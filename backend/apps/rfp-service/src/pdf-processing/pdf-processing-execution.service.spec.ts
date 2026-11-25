import { PDF_PROCESSING_STATUS } from '../common/constants/pdf-processing-status.constants';
import { PdfCorruptError } from '../common/exceptions/pdf-processing.errors';
import { PdfProcessingExecutionService } from './pdf-processing-execution.service';

describe('PdfProcessingExecutionService', () => {
  const MINIMAL_PDF = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 1>>endobj\nxref\n0 3\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  );

  function buildService(overrides?: {
  validate?: jest.Mock;
  executeInner?: boolean;
}) {
    const jobRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const pageRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      create: jest.fn((row) => row),
      update: jest.fn(),
    };
    const documentClient = {
      downloadDocument: jest.fn().mockResolvedValue({
        data: MINIMAL_PDF,
        fileName: 'sample.pdf',
        mimeType: 'application/pdf',
      }),
    };
    const validationService = {
      validate: overrides?.validate ?? jest.fn().mockResolvedValue({ pageCount: 1, sizeBytes: 100 }),
    };
    const pdfJsTextExtractor = {
      extractPageText: jest.fn().mockResolvedValue('Enough embedded tender text for classification purposes.'),
    };
    const poppler = {
      withPdfTempFile: jest.fn(async (_buffer, handler) =>
        handler('/tmp/document.pdf', '/tmp/work'),
      ),
      renderPageToPng: jest.fn(),
    };
    const tesseract = { recognizeImage: jest.fn() };
    const pageTextMerger = {
      classifyEmbeddedText: jest.fn(() => ({ hasUsableText: true, charCount: 40 })),
      buildEmbeddedResult: jest.fn((pageNumber, text) => ({
        pageNumber,
        extractionMethod: 'embedded',
        textContent: text,
        charCount: 40,
        hasUsableText: true,
        ocrConfidence: null,
        metadataJson: {},
      })),
      buildOcrResult: jest.fn(),
      buildFailedPageResult: jest.fn(),
    };

    const service = new PdfProcessingExecutionService(
      {
        getOrThrow: () => ({
          minTextChars: 10,
        }),
      } as never,
      jobRepo as never,
      pageRepo as never,
      documentClient as never,
      validationService as never,
      pdfJsTextExtractor as never,
      poppler as never,
      tesseract as never,
      pageTextMerger as never,
    );

    return {
      service,
      jobRepo,
      pageRepo,
      poppler,
      pdfJsTextExtractor,
      documentClient,
    };
  }

  it('marks the job completed for digital-text pages without Poppler rendering', async () => {
    const { service, jobRepo, poppler, pageRepo, documentClient } = buildService();
    jobRepo.findOne.mockResolvedValue({
      id: 'job-1',
      status: PDF_PROCESSING_STATUS.PENDING,
    });

    await service.execute({
      processingJobId: 'job-1',
      rfpId: '11111111-1111-4111-8111-111111111111',
      documentId: '22222222-2222-4222-8222-222222222222',
      userAuthorization: 'Bearer test',
    });

    expect(documentClient.downloadDocument).toHaveBeenCalledWith(
      '22222222-2222-4222-8222-222222222222',
      { userAuthorization: 'Bearer test' },
    );
    expect(poppler.renderPageToPng).not.toHaveBeenCalled();
    expect(pageRepo.save).toHaveBeenCalled();
    expect(jobRepo.update).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({ status: PDF_PROCESSING_STATUS.COMPLETED }),
    );
  });

  it('marks the job failed when validation fails', async () => {
    const { service, jobRepo } = buildService({
      validate: jest.fn().mockRejectedValue(new PdfCorruptError()),
    });
    jobRepo.findOne.mockResolvedValue({
      id: 'job-2',
      status: PDF_PROCESSING_STATUS.PENDING,
    });

    await expect(
      service.execute({
        processingJobId: 'job-2',
        rfpId: '11111111-1111-4111-8111-111111111111',
        documentId: '22222222-2222-4222-8222-222222222222',
      }),
    ).rejects.toBeInstanceOf(PdfCorruptError);

    expect(jobRepo.update).toHaveBeenCalledWith(
      'job-2',
      expect.objectContaining({ status: PDF_PROCESSING_STATUS.FAILED }),
    );
  });
});