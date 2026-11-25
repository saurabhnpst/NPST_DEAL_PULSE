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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ComplianceAssessmentLine } from '../entities/compliance-assessment-line.entity';
import { UpdateMatrixEntryDto } from './dto/update-matrix-entry.dto';
import { MatricesService } from './matrices.service';

@ApiTags('Matrix')
@ApiBearerAuth()
@Controller('assessments/:assessmentId/matrix')
export class MatricesController {
  constructor(private readonly matricesService: MatricesService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initialize matrix entries',
    description:
      'Creates one row per requirement in the assessment configuration. Idempotent: existing rows are kept.',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ComplianceAssessmentLine] })
  @ApiResponse({ status: 400, description: 'Assessment completed or configuration empty' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  initialize(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
  ): Promise<ComplianceAssessmentLine[]> {
    return this.matricesService.initialize(assessmentId);
  }

  @Get()
  @ApiOperation({ summary: 'List matrix entries for an assessment' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ComplianceAssessmentLine] })
  findAll(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
  ): Promise<ComplianceAssessmentLine[]> {
    return this.matricesService.listForAssessment(assessmentId);
  }

  @Get(':entryId')
  @ApiOperation({ summary: 'Get a matrix entry' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'entryId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessmentLine })
  @ApiResponse({ status: 404, description: 'Entry not found for this assessment' })
  findOne(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ): Promise<ComplianceAssessmentLine> {
    return this.matricesService.findOne(assessmentId, entryId);
  }

  @Patch(':entryId')
  @ApiOperation({
    summary: 'Update matrix entry result',
    description:
      'Updates compliance status, notes, and reviewer observations on the matrix row only (does not change library requirements).',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'entryId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessmentLine })
  @ApiResponse({ status: 400, description: 'Invalid status or assessment completed' })
  update(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() dto: UpdateMatrixEntryDto,
  ): Promise<ComplianceAssessmentLine> {
    return this.matricesService.update(assessmentId, entryId, dto);
  }
}