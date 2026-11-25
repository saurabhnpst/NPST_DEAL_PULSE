import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FrameworkStatus } from '../common/enums/framework-status.enum';
import { ComplianceFramework } from '../entities/compliance-framework.entity';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';
import { FrameworksService } from './frameworks.service';

@ApiTags('Frameworks')
@ApiBearerAuth()
@Controller('frameworks')
export class FrameworksController {
  constructor(private readonly frameworksService: FrameworksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a compliance framework' })
  @ApiResponse({ status: 201, type: ComplianceFramework })
  @ApiResponse({ status: 409, description: 'Duplicate framework code' })
  create(@Body() dto: CreateFrameworkDto): Promise<ComplianceFramework> {
    return this.frameworksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List compliance frameworks' })
  @ApiQuery({ name: 'status', required: false, enum: FrameworkStatus })
  @ApiResponse({ status: 200, type: [ComplianceFramework] })
  findAll(
    @Query('status', new ParseEnumPipe(FrameworkStatus, { optional: true }))
    status?: FrameworkStatus,
  ): Promise<ComplianceFramework[]> {
    return this.frameworksService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get framework by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceFramework })
  @ApiResponse({ status: 404, description: 'Framework not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ComplianceFramework> {
    return this.frameworksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update framework fields' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceFramework })
  @ApiResponse({ status: 409, description: 'Duplicate framework code' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFrameworkDto,
  ): Promise<ComplianceFramework> {
    return this.frameworksService.update(id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate framework' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceFramework })
  activate(@Param('id', ParseUUIDPipe) id: string): Promise<ComplianceFramework> {
    return this.frameworksService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate framework' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: ComplianceFramework })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ComplianceFramework> {
    return this.frameworksService.deactivate(id);
  }
}