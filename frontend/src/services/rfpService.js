import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';

export const rfpService = {
  list: () => apiFetch(endpoints.rfps),
  get: (id) => apiFetch(endpoints.rfp(id)),
  create: (payload) => apiFetch(endpoints.rfps, { method: 'POST', body: JSON.stringify(payload) }),
};