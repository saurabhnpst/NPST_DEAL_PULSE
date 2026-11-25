import {
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

export class DocumentNotFoundError extends NotFoundException {
  constructor(documentId: string) {
    super(`Document ${documentId} was not found`);
  }
}

export class DocumentUnauthorizedError extends UnauthorizedException {
  constructor() {
    super('Unauthorized to access the requested document');
  }
}

export class DocumentForbiddenError extends ForbiddenException {
  constructor() {
    super('Insufficient permissions to access the requested document');
  }
}

export class DocumentServiceUnavailableError extends ServiceUnavailableException {
  constructor() {
    super('Document Service is currently unavailable');
  }
}

export class DocumentConnectionTimeoutError extends GatewayTimeoutException {
  constructor() {
    super('Timed out while communicating with Document Service');
  }
}

export class InvalidPdfError extends UnprocessableEntityException {
  constructor() {
    super('Downloaded content is not a valid PDF');
  }
}

export class EmptyDocumentError extends BadRequestException {
  constructor() {
    super('Document Service returned an empty file');
  }
}

export class RfpDocumentAccessDeniedError extends ForbiddenException {
  constructor(rfpId: string, documentId: string) {
    super(
      `Document ${documentId} is not associated with RFP ${rfpId}`,
    );
  }
}

export function mapDocumentServiceHttpStatus(
  status: number,
  documentId: string,
): HttpException {
  switch (status) {
    case 401:
      return new DocumentUnauthorizedError();
    case 403:
      return new DocumentForbiddenError();
    case 404:
      return new DocumentNotFoundError(documentId);
    case 408:
    case 504:
      return new DocumentConnectionTimeoutError();
    case 503:
      return new DocumentServiceUnavailableError();
    default:
      return new HttpException(
        'Unexpected error from Document Service',
        status >= 500 ? HttpStatus.BAD_GATEWAY : HttpStatus.BAD_REQUEST,
      );
  }
}