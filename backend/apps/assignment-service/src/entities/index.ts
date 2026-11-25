import { ProductTechLead } from './product-tech-lead.entity';
import { TechnicalAssignment } from './technical-assignment.entity';
import { RfpRequirement } from './rfp-requirement.entity';
import { PresalesHandoff } from './presales-handoff.entity';
import { AssignmentHistory } from './assignment-history.entity';
import { AssignmentDomainEvent } from './assignment-domain-event.entity';

export {
  ProductTechLead,
  TechnicalAssignment,
  RfpRequirement,
  PresalesHandoff,
  AssignmentHistory,
  AssignmentDomainEvent,
};

/** Every table of assignment_db. */
export const ASSIGNMENT_ENTITIES = [
  ProductTechLead,
  TechnicalAssignment,
  RfpRequirement,
  PresalesHandoff,
  AssignmentHistory,
  AssignmentDomainEvent,
];
