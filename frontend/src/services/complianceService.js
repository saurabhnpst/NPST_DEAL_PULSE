import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';

export const complianceService = {
  list: () => apiFetch(endpoints.compliance),
};