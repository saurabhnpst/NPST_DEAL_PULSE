import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentServiceClient } from '../clients/document-service.client';
import { RfpDocumentAssociation } from '../entities/rfp-document-association.entity';
import { Rfp } from '../entities/rfp.entity';
import { RfpDocumentsController } from './rfp-documents.controller';
import { RfpDocumentService } from './rfp-document.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rfp, RfpDocumentAssociation]),
  ],
  controllers: [RfpDocumentsController],
  providers: [DocumentServiceClient, RfpDocumentService],
  exports: [RfpDocumentService, DocumentServiceClient],
})
export class DocumentsModule {}