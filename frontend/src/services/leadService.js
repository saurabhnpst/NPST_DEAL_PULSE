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
  /** Save BANT answers (qualification record is created on first save). */
  saveQualification: async (id, payload) => {
    const path = endpoints.lead(id) + '/qualification';
    try {
      return await call(path, { method: 'PATCH', body: JSON.stringify(payload) });
    } catch (e) {
      if (e?.status !== 404) throw e;
      return call(path, { method: 'POST', body: JSON.stringify(payload) });
    }
  },
  qualification: (id) => call(endpoints.lead(id) + '/qualification'),
};