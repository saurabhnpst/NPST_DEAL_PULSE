import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { ComplianceRequirement } from '../entities/compliance-requirement.entity';
import { FrameworksService } from '../frameworks/frameworks.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(ComplianceRequirement)
    private readonly requirementRepo: Repository<ComplianceRequirement>,
    private readonly frameworksService: FrameworksService,
  ) {}

  async create(
    frameworkId: string,
    dto: CreateRequirementDto,
  ): Promise<ComplianceRequirement> {
    const framework = await this.frameworksService.findOne(frameworkId);
    const requirement = this.requirementRepo.create({
      framework,
      code: dto.code,
      title: dto.title,
      description: dto.description ?? null,
      category: dto.category ?? null,
      criticality: dto.criticality ?? null,
      referenceClause: dto.referenceClause ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });

    try {
      return await this.requirementRepo.save(requirement);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: `Requirement with code "${dto.code}" already exists in this framework`,
      });
    }
  }

  async findByFramework(frameworkId: string): Promise<ComplianceRequirement[]> {
    await this.frameworksService.findOne(frameworkId);
    return this.requirementRepo.find({
      where: { framework: { id: frameworkId } },
      order: { sortOrder: 'ASC', title: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ComplianceRequirement> {
    const requirement = await this.requirementRepo.findOne({
      where: { id },
      relations: { framework: true },
    });
    if (!requirement) {
      throw new NotFoundException(`Requirement ${id} not found`);
    }
    return requirement;
  }

  async update(id: string, dto: UpdateRequirementDto): Promise<ComplianceRequirement> {
    const requirement = await this.findOne(id);
    if (dto.code !== undefined) requirement.code = dto.code;
    if (dto.title !== undefined) requirement.title = dto.title;
    if (dto.description !== undefined) requirement.description = dto.description ?? null;
    if (dto.category !== undefined) requirement.category = dto.category ?? null;
    if (dto.criticality !== undefined) requirement.criticality = dto.criticality ?? null;
    if (dto.referenceClause !== undefined) {
      requirement.referenceClause = dto.referenceClause ?? null;
    }
    if (dto.sortOrder !== undefined) requirement.sortOrder = dto.sortOrder;

    try {
      return await this.requirementRepo.save(requirement);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'A requirement with this code already exists in the framework',
      });
    }
  }

  async remove(id: string): Promise<void> {
    const requirement = await this.findOne(id);
    const referenced = await this.isReferencedByAssessmentLines(id);
    if (referenced) {
      throw new ConflictException(
        'Requirement cannot be deleted because it is referenced by assessment matrix lines',
      );
    }

    try {
      await this.requirementRepo.remove(requirement);
    } catch (err) {
      rethrowPersistenceError(err, {
        restricted:
          'Requirement cannot be deleted because it is referenced by other records',
      });
    }
  }

  /**
   * Checks matrix line references when that table exists; returns false if the table is not deployed yet.
   */
  private async isReferencedByAssessmentLines(requirementId: string): Promise<boolean> {
    try {
      const rows = await this.requirementRepo.manager.query(
        'SELECT 1 FROM compliance_assessment_lines WHERE requirement_id = ? LIMIT 1',
        [requirementId],
      );
      return Array.isArray(rows) && rows.length > 0;
    } catch (err) {
      const driverErr = err as { errno?: number; code?: string };
      if (driverErr.code === 'ER_NO_SUCH_TABLE' || driverErr.errno === 1146) {
        return false;
      }
      throw err;
    }
  }
}