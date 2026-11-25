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
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ComplianceConfiguration } from '../entities/compliance-configuration.entity';
import { ConfigurationsService } from './configurations.service';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { ListConfigurationsQueryDto } from './dto/list-configurations-query.dto';
import { SetFrameworkAssociationsDto } from './dto/set-framework-associations.dto';
import { SetRequirementAssociationsDto } from './dto/set-requirement-associations.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

@ApiTags('Configurations')
@ApiBearerAuth()
@Controller('configurations')
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a compliance configuration',
    description:
      'Creates a configuration for a project/opportunity and optionally links frameworks and requirements.',
  })
  @ApiResponse({ status: 201, type: ComplianceConfiguration })
  @ApiResponse({ status: 400, description: 'Invalid framework or requirement association' })
  create(
    @Body() dto: CreateConfigurationDto,
  ): Promise<ComplianceConfiguration> {
    return this.configurationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List compliance configurations' })
  @ApiResponse({ status: 200, type: [ComplianceConfiguration] })
  findAll(
    @Query() query: ListConfigurationsQueryDto,
  ): Promise<ComplianceConfiguration[]> {
    return this.configurationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get configuration by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceConfiguration })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ComplianceConfiguration> {
    return this.configurationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update configuration fields' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceConfiguration })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConfigurationDto,
  ): Promise<ComplianceConfiguration> {
    return this.configurationsService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate configuration' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceConfiguration })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ComplianceConfiguration> {
    return this.configurationsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate configuration' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceConfiguration })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ComplianceConfiguration> {
    return this.configurationsService.deactivate(id);
  }

  @Put(':id/frameworks')
  @ApiOperation({
    summary: 'Replace framework associations',
    description: 'Links only active frameworks. Fails if linked requirements would be orphaned.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceConfiguration })
  @ApiResponse({ status: 409, description: 'Framework change conflicts with requirements' })
  setFrameworks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetFrameworkAssociationsDto,
  ): Promise<ComplianceConfiguration> {
    return this.configurationsService.setFrameworks(id, dto.frameworkIds);
  }

  @Put(':id/requirements')
  @ApiOperation({
    summary: 'Replace requirement associations',
    description:
      'Each requirement must exist and belong to a framework already linked to this configuration.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceConfiguration })
  @ApiResponse({ status: 400, description: 'Requirement not under a linked framework' })
  setRequirements(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRequirementAssociationsDto,
  ): Promise<ComplianceConfiguration> {
    return this.configurationsService.setRequirements(id, dto.requirementIds);
  }
}