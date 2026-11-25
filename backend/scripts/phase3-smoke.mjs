#!/usr/bin/env node
/**
 * Phase 3 gateway smoke + workflow probes (services must be running).
 * GATEWAY=http://localhost:3010 node scripts/phase3-smoke.mjs
 */
const GATEWAY = (process.env.GATEWAY || 'http://localhost:3010').replace(/\/$/, '');

async function req(method, url, { body, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 300);
  }
  return { status: res.status, ok: res.ok, json };
}

const rows = [];
function record(name, status, detail = '') {
  const mark = status === 'PASS' ? 'PASS' : status === 'PARTIAL' ? 'PARTIAL' : status === 'BLOCKED' ? 'BLOCKED' : 'FAIL';
  rows.push({ name, status: mark, detail });
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`Gateway: ${GATEWAY}\n`);

  const h = await req('GET', `${GATEWAY}/health`).catch((e) => ({ ok: false, status: 0, json: e.message }));
  record('GET /health', h.ok ? 'PASS' : 'FAIL', String(h.status));

  const ready = await req('GET', `${GATEWAY}/health/ready`);
  record('GET /health/ready', ready.ok ? 'PASS' : ready.status === 503 ? 'PARTIAL' : 'FAIL', String(ready.status));

  const docs = await req('GET', `${GATEWAY}/api/docs/`);
  record('Swagger hub UI', docs.status === 200 || docs.status === 301 ? 'PASS' : 'FAIL', String(docs.status));

  const oai = await req('GET', `${GATEWAY}/api/openapi/leads.json`);
  record('OpenAPI leads.json', oai.ok ? 'PASS' : 'FAIL', String(oai.status));

  for (const [name, path] of [
    ['leads', '/api/v1/leads?limit=1'],
    ['opportunities', '/api/v1/opportunities?limit=1'],
    ['rfps', '/api/v1/rfps?limit=1'],
    ['frameworks', '/api/v1/frameworks'],
    ['assignments', '/api/v1/assignments'],
  ]) {
    const r = await req('GET', `${GATEWAY}${path}`);
    record(`GET ${path}`, r.ok ? 'PASS' : 'FAIL', `${r.status}`);
  }

  const approvals = await req('GET', `${GATEWAY}/api/v1/approvals`, {
    headers: process.env.APPROVAL_MOCK_TOKEN
      ? { 'x-mock-token': process.env.APPROVAL_MOCK_TOKEN }
      : {},
  });
  record(
    'GET /api/v1/approvals',
    approvals.status === 403 && !process.env.APPROVAL_MOCK_TOKEN ? 'PARTIAL' : approvals.ok ? 'PASS' : 'FAIL',
    approvals.status === 403 ? 'set APPROVAL_MOCK_TOKEN for full test' : String(approvals.status),
  );

  console.log('\n--- summary ---');
  const fail = rows.filter((r) => r.status === 'FAIL').length;
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});