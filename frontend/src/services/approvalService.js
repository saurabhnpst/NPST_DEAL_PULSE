import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';

export const approvalService = {
  list: () => apiFetch(endpoints.approvals),
};