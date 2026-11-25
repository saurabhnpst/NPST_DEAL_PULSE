#!/usr/bin/env node
/**
 * Live cross-service PDF workflow (Document Service + RFP Service).
 * Requires both services running and infra from docker-compose.local.yml.
 *
 * Env (defaults shown):
 *   DOCUMENT_SERVICE_URL=http://localhost:3005
 *   RFP_SERVICE_URL=http://localhost:3004
 *   E2E_PDF_PATH=./scripts/fixtures/sample-rfp.pdf
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const documentBase =
  process.env.DOCUMENT_SERVICE_URL?.replace(/\/$/, '') ??
  'http://localhost:3005';
const rfpBase =
  process.env.RFP_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3004';
const pdfPath = resolve(
  process.cwd(),
  process.env.E2E_PDF_PATH ?? 'scripts/fixtures/sample-rfp.pdf',
);

const leadId = process.env.E2E_LEAD_ID ?? '55555555-5555-4555-8555-555555555555';

function assertPdf(buffer) {
  if (!buffer?.length) throw new Error('Empty PDF buffer');
  if (buffer.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error('Missing PDF magic bytes');
  }
}

async function assertOk(res, label) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${label} failed status=${res.status} body=${body.slice(0, 400)}`);
  }
}

async function waitForHealth(url, label, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${url}/api/v1/health`);
      if (res.ok) {
        console.log(`✓ ${label} health OK`);
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`${label} health check failed at ${url}`);
}

async function main() {
  const basePdf = readFileSync(pdfPath);
  const runSalt = `run-${Date.now()}\n`;
  const originalPdf = Buffer.concat([basePdf, Buffer.from(runSalt)]);
  assertPdf(originalPdf);
  console.log(`Using sample PDF (${originalPdf.length} bytes) from ${pdfPath}`);

  await waitForHealth(documentBase, 'Document Service');
  await waitForHealth(rfpBase, 'RFP Service');

  const ready = await fetch(`${rfpBase}/api/v1/health/ready`);
  if (ready.ok) {
    const body = await ready.json();
    console.log(`✓ RFP readiness dbName=${body.dbName}`);
  }

  const form = new FormData();
  form.append(
    'file',
    new Blob([originalPdf], { type: 'application/pdf' }),
    'sample-rfp.pdf',
  );
  const uploadRes = await fetch(`${documentBase}/api/v1/uploads`, {
    method: 'POST',
    body: form,
  });
  let documentId;
  if (uploadRes.status === 409) {
    const conflict = await uploadRes.json();
    documentId = conflict.documentId;
    if (!documentId) {
      throw new Error(`Upload duplicate without documentId: ${JSON.stringify(conflict)}`);
    }
    console.log(`✓ Reusing existing documentId=${documentId} (duplicate content)`);
  } else {
    await assertOk(uploadRes, 'Upload PDF');
    const uploadBody = await uploadRes.json();
    documentId = uploadBody.documentId;
    console.log(`✓ Upload documentId=${documentId}`);
  }

  const metaRes = await fetch(`${documentBase}/api/v1/documents/${documentId}`);
  await assertOk(metaRes, 'Metadata');
  const meta = await metaRes.json();
  if (!String(meta.originalName ?? '').includes('sample-rfp.pdf')) {
    throw new Error(`Unexpected originalName: ${meta.originalName}`);
  }
  console.log('✓ Metadata retrieved');

  const directDl = await fetch(
    `${documentBase}/api/v1/documents/${documentId}/download`,
  );
  await assertOk(directDl, 'Direct download');
  const directBytes = Buffer.from(await directDl.arrayBuffer());
  assertPdf(directBytes);
  if (!directBytes.equals(originalPdf)) {
    throw new Error('Direct download bytes differ from upload');
  }
  console.log(`✓ Direct download (${directBytes.length} bytes, matches upload)`);

  const createRes = await fetch(`${rfpBase}/api/v1/rfps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `E2E workflow ${new Date().toISOString()}`,
      referenceNumber: `E2E/${Date.now()}`,
      leadId,
      documentId,
      status: 'Registered',
    }),
  });
  await assertOk(createRes, 'Create RFP');
  const rfp = await createRes.json();
  console.log(`✓ RFP created id=${rfp.id}`);

    await new Promise((r) => setTimeout(r, 2500));

  const attachRes = await fetch(
    `${documentBase}/api/v1/documents/${documentId}/attachments`,
  );
  await assertOk(attachRes, 'List attachments');
  const attachments = await attachRes.json();
  const leadAttach = attachments.find(
    (a) => a.entityType === 'LEAD' && a.entityId === leadId,
  );
  if (!leadAttach) {
    throw new Error('LEAD attachment not found on Document Service');
  }
  console.log('✓ Lead attachment present on Document Service');

  const rfpDl = await fetch(
    `${rfpBase}/api/v1/rfps/${rfp.id}/documents/${documentId}/download`,
  );
  await assertOk(rfpDl, 'RFP proxy download');
  const viaRfp = Buffer.from(await rfpDl.arrayBuffer());
  assertPdf(viaRfp);
  if (!viaRfp.equals(originalPdf)) {
    throw new Error('RFP download bytes differ from upload');
  }
  const ctype = rfpDl.headers.get('content-type') ?? '';
  if (!ctype.includes('pdf')) {
    throw new Error(`Unexpected content-type: ${ctype}`);
  }
  console.log(`✓ RFP proxy download (${viaRfp.length} bytes, matches upload)`);

  const processingRes = await fetch(
    `${rfpBase}/api/v1/rfps/${rfp.id}/documents/${documentId}/processing`,
    { method: 'POST' },
  );
  if (processingRes.status !== 202) {
    const body = await processingRes.text();
    throw new Error(
      `PDF processing enqueue failed status=${processingRes.status} body=${body.slice(0, 400)}`,
    );
  }
  const queued = await processingRes.json();
  console.log(
    `✓ PDF processing queued jobId=${queued.processingJobId} status=${queued.status}`,
  );

  const pollAttempts = 60;
  for (let i = 0; i < pollAttempts; i++) {
    const statusRes = await fetch(
      `${rfpBase}/api/v1/rfps/${rfp.id}/documents/${documentId}/processing`,
    );
    await assertOk(statusRes, 'Processing status');
    const status = await statusRes.json();
    if (
      status.status === 'completed' ||
      status.status === 'partial' ||
      status.status === 'failed'
    ) {
      console.log(
        `✓ PDF processing finished status=${status.status} pages=${status.processedPageCount}`,
      );
      if (status.status === 'failed') {
        throw new Error(
          `Processing failed: ${status.errorCode ?? ''} ${status.errorMessage ?? ''}`,
        );
      }
      const textRes = await fetch(
        `${rfpBase}/api/v1/rfps/${rfp.id}/documents/${documentId}/extracted-text?format=concat`,
      );
      await assertOk(textRes, 'Extracted text');
      const extracted = await textRes.json();
      if (!extracted.text || extracted.text.length < 10) {
        throw new Error('Extracted text was empty after processing');
      }
      console.log(`✓ Extracted text length=${extracted.text.length}`);
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
    if (i === pollAttempts - 1) {
      throw new Error('PDF processing did not complete in time');
    }
  }

  console.log('\nE2E PDF workflow completed successfully.');
  console.log(JSON.stringify({ documentId, rfpId: rfp.id, leadId }, null, 2));
}

main().catch((err) => {
  console.error('\nE2E workflow failed:', err.message);
  process.exit(1);
});