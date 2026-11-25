// Full opportunity record: everything shown on the opportunity screen beyond the basics.
import { plusDays } from './defaults.js';

// Rich sample for the flagship deal, matching the design.
export const OPP_EXTRAS = {
  'OPP-2026-00084': {
    convertedFrom: 'LEAD-2026-00311',
    productTsp3: '—', productTsp4: '—', module2: '—', productRemark: '',
    module: 'CC on UPI; Credit Line on UPI',
    year2: 12000000, year3: 12000000, year4: 12000000, year5: 12000000,
    competitors: ['Finacus', 'Mobileware'], competitionRemarks: 'Incumbent is Finacus',
    today: 'In-house switch built in 2018', painPoint: 'TPS ceiling at festive peaks', presentPain: 'Frequent timeouts; manual reconciliation',
    implication: 'NPCI penalties for declines', notes: 'Bank wants a single vendor for UPI and fraud monitoring.',
    nextStep: 'DR switchover demo, then negotiation.',
    economicBuyer: 'GM, Digital Banking', nda: true, strategy: 'Lead on uptime and NPCI certification', presalesInvolved: 'Yes', presalesName: 'Vikram N.',
    champion: true, championOk: true, reqReceived: 'Yes',
    ebAligned: 'Yes', ebMet: '2026-10-08', demoDone: true, success: '3,000 TPS sustained for 2 hours', poc: true, sow: 'Yes',
    proposalDate: '2026-10-18', criteriaKnown: true, criteria: 'L1 after technical qualification',
    createdBy: 'Pre-Sales Mgr · 29 Jul 2026, 16:02',
    rfp: { ref: 'RFP/MB/2026/118', submitted: '18 Oct 2026', opening: '12 Nov 2026', emd: '₹8,40,000 · BG', pbg: '3% on award', owner: 'Vikram N.', accepted: '29 Jul' },
    reviews: [
      { id: 'rv1', t: 'Technical proposal', v: 'v3', r: 'Legal · N. Shah', due: '03 Nov', s: 'Changes requested' },
      { id: 'rv2', t: 'Commercial proposal', v: 'v2', r: 'Finance · K. Rao', due: '17 Oct', s: 'Approved' }
    ],
    recDraft: { rec: 'Yes', syn: 'Existing UPI client; PoC passed. ₹4.10 Cr first year after a ₹20 L licence discount.', concern: 'Ask for 30/50/20 payment milestones.' },
    deliverables: [
      { id: 'dl1', t: 'PoC environment on bank UAT', o: 'Sneha G.', due: '30 Sep', e: 14, s: 'Done' },
      { id: 'dl2', t: 'Load test report (3,000 TPS)', o: 'Sneha G.', due: '18 Oct', e: 18, s: 'Done' },
      { id: 'dl3', t: 'HSM integration note', o: 'Vikram N.', due: '22 Oct', e: 8, s: 'Done' },
      { id: 'dl4', t: 'DR switchover demo', o: 'Sneha G.', due: '08 Nov', e: 6, s: 'In progress' }
    ],
    versions: ['Initial (29 Jul)', 'Revised (15 Oct)'],
    lines: [
      { id: 'ln1', t: 'UPI switch licence', q: 1, p: [24000000, 22000000] },
      { id: 'ln2', t: 'Implementation + HSM integration', q: 1, p: [6000000, 8000000] },
      { id: 'ln3', t: 'AMC per year', q: 1, p: [12000000, 11000000] }
    ],
    licence: 'Perpetual', milestones: '40/40/20', amcTerm: '5 years',
    files: [
      { id: 'f1', n: 'RFP_MB_2026_118.pdf', t: 'RFP', v: 'v1', u: 'Priya S. · 20 Jul' },
      { id: 'f2', n: 'Corrigendum-1.pdf', t: 'RFP corrigendum', v: 'v1', u: 'Priya S. · 02 Aug' },
      { id: 'f3', n: 'Compliance_Matrix_Final.xlsx', t: 'Compliance', v: 'Final', u: 'Compliance · 16 Oct' },
      { id: 'f4', n: 'PoC_Load_Test_Report.pdf', t: 'Pre-PO deliverable', v: 'v1', u: 'Sneha G. · 18 Oct' },
      { id: 'f5', n: 'Technical_Proposal.pdf', t: 'Proposal', v: 'v3', u: 'Vikram N. · 16 Oct' },
      { id: 'f6', n: 'Commercial_Proposal.xlsx', t: 'Proposal', v: 'v2', u: 'Priya S. · 15 Oct' }
    ],
    tasks: [
      { id: 'tk1', t: 'Answer Legal comments on clause 6.4', due: '03 Nov', o: 'Vikram N.', done: false, stage: 'Proposal' },
      { id: 'tk2', t: 'DR switchover demo for bank IT', due: '08 Nov', o: 'Sneha G.', done: false, stage: 'Proposal' },
      { id: 'tk3', t: 'Prepare negotiation brief', due: '10 Nov', o: 'Priya S.', done: false, stage: 'Proposal' }
    ],
    people: [
      { n: 'Priya S.', r: 'Opportunity owner' }, { n: 'Pushkar B.', r: 'Sales Head / P&L' }, { n: 'Vikram N.', r: 'Pre-Sales' },
      { n: 'Sneha G.', r: 'Tech (PoC)' }, { n: 'A. Kulkarni', r: 'Bank · economic buyer' }
    ]
  }
};

const short = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

/**
 * Fill in every opportunity-screen field with a default value.
 * Empty values ('' / null / undefined) also fall back to the default, so every field shows something.
 */
export function withExtras(o) {
  const noPresales = !!o.skipPresales; // non-RFP lead: handled by Sales at every stage, no Pre-Sales owner
  const presales = noPresales ? '—' : o.presales && o.presales !== '—' ? o.presales : 'Vikram N.';
  const prod = o.productTsp || 'UPI';
  const people = [{ n: o.owner, r: 'Opportunity owner' }, { n: 'Pushkar B.', r: 'Sales Head / P&L' }, ...(noPresales ? [] : [{ n: presales, r: 'Pre-Sales' }]), { n: 'IT Head', r: `Bank · ${o.account}` }];
  const defaults = {
    // opportunity information
    presales, territory: 'South', leadSource: 'Sales Outbound', convertedFrom: '—',
    recordType: 'TSP', region: 'Domestic', businessType: 'New Business',
    expectedPoDate: o.closeDate || plusDays(90), projectStartExpected: addDays(o.closeDate, 30), firstBillingExpected: addDays(o.closeDate, 60),
    currentVolume: '10 Cr transactions / year', yearlyVolumeProjection: 120000000,
    spocFirstName: '', spocLastName: '', followupDetails: '',
    // industry information
    industry: 'Banking', subIndustry: subIndustryOf(o.account), accountSize: (Number(o.arr) || 0) + (Number(o.oneTime) || 0) > 30000000 ? 'Large' : 'Medium', merchantCategory: '', industryRemark: '',
    // product description (spec)
    solutionType: 'Product', serviceModel: 'Licence', productOwner: 'NPST',
    // qualification (spec)
    contractYears: '3', billingFrequency: 'Annual',
    fy27Q1: 0, fy27Jul: 0, fy27Aug: 0, fy27Sep: 0, ...phasing(o),
    // negotiation (spec)
    commercials: '', documentation: '', uatAgreement: '', bankInterview: '', bankApproval: '', poReceived: '',
    // product description
    module2: '—', productTsp3: '—', productTsp4: '—', productRemark: `${prod} as primary product`,
    // stage 1 · qualification
    currency: 'INR', closeDate: plusDays(90),
    year2: o.arr || 0, year3: o.arr || 0, year4: o.arr || 0, year5: o.arr || 0,
    compellingEvent: 'Current vendor contract ends Mar 2027', transactions: '10,00,000 per day',
    oppType: 'Hunting', partner: 'No', tender: 'Non RFP', hosting: 'On-premise',
    competitors: o.competition && o.competition !== '—' ? [o.competition] : ['FSS'], competitionRemarks: 'Incumbent vendor on renewal',
    today: `Legacy ${prod} system run in-house`, painPoint: 'Slow processing at peak load', presentPain: 'Timeouts and manual reconciliation',
    implication: 'NPCI penalties and customer complaints', notes: `${o.account} wants a single vendor for ${prod}.`,
    nextStep: 'Discovery call with IT head',
    // stage 2 · needs analysis
    economicBuyer: 'GM, Digital Banking', nda: true, strategy: 'Lead on uptime and NPCI certification',
    presalesInvolved: noPresales ? 'No' : 'Yes', presalesName: noPresales ? '' : presales, champion: true, championOk: true, reqReceived: 'Yes',
    // stage 3 · impact analysis
    ebAligned: 'Yes', ebMet: plusDays(-10), demoDone: true, success: 'Meets target TPS on bank UAT', poc: true, sow: 'Yes',
    // stage 4 · proposal
    proposalDate: plusDays(-3), criteriaKnown: true, criteria: 'L1 after technical qualification',
    // stage 5 · negotiation
    contractShared: 'Yes', contractSigned: 'No', signDate: '', discount: '5% on licence',
    lostReason: '',
    // other tabs
    createdBy: o.history?.[o.history.length - 1]?.m || '—',
    rfp: null,
    reviews: [{ id: 'rv1', t: 'Commercial proposal', v: 'v1', r: 'Finance · K. Rao', due: short(plusDays(5)), s: 'Assigned' }],
    recDraft: { rec: 'Yes', syn: `${o.account}: ${prod} deal at ${inrCr(o)} first year. Requirements confirmed, champion engaged.`, concern: 'Ask for 30/50/20 payment milestones.' },
    deliverables: [],
    versions: ['Initial'],
    lines: [
      { id: 'ln1', t: 'Licence + implementation (one time)', q: 1, p: [o.oneTime || 0] },
      { id: 'ln2', t: 'AMC / ARR per year', q: 1, p: [o.arr || 0] }
    ],
    licence: 'Perpetual', milestones: '30/50/20', amcTerm: '5 years',
    files: [],
    tasks: [{ id: 'tk1', t: o.nextStep || 'Discovery call with IT head', due: short(plusDays(7)), o: o.owner, done: false, stage: o.stage }],
    people
  };
  const out = { ...defaults };
  for (const [k, v] of Object.entries(o)) if (v !== '' && v !== null && v !== undefined) out[k] = v;
  if (out.presales === '—') out.presales = presales;
  return out;
}

function addDays(iso, n) { const d = new Date(iso || Date.now()); if (isNaN(d)) return ''; d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function subIndustryOf(acct = '') {
  if (/co-?op/i.test(acct)) return 'Coop Bank';
  if (/small finance|sfb/i.test(acct)) return 'Small Finance Bank';
  if (/payments bank/i.test(acct)) return 'Payments Bank';
  if (/gramin/i.test(acct)) return 'Regional Rural Bank';
  if (/state apex/i.test(acct)) return 'Coop Bank';
  return 'Private Bank';
}
/** Sample FY27 phasing: one-time fees billed in Q3, ARR spread monthly from Oct 2026. */
function phasing(o) {
  const m = Math.round((Number(o.arr) || 0) / 12);
  const ot = Number(o.oneTime) || 0;
  return { fy27Oct: m + Math.round(ot * 0.4), fy27Nov: m, fy27Dec: m, fy27Jan: m + Math.round(ot * 0.4), fy27Feb: m, fy27Mar: m + Math.round(ot * 0.2) };
}

function inrCr(o) { return '₹' + (((Number(o.arr) || 0) + (Number(o.oneTime) || 0)) / 1e7).toFixed(2) + ' Cr'; }
