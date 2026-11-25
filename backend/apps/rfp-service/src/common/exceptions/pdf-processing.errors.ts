import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

export class PdfProcessingJobNotFoundError extends NotFoundException {
  constructor(rfpId: string, documentId: string) {
    super(
      `No PDF processing job found for RFP ${rfpId} and document ${documentId}`,
    );
  }
}

export class PdfProcessingInProgressError extends ConflictException {
  constructor(processingJobId: string) {
    super(`PDF processing job ${processingJobId} is already in progress`);
  }
}

export class PdfCorruptError extends UnprocessableEntityException {
  constructor(message = 'PDF file is corrupt or unreadable') {
    super(message);
  }
}

export class PdfEncryptedError extends UnprocessableEntityException {
  constructor() {
    super('PDF is encrypted or password-protected and cannot be processed');
  }
}

export class PdfTooLargeError extends UnprocessableEntityException {
  constructor(maxBytes: number) {
    super(`PDF exceeds maximum allowed size of ${maxBytes} bytes`);
  }
}

export class PdfTooManyPagesError extends UnprocessableEntityException {
  constructor(maxPages: number) {
    super(`PDF exceeds maximum allowed page count of ${maxPages}`);
  }
}

export class PdfToolUnavailableError extends ServiceUnavailableException {
  constructor(tool: string) {
    super(`${tool} is not available on this host`);
  }
}

export class PdfToolTimeoutError extends ServiceUnavailableException {
  constructor(tool: string) {
    super(`${tool} execution timed out`);
  }
}