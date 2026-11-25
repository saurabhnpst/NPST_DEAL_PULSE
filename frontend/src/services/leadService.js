import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';

export const leadService = {
  list: (query = '') => apiFetch(`${endpoints.leads}${query ? `?${query}` : ''}`),
  get: (id) => apiFetch(endpoints.lead(id)),
  create: (payload) => apiFetch(endpoints.leads, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => apiFetch(endpoints.lead(id), { method: 'PATCH', body: JSON.stringify(payload) }),
  history: (id) => apiFetch(endpoints.leadHistory(id)),
};