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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRfpDto } from '../dto/create-rfp.dto';
import { ListRfpsQueryDto } from '../dto/list-rfps-query.dto';
import { PaginatedRfpsResponseDto } from '../dto/paginated-rfps-response.dto';
import { UpdateRfpDto } from '../dto/update-rfp.dto';
import { Rfp } from '../entities/rfp.entity';
import { RfpsService } from './rfps.service';

@ApiTags('RFPs')
@ApiBearerAuth()
@Controller('rfps')
export class RfpsController {
  constructor(private readonly rfpsService: RfpsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an RFP record' })
  @ApiResponse({ status: 201, type: Rfp })
  create(@Body() dto: CreateRfpDto) {
    return this.rfpsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List RFPs with pagination and filters' })
  @ApiResponse({ status: 200, type: PaginatedRfpsResponseDto })
  findAll(@Query() query: ListRfpsQueryDto) {
    return this.rfpsService.findAll(query);
  }

  @Get('lead/:leadId')
  @ApiOperation({ summary: 'List RFPs linked to a lead' })
  @ApiParam({ name: 'leadId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [Rfp] })
  findByLead(@Param('leadId', ParseUUIDPipe) leadId: string) {
    return this.rfpsService.findByLeadId(leadId);
  }

  @Get('opportunity/:opportunityId')
  @ApiOperation({ summary: 'List RFPs linked to an opportunity' })
  @ApiParam({ name: 'opportunityId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [Rfp] })
  findByOpportunity(
    @Param('opportunityId', ParseUUIDPipe) opportunityId: string,
  ) {
    return this.rfpsService.findByOpportunityId(opportunityId);
  }

  @Get(':rfpId')
  @ApiOperation({ summary: 'Get RFP by id' })
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiResponse({ status: 200, type: Rfp })
  @ApiNotFoundResponse({ description: 'RFP not found' })
  findOne(@Param('rfpId', ParseUUIDPipe) rfpId: string) {
    return this.rfpsService.findOne(rfpId);
  }

  @Patch(':rfpId')
  @ApiOperation({ summary: 'Update RFP fields' })
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiResponse({ status: 200, type: Rfp })
  @ApiNotFoundResponse({ description: 'RFP not found' })
  update(
    @Param('rfpId', ParseUUIDPipe) rfpId: string,
    @Body() dto: UpdateRfpDto,
  ) {
    return this.rfpsService.update(rfpId, dto);
  }

  @Delete(':rfpId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an RFP' })
  @ApiParam({ name: 'rfpId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'RFP not found' })
  async remove(@Param('rfpId', ParseUUIDPipe) rfpId: string) {
    await this.rfpsService.remove(rfpId);
  }
}