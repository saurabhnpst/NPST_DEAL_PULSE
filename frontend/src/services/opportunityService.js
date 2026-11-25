import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}

export const opportunityService = {
  list: (query = '') => call(`${endpoints.opportunities}${query ? `?${query}` : ''}`),
  get: (id) => call(endpoints.opportunity(id)),
  create: (payload) => call(endpoints.opportunities, { method: 'POST', body: JSON.stringify(payload) }),
  patch: (id, payload) => call(endpoints.opportunity(id), { method: 'PATCH', body: JSON.stringify(payload) }),
  pipeline: () => call(endpoints.opportunityPipeline),
};