import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OpportunityClient, OpportunitySummary } from '../integrations/opportunity.client';
import { ServiceUser, UsersClient } from '../integrations/users.client';

/**
 * Checks against other services, with clear error messages.
 * Works the same with the mock and the real clients.
 */
@Injectable()
export class LookupService {
  constructor(
    private readonly users: UsersClient,
    private readonly opportunities: OpportunityClient,
  ) {}

  /** The opportunity (by public id OPP-YYYY-NNNNN or numeric id), or 404. */
  async opportunity(opportunityId: string): Promise<OpportunitySummary> {
    const opp = await this.opportunities.getOpportunity(opportunityId.trim());
    if (!opp) throw new NotFoundException(`Opportunity ${opportunityId} not found`);
    return opp;
  }

  /** The user, who must exist and be active (400 otherwise). */
  async activeUser(userId: number | string, label = 'User'): Promise<ServiceUser> {
    const user = await this.users.getUser(userId);
    if (!user) throw new BadRequestException(`${label} ${userId} not found`);
    if (!user.active) throw new BadRequestException(`${label} ${user.name} is inactive`);
    return user;
  }

  /** The user doing the action must be known and have the role (e.g. only a Solution Manager approves). */
  async requireRole(actorUserId: number | undefined, role: string, action: string): Promise<ServiceUser> {
    if (actorUserId == null) {
      throw new BadRequestException(`The x-user-id header is required to ${action}`);
    }
    const user = await this.activeUser(actorUserId);
    if (!user.roles.includes(role)) {
      throw new ForbiddenException(`${user.name} cannot ${action} (needs role ${role})`);
    }
    return user;
  }
}
