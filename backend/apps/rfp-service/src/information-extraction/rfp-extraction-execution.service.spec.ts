import { PDF_PROCESSING_STATUS } from '../common/constants/pdf-processing-status.constants';
import {
  RFP_EXTRACTION_JOB_STATUS,
  RFP_FIELD_REVIEW_STATUS,
} from '../common/constants/rfp-extraction.constants';
import { PdfTextNotReadyError } from '../common/exceptions/information-extraction.errors';
import { RfpExtractionExecutionService } from './rfp-extraction-execution.service';

describe('RfpExtractionExecutionService', () => {
  const payload = {
    extractionJobId: 'ext-job-1',
    rfpId: '11111111-1111-4111-8111-111111111111',
    versionId: '22222222-2222-4222-8222-222222222222',
    documentId: '33333333-3333-4333-8333-333333333333',
  };

  function buildService() {
    const jobRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const fieldRepo = {
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn((row) => row),
    };
    const pdfJobRepo = {
      findOne: jest.fn(),
    };
    const pageRepo = {
      find: jest.fn(),
    };
    const fieldMappingService = {
      listActiveMappings: jest.fn().mockResolvedValue([
        {
          fieldKey: 'tender_reference_number',
          displayName: 'Tender Ref',
          category: 'client_tender',
          dataType: 'string',
          portalTarget: 'rfp.referenceNumber',
        },
      ]),
      validateValueForType: jest.fn().mockReturnValue({
        valid: true,
        normalized: 'GEM/2025/12345',
      }),
    };
    const ruleBasedExtractor = {
      providerId: 'rule-based-v1',
      extract: jest.fn().mockReturnValue([
        {
          fieldKey: 'tender_reference_number',
          value: 'GEM/2025/12345',
          pageNumber: 1,
          sourceExcerpt: 'Tender No GEM/2025/12345',
          confidence: 0.8,
        },
      ]),
    };

    const service = new RfpExtractionExecutionService(
      jobRepo as never,
      fieldRepo as never,
      pdfJobRepo as never,
      pageRepo as never,
      fieldMappingService as never,
      ruleBasedExtractor as never,
      {
        getOrThrow: () => ({ minConfidence: 0.55 }),
      } as never,
    );

    return {
      service,
      jobRepo,
      fieldRepo,
      pdfJobRepo,
      pageRepo,
      fieldMappingService,
      ruleBasedExtractor,
    };
  }

  it('persists extracted fields when PDF text is ready', async () => {
    const { service, jobRepo, pdfJobRepo, pageRepo, fieldRepo } = buildService();
    jobRepo.findOne.mockResolvedValue({
      id: payload.extractionJobId,
      status: RFP_EXTRACTION_JOB_STATUS.PENDING,
    });
    pdfJobRepo.findOne.mockResolvedValue({
      id: 'pdf-job-1',
      status: PDF_PROCESSING_STATUS.COMPLETED,
    });
    pageRepo.find.mockResolvedValue([
      { pageNumber: 1, textContent: 'Tender No: GEM/2025/12345' },
    ]);

    await service.execute(payload);

    expect(fieldRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldKey: 'tender_reference_number',
        reviewStatus: RFP_FIELD_REVIEW_STATUS.DRAFT,
        extractedValue: 'GEM/2025/12345',
      }),
    );
    expect(jobRepo.update).toHaveBeenCalledWith(
      payload.extractionJobId,
      expect.objectContaining({
        status: RFP_EXTRACTION_JOB_STATUS.REVIEW_PENDING,
      }),
    );
  });

  it('fails when PDF processing is not complete', async () => {
    const { service, jobRepo, pdfJobRepo } = buildService();
    jobRepo.findOne.mockResolvedValue({
      id: payload.extractionJobId,
      status: RFP_EXTRACTION_JOB_STATUS.PENDING,
    });
    pdfJobRepo.findOne.mockResolvedValue({
      id: 'pdf-job-1',
      status: PDF_PROCESSING_STATUS.PENDING,
    });

    await expect(service.execute(payload)).rejects.toBeInstanceOf(
      PdfTextNotReadyError,
    );
    expect(jobRepo.update).toHaveBeenCalledWith(
      payload.extractionJobId,
      expect.objectContaining({
        status: RFP_EXTRACTION_JOB_STATUS.FAILED,
      }),
    );
  });
});