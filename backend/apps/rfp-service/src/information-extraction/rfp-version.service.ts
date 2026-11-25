import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RfpVersionType } from '../common/constants/rfp-extraction.constants';
import { RfpVersionNotFoundError } from '../common/exceptions/information-extraction.errors';
import { RfpDocumentService } from '../documents/rfp-document.service';
import { RfpDocumentVersion } from '../entities/rfp-document-version.entity';
import { Rfp } from '../entities/rfp.entity';
import { RegisterRfpVersionDto } from './dto/register-rfp-version.dto';

@Injectable()
export class RfpVersionService {
  constructor(
    @InjectRepository(RfpDocumentVersion)
    private readonly versionRepo: Repository<RfpDocumentVersion>,
    @InjectRepository(Rfp)
    private readonly rfpRepo: Repository<Rfp>,
    private readonly rfpDocumentService: RfpDocumentService,
  ) {}

  async registerVersion(
    rfpId: string,
    dto: RegisterRfpVersionDto,
  ): Promise<RfpDocumentVersion> {
    await this.rfpDocumentService.assertDocumentLinkedToRfp(rfpId, dto.documentId);

    const rfp = await this.rfpRepo.findOne({ where: { id: rfpId } });
    if (!rfp) {
      throw new RfpVersionNotFoundError();
    }

    const latest = await this.versionRepo.findOne({
      where: { rfpId },
      order: { versionNumber: 'DESC' },
    });
    const versionNumber = (latest?.versionNumber ?? 0) + 1;
    const versionType: RfpVersionType =
      dto.versionType ??
      (versionNumber === 1
        ? 'initial'
        : 'amendment');

    const saved = await this.versionRepo.save(
      this.versionRepo.create({
        rfpId,
        documentId: dto.documentId,
        versionNumber,
        versionType,
        label: dto.label ?? (versionType === 'amendment' ? `Amendment ${versionNumber}` : 'Initial RFP'),
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        metadataJson: dto.metadata ?? null,
      }),
    );

    if (!rfp.documentId || versionNumber === 1) {
      rfp.documentId = dto.documentId;
      await this.rfpRepo.save(rfp);
    }

    return saved;
  }

  async listVersions(rfpId: string): Promise<RfpDocumentVersion[]> {
    return this.versionRepo.find({
      where: { rfpId },
      order: { versionNumber: 'ASC' },
    });
  }

  async getVersionOrThrow(
    rfpId: string,
    versionId: string,
  ): Promise<RfpDocumentVersion> {
    const version = await this.versionRepo.findOne({
      where: { id: versionId, rfpId },
    });
    if (!version) {
      throw new RfpVersionNotFoundError(versionId);
    }
    return version;
  }
}