import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { ConfigService } from '@nestjs/config';
import { DocumentServiceClient } from './document-service.client';

describe('DocumentServiceClient (integration)', () => {
  let server: Server;
  let baseUrl: string;
  let lastAuthHeader: string | undefined;

  beforeAll(async () => {
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      lastAuthHeader = req.headers.authorization;
      const url = req.url ?? '';

      if (url.endsWith('/download')) {
        res.writeHead(200, {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="sample.pdf"',
        });
        res.end(Buffer.from('%PDF-integration-test'));
        return;
      }

      if (url.includes('/attachments') && req.method === 'POST') {
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end('{}');
        return;
      }

      if (req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            id: '99999999-9999-4999-8999-999999999999',
            fileName: 'sample.pdf',
            mimeType: 'application/pdf',
          }),
        );
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  beforeEach(() => {
    lastAuthHeader = undefined;
  });

  it('performs real HTTP download and metadata calls', async () => {
    const client = new DocumentServiceClient({
      getOrThrow: () => ({
        baseUrl,
        connectTimeoutMs: 2_000,
        readTimeoutMs: 5_000,
        s2sToken: 'integration-token',
      }),
    } as unknown as ConfigService);

    const metadata = await client.getDocumentMetadata(
      '99999999-9999-4999-8999-999999999999',
    );
    expect(metadata.fileName).toBe('sample.pdf');
    expect(lastAuthHeader).toBe('Bearer integration-token');

    const download = await client.downloadDocument(
      '99999999-9999-4999-8999-999999999999',
    );
    expect(download.data.toString()).toBe('%PDF-integration-test');
    expect(download.fileName).toBe('sample.pdf');
  });
});