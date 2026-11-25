import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RfpFieldMappingConfig } from '../entities/rfp-field-mapping-config.entity';

@Injectable()
export class FieldMappingService {
  constructor(
    @InjectRepository(RfpFieldMappingConfig)
    private readonly mappingRepo: Repository<RfpFieldMappingConfig>,
  ) {}

  async listActiveMappings(): Promise<RfpFieldMappingConfig[]> {
    return this.mappingRepo.find({
      where: { active: true },
      order: { fieldKey: 'ASC' },
    });
  }

  validateValueForType(
    dataType: string,
    value: string,
  ): { valid: boolean; normalized?: string; reason?: string } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { valid: false, reason: 'EMPTY_VALUE' };
    }
    switch (dataType) {
      case 'boolean': {
        const lower = trimmed.toLowerCase();
        if (['yes', 'true', 'required', '1'].includes(lower)) {
          return { valid: true, normalized: 'true' };
        }
        if (['no', 'false', 'not required', '0'].includes(lower)) {
          return { valid: true, normalized: 'false' };
        }
        return { valid: false, reason: 'INVALID_BOOLEAN' };
      }
      case 'number': {
        const num = Number(trimmed.replace(/,/g, ''));
        if (!Number.isFinite(num)) {
          return { valid: false, reason: 'INVALID_NUMBER' };
        }
        return { valid: true, normalized: String(num) };
      }
      case 'date': {
        const parsed = Date.parse(trimmed);
        if (Number.isNaN(parsed)) {
          return { valid: false, reason: 'INVALID_DATE' };
        }
        return { valid: true, normalized: new Date(parsed).toISOString() };
      }
      default:
        return { valid: true, normalized: trimmed };
    }
  }
}