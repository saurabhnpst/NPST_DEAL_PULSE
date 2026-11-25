import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}

export const complianceService = {
  configurations: () => call('/configurations'),
  frameworks: () => call(endpoints.complianceFrameworks),
  assessments: (query = '') =>
    call(`${endpoints.complianceAssessments}${query ? `?${query}` : ''}`),
};