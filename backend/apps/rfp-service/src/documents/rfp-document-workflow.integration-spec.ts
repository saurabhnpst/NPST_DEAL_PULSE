import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readFileSync as readCa } from 'fs';
import { resolve } from 'path';
import { Repository } from 'typeorm';
import { DocumentServiceClient } from '../clients/document-service.client';
import documentServiceConfig from '../config/document-service.config';
import { RfpDocumentAssociation } from '../entities/rfp-document-association.entity';
import { Rfp } from '../entities/rfp.entity';
import { RfpDocumentService } from './rfp-document.service';

const PDF_BYTES = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 3\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

const runE2e = process.env.RUN_RFP_DOCUMENT_E2E === '1';
const documentServiceBaseUrl =
  process.env.DOCUMENT_SERVICE_BASE_URL?.replace(/\/$/, '') ??
  'http://localhost:3005';

async function uploadPdfToDocumentService(
  baseUrl: string,
  pdf: Buffer,
  fileName: string,
): Promise<string> {
  const form = new FormData();
  form.append(
    'file',
    new Blob([Uint8Array.from(pdf)], { type: 'application/pdf' }),
    fileName,
  );

  const response = await fetch(`${baseUrl}/api/v1/uploads`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Document upload failed status=${response.status} body=${text.slice(0, 500)}`,
    );
  }

  const body = (await response.json()) as { documentId?: string };
  if (!body.documentId) {
    throw new Error('Upload response missing documentId');
  }
  return body.documentId;
}

async function deleteDocumentFromService(
  baseUrl: string,
  documentId: string,
): Promise<void> {
  await fetch(`${baseUrl}/api/v1/documents/${documentId}?force=true`, {
    method: 'DELETE',
  });
}

const describeE2e = runE2e ? describe : describe.skip;

describeE2e('RFP ↔ Document Service workflow (live E2E)', () => {
  let module: TestingModule;
  let rfpRepo: Repository<Rfp>;
  let associationRepo: Repository<RfpDocumentAssociation>;
  let documentService: RfpDocumentService;
  let documentClient: DocumentServiceClient;

  const createdRfpIds: string[] = [];
  let uploadedDocumentId: string | undefined;

  beforeAll(async () => {
    const health = await fetch(`${documentServiceBaseUrl}/api/v1/health`);
    if (!health.ok) {
      throw new Error(
        `Document Service not reachable at ${documentServiceBaseUrl} (health status=${health.status})`,
      );
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [documentServiceConfig],
          envFilePath: resolve(process.cwd(), '.env'),
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT ?? 16659),
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [Rfp, RfpDocumentAssociation],
          synchronize: false,
          ssl: {
            ca: readCa(resolve(process.cwd(), process.env.DB_SSL_CA ?? './ca.pem')),
            rejectUnauthorized: true,
          },
        }),
        TypeOrmModule.forFeature([Rfp, RfpDocumentAssociation]),
      ],
      providers: [DocumentServiceClient, RfpDocumentService],
    }).compile();

    rfpRepo = module.get(getRepositoryToken(Rfp));
    associationRepo = module.get(getRepositoryToken(RfpDocumentAssociation));
    documentService = module.get(RfpDocumentService);
    documentClient = module.get(DocumentServiceClient);

    uploadedDocumentId = await uploadPdfToDocumentService(
      documentServiceBaseUrl,
      PDF_BYTES,
      'rfp-workflow-integration.pdf',
    );
  }, 120_000);

  afterAll(async () => {
    if (createdRfpIds.length > 0) {
      await associationRepo.delete({ rfpId: createdRfpIds[0] });
      await rfpRepo.delete(createdRfpIds);
    }
    if (uploadedDocumentId) {
      await deleteDocumentFromService(documentServiceBaseUrl, uploadedDocumentId);
    }
    await module?.close();
  });

  it('uploads, reads metadata, associates with RFP, and downloads identical bytes', async () => {
    expect(uploadedDocumentId).toBeDefined();

    const metadata = await documentClient.getDocumentMetadata(
      uploadedDocumentId!,
    );
    expect(metadata.fileName).toBe('rfp-workflow-integration.pdf');
    expect(metadata.mimeType).toBe('application/pdf');
    expect(metadata.uploadedAt).toBeDefined();

    const leadId = '44444444-4444-4444-8444-444444444444';
    const rfp = await rfpRepo.save(
      rfpRepo.create({
        title: 'E2E document workflow RFP',
        referenceNumber: `E2E/${Date.now()}`,
        leadId,
        status: 'Registered',
        documentId: uploadedDocumentId,
      }),
    );
    createdRfpIds.push(rfp.id);

    const association = await documentService.syncAssociationForRfp(
      rfp,
      uploadedDocumentId!,
    );
    expect(association.documentId).toBe(uploadedDocumentId);
    expect(association.documentName).toBe('rfp-workflow-integration.pdf');
    expect(association.leadId).toBe(leadId);

    const downloaded = await documentService.downloadForRfp(
      rfp.id,
      uploadedDocumentId!,
    );
    expect(downloaded.data.equals(PDF_BYTES)).toBe(true);
    expect(downloaded.mimeType).toContain('pdf');
    expect(downloaded.data.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('rejects download when document is not linked to the RFP', async () => {
    const rfp = await rfpRepo.save(
      rfpRepo.create({
        title: 'Unlinked RFP',
        referenceNumber: `E2E/unlinked/${Date.now()}`,
        status: 'Registered',
      }),
    );
    createdRfpIds.push(rfp.id);

    await expect(
      documentService.downloadForRfp(rfp.id, uploadedDocumentId!),
    ).rejects.toMatchObject({ status: 403 });
  });
});