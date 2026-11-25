import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RFP_AMENDMENT_CHANGE_CATEGORY,
  RfpAmendmentChangeCategory,
} from '../common/constants/rfp-extraction.constants';
import { RfpAmendmentComparison } from '../entities/rfp-amendment-comparison.entity';
import { RfpAmendmentDiff } from '../entities/rfp-amendment-diff.entity';
import { RfpExtractedField } from '../entities/rfp-extracted-field.entity';
import { ReviewAmendmentDiffDto } from './dto/review-amendment-diff.dto';
import { RfpVersionService } from './rfp-version.service';

@Injectable()
export class AmendmentComparisonService {
  constructor(
    @InjectRepository(RfpAmendmentComparison)
    private readonly comparisonRepo: Repository<RfpAmendmentComparison>,
    @InjectRepository(RfpAmendmentDiff)
    private readonly diffRepo: Repository<RfpAmendmentDiff>,
    @InjectRepository(RfpExtractedField)
    private readonly fieldRepo: Repository<RfpExtractedField>,
    private readonly versionService: RfpVersionService,
  ) {}

  async compareVersions(
    rfpId: string,
    fromVersionId: string,
    toVersionId: string,
  ) {
    if (fromVersionId === toVersionId) {
      throw new BadRequestException('fromVersionId and toVersionId must differ');
    }
    await this.versionService.getVersionOrThrow(rfpId, fromVersionId);
    await this.versionService.getVersionOrThrow(rfpId, toVersionId);

    const fromFields = await this.latestFieldsByKey(fromVersionId);
    const toFields = await this.latestFieldsByKey(toVersionId);
    const keys = new Set([...fromFields.keys(), ...toFields.keys()]);

    const comparison = await this.comparisonRepo.save(
      this.comparisonRepo.create({
        rfpId,
        fromVersionId,
        toVersionId,
        status: 'pending_review',
      }),
    );

    const diffs: RfpAmendmentDiff[] = [];
    for (const key of keys) {
      const prev = fromFields.get(key);
      const next = toFields.get(key);
      const prevValue =
        prev?.confirmedValue ?? prev?.correctedValue ?? prev?.extractedValue ?? null;
      const nextValue =
        next?.confirmedValue ?? next?.correctedValue ?? next?.extractedValue ?? null;

      let category: RfpAmendmentChangeCategory =
        RFP_AMENDMENT_CHANGE_CATEGORY.UNCLEAR;
      if (prevValue && !nextValue) {
        category = RFP_AMENDMENT_CHANGE_CATEGORY.REMOVED;
      } else if (!prevValue && nextValue) {
        category = RFP_AMENDMENT_CHANGE_CATEGORY.ADDED;
      } else if (prevValue && nextValue) {
        if (prevValue.trim() === nextValue.trim()) {
          continue;
        }
        category = this.classifyChange(prevValue, nextValue);
      } else {
        continue;
      }

      diffs.push(
        this.diffRepo.create({
          comparisonId: comparison.id,
          fieldKey: key,
          changeCategory: category,
          previousValue: prevValue,
          newValue: nextValue,
          previousSourceExcerpt: prev?.sourceExcerpt ?? null,
          newSourceExcerpt: next?.sourceExcerpt ?? null,
          reviewStatus: 'pending',
        }),
      );
    }

    if (diffs.length > 0) {
      await this.diffRepo.save(diffs);
    }

    return this.getComparison(rfpId, comparison.id);
  }

  async getComparison(rfpId: string, comparisonId: string) {
    const comparison = await this.comparisonRepo.findOne({
      where: { id: comparisonId, rfpId },
    });
    if (!comparison) {
      throw new BadRequestException('Comparison not found');
    }
    const diffs = await this.diffRepo.find({
      where: { comparisonId },
      order: { fieldKey: 'ASC' },
    });
    return {
      comparisonId: comparison.id,
      rfpId: comparison.rfpId,
      fromVersionId: comparison.fromVersionId,
      toVersionId: comparison.toVersionId,
      status: comparison.status,
      diffs: diffs.map((d) => ({
        id: d.id,
        fieldKey: d.fieldKey,
        changeCategory: d.changeCategory,
        previousValue: d.previousValue,
        newValue: d.newValue,
        previousSourceExcerpt: d.previousSourceExcerpt,
        newSourceExcerpt: d.newSourceExcerpt,
        reviewStatus: d.reviewStatus,
        reviewerId: d.reviewerId,
        comments: d.comments,
      })),
    };
  }

  async reviewDiff(
    rfpId: string,
    comparisonId: string,
    diffId: string,
    dto: ReviewAmendmentDiffDto,
    reviewerId: string,
  ) {
    await this.getComparison(rfpId, comparisonId);
    const diff = await this.diffRepo.findOne({
      where: { id: diffId, comparisonId },
    });
    if (!diff) {
      throw new BadRequestException('Amendment diff not found');
    }
    diff.reviewStatus = dto.action;
    diff.reviewerId = reviewerId;
    diff.comments = dto.comments ?? null;
    await this.diffRepo.save(diff);
    return diff;
  }

  private async latestFieldsByKey(versionId: string) {
    const rows = await this.fieldRepo.find({
      where: { versionId },
      order: { updatedAt: 'DESC' },
    });
    const map = new Map<string, RfpExtractedField>();
    for (const row of rows) {
      if (!map.has(row.fieldKey)) {
        map.set(row.fieldKey, row);
      }
    }
    return map;
  }

  private classifyChange(
    previous: string,
    next: string,
  ): (typeof RFP_AMENDMENT_CHANGE_CATEGORY)[keyof typeof RFP_AMENDMENT_CHANGE_CATEGORY] {
    const prevNorm = previous.replace(/\s+/g, ' ').trim().toLowerCase();
    const nextNorm = next.replace(/\s+/g, ' ').trim().toLowerCase();
    if (prevNorm === nextNorm) {
      return RFP_AMENDMENT_CHANGE_CATEGORY.UNCLEAR;
    }
    if (nextNorm.includes(prevNorm) || prevNorm.includes(nextNorm)) {
      return RFP_AMENDMENT_CHANGE_CATEGORY.CHANGED;
    }
    const similarity = this.levenshteinRatio(prevNorm, nextNorm);
    return similarity < 0.45
      ? RFP_AMENDMENT_CHANGE_CATEGORY.UNCLEAR
      : RFP_AMENDMENT_CHANGE_CATEGORY.CHANGED;
  }

  private levenshteinRatio(a: string, b: string): number {
    if (!a.length && !b.length) {
      return 1;
    }
    const distance = this.levenshtein(a, b);
    return 1 - distance / Math.max(a.length, b.length);
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
    return matrix[a.length][b.length];
  }
}