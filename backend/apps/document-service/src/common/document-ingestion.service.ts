import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Document as DocumentEntity } from '../entities/document.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { StorageService } from '../storage/storage.service';
import { ClamavService } from '../uploads/clamav.service';
import {
  FileValidationService,
  ValidatedUploadFile,
} from '../validation/file-validation.service';

export interface IngestedDocumentResult {
  document: DocumentEntity;
  version: DocumentVersion;
}

@Injectable()
export class DocumentIngestionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    private readonly clamav: ClamavService,
    private readonly fileValidation: FileValidationService,
    @InjectRepository(DocumentVersion)
    private readonly versionRepository: Repository<DocumentVersion>,
  ) {}

  /** Scan status to store with the file: CLEAN, or SKIPPED when CLAMAV_ENABLED=false (local dev). */
  scanStatusLabel(): string {
    return process.env.CLAMAV_ENABLED === 'false' ? 'SKIPPED' : 'CLEAN';
  }

  async validateAndScan(file: Express.Multer.File): Promise<ValidatedUploadFile> {
    const validated = await this.fileValidation.validate(file);
    if (process.env.CLAMAV_ENABLED === 'false') {
      return validated;
    }
    const scanResult = await this.clamav.scan(validated.buffer);
    if (scanResult !== 'CLEAN') {
      throw new BadRequestException('File rejected: malware detected');
    }
    return validated;
  }

  async assertChecksumIsUnique(checksumSha256: string) {
    const existing = await this.versionRepository.findOne({
      where: { checksumSha256 },
    });
    if (existing) {
      throw new ConflictException({
        message: 'Duplicate file content detected',
        documentId: existing.documentId,
        versionNumber: existing.versionNumber,
      });
    }
  }

  async createInitialDocument(
    validated: ValidatedUploadFile,
    scanStatus: string,
    uploadedBy?: string | null,
  ): Promise<IngestedDocumentResult> {
    await this.assertChecksumIsUnique(validated.checksumSha256);
    const storageKey = this.fileValidation.buildStorageKey(validated.originalName);
    await this.storage.uploadFile(
      storageKey,
      validated.buffer,
      validated.mimeType,
    );

    try {
      return await this.dataSource.transaction(async (manager) => {
        const document = manager.create(DocumentEntity, {
          originalName: validated.originalName,
          storageKey,
          mimeType: validated.mimeType,
          size: validated.size,
          scanStatus,
          uploadedBy: uploadedBy ?? null,
          leadId: null,
          currentVersionNumber: 1,
          checksumSha256: validated.checksumSha256,
        });
        const savedDocument = await manager.save(document);

        const version = manager.create(DocumentVersion, {
          documentId: savedDocument.id,
          versionNumber: 1,
          storageKey,
          originalName: validated.originalName,
          mimeType: validated.mimeType,
          size: validated.size,
          checksumSha256: validated.checksumSha256,
          scanStatus,
        });
        const savedVersion = await manager.save(version);
        return { document: savedDocument, version: savedVersion };
      });
    } catch (error) {
      try {
        await this.storage.deleteFile(storageKey);
      } catch {
        // logged by storage layer
      }
      throw new InternalServerErrorException(
        'File uploaded but metadata persistence failed',
      );
    }
  }

  async createNewVersion(
    documentId: string,
    validated: ValidatedUploadFile,
    scanStatus: string,
  ): Promise<DocumentVersion> {
    await this.assertChecksumIsUnique(validated.checksumSha256);
    const storageKey = this.fileValidation.buildStorageKey(validated.originalName);
    await this.storage.uploadFile(
      storageKey,
      validated.buffer,
      validated.mimeType,
    );

    try {
      return await this.dataSource.transaction(async (manager) => {
        const document = await manager.findOne(DocumentEntity, {
          where: { id: documentId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!document) {
          throw new NotFoundException('Document not found');
        }

        const nextVersionNumber = document.currentVersionNumber + 1;
        const version = manager.create(DocumentVersion, {
          documentId: document.id,
          versionNumber: nextVersionNumber,
          storageKey,
          originalName: validated.originalName,
          mimeType: validated.mimeType,
          size: validated.size,
          checksumSha256: validated.checksumSha256,
          scanStatus,
        });
        const savedVersion = await manager.save(version);

        document.currentVersionNumber = nextVersionNumber;
        document.storageKey = storageKey;
        document.originalName = validated.originalName;
        document.mimeType = validated.mimeType;
        document.size = validated.size;
        document.scanStatus = scanStatus;
        document.checksumSha256 = validated.checksumSha256;
        await manager.save(document);
        return savedVersion;
      });
    } catch (error) {
      try {
        await this.storage.deleteFile(storageKey);
      } catch {
        // logged by storage layer
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'New version uploaded but metadata persistence failed',
      );
    }
  }
}