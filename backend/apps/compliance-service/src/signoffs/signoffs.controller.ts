import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChangedBy } from '../common/decorators/changed-by.decorator';
import { ComplianceAssessmentSignoff } from '../entities/compliance-assessment-signoff.entity';
import { CreateSignoffDto } from './dto/create-signoff.dto';
import { SignoffsService } from './signoffs.service';

@ApiTags('Sign-offs')
@ApiBearerAuth()
@Controller('assessments/:assessmentId/sign-offs')
export class SignoffsController {
  constructor(private readonly signoffsService: SignoffsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create final compliance sign-off',
    description:
      'One sign-off per assessment. SIGNED_OFF requires matrix readiness and an APPROVED submitted review.',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiResponse({ status: 201, type: ComplianceAssessmentSignoff })
  @ApiResponse({ status: 400, description: 'Assessment or review prerequisites not met' })
  @ApiResponse({ status: 409, description: 'Sign-off already exists' })
  create(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Body() dto: CreateSignoffDto,
    @ChangedBy() signerActorId?: string,
  ): Promise<ComplianceAssessmentSignoff> {
    return this.signoffsService.create(assessmentId, dto, signerActorId);
  }

  @Get()
  @ApiOperation({
    summary: 'List sign-offs for an assessment',
    description: 'MVP allows at most one sign-off row per assessment.',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ComplianceAssessmentSignoff] })
  findAll(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
  ): Promise<ComplianceAssessmentSignoff[]> {
    return this.signoffsService.findByAssessment(assessmentId);
  }

  @Get(':signoffId')
  @ApiOperation({ summary: 'Get sign-off by id' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'signoffId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceAssessmentSignoff })
  @ApiResponse({ status: 404, description: 'Sign-off not found' })
  findOne(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('signoffId', ParseUUIDPipe) signoffId: string,
  ): Promise<ComplianceAssessmentSignoff> {
    return this.signoffsService.findOne(assessmentId, signoffId);
  }
}