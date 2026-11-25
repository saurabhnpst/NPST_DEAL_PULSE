/** Relative to `VITE_API_BASE_URL` (includes `/api/v1`). */
export const endpoints = {
  leads: '/leads',
  lead: (id) => `/leads/${id}`,
  leadHistory: (id) => `/leads/${id}/history`,
  documents: '/documents',
  document: (id) => `/documents/${id}`,
  uploads: '/uploads',
  rfps: '/rfps',
  rfp: (id) => `/rfps/${id}`,
  opportunities: '/opportunities',
  opportunity: (id) => `/opportunities/${id}`,
  approvals: '/approvals',
  assignments: '/assignments',
  compliance: '/compliance',
};