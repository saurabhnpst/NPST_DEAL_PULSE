import {
  PDF_PROCESSING_QUEUE,
  PDF_PROCESSING_STATUS,
} from '../common/constants/pdf-processing-status.constants';
import { PdfProcessingInProgressError } from '../common/exceptions/pdf-processing.errors';
import { RfpDocumentService } from '../documents/rfp-document.service';
import { PdfProcessingService } from './pdf-processing.service';

describe('PdfProcessingService', () => {
  let service: PdfProcessingService;
  const jobRepo = {
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => ({ id: 'job-1', ...entity })),
    findOne: jest.fn(),
  };
  const pageRepo = { find: jest.fn(), findOne: jest.fn() };
  const queue = { add: jest.fn() };
  const rfpDocumentService = {
    assertDocumentLinkedToRfp: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PdfProcessingService(
      jobRepo as never,
      pageRepo as never,
      queue as never,
      rfpDocumentService as unknown as RfpDocumentService,
      {
        getOrThrow: () => ({
          queueRetryAttempts: 3,
          queueRetryBackoffMs: 5_000,
        }),
      } as never,
    );
    void PDF_PROCESSING_QUEUE;
  });

  it('queues processing job after access validation', async () => {
    jobRepo.findOne.mockResolvedValue(null);
    const result = await service.startProcessing(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    );
    expect(rfpDocumentService.assertDocumentLinkedToRfp).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalled();
    expect(result.processingJobId).toBe('job-1');
    expect(result.status).toBe('pending');
  });

  it('forwards authorization into the BullMQ payload', async () => {
    jobRepo.findOne.mockResolvedValue(null);
    await service.startProcessing(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      { userAuthorization: 'Bearer test-token' },
    );
    expect(queue.add).toHaveBeenCalledWith(
      'process-pdf',
      expect.objectContaining({ userAuthorization: 'Bearer test-token' }),
      expect.any(Object),
    );
  });

  it('rejects duplicate processing while a job is in progress', async () => {
    jobRepo.findOne.mockResolvedValue({
      id: 'job-busy',
      status: PDF_PROCESSING_STATUS.PROCESSING,
      attempt: 1,
    });
    await expect(
      service.startProcessing(
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ),
    ).rejects.toBeInstanceOf(PdfProcessingInProgressError);
  });
});