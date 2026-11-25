import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GapAnalysisQueryDto } from './dto/gap-analysis-query.dto';
import { GapAnalysisResponseDto } from './dto/gap-analysis-response.dto';
import { GapAnalysisService } from './gap-analysis.service';

@ApiTags('Gap Analysis')
@ApiBearerAuth()
@Controller('assessments/:assessmentId/gap-analysis')
export class GapAnalysisController {
  constructor(private readonly gapAnalysisService: GapAnalysisService) {}

  @Get()
  @ApiOperation({
    summary: 'Get gap analysis for an assessment',
    description:
      'Derived read-only view of compliance_assessment_lines. Compliance % = COMPLIANT / (total − NOT_APPLICABLE). Optional filters: category, frameworkId.',
  })
  @ApiParam({ name: 'assessmentId', format: 'uuid' })
  @ApiResponse({ status: 200, type: GapAnalysisResponseDto })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  getGapAnalysis(
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
    @Query() query: GapAnalysisQueryDto,
  ): Promise<GapAnalysisResponseDto> {
    return this.gapAnalysisService.getForAssessment(assessmentId, query);
  }
}