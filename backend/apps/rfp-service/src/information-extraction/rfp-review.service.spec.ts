import { BadRequestException } from '@nestjs/common';
import {
  RFP_FIELD_REVIEW_STATUS,
} from '../common/constants/rfp-extraction.constants';
import { RfpExtractedFieldNotFoundError } from '../common/exceptions/information-extraction.errors';
import { RfpReviewService } from './rfp-review.service';

describe('RfpReviewService', () => {
  const versionService = {
    getVersionOrThrow: jest.fn().mockResolvedValue({ id: 'ver-1' }),
  };

  function buildService() {
    const field = {
      id: 'field-1',
      rfpId: 'rfp-1',
      versionId: 'ver-1',
      fieldKey: 'emd_details',
      dataType: 'text',
      extractedValue: 'EMD 2%',
      correctedValue: null,
      confirmedValue: null,
      reviewStatus: RFP_FIELD_REVIEW_STATUS.DRAFT,
    };

    const fieldRepo = {
      findOne: jest.fn().mockResolvedValue(field),
      find: jest.fn(),
      save: jest.fn(async (row) => row),
      create: jest.fn(),
    };
    const auditRepo = {
      save: jest.fn(),
      create: jest.fn((row) => row),
      find: jest.fn(),
    };
    const jobRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const fieldMappingService = {
      validateValueForType: jest.fn().mockReturnValue({
        valid: true,
        normalized: 'EMD 3%',
      }),
    };

    const service = new RfpReviewService(
      fieldRepo as never,
      auditRepo as never,
      jobRepo as never,
      versionService as never,
      fieldMappingService as never,
    );

    return { service, fieldRepo, auditRepo, field, fieldMappingService };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    versionService.getVersionOrThrow.mockResolvedValue({ id: 'ver-1' });
  });

  it('corrects a field and writes audit', async () => {
    const { service, fieldRepo, auditRepo } = buildService();

    const result = await service.reviewField(
      'rfp-1',
      'ver-1',
      'field-1',
      { action: RFP_FIELD_REVIEW_STATUS.CORRECTED, value: 'EMD 3%' },
      'reviewer-1',
    );

    expect(result.reviewStatus).toBe(RFP_FIELD_REVIEW_STATUS.CORRECTED);
    expect(fieldRepo.save).toHaveBeenCalled();
    expect(auditRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'corrected', reviewerId: 'reviewer-1' }),
    );
  });

  it('requires a value for corrected action', async () => {
    const { service } = buildService();
    await expect(
      service.reviewField(
        'rfp-1',
        'ver-1',
        'field-1',
        { action: RFP_FIELD_REVIEW_STATUS.CORRECTED },
        'reviewer-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when field is missing', async () => {
    const { service, fieldRepo } = buildService();
    fieldRepo.findOne.mockResolvedValue(null);
    await expect(
      service.reviewField(
        'rfp-1',
        'ver-1',
        'missing',
        { action: RFP_FIELD_REVIEW_STATUS.ACCEPTED },
        'reviewer-1',
      ),
    ).rejects.toBeInstanceOf(RfpExtractedFieldNotFoundError);
  });
});