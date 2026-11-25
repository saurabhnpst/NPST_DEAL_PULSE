import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';

export const assignmentService = {
  list: () => apiFetch(endpoints.assignments),
};