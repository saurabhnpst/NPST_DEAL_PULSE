import { registerAs } from '@nestjs/config';

export interface DocumentServiceConfig {
  baseUrl: string;
  connectTimeoutMs: number;
  readTimeoutMs: number;
  s2sToken?: string;
}

export default registerAs(
  'documentService',
  (): DocumentServiceConfig => ({
    baseUrl:
      process.env.DOCUMENT_SERVICE_BASE_URL?.replace(/\/$/, '') ??
      'http://localhost:3005',
    connectTimeoutMs: Number(
      process.env.DOCUMENT_SERVICE_CONNECT_TIMEOUT ?? 5_000,
    ),
    readTimeoutMs: Number(process.env.DOCUMENT_SERVICE_READ_TIMEOUT ?? 30_000),
    s2sToken: process.env.DOCUMENT_SERVICE_S2S_TOKEN,
  }),
);