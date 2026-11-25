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
import { ComplianceRequirement } from '../entities/compliance-requirement.entity';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { RequirementsService } from './requirements.service';

@ApiTags('Requirements')
@ApiBearerAuth()
@Controller()
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Post('frameworks/:frameworkId/requirements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a requirement under a framework' })
  @ApiParam({ name: 'frameworkId', format: 'uuid' })
  @ApiResponse({ status: 201, type: ComplianceRequirement })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  @ApiResponse({ status: 409, description: 'Duplicate requirement code' })
  create(
    @Param('frameworkId', ParseUUIDPipe) frameworkId: string,
    @Body() dto: CreateRequirementDto,
  ): Promise<ComplianceRequirement> {
    return this.requirementsService.create(frameworkId, dto);
  }

  @Get('frameworks/:frameworkId/requirements')
  @ApiOperation({ summary: 'List requirements for a framework' })
  @ApiParam({ name: 'frameworkId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ComplianceRequirement] })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  findByFramework(
    @Param('frameworkId', ParseUUIDPipe) frameworkId: string,
  ): Promise<ComplianceRequirement[]> {
    return this.requirementsService.findByFramework(frameworkId);
  }

  @Get('requirements/:id')
  @ApiOperation({ summary: 'Get requirement by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceRequirement })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ComplianceRequirement> {
    return this.requirementsService.findOne(id);
  }

  @Patch('requirements/:id')
  @ApiOperation({ summary: 'Update a requirement' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceRequirement })
  @ApiResponse({ status: 409, description: 'Duplicate requirement code' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequirementDto,
  ): Promise<ComplianceRequirement> {
    return this.requirementsService.update(id, dto);
  }

  @Delete('requirements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a requirement when not referenced by matrix lines' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  @ApiResponse({ status: 409, description: 'Requirement is referenced and cannot be deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.requirementsService.remove(id);
  }
}