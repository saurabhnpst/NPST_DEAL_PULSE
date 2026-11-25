import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DocumentRequestAuth,
  DocumentServiceClient,
  DownloadedDocument,
} from '../clients/document-service.client';
import {
  InvalidPdfError,
  RfpDocumentAccessDeniedError,
} from '../common/exceptions/document.errors';
import { RfpDocumentAssociation } from '../entities/rfp-document-association.entity';
import { Rfp } from '../entities/rfp.entity';

const PDF_MAGIC = Buffer.from('%PDF-');

export interface RfpDownloadResult extends DownloadedDocument {}

@Injectable()
export class RfpDocumentService {
  private readonly logger = new Logger(RfpDocumentService.name);

  constructor(
    @InjectRepository(Rfp)
    private readonly rfpRepo: Repository<Rfp>,
    @InjectRepository(RfpDocumentAssociation)
    private readonly associationRepo: Repository<RfpDocumentAssociation>,
    private readonly documentServiceClient: DocumentServiceClient,
  ) {}

  async downloadForRfp(
    rfpId: string,
    documentId: string,
    auth?: DocumentRequestAuth,
  ): Promise<RfpDownloadResult> {
    this.logger.log(
      `Document retrieval initiated rfpId=${rfpId} documentId=${documentId}`,
    );

    await this.assertRfpDocumentAccess(rfpId, documentId);

    const downloaded = await this.documentServiceClient.downloadDocument(
      documentId,
      auth,
    );
    this.assertValidPdf(downloaded.data);

    this.logger.log(
      `Document retrieval successful rfpId=${rfpId} documentId=${documentId} bytes=${downloaded.data.length}`,
    );

    return downloaded;
  }

  async syncAssociationForRfp(
    rfp: Rfp,
    documentId: string,
    auth?: DocumentRequestAuth,
  ): Promise<RfpDocumentAssociation> {
    const metadata = await this.documentServiceClient.getDocumentMetadata(
      documentId,
      auth,
    );

    const association = await this.upsertAssociation(rfp, metadata);
    await this.syncRemoteLeadLink(documentId, rfp.leadId, auth);

    this.logger.log(
      `Document association created rfpId=${rfp.id} documentId=${documentId} leadId=${rfp.leadId ?? 'n/a'}`,
    );

    return association;
  }

  async upsertAssociationFromRfp(
    rfp: Rfp,
    auth?: DocumentRequestAuth,
  ): Promise<RfpDocumentAssociation | undefined> {
    if (!rfp.documentId) {
      return undefined;
    }
    return this.syncAssociationForRfp(rfp, rfp.documentId, auth);
  }

  async assertDocumentLinkedToRfp(
    rfpId: string,
    documentId: string,
  ): Promise<Rfp> {
    return this.assertRfpDocumentAccess(rfpId, documentId);
  }

  private async assertRfpDocumentAccess(
    rfpId: string,
    documentId: string,
  ): Promise<Rfp> {
    const rfp = await this.rfpRepo.findOne({ where: { id: rfpId } });
    if (!rfp) {
      throw new NotFoundException(`RFP ${rfpId} not found`);
    }

    const association = await this.associationRepo.findOne({
      where: { rfpId, documentId },
    });

    const linkedOnRfp = rfp.documentId === documentId;
    if (!association && !linkedOnRfp) {
      this.logger.warn(
        `Document access denied rfpId=${rfpId} documentId=${documentId}`,
      );
      throw new RfpDocumentAccessDeniedError(rfpId, documentId);
    }

    return rfp;
  }

  private async upsertAssociation(
    rfp: Rfp,
    metadata: {
      id: string;
      fileName?: string;
      documentType?: string;
      uploadedAt?: string;
    },
  ): Promise<RfpDocumentAssociation> {
    let association = await this.associationRepo.findOne({
      where: { rfpId: rfp.id, documentId: metadata.id },
    });

    const uploadedAt = metadata.uploadedAt
      ? new Date(metadata.uploadedAt)
      : undefined;

    if (!association) {
      association = this.associationRepo.create({
        rfpId: rfp.id,
        documentId: metadata.id,
        leadId: rfp.leadId,
        documentName: metadata.fileName,
        documentType: metadata.documentType,
        uploadedAt,
      });
    } else {
      association.leadId = rfp.leadId ?? association.leadId;
      association.documentName = metadata.fileName ?? association.documentName;
      association.documentType =
        metadata.documentType ?? association.documentType;
      association.uploadedAt = uploadedAt ?? association.uploadedAt;
    }

    return this.associationRepo.save(association);
  }

  private async syncRemoteLeadLink(
    documentId: string,
    leadId: string | undefined,
    auth?: DocumentRequestAuth,
  ): Promise<void> {
    if (!leadId) {
      return;
    }
    try {
      await this.documentServiceClient.createDocumentLink(
        documentId,
        { entityType: 'lead', entityId: leadId },
        auth,
      );
    } catch (error) {
      this.logger.warn(
        `Remote lead link sync failed documentId=${documentId} leadId=${leadId}`,
      );
    }
  }

  private assertValidPdf(buffer: Buffer): void {
    if (buffer.length < PDF_MAGIC.length) {
      throw new InvalidPdfError();
    }
    if (!buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      throw new InvalidPdfError();
    }
  }
}