import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignoffDecision } from '../enums/signoff-decision.enum';
import { ComplianceAssessmentSignoff } from '../../entities/compliance-assessment-signoff.entity';

@Injectable()
export class AssessmentSignoffGuard {
  constructor(
    @InjectRepository(ComplianceAssessmentSignoff)
    private readonly signoffRepo: Repository<ComplianceAssessmentSignoff>,
  ) {}

  async findForAssessment(
    assessmentId: string,
  ): Promise<ComplianceAssessmentSignoff | null> {
    return this.signoffRepo.findOne({
      where: { assessment: { id: assessmentId } },
    });
  }

  /** Blocks structural edits after a positive sign-off until completion. */
  async assertNotLockedBySignedOff(assessmentId: string): Promise<void> {
    const signoff = await this.findForAssessment(assessmentId);
    if (signoff?.decision === SignoffDecision.SIGNED_OFF) {
      throw new BadRequestException(
        'Assessment is locked after SIGNED_OFF sign-off; complete the assessment or wait until workflow rules allow changes',
      );
    }
  }

  async assertSignedOffBeforeComplete(assessmentId: string): Promise<void> {
    const signoff = await this.findForAssessment(assessmentId);
    if (!signoff || signoff.decision !== SignoffDecision.SIGNED_OFF) {
      throw new BadRequestException(
        'Assessment must have a SIGNED_OFF sign-off before it can be completed',
      );
    }
  }

  async assertMayRevertFromInReview(assessmentId: string): Promise<void> {
    const signoff = await this.findForAssessment(assessmentId);
    if (signoff?.decision === SignoffDecision.SIGNED_OFF) {
      throw new BadRequestException(
        'Cannot move back to In Progress after SIGNED_OFF sign-off',
      );
    }
  }
}