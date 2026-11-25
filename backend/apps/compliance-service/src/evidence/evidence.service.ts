import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentStatus } from '../common/enums/assessment-status.enum';
import { rethrowPersistenceError } from '../common/utils/typeorm-error.util';
import { MatricesService } from '../matrices/matrices.service';
import { ComplianceEvidenceReference } from '../entities/compliance-evidence-reference.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { AssessmentSignoffGuard } from '../common/services/assessment-signoff.guard';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(ComplianceEvidenceReference)
    private readonly evidenceRepo: Repository<ComplianceEvidenceReference>,
    private readonly matricesService: MatricesService,
    private readonly signoffGuard: AssessmentSignoffGuard,
  ) {}

  async create(
    assessmentId: string,
    entryId: string,
    dto: CreateEvidenceDto,
    actorId?: string,
  ): Promise<ComplianceEvidenceReference> {
    const line = await this.matricesService.findOne(assessmentId, entryId);
    await this.assertEvidenceMutable(assessmentId, line.assessment.status);

    if (!dto.documentId && !dto.referenceUrl) {
      throw new BadRequestException(
        'Provide documentId and/or referenceUrl as an external document reference',
      );
    }

    const evidence = this.evidenceRepo.create({
      assessmentLine: line,
      documentId: dto.documentId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      evidenceType: dto.evidenceType ?? null,
      referenceUrl: dto.referenceUrl ?? null,
      referenceMetadata: dto.referenceMetadata ?? null,
      createdByActorId: actorId ?? null,
    });

    try {
      return await this.evidenceRepo.save(evidence);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Evidence reference conflicts with an existing record',
      });
    }
  }

  async listForMatrixEntry(
    assessmentId: string,
    entryId: string,
  ): Promise<ComplianceEvidenceReference[]> {
    await this.matricesService.findOne(assessmentId, entryId);
    return this.evidenceRepo.find({
      where: { assessmentLine: { id: entryId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    assessmentId: string,
    entryId: string,
    evidenceId: string,
  ): Promise<ComplianceEvidenceReference> {
    const evidence = await this.evidenceRepo.findOne({
      where: {
        id: evidenceId,
        assessmentLine: { id: entryId, assessment: { id: assessmentId } },
      },
      relations: { assessmentLine: { assessment: true } },
    });
    if (!evidence) {
      throw new NotFoundException(
        `Evidence ${evidenceId} not found for matrix entry ${entryId}`,
      );
    }
    return evidence;
  }

  async update(
    assessmentId: string,
    entryId: string,
    evidenceId: string,
    dto: UpdateEvidenceDto,
  ): Promise<ComplianceEvidenceReference> {
    const evidence = await this.findOne(assessmentId, entryId, evidenceId);
    await this.assertEvidenceMutable(
      assessmentId,
      evidence.assessmentLine.assessment.status,
    );

    if (dto.documentId !== undefined) evidence.documentId = dto.documentId ?? null;
    if (dto.title !== undefined) evidence.title = dto.title;
    if (dto.description !== undefined) evidence.description = dto.description ?? null;
    if (dto.evidenceType !== undefined) evidence.evidenceType = dto.evidenceType ?? null;
    if (dto.referenceUrl !== undefined) evidence.referenceUrl = dto.referenceUrl ?? null;
    if (dto.referenceMetadata !== undefined) {
      evidence.referenceMetadata = dto.referenceMetadata ?? null;
    }

    const documentId = evidence.documentId;
    const referenceUrl = evidence.referenceUrl;
    if (!documentId && !referenceUrl) {
      throw new BadRequestException(
        'At least one of documentId or referenceUrl must remain set',
      );
    }

    try {
      return await this.evidenceRepo.save(evidence);
    } catch (err) {
      rethrowPersistenceError(err, {
        duplicate: 'Evidence update conflicts with an existing record',
      });
    }
  }

  async remove(
    assessmentId: string,
    entryId: string,
    evidenceId: string,
  ): Promise<void> {
    const evidence = await this.findOne(assessmentId, entryId, evidenceId);
    await this.assertEvidenceMutable(
      assessmentId,
      evidence.assessmentLine.assessment.status,
    );
    await this.evidenceRepo.remove(evidence);
  }

  private async assertEvidenceMutable(
    assessmentId: string,
    assessmentStatus: AssessmentStatus,
  ): Promise<void> {
    if (assessmentStatus === AssessmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Evidence cannot be changed after the assessment is completed',
      );
    }
    await this.signoffGuard.assertNotLockedBySignedOff(assessmentId);
  }
}