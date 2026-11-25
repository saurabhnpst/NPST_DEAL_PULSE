import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentServiceConfig } from '../config/document-service.config';
import {
  DocumentConnectionTimeoutError,
  DocumentServiceUnavailableError,
  EmptyDocumentError,
  mapDocumentServiceHttpStatus,
} from '../common/exceptions/document.errors';

export interface DocumentRequestAuth {
  userAuthorization?: string;
}

export interface DocumentMetadata {
  id: string;
  fileName?: string;
  mimeType?: string;
  documentType?: string;
  uploadedAt?: string;
  sizeBytes?: number;
}

export interface DownloadedDocument {
  data: Buffer;
  fileName: string;
  mimeType: string;
}

export interface DocumentEntityLinkPayload {
  entityType: 'lead' | 'rfp' | 'opportunity';
  entityId: string;
  /** Maps to Document Service `relationshipType` (default `RFP`). */
  relationshipType?: string;
}

@Injectable()
export class DocumentServiceClient {
  private readonly logger = new Logger(DocumentServiceClient.name);
  private readonly config: DocumentServiceConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<DocumentServiceConfig>(
      'documentService',
    );
  }

  async getDocumentMetadata(
    documentId: string,
    auth?: DocumentRequestAuth,
  ): Promise<DocumentMetadata> {
    const url = `${this.config.baseUrl}/api/v1/documents/${documentId}`;
    this.logger.log(`Fetching document metadata documentId=${documentId}`);

    const response = await this.request(url, {
      method: 'GET',
      auth,
      expectJson: true,
    });

    if (!response.ok) {
      this.logger.warn(
        `Document metadata failed documentId=${documentId} status=${response.status}`,
      );
      throw mapDocumentServiceHttpStatus(response.status, documentId);
    }

    const body = (await response.json()) as Record<string, unknown>;
    return this.parseMetadata(documentId, body);
  }

  async downloadDocument(
    documentId: string,
    auth?: DocumentRequestAuth,
  ): Promise<DownloadedDocument> {
    const url = `${this.config.baseUrl}/api/v1/documents/${documentId}/download`;
    this.logger.log(`Downloading document documentId=${documentId}`);

    const response = await this.request(url, {
      method: 'GET',
      auth,
      expectJson: false,
    });

    if (!response.ok) {
      this.logger.warn(
        `Document download failed documentId=${documentId} status=${response.status}`,
      );
      throw mapDocumentServiceHttpStatus(response.status, documentId);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);
    if (data.length === 0) {
      throw new EmptyDocumentError();
    }

    const contentType =
      response.headers.get('content-type')?.split(';')[0]?.trim() ??
      'application/pdf';
    const fileName =
      this.parseFilenameFromContentDisposition(
        response.headers.get('content-disposition'),
      ) ?? `${documentId}.pdf`;

    return { data, fileName, mimeType: contentType };
  }

  async createDocumentLink(
    documentId: string,
    payload: DocumentEntityLinkPayload,
    auth?: DocumentRequestAuth,
  ): Promise<void> {
    const url = `${this.config.baseUrl}/api/v1/documents/${documentId}/attachments`;
    const body = {
      entityType: payload.entityType.toUpperCase(),
      entityId: payload.entityId,
      relationshipType: payload.relationshipType ?? 'RFP',
    };
    this.logger.log(
      `Creating document attachment documentId=${documentId} entityType=${body.entityType} entityId=${body.entityId}`,
    );

    const response = await this.request(url, {
      method: 'POST',
      auth,
      expectJson: true,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 409) {
      this.logger.log(
        `Document attachment already exists documentId=${documentId} entityId=${body.entityId}`,
      );
      return;
    }

    if (!response.ok) {
      this.logger.warn(
        `Document attachment failed documentId=${documentId} status=${response.status}`,
      );
      throw mapDocumentServiceHttpStatus(response.status, documentId);
    }
  }

  private async request(
    url: string,
    options: {
      method: string;
      auth?: DocumentRequestAuth;
      expectJson: boolean;
      body?: string;
      headers?: Record<string, string>;
    },
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: options.expectJson ? 'application/json' : 'application/pdf',
      ...this.buildAuthHeaders(options.auth),
      ...options.headers,
    };

    const timeoutMs = Math.max(
      this.config.connectTimeoutMs,
      this.config.readTimeoutMs,
    );

    try {
      return await fetch(url, {
        method: options.method,
        headers,
        body: options.body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new DocumentConnectionTimeoutError();
      }
      throw new DocumentServiceUnavailableError();
    }
  }

  private buildAuthHeaders(auth?: DocumentRequestAuth): Record<string, string> {
    if (auth?.userAuthorization?.trim()) {
      return { Authorization: auth.userAuthorization.trim() };
    }
    if (this.config.s2sToken?.trim()) {
      const token = this.config.s2sToken.trim();
      const value = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
      return { Authorization: value };
    }
    return {};
  }

  private parseMetadata(
    documentId: string,
    body: Record<string, unknown>,
  ): DocumentMetadata {
    const nested =
      body.data && typeof body.data === 'object'
        ? (body.data as Record<string, unknown>)
        : body;

    const id = String(nested.id ?? body.id ?? documentId);
    return {
      id,
      fileName: this.optionalString(
        nested.fileName ?? nested.filename ?? nested.originalName,
      ),
      mimeType: this.optionalString(
        nested.mimeType ?? nested.contentType ?? nested.mime_type,
      ),
      documentType: this.optionalString(
        nested.documentType ?? nested.type ?? nested.mimeType,
      ),
      uploadedAt: this.optionalString(
        nested.uploadedAt ?? nested.createdAt ?? nested.uploaded_at,
      ),
      sizeBytes: this.optionalNumber(nested.sizeBytes ?? nested.size),
    };
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private optionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private parseFilenameFromContentDisposition(
    header: string | null,
  ): string | undefined {
    if (!header) {
      return undefined;
    }
    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1].trim());
    }
    const match = /filename="([^"]+)"/i.exec(header);
    return match?.[1]?.trim();
  }
}