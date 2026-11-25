import {
  Body,
  Controller,
  Delete,
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
import { ChangedBy } from '../common/decorators/changed-by.decorator';
import { ComplianceEvidenceReference } from '../entities/compliance-evidence-reference.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { EvidenceService } from './evidence.service';

@ApiTags('Evidence')
@ApiBearerAuth()
@Controller('assessments/:assessmentId/matrix/:entryId/evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add evidence reference to a matrix requirement',
    description:
      'Stores document id and/or URL metadata only. Files remain in Document Service / external systems.',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'entryId', format: 'uuid' })
  @ApiResponse({ status: 201, type: ComplianceEvidenceReference })
  @ApiResponse({ status: 400, description: 'Missing reference or assessment completed' })
  create(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() dto: CreateEvidenceDto,
    @ChangedBy() actorId?: string,
  ): Promise<ComplianceEvidenceReference> {
    return this.evidenceService.create(assessmentId, entryId, dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'List evidence references for a matrix entry' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'entryId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ComplianceEvidenceReference] })
  findAll(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ): Promise<ComplianceEvidenceReference[]> {
    return this.evidenceService.listForMatrixEntry(assessmentId, entryId);
  }

  @Get(':evidenceId')
  @ApiOperation({ summary: 'Get evidence reference details' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'entryId', format: 'uuid' })
  @ApiParam({ name: 'evidenceId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceEvidenceReference })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  findOne(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
  ): Promise<ComplianceEvidenceReference> {
    return this.evidenceService.findOne(assessmentId, entryId, evidenceId);
  }

  @Patch(':evidenceId')
  @ApiOperation({ summary: 'Update evidence metadata' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'entryId', format: 'uuid' })
  @ApiParam({ name: 'evidenceId', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceEvidenceReference })
  update(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @Body() dto: UpdateEvidenceDto,
  ): Promise<ComplianceEvidenceReference> {
    return this.evidenceService.update(assessmentId, entryId, evidenceId, dto);
  }

  @Delete(':evidenceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove evidence reference' })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiParam({ name: 'entryId', format: 'uuid' })
  @ApiParam({ name: 'evidenceId', format: 'uuid' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 400, description: 'Assessment completed' })
  async remove(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
  ): Promise<void> {
    await this.evidenceService.remove(assessmentId, entryId, evidenceId);
  }
}