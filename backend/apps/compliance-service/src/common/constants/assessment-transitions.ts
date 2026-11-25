import { AssessmentStatus } from '../enums/assessment-status.enum';

export const ASSESSMENT_ALLOWED_TRANSITIONS: Record<
  AssessmentStatus,
  AssessmentStatus[]
> = {
  [AssessmentStatus.DRAFT]: [AssessmentStatus.IN_PROGRESS],
  [AssessmentStatus.IN_PROGRESS]: [AssessmentStatus.IN_REVIEW],
  [AssessmentStatus.IN_REVIEW]: [
    AssessmentStatus.IN_PROGRESS,
    AssessmentStatus.COMPLETED,
  ],
  [AssessmentStatus.COMPLETED]: [],
};