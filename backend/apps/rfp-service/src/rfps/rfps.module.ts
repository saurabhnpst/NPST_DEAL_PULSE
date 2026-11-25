import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from '../documents/documents.module';
import { InformationExtractionModule } from '../information-extraction/information-extraction.module';
import { PdfProcessingModule } from '../pdf-processing/pdf-processing.module';
import { Rfp } from '../entities/rfp.entity';
import { RfpsController } from './rfps.controller';
import { RfpsService } from './rfps.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rfp]),
    DocumentsModule,
    PdfProcessingModule,
    InformationExtractionModule,
  ],
  controllers: [RfpsController],
  providers: [RfpsService],
})
export class RfpsModule {}