import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_RFP_STATUS } from '../common/constants/rfp-status.constants';
import { CreateRfpDto } from '../dto/create-rfp.dto';
import { ListRfpsQueryDto } from '../dto/list-rfps-query.dto';
import { PaginatedRfpsDto } from '../dto/paginated-rfps.dto';
import { UpdateRfpDto } from '../dto/update-rfp.dto';
import { DocumentRequestAuth } from '../clients/document-service.client';
import { Rfp } from '../entities/rfp.entity';
import { RfpDocumentService } from '../documents/rfp-document.service';

@Injectable()
export class RfpsService {
  private readonly logger = new Logger(RfpsService.name);

  constructor(
    @InjectRepository(Rfp)
    private readonly rfpRepo: Repository<Rfp>,
    private readonly rfpDocumentService: RfpDocumentService,
  ) {}

  async create(
    dto: CreateRfpDto,
    documentAuth?: DocumentRequestAuth,
  ): Promise<Rfp> {
    const rfp = this.rfpRepo.create({
      ...dto,
      status: dto.status ?? DEFAULT_RFP_STATUS,
    });
    this.applyDateFields(rfp, dto);
    const saved = await this.rfpRepo.save(rfp);
    await this.trySyncDocumentAssociation(saved, documentAuth);
    return saved;
  }

  async findAll(query: ListRfpsQueryDto): Promise<PaginatedRfpsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.rfpRepo.createQueryBuilder('rfp');

    if (query.status) {
      qb.andWhere('rfp.status = :status', { status: query.status });
    }
    if (query.leadId) {
      qb.andWhere('rfp.leadId = :leadId', { leadId: query.leadId });
    }
    if (query.opportunityId) {
      qb.andWhere('rfp.opportunityId = :opportunityId', {
        opportunityId: query.opportunityId,
      });
    }
    if (query.ownerId) {
      qb.andWhere('rfp.ownerId = :ownerId', { ownerId: query.ownerId });
    }
    if (query.portal) {
      qb.andWhere('rfp.portal = :portal', { portal: query.portal });
    }
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        '(rfp.title LIKE :term OR rfp.referenceNumber LIKE :term)',
        { term },
      );
    }
    if (query.submissionDeadlineFrom) {
      qb.andWhere('rfp.submissionDeadline >= :from', {
        from: query.submissionDeadlineFrom,
      });
    }
    if (query.submissionDeadlineTo) {
      qb.andWhere('rfp.submissionDeadline <= :to', {
        to: query.submissionDeadlineTo,
      });
    }

    qb.orderBy('rfp.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Rfp> {
    const rfp = await this.rfpRepo.findOne({ where: { id } });
    if (!rfp) {
      throw new NotFoundException(`RFP ${id} not found`);
    }
    return rfp;
  }

  async findByLeadId(leadId: string): Promise<Rfp[]> {
    return this.rfpRepo.find({
      where: { leadId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByOpportunityId(opportunityId: string): Promise<Rfp[]> {
    return this.rfpRepo.find({
      where: { opportunityId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateRfpDto,
    documentAuth?: DocumentRequestAuth,
  ): Promise<Rfp> {
    const rfp = await this.findOne(id);
    Object.assign(rfp, dto);
    this.applyDateFields(rfp, dto);
    const saved = await this.rfpRepo.save(rfp);
    await this.trySyncDocumentAssociation(saved, documentAuth);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const rfp = await this.findOne(id);
    await this.rfpRepo.softRemove(rfp);
  }

  private async trySyncDocumentAssociation(
    rfp: Rfp,
    documentAuth?: DocumentRequestAuth,
  ): Promise<void> {
    if (!rfp.documentId) {
      return;
    }
    try {
      await this.rfpDocumentService.upsertAssociationFromRfp(rfp, documentAuth);
    } catch (error) {
      this.logger.warn(
        `Document association sync failed rfpId=${rfp.id} documentId=${rfp.documentId}`,
      );
    }
  }

  private applyDateFields(
    rfp: Rfp,
    dto: Partial<CreateRfpDto & UpdateRfpDto>,
  ): void {
    if ('preBidMeetingAt' in dto) {
      rfp.preBidMeetingAt = dto.preBidMeetingAt
        ? new Date(dto.preBidMeetingAt)
        : undefined;
    }
    if ('submissionDeadline' in dto) {
      rfp.submissionDeadline = dto.submissionDeadline
        ? new Date(dto.submissionDeadline)
        : undefined;
    }
    if ('bidOpeningAt' in dto) {
      rfp.bidOpeningAt = dto.bidOpeningAt
        ? new Date(dto.bidOpeningAt)
        : undefined;
    }
  }
}