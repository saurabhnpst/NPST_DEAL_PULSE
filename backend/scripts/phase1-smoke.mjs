#!/usr/bin/env node
/**
 * Phase 1 smoke checks — direct service + gateway (run services first).
 * Usage: GATEWAY=http://localhost:3000 node scripts/phase1-smoke.mjs
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
    json = text.slice(0, 200);
  }
  return { status: res.status, ok: res.ok, json };
}

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`Gateway base: ${GATEWAY}\n---`);

  try {
    const h = await req('GET', `${GATEWAY}/health`);
    record('gateway liveness', h.ok, String(h.status));
  } catch (e) {
    record('gateway liveness', false, e.message);
  }

  try {
    const r = await req('GET', `${GATEWAY}/health/ready`);
    record('gateway readiness', r.status === 200 || r.status === 503, String(r.status));
  } catch (e) {
    record('gateway readiness', false, e.message);
  }

  const leadList = await req('GET', `${GATEWAY}/api/v1/leads`);
  record('gateway GET /api/v1/leads', leadList.ok, String(leadList.status));

  const oppList = await req('GET', `${GATEWAY}/api/v1/opportunities?page=1&limit=1`);
  record('gateway GET /api/v1/opportunities', oppList.ok, String(oppList.status));

  const rfpList = await req('GET', `${GATEWAY}/api/v1/rfps`);
  record('gateway GET /api/v1/rfps', rfpList.ok, String(rfpList.status));

  const frameworks = await req('GET', `${GATEWAY}/api/v1/frameworks`);
  record('gateway GET /api/v1/frameworks', frameworks.ok, String(frameworks.status));

  const approvals = await req('GET', `${GATEWAY}/api/v1/approvals`);
  record(
    'gateway GET /api/v1/approvals (mock token may be required)',
    approvals.status === 200 || approvals.status === 401,
    String(approvals.status),
  );

  const assigns = await req('GET', `${GATEWAY}/api/v1/assignments`);
  record('gateway GET /api/v1/assignments', assigns.ok || assigns.status === 404, String(assigns.status));

  console.log('\n--- summary');
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} checks passed`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});