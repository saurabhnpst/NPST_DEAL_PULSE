/**
 * Owner / Pre-Sales picklists, filled from the auth-service user directory after sign-in (no hardcoded names).
 * The arrays are filled in place because the page field configs reference them at module level.
 */
export const OWNER_OPTIONS = ['—'];
export const PRESALES_OPTIONS = ['—'];

export function setPeople(users = []) {
  const names = (roles) => users.filter((u) => u.roles?.some((r) => roles.includes(r))).map((u) => u.name);
  OWNER_OPTIONS.splice(0, OWNER_OPTIONS.length, ...names(['sales', 'pl_head']));
  PRESALES_OPTIONS.splice(0, PRESALES_OPTIONS.length, '—', ...names(['presales']));
  if (!OWNER_OPTIONS.length) OWNER_OPTIONS.push('—');
}

export function ownerOptions(user) {
  return OWNER_OPTIONS.length > 1 || OWNER_OPTIONS[0] !== '—' ? [...OWNER_OPTIONS] : [user?.name || '—'];
}
