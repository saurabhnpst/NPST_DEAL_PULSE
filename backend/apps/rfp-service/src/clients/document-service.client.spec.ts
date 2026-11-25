import { ConfigService } from '@nestjs/config';
import { DocumentServiceClient } from './document-service.client';
import {
  DocumentConnectionTimeoutError,
  DocumentForbiddenError,
  DocumentNotFoundError,
  DocumentServiceUnavailableError,
  DocumentUnauthorizedError,
  EmptyDocumentError,
} from '../common/exceptions/document.errors';

const PDF_BYTES = Buffer.from('%PDF-1.4\n%âãÏÓ\n');

describe('DocumentServiceClient', () => {
  const baseUrl = 'http://document-service.test';
  let client: DocumentServiceClient;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue({
        baseUrl,
        connectTimeoutMs: 100,
        readTimeoutMs: 500,
        s2sToken: 'test-token',
      }),
    } as unknown as ConfigService;

    client = new DocumentServiceClient(configService);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('downloads a PDF with binary body intact', async () => {
    fetchMock.mockResolvedValue(
      new Response(PDF_BYTES, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="tender.pdf"',
        },
      }),
    );

    const result = await client.downloadDocument(
      '11111111-1111-4111-8111-111111111111',
    );
    expect(result.data.equals(PDF_BYTES)).toBe(true);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.fileName).toBe('tender.pdf');
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/api/v1/documents/11111111-1111-4111-8111-111111111111/download`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('maps document not found responses', async () => {
    fetchMock.mockResolvedValue(new Response('missing', { status: 404 }));
    await expect(
      client.downloadDocument('22222222-2222-4222-8222-222222222222'),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);
  });

  it('maps authentication failures', async () => {
    fetchMock.mockResolvedValue(new Response('unauthorized', { status: 401 }));
    await expect(
      client.getDocumentMetadata('33333333-3333-4333-8333-333333333333'),
    ).rejects.toBeInstanceOf(DocumentUnauthorizedError);
  });

  it('maps permission failures', async () => {
    fetchMock.mockResolvedValue(new Response('forbidden', { status: 403 }));
    await expect(
      client.getDocumentMetadata('33333333-3333-4333-8333-333333333333'),
    ).rejects.toBeInstanceOf(DocumentForbiddenError);
  });

  it('maps service unavailable failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(
      client.downloadDocument('44444444-4444-4444-8444-444444444444'),
    ).rejects.toBeInstanceOf(DocumentServiceUnavailableError);
  });

  it('maps connection timeouts', async () => {
    const error = new Error('timed out');
    error.name = 'TimeoutError';
    fetchMock.mockRejectedValue(error);
    await expect(
      client.downloadDocument('55555555-5555-4555-8555-555555555555'),
    ).rejects.toBeInstanceOf(DocumentConnectionTimeoutError);
  });

  it('rejects empty downloads', async () => {
    fetchMock.mockResolvedValue(
      new Response(Buffer.alloc(0), { status: 200 }),
    );
    await expect(
      client.downloadDocument('66666666-6666-4666-8666-666666666666'),
    ).rejects.toBeInstanceOf(EmptyDocumentError);
  });

  it('parses metadata responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: '77777777-7777-4777-8777-777777777777',
          fileName: 'RFP.pdf',
          mimeType: 'application/pdf',
          documentType: 'rfp',
          uploadedAt: '2026-01-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const metadata = await client.getDocumentMetadata(
      '77777777-7777-4777-8777-777777777777',
    );
    expect(metadata.fileName).toBe('RFP.pdf');
    expect(metadata.mimeType).toBe('application/pdf');
  });

  it('maps Document Service originalName metadata fields', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          originalName: 'proposal.pdf',
          mimeType: 'application/pdf',
          createdAt: '2026-03-01T12:00:00.000Z',
          size: 1024,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const metadata = await client.getDocumentMetadata(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(metadata.fileName).toBe('proposal.pdf');
    expect(metadata.uploadedAt).toBe('2026-03-01T12:00:00.000Z');
    expect(metadata.sizeBytes).toBe(1024);
  });

  it('posts entity attachments with uppercase entity type', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }));

    await client.createDocumentLink(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      { entityType: 'lead', entityId: 'lead-uuid-123' },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/api/v1/documents/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/attachments`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          entityType: 'LEAD',
          entityId: 'lead-uuid-123',
          relationshipType: 'RFP',
        }),
      }),
    );
  });

  it('treats duplicate attachments as success', async () => {
    fetchMock.mockResolvedValue(new Response('conflict', { status: 409 }));
    await expect(
      client.createDocumentLink(
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        { entityType: 'lead', entityId: 'lead-uuid' },
      ),
    ).resolves.toBeUndefined();
  });

  it('forwards user authorization when provided', async () => {
    fetchMock.mockResolvedValue(
      new Response(PDF_BYTES, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );

    await client.downloadDocument('88888888-8888-4888-8888-888888888888', {
      userAuthorization: 'Bearer user-jwt',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer user-jwt',
        }),
      }),
    );
  });
});