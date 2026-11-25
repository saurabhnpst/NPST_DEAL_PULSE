import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RFP_EXTRACTION_JOB_STATUS,
  RFP_FIELD_REVIEW_STATUS,
} from '../common/constants/rfp-extraction.constants';
import { RfpExtractedFieldNotFoundError } from '../common/exceptions/information-extraction.errors';
import { RfpExtractedField } from '../entities/rfp-extracted-field.entity';
import { RfpFieldReviewAudit } from '../entities/rfp-field-review-audit.entity';
import { RfpInformationExtractionJob } from '../entities/rfp-information-extraction-job.entity';
import { FieldMappingService } from '../field-mapping/field-mapping.service';
import { ReviewFieldDto } from './dto/review-field.dto';
import { RfpVersionService } from './rfp-version.service';

@Injectable()
export class RfpReviewService {
  constructor(
    @InjectRepository(RfpExtractedField)
    private readonly fieldRepo: Repository<RfpExtractedField>,
    @InjectRepository(RfpFieldReviewAudit)
    private readonly auditRepo: Repository<RfpFieldReviewAudit>,
    @InjectRepository(RfpInformationExtractionJob)
    private readonly jobRepo: Repository<RfpInformationExtractionJob>,
    private readonly versionService: RfpVersionService,
    private readonly fieldMappingService: FieldMappingService,
  ) {}

  async reviewField(
    rfpId: string,
    versionId: string,
    fieldId: string,
    dto: ReviewFieldDto,
    reviewerId: string,
  ) {
    await this.versionService.getVersionOrThrow(rfpId, versionId);
    const field = await this.fieldRepo.findOne({
      where: { id: fieldId, rfpId, versionId },
    });
    if (!field) {
      throw new RfpExtractedFieldNotFoundError();
    }

    const previous =
      field.correctedValue ?? field.extractedValue ?? field.confirmedValue ?? null;

    let newValue = previous;
    let reviewStatus = dto.action;

    switch (dto.action) {
      case RFP_FIELD_REVIEW_STATUS.ACCEPTED:
        reviewStatus = RFP_FIELD_REVIEW_STATUS.ACCEPTED;
        newValue = field.extractedValue ?? previous;
        break;
      case RFP_FIELD_REVIEW_STATUS.CORRECTED:
        if (!dto.value?.trim()) {
          throw new BadRequestException('Corrected value is required');
        }
        const validation = this.fieldMappingService.validateValueForType(
          field.dataType,
          dto.value,
        );
        if (!validation.valid) {
          throw new BadRequestException(
            `Invalid value for ${field.dataType}: ${validation.reason}`,
          );
        }
        field.correctedValue = validation.normalized ?? dto.value.trim();
        newValue = field.correctedValue;
        reviewStatus = RFP_FIELD_REVIEW_STATUS.CORRECTED;
        break;
      case RFP_FIELD_REVIEW_STATUS.REJECTED:
        reviewStatus = RFP_FIELD_REVIEW_STATUS.REJECTED;
        break;
      case RFP_FIELD_REVIEW_STATUS.UNRESOLVED:
        reviewStatus = RFP_FIELD_REVIEW_STATUS.UNRESOLVED;
        break;
      case RFP_FIELD_REVIEW_STATUS.CONFIRMED: {
        const candidate =
          field.correctedValue ?? field.extractedValue ?? dto.value?.trim();
        if (!candidate) {
          throw new BadRequestException(
            'Cannot confirm field without an extracted or corrected value',
          );
        }
        const confirmValidation = this.fieldMappingService.validateValueForType(
          field.dataType,
          candidate,
        );
        if (!confirmValidation.valid) {
          throw new BadRequestException(
            `Cannot confirm invalid value: ${confirmValidation.reason}`,
          );
        }
        field.confirmedValue = confirmValidation.normalized ?? candidate;
        field.confirmedAt = new Date();
        field.confirmedById = reviewerId;
        newValue = field.confirmedValue;
        reviewStatus = RFP_FIELD_REVIEW_STATUS.CONFIRMED;
        break;
      }
      default:
        throw new BadRequestException(`Unsupported review action: ${dto.action}`);
    }

    field.reviewStatus = reviewStatus;
    await this.fieldRepo.save(field);

    await this.auditRepo.save(
      this.auditRepo.create({
        rfpId,
        versionId,
        extractedFieldId: field.id,
        action: dto.action,
        reviewerId,
        previousValue: previous,
        newValue: newValue ?? null,
        comments: dto.comments ?? null,
      }),
    );

    return this.mapField(field);
  }

  async confirmVersion(rfpId: string, versionId: string, reviewerId: string) {
    await this.versionService.getVersionOrThrow(rfpId, versionId);
    const fields = await this.fieldRepo.find({
      where: { rfpId, versionId },
    });

    let confirmedCount = 0;
    for (const field of fields) {
      if (field.reviewStatus === RFP_FIELD_REVIEW_STATUS.CONFIRMED) {
        confirmedCount++;
        continue;
      }
      if (
        field.reviewStatus === RFP_FIELD_REVIEW_STATUS.ACCEPTED ||
        field.reviewStatus === RFP_FIELD_REVIEW_STATUS.CORRECTED
      ) {
        const candidate = field.correctedValue ?? field.extractedValue;
        if (!candidate) {
          continue;
        }
        field.reviewStatus = RFP_FIELD_REVIEW_STATUS.CONFIRMED;
        field.confirmedValue = candidate;
        field.confirmedAt = new Date();
        field.confirmedById = reviewerId;
        await this.fieldRepo.save(field);
        confirmedCount++;
        await this.auditRepo.save(
          this.auditRepo.create({
            rfpId,
            versionId,
            extractedFieldId: field.id,
            action: 'bulk_confirm',
            reviewerId,
            newValue: candidate,
          }),
        );
      }
    }

    const job = await this.jobRepo.findOne({
      where: { versionId },
      order: { createdAt: 'DESC' },
    });
    if (job) {
      await this.jobRepo.update(job.id, {
        status:
          confirmedCount > 0
            ? RFP_EXTRACTION_JOB_STATUS.CONFIRMED
            : job.status,
      });
    }

    return { confirmedFieldCount: confirmedCount };
  }

  async listAudit(rfpId: string, versionId?: string) {
    const where = versionId ? { rfpId, versionId } : { rfpId };
    const rows = await this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return rows.map((row) => ({
      id: row.id,
      extractedFieldId: row.extractedFieldId,
      action: row.action,
      reviewerId: row.reviewerId,
      previousValue: row.previousValue,
      newValue: row.newValue,
      comments: row.comments,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private mapField(field: RfpExtractedField) {
    return {
      id: field.id,
      fieldKey: field.fieldKey,
      reviewStatus: field.reviewStatus,
      extractedValue: field.extractedValue,
      correctedValue: field.correctedValue,
      confirmedValue: field.confirmedValue,
      sourceExcerpt: field.sourceExcerpt,
      confirmedAt: field.confirmedAt?.toISOString() ?? null,
    };
  }
}