import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityProduct } from '../entities/opportunity-product.entity';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { OpportunityProductDto } from './dto/opportunity-product.dto';
import { OpportunityPublicIdService } from './opportunity-public-id.service';
import { OpportunityResponse, toOpportunityResponse } from './opportunity.mapper';
import { applyFields } from './opportunity-fields';
import { assertValidProducts } from '../products/product-catalog';
import { OpportunityEventPublisher } from '../events/opportunity-event.publisher';
import { OPPORTUNITY_EVENT_TYPES } from '../events/domain-event';

export type PaginatedOpportunities = {
  items: OpportunityResponse[];
  total: number;
  page: number;
  limit: number;
};

const PUBLIC_ID_PATTERN = /^OPP-\d{4}-\d{5}$/i;

@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    private readonly dataSource: DataSource,
    private readonly publicIdService: OpportunityPublicIdService,
    private readonly events: OpportunityEventPublisher,
  ) {}

  parseIdentifier(id: string): { publicId?: string; pk?: string } {
    const trimmed = id.trim();
    if (PUBLIC_ID_PATTERN.test(trimmed)) {
      return { publicId: trimmed.toUpperCase() };
    }
    if (/^\d+$/.test(trimmed)) {
      return { pk: trimmed };
    }
    throw new BadRequestException(
      'Opportunity id must be a numeric primary key or OPP-YYYY-NNNNN',
    );
  }

  async create(dto: CreateOpportunityDto, actorId?: number): Promise<OpportunityResponse> {
    assertValidProducts(dto.products);

    const publicId = await this.dataSource.transaction(async (manager) => {
      const opportunity = manager.create(Opportunity, {
        publicId: await this.publicIdService.allocate(manager),
        stage: dto.stage ?? 'Qualification',
        createdByUserId: actorId != null ? String(actorId) : null,
        lastModifiedByUserId: actorId != null ? String(actorId) : null,
      });
      applyFields(opportunity, dto);
      const created = await manager.save(opportunity);

      await this.saveProducts(manager, created.id, dto.products);
      await this.events.publishInTransaction(
        manager,
        OPPORTUNITY_EVENT_TYPES.CREATED,
        created.id,
        { publicId: created.publicId, stage: created.stage },
      );
      return created.publicId;
    });

    // Re-read so the response shows exactly what the database stored (defaults included).
    return this.findOne(publicId);
  }

  async findAll(query: ListOpportunitiesQueryDto): Promise<PaginatedOpportunities> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.opportunityRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.products', 'p')
      .orderBy('o.updatedAt', 'DESC')
      .addOrderBy('p.productSlot', 'ASC')
      .skip(skip)
      .take(limit);

    if (query.search) {
      qb.andWhere(
        '(o.name LIKE :search OR o.accountName LIKE :search OR o.publicId LIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.stage) {
      qb.andWhere('o.stage = :stage', { stage: query.stage });
    }
    if (query.owner != null) {
      qb.andWhere('o.ownerUserId = :owner', { owner: String(query.owner) });
    }
    if (query.accountId != null) {
      qb.andWhere('o.accountId = :accountId', {
        accountId: String(query.accountId),
      });
    }
    if (query.account) {
      qb.andWhere('o.accountName LIKE :account', {
        account: `%${query.account}%`,
      });
    }
    if (query.product) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM opportunity_products opf
          WHERE opf.opportunity_id = o.id AND opf.product_tsp LIKE :productTsp
        )`,
        { productTsp: `%${query.product}%` },
      );
    }

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map(toOpportunityResponse),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<OpportunityResponse> {
    const entity = await this.loadByIdentifier(id, { withDeleted: false });
    return toOpportunityResponse(entity);
  }

  /** Loads the entity (with products) for stage workflows and internal modules. */
  async findEntity(id: string): Promise<Opportunity> {
    return this.loadByIdentifier(id, { withDeleted: false });
  }

  /**
   * The one update path for plain fields. PATCH /opportunities/:id, /revenue,
   * /contributors and PUT /products all come through here.
   */
  async update(
    id: string,
    dto: UpdateOpportunityDto,
    actorId?: number,
  ): Promise<OpportunityResponse> {
    if (dto.products) assertValidProducts(dto.products);

    const pk = await this.dataSource.transaction(async (manager) => {
      const entity = await this.loadByIdentifier(id, { withDeleted: false, manager });
      applyFields(entity, dto);
      if (actorId != null) entity.lastModifiedByUserId = String(actorId);
      await manager.save(entity);

      if (dto.products) {
        await manager.delete(OpportunityProduct, { opportunityId: entity.id });
        await this.saveProducts(manager, entity.id, dto.products);
      }
      await this.events.publishInTransaction(
        manager,
        OPPORTUNITY_EVENT_TYPES.UPDATED,
        entity.id,
        { publicId: entity.publicId, fields: Object.keys(dto) },
      );
      return entity.id;
    });

    return this.findOne(pk);
  }

  private async saveProducts(
    manager: EntityManager,
    opportunityId: string,
    products: OpportunityProductDto[],
  ): Promise<void> {
    await manager.save(
      products.map((p) =>
        manager.create(OpportunityProduct, {
          opportunityId,
          productSlot: p.productSlot,
          productTsp: p.productTsp,
          modules: p.modules ?? [],
        }),
      ),
    );
  }

  async softDelete(
    id: string,
    actorId?: number,
  ): Promise<{ id: string; publicId: string; deletedAt: string }> {
    const entity = await this.loadByIdentifier(id, { withDeleted: false });
    if (actorId != null) entity.lastModifiedByUserId = String(actorId);
    const removed = await this.opportunityRepo.softRemove(entity);
    if (!removed.deletedAt) {
      throw new NotFoundException('Opportunity not found');
    }
    await this.events.publish(removed.id, OPPORTUNITY_EVENT_TYPES.DELETED, {
      publicId: removed.publicId,
    });
    return {
      id: removed.id,
      publicId: removed.publicId,
      deletedAt: removed.deletedAt.toISOString(),
    };
  }

  private async loadByIdentifier(
    id: string,
    opts: {
      withDeleted: boolean;
      manager?: EntityManager;
    },
  ): Promise<Opportunity> {
    const { publicId, pk } = this.parseIdentifier(id);
    const repo = opts.manager
      ? opts.manager.getRepository(Opportunity)
      : this.opportunityRepo;

    const where = publicId ? { publicId } : { id: pk! };

    const entity = await repo.findOne({
      where,
      relations: { products: true },
      order: { products: { productSlot: 'ASC' } },
      withDeleted: opts.withDeleted,
    });

    if (!entity) {
      throw new NotFoundException('Opportunity not found');
    }
    return entity;
  }
}