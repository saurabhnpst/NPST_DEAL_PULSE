import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';

export const opportunityService = {
  list: () => apiFetch(endpoints.opportunities),
  get: (id) => apiFetch(endpoints.opportunity(id)),
};