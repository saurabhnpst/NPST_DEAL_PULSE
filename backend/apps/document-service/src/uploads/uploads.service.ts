import { Injectable } from '@nestjs/common';

import { toPublicDocument } from '../common/document-response.mapper';
import { DocumentIngestionService } from '../common/document-ingestion.service';

@Injectable()
export class UploadsService {
  constructor(private readonly ingestion: DocumentIngestionService) {}

  async upload(file: Express.Multer.File, uploadedBy?: string) {
    const validated = await this.ingestion.validateAndScan(file);
    const scanStatus = this.ingestion.scanStatusLabel();
    const { document, version } = await this.ingestion.createInitialDocument(
      validated,
      scanStatus,
      uploadedBy ?? null,
    );

    const publicDocument = toPublicDocument(document);
    return {
      message: 'File uploaded successfully',
      documentId: document.id,
      originalName: publicDocument.originalName,
      size: publicDocument.size,
      mimeType: publicDocument.mimeType,
      scanStatus: publicDocument.scanStatus,
      currentVersionNumber: publicDocument.currentVersionNumber,
      versionId: version.id,
      createdAt: publicDocument.createdAt,
    };
  }
}