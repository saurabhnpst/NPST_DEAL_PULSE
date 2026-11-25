export const ASSIGNMENT_REPOSITORY = Symbol('APPROVAL_ASSIGNMENT_REPOSITORY');

export interface LeadAssignment {
  leadId: string;
  creatorId: string;
  productVertical: string;
  teamId: string;
  territoryId: string;
}

export interface ApproverMapping {
  pnlHeadId: string;
  salesManagerId: string;
}

export interface ApproverAssignmentRepository {
  saveLeadAssignment(assignment: LeadAssignment): Promise<void>;
  getLeadAssignment(leadId: string): Promise<LeadAssignment | undefined>;
  getMapping(productVertical: string): Promise<ApproverMapping | undefined>;
}
