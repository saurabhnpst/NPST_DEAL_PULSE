/** Owner picklists until directory / assignment APIs expose rosters (no hardcoded names). */
export function ownerOptions(user) {
  const name = user?.name?.trim();
  return name ? [name] : ['—'];
}

export const PRESALES_OPTIONS = ['—'];