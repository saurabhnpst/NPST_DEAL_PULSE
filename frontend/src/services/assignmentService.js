import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}

export const assignmentService = {
  list: (query = '') => call(`${endpoints.assignments}${query ? `?${query}` : ''}`),
  createHandoff: (payload) =>
    call(endpoints.assignmentHandoffs, { method: 'POST', body: JSON.stringify(payload) }),
};