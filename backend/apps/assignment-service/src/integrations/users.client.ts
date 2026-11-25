import { callService } from './http-call';

/**
 * Users / roles from the Auth Service.
 * Real:  AUTH_SERVICE_URL set → GET {AUTH_SERVICE_URL}/api/v1/users/:id
 * Mock:  otherwise → the demo users below (same people as the frontend demo).
 */

export const ROLES = {
  SALES: 'SALES',
  SALES_HEAD: 'SALES_HEAD',
  PL_HEAD: 'PL_HEAD',
  /** Pre-Sales Manager; approves technical assignments. */
  SOLUTION_MANAGER: 'SOLUTION_MANAGER',
  PRESALES: 'PRESALES',
  TECH_LEAD: 'TECH_LEAD',
} as const;

export type ServiceUser = {
  id: string;
  name: string;
  active: boolean;
  roles: string[];
};

/** The contract the rest of the service uses. */
export abstract class UsersClient {
  abstract readonly mode: 'mock' | 'real';
  /** null when the user doesn't exist. */
  abstract getUser(userId: string | number): Promise<ServiceUser | null>;
}

/**
 * Demo users. Ids 1–4 match the Opportunity Service frontend mapping (TEAM index + 1).
 * 7–9 are demo Tech Leads; 9 is inactive, to try the "inactive Tech Lead → review" path.
 */
export const MOCK_USERS: ServiceUser[] = [
  { id: '1', name: 'Pushkar B.', active: true, roles: [ROLES.SALES_HEAD, ROLES.PL_HEAD] },
  { id: '2', name: 'Priya S.', active: true, roles: [ROLES.SALES] },
  { id: '3', name: 'Arjun K.', active: true, roles: [ROLES.SALES] },
  { id: '4', name: 'Meera D.', active: true, roles: [ROLES.SALES] },
  { id: '5', name: 'Vikram N.', active: true, roles: [ROLES.SOLUTION_MANAGER, ROLES.PRESALES] },
  { id: '6', name: 'Sneha G.', active: true, roles: [ROLES.PRESALES, ROLES.TECH_LEAD] },
  { id: '7', name: 'Demo Tech Lead (UPI)', active: true, roles: [ROLES.TECH_LEAD] },
  { id: '8', name: 'Demo Tech Lead (BBPS)', active: true, roles: [ROLES.TECH_LEAD] },
  { id: '9', name: 'Demo Tech Lead (inactive)', active: false, roles: [ROLES.TECH_LEAD] },
];

export class MockUsersClient extends UsersClient {
  readonly mode = 'mock' as const;

  async getUser(userId: string | number): Promise<ServiceUser | null> {
    return MOCK_USERS.find((u) => u.id === String(userId)) ?? null;
  }
}

export class HttpUsersClient extends UsersClient {
  readonly mode = 'real' as const;

  constructor(private readonly baseUrl: string) {
    super();
  }

  async getUser(userId: string | number): Promise<ServiceUser | null> {
    // Field names are a best guess until the Auth team publishes its contract; adjust here only.
    const u = await callService<{
      id: string | number;
      name?: string;
      fullName?: string;
      active?: boolean;
      isActive?: boolean;
      roles?: string[];
    }>('Auth Service', this.baseUrl, `/api/v1/users/${userId}`);
    if (!u) return null;
    return {
      id: String(u.id),
      name: u.name ?? u.fullName ?? `User ${u.id}`,
      active: (u.active ?? u.isActive) !== false,
      roles: u.roles ?? [],
    };
  }
}
