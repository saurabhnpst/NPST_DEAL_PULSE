export const PDF_PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

export type PdfProcessingStatus =
  (typeof PDF_PROCESSING_STATUS)[keyof typeof PDF_PROCESSING_STATUS];

export const PDF_EXTRACTION_METHOD = {
  EMBEDDED: 'embedded',
  OCR: 'ocr',
  HYBRID: 'hybrid',
} as const;

export type PdfExtractionMethod =
  (typeof PDF_EXTRACTION_METHOD)[keyof typeof PDF_EXTRACTION_METHOD];

export const PDF_PROCESSING_QUEUE = 'rfp-pdf-processing';