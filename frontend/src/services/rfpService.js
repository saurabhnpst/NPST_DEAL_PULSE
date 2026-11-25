import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}

export const rfpService = {
  list: (query = '') => call(`${endpoints.rfps}${query ? `?${query}` : ''}`),
  get: (id) => call(endpoints.rfp(id)),
  create: (payload) => call(endpoints.rfps, { method: 'POST', body: JSON.stringify(payload) }),
};