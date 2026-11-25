import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ExtractedTextResponseDto } from './dto/extracted-text-response.dto';
import { ProcessingStatusResponseDto } from './dto/processing-status-response.dto';
import { StartProcessingResponseDto } from './dto/start-processing-response.dto';
import { PdfProcessingService } from './pdf-processing.service';

@ApiTags('RFP PDF processing')
@ApiBearerAuth()
@Controller('rfps/:rfpId/documents/:documentId')
export class RfpPdfProcessingController {
  constructor(private readonly pdfProcessingService: PdfProcessingService) {}

  @Post('processing')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start PDF text extraction and OCR processing' })
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiAcceptedResponse({ type: StartProcessingResponseDto })
  startProcessing(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: Request,
  ): Promise<StartProcessingResponseDto> {
    return this.pdfProcessingService.startProcessing(rfpId, documentId, {
      userAuthorization: req.headers.authorization,
    });
  }

  @Post('processing/reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Reprocess PDF with a new processing attempt' })
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiAcceptedResponse({ type: StartProcessingResponseDto })
  reprocess(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: Request,
  ): Promise<StartProcessingResponseDto> {
    return this.pdfProcessingService.reprocess(rfpId, documentId, {
      userAuthorization: req.headers.authorization,
    });
  }

  @Get('processing')
  @ApiOperation({ summary: 'Get latest PDF processing job status' })
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ProcessingStatusResponseDto })
  getStatus(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<ProcessingStatusResponseDto> {
    return this.pdfProcessingService.getStatus(rfpId, documentId);
  }

  @Get('extracted-text')
  @ApiOperation({ summary: 'Retrieve extracted text for the latest processing job' })
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiParam({ name: 'documentId', format: 'uuid' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Return a single page (1-based)',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['pages', 'concat'],
  })
  @ApiResponse({ status: 200, type: ExtractedTextResponseDto })
  getExtractedText(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query('page') page?: string,
    @Query('format') format?: 'pages' | 'concat',
  ): Promise<ExtractedTextResponseDto> {
    const pageNumber = page ? Number.parseInt(page, 10) : undefined;
    return this.pdfProcessingService.getExtractedText(rfpId, documentId, {
      page: Number.isFinite(pageNumber) ? pageNumber : undefined,
      format,
    });
  }
}