import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Req,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { RfpDocumentService } from './rfp-document.service';

@ApiTags('RFPs')
@ApiBearerAuth()
@Controller('rfps/:rfpId/documents')
export class RfpDocumentsController {
  constructor(private readonly rfpDocumentService: RfpDocumentService) {}

  @Get(':documentId/download')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download a PDF linked to an RFP' })
  @ApiProduces('application/pdf')
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'PDF binary stream' })
  @ApiResponse({ status: 403, description: 'Document not linked to RFP' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async download(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const result = await this.rfpDocumentService.downloadForRfp(
      rfpId,
      documentId,
      { userAuthorization: req.headers.authorization },
    );

    return new StreamableFile(result.data, {
      type: result.mimeType || 'application/pdf',
      disposition: `attachment; filename="${result.fileName}"`,
    });
  }
}