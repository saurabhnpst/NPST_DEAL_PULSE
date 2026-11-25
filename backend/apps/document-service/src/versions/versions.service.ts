import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DocumentIngestionService } from '../common/document-ingestion.service';
import { Document as DocumentEntity } from '../entities/document.entity';
import { DocumentVersion } from '../entities/document-version.entity';

@Injectable()
export class VersionsService {
  constructor(
    private readonly ingestion: DocumentIngestionService,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentVersion)
    private readonly versionRepository: Repository<DocumentVersion>,
  ) {}

  async uploadNewVersion(documentId: string, file: Express.Multer.File) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const validated = await this.ingestion.validateAndScan(file);
    const scanStatus = this.ingestion.scanStatusLabel();
    const savedVersion = await this.ingestion.createNewVersion(
      documentId,
      validated,
      scanStatus,
    );

    return {
      message: 'New document version uploaded successfully',
      documentId,
      versionId: savedVersion.id,
      versionNumber: savedVersion.versionNumber,
      originalName: savedVersion.originalName,
      mimeType: savedVersion.mimeType,
      size: Number(savedVersion.size),
      scanStatus: savedVersion.scanStatus,
      createdAt: savedVersion.createdAt,
    };
  }

  async listVersions(documentId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const versions = await this.versionRepository.find({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });

    return {
      documentId,
      currentVersionNumber: document.currentVersionNumber,
      items: versions.map((version) => ({
        versionId: version.id,
        versionNumber: version.versionNumber,
        originalName: version.originalName,
        mimeType: version.mimeType,
        size: Number(version.size),
        scanStatus: version.scanStatus,
        checksumSha256: version.checksumSha256,
        createdAt: version.createdAt,
      })),
    };
  }

  async getVersionForDownload(
    documentId: string,
    versionNumber: number,
  ) {
    const version = await this.versionRepository.findOne({
      where: { documentId, versionNumber },
    });
    if (!version) {
      throw new NotFoundException('Document version not found');
    }
    return version;
  }
}