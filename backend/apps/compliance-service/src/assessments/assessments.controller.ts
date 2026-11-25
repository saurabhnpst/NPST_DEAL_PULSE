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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChangedBy } from '../common/decorators/changed-by.decorator';
import { ComplianceAssessment } from '../entities/compliance-assessment.entity';
import { AssessmentsService } from './assessments.service';
import { ChangeAssessmentStatusDto } from './dto/change-assessment-status.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ListAssessmentsQueryDto } from './dto/list-assessments-query.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a compliance assessment',
    description:
      'Binds an opportunity to an active configuration. Initial status is Draft.',
  })
  @ApiResponse({ status: 201, type: ComplianceAssessment })
  @ApiResponse({ status: 400, description: 'Invalid configuration or opportunity' })
  create(
    @Body() dto: CreateAssessmentDto,
    @ChangedBy() actorId?: string,
  ): Promise<ComplianceAssessment> {
    return this.assessmentsService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'List compliance assessments' })
  @ApiResponse({ status: 200, type: [ComplianceAssessment] })
  findAll(
    @Query() query: ListAssessmentsQueryDto,
  ): Promise<ComplianceAssessment[]> {
    return this.assessmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessment })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ComplianceAssessment> {
    return this.assessmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update assessment metadata',
    description: 'Does not change status or configuration. Not allowed when Completed.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessment })
  @ApiResponse({ status: 400, description: 'Assessment is completed' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssessmentDto,
  ): Promise<ComplianceAssessment> {
    return this.assessmentsService.update(id, dto);
  }

  @Post(':id/start')
  @ApiOperation({
    summary: 'Start assessment',
    description: 'Draft → InProgress. Requires an active configuration with frameworks and requirements.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessment })
  @ApiResponse({ status: 400, description: 'Invalid status or configuration' })
  start(@Param('id', ParseUUIDPipe) id: string): Promise<ComplianceAssessment> {
    return this.assessmentsService.start(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change assessment status',
    description:
      'Valid MVP transitions: InProgress↔InReview; InReview→Completed (prefer POST .../complete). Draft must use .../start.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessment })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAssessmentStatusDto,
  ): Promise<ComplianceAssessment> {
    return this.assessmentsService.changeStatus(id, dto);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Complete assessment',
    description:
      'InReview → Completed when configuration is valid and all matrix lines are approved (when present).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessment })
  @ApiResponse({ status: 400, description: 'Completion conditions not met' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ComplianceAssessment> {
    return this.assessmentsService.complete(id);
  }
}