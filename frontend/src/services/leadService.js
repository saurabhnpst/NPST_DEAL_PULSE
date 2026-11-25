import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}

export const leadService = {
  list: (query = '') => call(`${endpoints.leads}${query ? `?${query}` : ''}`),
  get: (id) => call(endpoints.lead(id)),
  create: (payload) => call(endpoints.leads, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => call(endpoints.lead(id), { method: 'PATCH', body: JSON.stringify(payload) }),
  history: (id) => call(endpoints.leadHistory(id)),
  moveToWorking: (id) => call(endpoints.lead(id) + '/working', { method: 'POST', body: '{}' }),
  assessNeed: (id, payload) =>
    call(endpoints.lead(id) + '/assess-need', { method: 'POST', body: JSON.stringify(payload) }),
  approve: (id) => call(endpoints.lead(id) + '/approve', { method: 'POST', body: '{}' }),
};