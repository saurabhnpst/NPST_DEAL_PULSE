import { apiFetch } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';

export const documentService = {
  list: () => apiFetch(endpoints.documents),
  get: (id) => apiFetch(endpoints.document(id)),
  upload: (formData) =>
    apiFetch(endpoints.uploads, {
      method: 'POST',
      body: formData,
      headers: {},
    }),
};