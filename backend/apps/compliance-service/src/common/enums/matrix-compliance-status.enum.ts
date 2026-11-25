export enum MatrixComplianceStatus {
  PENDING = 'PENDING',
  COMPLIANT = 'COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

/** Statuses that block assessment completion. */
export const MATRIX_INCOMPLETE_STATUSES: MatrixComplianceStatus[] = [
  MatrixComplianceStatus.PENDING,
  MatrixComplianceStatus.PARTIALLY_COMPLIANT,
  MatrixComplianceStatus.NON_COMPLIANT,
];