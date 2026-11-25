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
import { Lead } from '../entities/lead.entity';
import { ChangedBy } from '../common/decorators/changed-by.decorator';
import { AssessNeedDto } from './dto/assess-need.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';
import { LinkOpportunityDto, RejectLeadDto } from './dto/approval-outcome.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a lead' })
  @ApiResponse({ status: 201, type: Lead })
  create(
    @Body() dto: CreateLeadDto,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.create(dto, changedBy);
  }

  @Get()
  @ApiOperation({ summary: 'List all active (non-deleted) leads' })
  @ApiResponse({ status: 200, type: [Lead] })
  findAll(): Promise<Lead[]> {
    return this.leadsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: Lead })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Lead> {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead fields (immutable audit fields ignored)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: Lead })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.update(id, dto, changedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a lead' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204 })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @ChangedBy() changedBy?: string,
  ): Promise<void> {
    return this.leadsService.remove(id, changedBy);
  }

  @Post(':id/working')
  @ApiOperation({ summary: 'Move lead to Working stage (Stage 2)' })
  moveToWorking(
    @Param('id', ParseUUIDPipe) id: string,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.moveToWorking(id, changedBy);
  }

  @Post(':id/assess-need')
  @ApiOperation({
    summary:
      'Assess need (Yes -> approval path; No -> Unqualified or Nurturing)',
  })
  assessNeed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssessNeedDto,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.assessNeed(id, dto, changedBy);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary:
      'Mark lead qualified after approval (integration hooks only; no approval DB)',
  })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.approveLead(id, changedBy);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Lead rejected in approval → Unqualified (called by approval-service)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLeadDto,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.rejectLead(id, dto.reason, changedBy);
  }

  @Post(':id/link-opportunity')
  @ApiOperation({ summary: 'Link the opportunity created from the RFP synopsis (called by rfp-service)' })
  linkOpportunity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkOpportunityDto,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.linkOpportunity(id, dto.opportunityId, changedBy);
  }

  @Post(':id/send-back')
  @ApiOperation({ summary: 'Approver asked for more work → back to Working (called by approval-service)' })
  sendBack(
    @Param('id', ParseUUIDPipe) id: string,
    @ChangedBy() changedBy?: string,
  ): Promise<Lead> {
    return this.leadsService.sendBackLead(id, changedBy);
  }
}