import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfpFieldMappingConfig } from '../entities/rfp-field-mapping-config.entity';
import { FieldMappingService } from './field-mapping.service';
import { RuleBasedExtractorService } from './rule-based-extractor.service';

@Module({
  imports: [TypeOrmModule.forFeature([RfpFieldMappingConfig])],
  providers: [FieldMappingService, RuleBasedExtractorService],
  exports: [FieldMappingService, RuleBasedExtractorService],
})
export class FieldMappingModule {}