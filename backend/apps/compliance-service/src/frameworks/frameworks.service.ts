import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FrameworkStatus } from '../common/enums/framework-status.enum';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { ComplianceFramework } from '../entities/compliance-framework.entity';
import { CreateFrameworkDto } from './dto/create-framework.dto';
import { UpdateFrameworkDto } from './dto/update-framework.dto';

@Injectable()
export class FrameworksService {
  constructor(
    @InjectRepository(ComplianceFramework)
    private readonly frameworkRepo: Repository<ComplianceFramework>,
  ) {}

  async create(dto: CreateFrameworkDto): Promise<ComplianceFramework> {
    const framework = this.frameworkRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      version: dto.version ?? null,
      source: dto.source ?? null,
      status: dto.status ?? FrameworkStatus.ACTIVE,
      applicableMetadata: dto.applicableMetadata ?? null,
    });

    try {
      return await this.frameworkRepo.save(framework);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: `Framework with code "${dto.code}" already exists`,
      });
    }
  }

  async findAll(status?: FrameworkStatus): Promise<ComplianceFramework[]> {
    return this.frameworkRepo.find({
      where: status ? { status } : {},
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ComplianceFramework> {
    const framework = await this.frameworkRepo.findOne({ where: { id } });
    if (!framework) {
      throw new NotFoundException(`Framework ${id} not found`);
    }
    return framework;
  }

  async update(id: string, dto: UpdateFrameworkDto): Promise<ComplianceFramework> {
    const framework = await this.findOne(id);
    if (dto.code !== undefined) framework.code = dto.code;
    if (dto.name !== undefined) framework.name = dto.name;
    if (dto.description !== undefined) framework.description = dto.description ?? null;
    if (dto.version !== undefined) framework.version = dto.version ?? null;
    if (dto.source !== undefined) framework.source = dto.source ?? null;
    if (dto.status !== undefined) framework.status = dto.status;
    if (dto.applicableMetadata !== undefined) {
      framework.applicableMetadata = dto.applicableMetadata ?? null;
    }

    try {
      return await this.frameworkRepo.save(framework);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'A framework with this code already exists',
      });
    }
  }

  async activate(id: string): Promise<ComplianceFramework> {
    return this.setStatus(id, FrameworkStatus.ACTIVE);
  }

  async deactivate(id: string): Promise<ComplianceFramework> {
    return this.setStatus(id, FrameworkStatus.INACTIVE);
  }

  private async setStatus(
    id: string,
    status: FrameworkStatus,
  ): Promise<ComplianceFramework> {
    const framework = await this.findOne(id);
    framework.status = status;
    return this.frameworkRepo.save(framework);
  }
}