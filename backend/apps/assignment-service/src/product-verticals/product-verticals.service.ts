import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductTechLead } from '../entities';
import { SUBJECT } from '../common/statuses';
import { LookupService } from '../common/lookup.service';
import { HistoryService } from '../history/history.service';
import { CreateProductTechLeadDto, UpdateProductTechLeadDto } from './product-verticals.dto';

/** Master data: which vertical a product belongs to and who its default Tech Lead is. */
@Injectable()
export class ProductVerticalsService {
  constructor(
    @InjectRepository(ProductTechLead)
    private readonly repo: Repository<ProductTechLead>,
    private readonly dataSource: DataSource,
    private readonly lookup: LookupService,
    private readonly history: HistoryService,
  ) {}

  list(activeOnly: boolean): Promise<ProductTechLead[]> {
    return this.repo.find({
      where: activeOnly ? { active: true } : {},
      order: { productTsp: 'ASC' },
    });
  }

  async get(id: string): Promise<ProductTechLead> {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException(`Product mapping ${id} not found`);
    return row;
  }

  /** Looks up a product by name (used by the assignment flow). */
  findByProduct(productTsp: string): Promise<ProductTechLead | null> {
    return this.repo.findOneBy({ productTsp });
  }

  async create(dto: CreateProductTechLeadDto, actorUserId?: number): Promise<ProductTechLead> {
    const productTsp = dto.productTsp.trim();
    if (await this.findByProduct(productTsp)) {
      throw new ConflictException(`${productTsp} is already in the master; use PATCH to change it`);
    }
    const lead = dto.techLeadUserId != null
      ? await this.lookup.activeUser(dto.techLeadUserId, 'Tech Lead')
      : null;

    return this.dataSource.transaction(async (manager) => {
      const row = await manager.save(
        manager.create(ProductTechLead, {
          productTsp,
          vertical: dto.vertical ?? 'TSP',
          techLeadUserId: lead?.id ?? null,
          techLeadName: lead?.name ?? null,
          active: dto.active ?? true,
          updatedByUserId: actorUserId != null ? String(actorUserId) : null,
        }),
      );
      await this.history.record(manager, {
        subjectType: SUBJECT.PRODUCT_TECH_LEAD,
        subjectId: row.id,
        action: 'CREATED',
        actorUserId,
        snapshot: row,
      });
      return row;
    });
  }

  async update(id: string, dto: UpdateProductTechLeadDto, actorUserId?: number): Promise<ProductTechLead> {
    const row = await this.get(id);
    if (dto.techLeadUserId !== undefined) {
      const lead = dto.techLeadUserId != null
        ? await this.lookup.activeUser(dto.techLeadUserId, 'Tech Lead')
        : null;
      row.techLeadUserId = lead?.id ?? null;
      row.techLeadName = lead?.name ?? null;
    }
    if (dto.vertical !== undefined) row.vertical = dto.vertical;
    if (dto.active !== undefined) row.active = dto.active;
    if (actorUserId != null) row.updatedByUserId = String(actorUserId);

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(row);
      await this.history.record(manager, {
        subjectType: SUBJECT.PRODUCT_TECH_LEAD,
        subjectId: saved.id,
        action: 'UPDATED',
        actorUserId,
        snapshot: saved,
      });
      return saved;
    });
  }
}
