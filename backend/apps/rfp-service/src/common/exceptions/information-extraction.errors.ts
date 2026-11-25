import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export class RfpVersionNotFoundError extends NotFoundException {
  constructor(versionId?: string) {
    super(versionId ? `RFP document version ${versionId} not found` : 'RFP version not found');
  }
}

export class RfpExtractionJobNotFoundError extends NotFoundException {
  constructor() {
    super('RFP information extraction job not found');
  }
}

export class PdfTextNotReadyError extends BadRequestException {
  constructor() {
    super(
      'PDF text is not available yet. Complete PDF processing before information extraction.',
    );
  }
}

export class RfpExtractionInProgressError extends ConflictException {
  constructor(jobId: string) {
    super(`RFP information extraction already in progress (jobId=${jobId})`);
  }
}

export class RfpExtractedFieldNotFoundError extends NotFoundException {
  constructor() {
    super('Extracted field not found');
  }
}