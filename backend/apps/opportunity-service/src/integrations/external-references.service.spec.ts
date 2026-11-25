import { ExternalReferencesService } from './external-references.service';

describe('ExternalReferencesService', () => {
  const svc = new ExternalReferencesService();

  afterEach(() => {
    delete process.env.AUTH_SERVICE_URL;
    delete process.env.DOCUMENT_SERVICE_URL;
    delete process.env.OPPORTUNITY_STRICT_EXT_REFS;
  });

  it('skips when service URL missing', async () => {
    await expect(svc.validateUserId(1)).resolves.toEqual({
      ok: true,
      skipped: true,
    });
  });

  it('fails strict mode when auth unreachable', async () => {
    process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:9';
    process.env.OPPORTUNITY_STRICT_EXT_REFS = 'true';
    const result = await svc.validateUserId(99);
    expect(result.ok).toBe(false);
  });

  it('continues non-strict when auth unreachable', async () => {
    process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:9';
    const result = await svc.validateUserId(99);
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/unverified/i);
  });
});