import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  DocumentForbiddenError,
  DocumentNotFoundError,
  InvalidPdfError,
  RfpDocumentAccessDeniedError,
} from '../common/exceptions/document.errors';
import { DocumentServiceClient } from '../clients/document-service.client';
import { RfpDocumentAssociation } from '../entities/rfp-document-association.entity';
import { Rfp } from '../entities/rfp.entity';
import { RfpDocumentService } from './rfp-document.service';

const PDF_BYTES = Buffer.from('%PDF-1.4 sample');

describe('RfpDocumentService', () => {
  let service: RfpDocumentService;
  const rfpRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const associationRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const documentClient = {
    downloadDocument: jest.fn(),
    getDocumentMetadata: jest.fn(),
    createDocumentLink: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfpDocumentService,
        { provide: getRepositoryToken(Rfp), useValue: rfpRepo },
        {
          provide: getRepositoryToken(RfpDocumentAssociation),
          useValue: associationRepo,
        },
        { provide: DocumentServiceClient, useValue: documentClient },
      ],
    }).compile();

    service = module.get(RfpDocumentService);
    jest.clearAllMocks();
  });

  it('downloads when RFP stores the document id', async () => {
    rfpRepo.findOne.mockResolvedValue({
      id: 'aaaa0001-0000-4000-8000-000000000001',
      documentId: 'bbbb0001-0000-4000-8000-000000000001',
    });
    associationRepo.findOne.mockResolvedValue(null);
    documentClient.downloadDocument.mockResolvedValue({
      data: PDF_BYTES,
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
    });

    const result = await service.downloadForRfp(
      'aaaa0001-0000-4000-8000-000000000001',
      'bbbb0001-0000-4000-8000-000000000001',
    );
    expect(result.data.equals(PDF_BYTES)).toBe(true);
  });

  it('downloads when association table contains the link', async () => {
    rfpRepo.findOne.mockResolvedValue({
      id: 'aaaa0001-0000-4000-8000-000000000001',
      documentId: undefined,
    });
    associationRepo.findOne.mockResolvedValue({
      rfpId: 'aaaa0001-0000-4000-8000-000000000001',
      documentId: 'bbbb0001-0000-4000-8000-000000000001',
    });
    documentClient.downloadDocument.mockResolvedValue({
      data: PDF_BYTES,
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
    });

    await expect(
      service.downloadForRfp(
        'aaaa0001-0000-4000-8000-000000000001',
        'bbbb0001-0000-4000-8000-000000000001',
      ),
    ).resolves.toBeDefined();
  });

  it('rejects unauthorized document download for unrelated documents', async () => {
    rfpRepo.findOne.mockResolvedValue({
      id: 'aaaa0001-0000-4000-8000-000000000001',
      documentId: 'other-doc',
    });
    associationRepo.findOne.mockResolvedValue(null);

    await expect(
      service.downloadForRfp(
        'aaaa0001-0000-4000-8000-000000000001',
        'bbbb0001-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(RfpDocumentAccessDeniedError);
  });

  it('throws when the RFP is missing', async () => {
    rfpRepo.findOne.mockResolvedValue(null);
    await expect(
      service.downloadForRfp(
        'aaaa0001-0000-4000-8000-000000000001',
        'bbbb0001-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid PDF bytes', async () => {
    rfpRepo.findOne.mockResolvedValue({
      id: 'aaaa0001-0000-4000-8000-000000000001',
      documentId: 'bbbb0001-0000-4000-8000-000000000001',
    });
    associationRepo.findOne.mockResolvedValue(null);
    documentClient.downloadDocument.mockResolvedValue({
      data: Buffer.from('not-a-pdf'),
      fileName: 'bad.bin',
      mimeType: 'application/octet-stream',
    });

    await expect(
      service.downloadForRfp(
        'aaaa0001-0000-4000-8000-000000000001',
        'bbbb0001-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(InvalidPdfError);
  });

  it('propagates document service failures', async () => {
    rfpRepo.findOne.mockResolvedValue({
      id: 'aaaa0001-0000-4000-8000-000000000001',
      documentId: 'bbbb0001-0000-4000-8000-000000000001',
    });
    associationRepo.findOne.mockResolvedValue(null);
    documentClient.downloadDocument.mockRejectedValue(
      new DocumentNotFoundError('bbbb0001-0000-4000-8000-000000000001'),
    );

    await expect(
      service.downloadForRfp(
        'aaaa0001-0000-4000-8000-000000000001',
        'bbbb0001-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('creates an association with lead id', async () => {
    const rfp = {
      id: 'aaaa0001-0000-4000-8000-000000000001',
      leadId: 'cccc0001-0000-4000-8000-000000000001',
      documentId: 'bbbb0001-0000-4000-8000-000000000001',
    } as Rfp;

    documentClient.getDocumentMetadata.mockResolvedValue({
      id: 'bbbb0001-0000-4000-8000-000000000001',
      fileName: 'RFP.pdf',
      documentType: 'rfp',
      uploadedAt: '2026-02-01T00:00:00.000Z',
    });
    associationRepo.findOne.mockResolvedValue(null);
    associationRepo.create.mockImplementation((value) => value);
    associationRepo.save.mockImplementation(async (value) => ({
      id: 'dddd0001-0000-4000-8000-000000000001',
      ...value,
    }));
    documentClient.createDocumentLink.mockResolvedValue(undefined);

    const association = await service.syncAssociationForRfp(
      rfp,
      'bbbb0001-0000-4000-8000-000000000001',
    );

    expect(association.leadId).toBe(rfp.leadId);
    expect(documentClient.createDocumentLink).toHaveBeenCalledWith(
      'bbbb0001-0000-4000-8000-000000000001',
      { entityType: 'lead', entityId: rfp.leadId },
      undefined,
    );
  });

  it('maps permission failures from metadata calls', async () => {
    const rfp = {
      id: 'aaaa0001-0000-4000-8000-000000000001',
      leadId: 'cccc0001-0000-4000-8000-000000000001',
    } as Rfp;
    documentClient.getDocumentMetadata.mockRejectedValue(
      new DocumentForbiddenError(),
    );

    await expect(
      service.syncAssociationForRfp(
        rfp,
        'bbbb0001-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(DocumentForbiddenError);
  });
});