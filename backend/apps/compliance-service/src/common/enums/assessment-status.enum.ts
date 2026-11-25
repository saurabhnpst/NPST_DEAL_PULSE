/**
 * MVP assessment lifecycle (no workflow engine).
 *
 * Allowed transitions:
 * - Draft → InProgress (start)
 * - InProgress → InReview
 * - InReview → InProgress | Completed
 * - Completed → (terminal)
 */
export enum AssessmentStatus {
  DRAFT = 'Draft',
  IN_PROGRESS = 'InProgress',
  IN_REVIEW = 'InReview',
  COMPLETED = 'Completed',
}