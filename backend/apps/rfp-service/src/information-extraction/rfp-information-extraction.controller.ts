import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { resolveReviewerId } from '../common/auth/reviewer-context';
import { AmendmentComparisonService } from './amendment-comparison.service';
import { CompareVersionsQueryDto } from './dto/compare-versions-query.dto';
import { RegisterRfpVersionDto } from './dto/register-rfp-version.dto';
import { ReviewAmendmentDiffDto } from './dto/review-amendment-diff.dto';
import { ReviewFieldDto } from './dto/review-field.dto';
import { RfpExtractionOrchestrationService } from './rfp-extraction-orchestration.service';
import { RfpReviewService } from './rfp-review.service';
import { RfpVersionService } from './rfp-version.service';

@ApiTags('RFP information extraction')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Reviewer-Id',
  required: false,
  description: 'Reviewer user id until Auth Service guards are enabled',
})
@Controller('rfps/:rfpId')
export class RfpInformationExtractionController {
  constructor(
    private readonly versionService: RfpVersionService,
    private readonly extractionService: RfpExtractionOrchestrationService,
    private readonly reviewService: RfpReviewService,
    private readonly amendmentService: AmendmentComparisonService,
  ) {}

  @Post('versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an RFP document version or amendment' })
  registerVersion(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Body() dto: RegisterRfpVersionDto,
  ) {
    return this.versionService.registerVersion(rfpId, dto);
  }

  @Get('versions')
  @ApiOperation({ summary: 'List document versions for an RFP' })
  listVersions(@Param('rfpId', ParseUUIDPipe) rfpId: string) {
    return this.versionService.listVersions(rfpId);
  }

  @Post('versions/:versionId/extraction')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue rule-based information extraction' })
  startExtraction(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.extractionService.requestExtraction(rfpId, versionId);
  }

  @Get('versions/:versionId/extraction')
  @ApiOperation({ summary: 'Information extraction job status' })
  extractionStatus(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.extractionService.getLatestJobStatus(rfpId, versionId);
  }

  @Get('versions/:versionId/fields')
  @ApiOperation({ summary: 'Extracted fields with source evidence' })
  listFields(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
  ) {
    return this.extractionService.listExtractedFields(rfpId, versionId);
  }

  @Get('field-mappings')
  @ApiOperation({ summary: 'Active field mapping configuration' })
  fieldMappings() {
    return this.extractionService.listFieldMappings();
  }

  @Patch('versions/:versionId/fields/:fieldId/review')
  @ApiOperation({ summary: 'Review, correct, or confirm an extracted field' })
  reviewField(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: ReviewFieldDto,
    @Req() req: Request,
  ) {
    return this.reviewService.reviewField(
      rfpId,
      versionId,
      fieldId,
      dto,
      resolveReviewerId(req),
    );
  }

  @Post('versions/:versionId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm accepted/corrected fields for a version' })
  confirmVersion(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Req() req: Request,
  ) {
    return this.reviewService.confirmVersion(
      rfpId,
      versionId,
      resolveReviewerId(req),
    );
  }

  @Get('confirmed-fields')
  @ApiOperation({ summary: 'Confirmed RFP field values for downstream modules' })
  confirmedFields(@Param('rfpId', ParseUUIDPipe) rfpId: string) {
    return this.extractionService.listConfirmedFields(rfpId);
  }

  @Get('versions/compare')
  @ApiOperation({ summary: 'Compare two RFP document versions' })
  @ApiQuery({ name: 'fromVersionId', required: true })
  @ApiQuery({ name: 'toVersionId', required: true })
  compareVersions(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Query() query: CompareVersionsQueryDto,
  ) {
    return this.amendmentService.compareVersions(
      rfpId,
      query.fromVersionId,
      query.toVersionId,
    );
  }

  @Patch('amendments/compare/:comparisonId/diffs/:diffId/review')
  @ApiOperation({ summary: 'Review an amendment comparison diff' })
  reviewAmendmentDiff(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Param('comparisonId', ParseUUIDPipe) comparisonId: string,
    @Param('diffId', ParseUUIDPipe) diffId: string,
    @Body() dto: ReviewAmendmentDiffDto,
    @Req() req: Request,
  ) {
    return this.amendmentService.reviewDiff(
      rfpId,
      comparisonId,
      diffId,
      dto,
      resolveReviewerId(req),
    );
  }

  @Get('audit')
  @ApiOperation({ summary: 'RFP field review audit history' })
  @ApiQuery({ name: 'versionId', required: false })
  audit(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Query('versionId') versionId?: string,
  ) {
    return this.reviewService.listAudit(rfpId, versionId);
  }
}