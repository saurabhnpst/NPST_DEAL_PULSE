import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}

export const approvalService = {
  list: (query = '') => call(`${endpoints.approvals}${query ? `?${query}` : ''}`),
  pending: () => call(`${endpoints.approvals}/pending`),
  forLead: (leadId) => call(`${endpoints.approvals}?leadId=${encodeURIComponent(leadId)}`),
  history: (id) => call(`${endpoints.approvals}/${id}/history`),
  get: (id) => call(`${endpoints.approvals}/${id}`),
  submit: (payload) => call(endpoints.approvals, { method: 'POST', body: JSON.stringify(payload) }),
  approve: (id, payload) =>
    call(`${endpoints.approvals}/${id}/approve`, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
  requestChanges: (id, payload) =>
    call(`${endpoints.approvals}/${id}/request-changes`, { method: 'POST', body: JSON.stringify(payload) }),
  reject: (id, payload) =>
    call(`${endpoints.approvals}/${id}/reject`, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
};