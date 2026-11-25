import { Logger } from '@nestjs/common';
import { HttpUsersClient, MockUsersClient } from './users.client';
import { HttpNotificationClient, MockNotificationClient } from './notification.client';
import { HttpRfpClient, MockRfpClient } from './rfp.client';
import { HttpOpportunityClient, MockOpportunityClient } from './opportunity.client';

/** Fake fetch response with the standard { success, data } envelope. */
const reply = (status: number, data?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => (status < 400 ? { success: true, data } : { success: false, error: { message: 'boom' } }),
  }) as Response;

describe('integration clients', () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });
  beforeEach(() => fetchMock.mockReset());

  describe('mocks (used while the real services are not built)', () => {
    it('users: demo users, unknown id → null, inactive user available for testing', async () => {
      const users = new MockUsersClient();
      expect(await users.getUser(5)).toMatchObject({ name: 'Vikram N.', roles: ['SOLUTION_MANAGER', 'PRESALES'] });
      expect(await users.getUser(9)).toMatchObject({ active: false });
      expect(await users.getUser(999)).toBeNull();
    });

    it('notifications: recorded in memory', async () => {
      const n = new MockNotificationClient();
      await n.send({ toUserId: '7', kind: 'TECHNICAL_ASSIGNMENT', title: 'Assigned', message: 'UPI' });
      expect(n.sent).toHaveLength(1);
    });

    it('rfp: sample requirements cover mapped, unmapped and multi-product cases', async () => {
      const list = await new MockRfpClient().getConfirmedRequirements('OPP-2026-00001');
      expect(list.some((r) => r.productTsp === 'UPI')).toBe(true);
      expect(list.some((r) => r.productTsp === null)).toBe(true);
      expect(list.some((r) => (r.products?.length ?? 0) > 1)).toBe(true);
    });

    it('opportunity: any OPP id exists; Pre-Sales owner and People are kept in memory', async () => {
      const opp = new MockOpportunityClient();
      expect(await opp.getOpportunity('not-an-id')).toBeNull();
      await opp.setPresalesOwner('OPP-2026-00001', { userId: '5', name: 'Vikram N.' });
      await opp.addDealTeamMember('OPP-2026-00001', { n: 'Sneha G.', r: 'Tech Lead (UPI)' });
      await opp.addDealTeamMember('OPP-2026-00001', { n: 'Sneha G.', r: 'Tech Lead (UPI)' });
      expect(await opp.getOpportunity('opp-2026-00001')).toMatchObject({
        presalesName: 'Vikram N.',
        dealTeam: [{ n: 'Sneha G.', r: 'Tech Lead (UPI)' }],
      });
    });
  });

  describe('real HTTP clients', () => {
    it('users: calls the Auth Service and maps its fields', async () => {
      fetchMock.mockResolvedValue(reply(200, { id: 42, fullName: 'Asha P.', isActive: false, roles: ['TECH_LEAD'] }));
      const user = await new HttpUsersClient('http://auth:3001/').getUser(42);
      expect(fetchMock.mock.calls[0][0]).toBe('http://auth:3001/api/v1/users/42');
      expect(user).toEqual({ id: '42', name: 'Asha P.', active: false, roles: ['TECH_LEAD'] });
    });

    it('404 → null, other errors → 502, service down → 503', async () => {
      const users = new HttpUsersClient('http://auth:3001');
      fetchMock.mockResolvedValueOnce(reply(404));
      expect(await users.getUser(1)).toBeNull();

      fetchMock.mockResolvedValueOnce(reply(500));
      await expect(users.getUser(1)).rejects.toMatchObject({ status: 502 });

      fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(users.getUser(1)).rejects.toMatchObject({ status: 503 });
    });

    it('notification: never throws, even when the service is down', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
      const ok = await new HttpNotificationClient('http://notify:3010').send({
        toUserId: '7', kind: 'X', title: 't', message: 'm',
      });
      expect(ok).toBe(false);
    });

    it('rfp: returns [] when the opportunity has no requirements', async () => {
      fetchMock.mockResolvedValue(reply(404));
      expect(await new HttpRfpClient('http://rfp:3004').getConfirmedRequirements('OPP-2026-00001')).toEqual([]);
    });

    it('opportunity: sets the Pre-Sales owner via PATCH /contributors with the x-user-id header', async () => {
      fetchMock.mockResolvedValue(reply(200, {}));
      await new HttpOpportunityClient('http://localhost:3005').setPresalesOwner(
        'OPP-2026-00001', { userId: '5', name: 'Vikram N.' }, 5,
      );
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('http://localhost:3005/api/v1/opportunities/OPP-2026-00001/contributors');
      expect(init.method).toBe('PATCH');
      expect(init.headers['x-user-id']).toBe('5');
      expect(JSON.parse(init.body)).toEqual({ presalesUserId: 5, presalesName: 'Vikram N.' });
    });

    it('opportunity: adds a People member once, keeping the existing team', async () => {
      const opp = { publicId: 'OPP-2026-00001', dealTeam: [{ n: 'Priya S.', r: 'Opportunity owner' }] };
      fetchMock.mockResolvedValueOnce(reply(200, opp)).mockResolvedValueOnce(reply(200, {}));
      const client = new HttpOpportunityClient('http://localhost:3005');
      await client.addDealTeamMember('OPP-2026-00001', { n: 'Sneha G.', r: 'Tech Lead (UPI)' });
      expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
        dealTeam: [{ n: 'Priya S.', r: 'Opportunity owner' }, { n: 'Sneha G.', r: 'Tech Lead (UPI)' }],
      });

      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(reply(200, { ...opp, dealTeam: [{ n: 'Sneha G.', r: 'Tech Lead (UPI)' }] }));
      await client.addDealTeamMember('OPP-2026-00001', { n: 'Sneha G.', r: 'Tech Lead (UPI)' });
      expect(fetchMock).toHaveBeenCalledTimes(1); // only the GET, no PATCH
    });
  });
});
