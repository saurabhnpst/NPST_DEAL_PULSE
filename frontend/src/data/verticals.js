// Development-only vertical permissions until Command Module registers DealPlus roles.
// Vertical switch affects navigation and `can` flags — not production IAM.

export const VERTICALS = {
  sales: {
    key: 'sales',
    label: 'Sales',
    blurb: 'Leads, opportunities, RFP synopsis and recommendations',
    user: { name: 'Priya S.', initials: 'PS', title: 'Sales Manager · South India', email: 'sales@dealpulse.demo' },
    nav: ['/', '/leads', '/rfp', '/opportunities', '/pre-po', '/post-po'],
    can: { createLead: true, createOpp: true, editOpp: true, editOppEarly: false, editOppLate: true, submitSynopsis: true, recommend: true, fallback: true }
  },
  pl: {
    key: 'pl',
    label: 'P&L Head',
    blurb: 'Approve leads and decide Proceed or Reject on deals',
    user: { name: 'Pushkar B.', initials: 'PB', title: 'Sales Head & P&L Head · South India', email: 'plhead@dealpulse.demo' },
    nav: ['/', '/decisions', '/leads', '/opportunities', '/pre-po'],
    can: { approveLead: true, decide: true, fallback: true }
  },
  solution: {
    key: 'solution',
    label: 'Solution / Pre-Sales',
    blurb: 'RFP synopsis, compliance, PoCs and post-PO work',
    user: { name: 'Vikram N.', initials: 'VN', title: 'Pre-Sales Manager · Solutions', email: 'solution@dealpulse.demo' },
    nav: ['/', '/rfp', '/opportunities', '/compliance', '/pre-po', '/post-po'],
    can: { editOpp: true, editOppEarly: true, editOppLate: false, acceptSynopsis: true, approveCompliance: true, createEval: true }
  }
};

// A lead submitted for approval goes to both approvers; it moves on only after both have decided.
// `key` matches the vertical that acts as that approver (the Sales Manager approves from the Sales login).
export const LEAD_APPROVERS = [
  { key: 'pl', role: 'P&L Head', name: VERTICALS.pl.user.name },
  { key: 'sales', role: 'Sales Manager', name: VERTICALS.sales.user.name }
];

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/leads', label: 'Leads' },
  { path: '/rfp', label: 'RFP synopsis' },
  { path: '/opportunities', label: 'Opportunities' },
  { path: '/compliance', label: 'Compliance' },
  { path: '/pre-po', label: 'Pre-PO evaluations' },
  { path: '/decisions', label: 'P&L decisions' },
  { path: '/post-po', label: 'Post-PO' }
];
