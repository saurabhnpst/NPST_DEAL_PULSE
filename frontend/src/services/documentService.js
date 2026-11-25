import { apiFetch, apiUpload } from '../api/apiClient.js';
import { endpoints } from '../api/endpoints.js';
import { unwrapApiBody } from '../api/unwrap.js';

async function call(path, init) {
  const body = await apiFetch(path, init);
  return unwrapApiBody(body);
}

export const documentService = {
  list: () => call(endpoints.documents),
  get: (id) => call(endpoints.document(id)),
  upload: async (formData) => unwrapApiBody(await apiUpload(endpoints.uploads, formData)),
};