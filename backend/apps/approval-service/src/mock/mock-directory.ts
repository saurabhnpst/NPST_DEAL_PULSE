import { Injectable } from '@nestjs/common';
import { ApproverMapping, ApproverAssignmentRepository, LeadAssignment } from './approver-assignment.repository';
import { MockActor } from './actor.types';
import { ActorDirectory } from './actor-directory';
import { MOCK_ACTORS, MOCK_APPROVER_MAPPINGS } from './fixtures';
import { mappingMissingError } from '../shared/errors';

@Injectable()
export class MockDirectory implements ApproverAssignmentRepository, ActorDirectory {
  private readonly actors = new Map<string, MockActor>(
    MOCK_ACTORS.map((actor) => [actor.actorId, actor]),
  );
  private readonly assignments = new Map<string, LeadAssignment>();
  private readonly mappings = new Map<string, ApproverMapping>(
    Object.entries(MOCK_APPROVER_MAPPINGS),
  );

  findActor(actorId: string): MockActor | undefined {
    return this.actors.get(actorId);
  }

  addActor(actor: MockActor): void {
    this.actors.set(actor.actorId, actor);
  }

  setMapping(productVertical: string, mapping: ApproverMapping): void {
    this.mappings.set(productVertical, mapping);
  }

  async saveLeadAssignment(assignment: LeadAssignment): Promise<void> {
    this.assignments.set(assignment.leadId, assignment);
  }

  async getLeadAssignment(leadId: string): Promise<LeadAssignment | undefined> {
    return this.assignments.get(leadId);
  }

  async getMapping(productVertical: string): Promise<ApproverMapping | undefined> {
    const mapping = this.mappings.get(productVertical) ?? this.mappings.get('default');
    if (mapping === undefined || mapping.pnlHeadId.length === 0 || mapping.salesManagerId.length === 0) {
      throw mappingMissingError(`No approver mapping for ${productVertical}`);
    }
    return mapping;
  }
}
