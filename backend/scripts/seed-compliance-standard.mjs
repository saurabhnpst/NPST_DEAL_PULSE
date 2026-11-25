#!/usr/bin/env node
/**
 * Seed the standard compliance requirement set used when Pre-Sales starts a compliance matrix.
 * Source: the portal's existing STANDARD_COMPLIANCE template (frontend/src/data/complianceTemplates.js).
 * Creates one framework "DealPulse Standard" and one active configuration per domain (UPI, BBPS, IMPS).
 * Safe to run again: existing framework/configurations are reused, nothing is overwritten.
 *
 *   node scripts/seed-compliance-standard.mjs            (uses http://localhost:3010/api/v1)
 */
const API = (process.env.GATEWAY_API || 'http://localhost:3010/api/v1').replace(/\/$/, '');
const FRAMEWORK_CODE = 'DEALPULSE_STANDARD';
const DOMAINS = ['UPI', 'BBPS', 'IMPS'];
// [title, M=Mandatory / S=Supporting, owning team, typical evidence]
const REQUIREMENTS = [
  ['Data localisation', 'Mandatory', 'Legal', ''],
  ['ISO 27001', 'Supporting', 'Compliance', 'ISO certificate'],
  ['VAPT', 'Supporting', 'Security', 'VAPT report'],
  ['Audit logging', 'Supporting', 'Architecture', 'Security policy'],
  ['CERT-In reporting', 'Supporting', 'Compliance', ''],
];

async function api(method, path, body) {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', 'x-changed-by': 'seed' }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`);
  const json = text ? JSON.parse(text) : null;
  return json && typeof json === 'object' && 'data' in json && 'success' in json ? json.data : json;
}
const list = (body) => (Array.isArray(body) ? body : body?.items ?? body?.data ?? []);

let framework = list(await api('GET', '/frameworks')).find((f) => f.code === FRAMEWORK_CODE);
if (!framework) {
  framework = await api('POST', '/frameworks', { code: FRAMEWORK_CODE, name: 'DealPulse Standard', version: '1.0', source: 'DealPulse portal template', description: 'Standard compliance lines used when starting a matrix', status: 'Active' });
  console.log('created framework', framework.id);
}
let reqs = list(await api('GET', `/frameworks/${framework.id}/requirements`));
for (const [i, [title, criticality, category, evidence]] of REQUIREMENTS.entries()) {
  const code = `STD-${String(i + 1).padStart(2, '0')}`;
  if (reqs.some((r) => r.code === code)) continue;
  await api('POST', `/frameworks/${framework.id}/requirements`, { code, title, criticality, category, description: evidence ? `Evidence: ${evidence}` : undefined, sortOrder: i + 1 });
  console.log('created requirement', code, title);
}
reqs = list(await api('GET', `/frameworks/${framework.id}/requirements`));

const configs = list(await api('GET', '/configurations'));
for (const domain of DOMAINS) {
  const name = `DealPulse standard — ${domain}`;
  if (configs.some((c) => c.name === name)) continue;
  const c = await api('POST', '/configurations', { name, productTsp: domain, status: 'Active', frameworkIds: [framework.id], requirementIds: reqs.map((r) => r.id) });
  console.log('created configuration', domain, c.id);
}
console.log('Compliance standard set is ready.');
