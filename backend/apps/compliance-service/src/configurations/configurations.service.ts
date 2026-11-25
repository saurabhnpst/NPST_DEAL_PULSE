import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ConfigurationStatus } from '../common/enums/configuration-status.enum';
import { FrameworkStatus } from '../common/enums/framework-status.enum';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { ComplianceConfigurationFramework } from '../entities/compliance-configuration-framework.entity';
import { ComplianceConfigurationRequirement } from '../entities/compliance-configuration-requirement.entity';
import { ComplianceConfiguration } from '../entities/compliance-configuration.entity';
import { ComplianceFramework } from '../entities/compliance-framework.entity';
import { ComplianceRequirement } from '../entities/compliance-requirement.entity';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { ListConfigurationsQueryDto } from './dto/list-configurations-query.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

@Injectable()
export class ConfigurationsService {
  constructor(
    @InjectRepository(ComplianceConfiguration)
    private readonly configurationRepo: Repository<ComplianceConfiguration>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateConfigurationDto): Promise<ComplianceConfiguration> {
    return this.dataSource.transaction(async (manager) => {
      const configuration = manager.create(ComplianceConfiguration, {
        name: dto.name,
        description: dto.description ?? null,
        opportunityId: dto.opportunityId ?? null,
        projectId: dto.projectId ?? null,
        productTsp: dto.productTsp ?? null,
        status: dto.status ?? ConfigurationStatus.ACTIVE,
      });

      let saved: ComplianceConfiguration;
      try {
        saved = await manager.save(configuration);
      } catch (err) {
        rethrowPersistenceError(err, {
          duplicate: 'A configuration with the same unique constraints already exists',
        });
      }

      if (dto.frameworkIds?.length) {
        await this.replaceFrameworkLinks(
          saved.id,
          dto.frameworkIds,
          manager,
        );
      }

      if (dto.requirementIds?.length) {
        await this.replaceRequirementLinks(
          saved.id,
          dto.requirementIds,
          manager,
        );
      }

      return this.findOne(saved.id, manager);
    });
  }

  async findAll(
    query: ListConfigurationsQueryDto,
  ): Promise<ComplianceConfiguration[]> {
    const qb = this.configurationRepo
      .createQueryBuilder('configuration')
      .leftJoinAndSelect('configuration.frameworkLinks', 'frameworkLinks')
      .leftJoinAndSelect('frameworkLinks.framework', 'framework')
      .leftJoinAndSelect('configuration.requirementLinks', 'requirementLinks')
      .leftJoinAndSelect('requirementLinks.requirement', 'requirement')
      .orderBy('configuration.updatedAt', 'DESC');

    if (query.opportunityId) {
      qb.andWhere('configuration.opportunity_id = :opportunityId', {
        opportunityId: query.opportunityId,
      });
    }
    if (query.projectId) {
      qb.andWhere('configuration.project_id = :projectId', {
        projectId: query.projectId,
      });
    }
    if (query.status) {
      qb.andWhere('configuration.status = :status', { status: query.status });
    }
    if (query.frameworkId) {
      qb.innerJoin(
        'configuration.frameworkLinks',
        'filterFramework',
      ).andWhere('filterFramework.framework_id = :frameworkId', {
        frameworkId: query.frameworkId,
      });
    }

    return qb.getMany();
  }

  async findOne(
    id: string,
    manager?: EntityManager,
  ): Promise<ComplianceConfiguration> {
    const repo = manager
      ? manager.getRepository(ComplianceConfiguration)
      : this.configurationRepo;

    const configuration = await repo.findOne({
      where: { id },
      relations: {
        frameworkLinks: { framework: true },
        requirementLinks: { requirement: true },
      },
    });

    if (!configuration) {
      throw new NotFoundException(`Configuration ${id} not found`);
    }
    return configuration;
  }

  async update(
    id: string,
    dto: UpdateConfigurationDto,
  ): Promise<ComplianceConfiguration> {
    const configuration = await this.findOne(id);
    if (dto.name !== undefined) configuration.name = dto.name;
    if (dto.description !== undefined) {
      configuration.description = dto.description ?? null;
    }
    if (dto.opportunityId !== undefined) {
      configuration.opportunityId = dto.opportunityId ?? null;
    }
    if (dto.projectId !== undefined) {
      configuration.projectId = dto.projectId ?? null;
    }
    if (dto.productTsp !== undefined) {
      configuration.productTsp = dto.productTsp ?? null;
    }
    if (dto.status !== undefined) configuration.status = dto.status;

    try {
      await this.configurationRepo.save(configuration);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Configuration update conflicts with an existing record',
      });
    }
    return this.findOne(id);
  }

  async activate(id: string): Promise<ComplianceConfiguration> {
    return this.setStatus(id, ConfigurationStatus.ACTIVE);
  }

  async deactivate(id: string): Promise<ComplianceConfiguration> {
    return this.setStatus(id, ConfigurationStatus.INACTIVE);
  }

  async setFrameworks(
    id: string,
    frameworkIds: string[],
  ): Promise<ComplianceConfiguration> {
    return this.dataSource.transaction(async (manager) => {
      await this.findOne(id, manager);
      await this.replaceFrameworkLinks(id, frameworkIds, manager);
      await this.pruneRequirementsOutsideFrameworks(id, manager, frameworkIds);
      return this.findOne(id, manager);
    });
  }

  async setRequirements(
    id: string,
    requirementIds: string[],
  ): Promise<ComplianceConfiguration> {
    return this.dataSource.transaction(async (manager) => {
      await this.findOne(id, manager);
      await this.replaceRequirementLinks(id, requirementIds, manager);
      return this.findOne(id, manager);
    });
  }

  private async setStatus(
    id: string,
    status: ConfigurationStatus,
  ): Promise<ComplianceConfiguration> {
    const configuration = await this.findOne(id);
    configuration.status = status;
    await this.configurationRepo.save(configuration);
    return this.findOne(id);
  }

  private async replaceFrameworkLinks(
    configurationId: string,
    frameworkIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    const uniqueIds = [...new Set(frameworkIds)];
    if (uniqueIds.length !== frameworkIds.length) {
      throw new BadRequestException('Duplicate framework ids in request');
    }

    const linkRepo = manager.getRepository(ComplianceConfigurationFramework);

    if (uniqueIds.length === 0) {
      const reqCount = await manager
        .getRepository(ComplianceConfigurationRequirement)
        .count({ where: { configuration: { id: configurationId } } });
      if (reqCount > 0) {
        throw new ConflictException(
          'Remove requirement associations before clearing all frameworks',
        );
      }
      await linkRepo.delete({ configuration: { id: configurationId } });
      return;
    }

    const frameworks = await this.loadAndValidateFrameworks(uniqueIds, manager);

    await linkRepo.delete({ configuration: { id: configurationId } });

    const configuration = { id: configurationId } as ComplianceConfiguration;
    const links = frameworks.map((framework, index) =>
      linkRepo.create({
        configuration,
        framework,
        sortOrder: index,
      }),
    );

    try {
      await linkRepo.save(links);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Duplicate framework association for this configuration',
      });
    }
  }

  private async replaceRequirementLinks(
    configurationId: string,
    requirementIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    const uniqueIds = [...new Set(requirementIds)];
    if (uniqueIds.length !== requirementIds.length) {
      throw new BadRequestException('Duplicate requirement ids in request');
    }

    if (uniqueIds.length === 0) {
      await manager
        .getRepository(ComplianceConfigurationRequirement)
        .delete({ configuration: { id: configurationId } });
      return;
    }

    const allowedFrameworkIds = await this.getLinkedFrameworkIds(
      configurationId,
      manager,
    );
    if (allowedFrameworkIds.size === 0) {
      throw new BadRequestException(
        'Associate at least one framework before adding requirements',
      );
    }

    const reqRepo = manager.getRepository(ComplianceRequirement);
    const requirements = await reqRepo.find({
      where: { id: In(uniqueIds) },
      relations: { framework: true },
    });

    if (requirements.length !== uniqueIds.length) {
      const found = new Set(requirements.map((r) => r.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new NotFoundException(
        `Requirement(s) not found: ${missing.join(', ')}`,
      );
    }

    for (const requirement of requirements) {
      const frameworkId = requirement.framework.id;
      if (!allowedFrameworkIds.has(frameworkId)) {
        throw new BadRequestException(
          `Requirement ${requirement.id} belongs to framework ${frameworkId}, which is not linked to this configuration`,
        );
      }
    }

    const linkRepo = manager.getRepository(ComplianceConfigurationRequirement);
    await linkRepo.delete({ configuration: { id: configurationId } });

    const configuration = { id: configurationId } as ComplianceConfiguration;
    const links = requirements.map((requirement, index) =>
      linkRepo.create({
        configuration,
        requirement,
        sortOrder: index,
      }),
    );

    try {
      await linkRepo.save(links);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Duplicate requirement association for this configuration',
      });
    }
  }

  private async pruneRequirementsOutsideFrameworks(
    configurationId: string,
    manager: EntityManager,
    frameworkIds: string[],
  ): Promise<void> {
    const allowed = new Set(frameworkIds);
    const linkRepo = manager.getRepository(ComplianceConfigurationRequirement);
    const existing = await linkRepo.find({
      where: { configuration: { id: configurationId } },
      relations: { requirement: { framework: true } },
    });

    const orphans = existing.filter(
      (link) => !allowed.has(link.requirement.framework.id),
    );
    if (orphans.length > 0) {
      throw new ConflictException(
        'Cannot remove framework(s) while requirements from those frameworks remain linked. Update requirements first.',
      );
    }
  }

  private async getLinkedFrameworkIds(
    configurationId: string,
    manager: EntityManager,
  ): Promise<Set<string>> {
    const links = await manager
      .getRepository(ComplianceConfigurationFramework)
      .find({
        where: { configuration: { id: configurationId } },
        relations: { framework: true },
      });
    return new Set(links.map((l) => l.framework.id));
  }

  private async loadAndValidateFrameworks(
    ids: string[],
    manager: EntityManager,
  ): Promise<ComplianceFramework[]> {
    if (ids.length === 0) {
      return [];
    }

    const repo = manager.getRepository(ComplianceFramework);
    const frameworks = await repo.find({ where: { id: In(ids) } });

    if (frameworks.length !== ids.length) {
      const found = new Set(frameworks.map((f) => f.id));
      const missing = ids.filter((id) => !found.has(id));
      throw new NotFoundException(
        `Framework(s) not found: ${missing.join(', ')}`,
      );
    }

    const inactive = frameworks.filter((f) => f.status !== FrameworkStatus.ACTIVE);
    if (inactive.length > 0) {
      throw new BadRequestException(
        `Framework(s) are not active: ${inactive.map((f) => f.code).join(', ')}`,
      );
    }

    return frameworks;
  }
}