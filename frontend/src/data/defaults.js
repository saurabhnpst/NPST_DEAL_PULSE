// Default values used when creating a lead or an opportunity.
// Picklist fields get empty or system defaults — no prefilled business records.

// Picklists follow "Lead - Fields.xlsx" and "Opportunity Fields.xlsx".
export const LEAD_SOURCES = ['Employee Referral', 'BD Outbound', 'Customer referral', 'Event', 'Linked-In', 'NPCI', 'Partner referral', 'Present customer', 'Sales Outbound', 'Social Media', 'Tender Portal', 'Website - Ads', 'Website - Organic', 'Website - Organic Search', 'Others', 'GFF 2025', 'Banking Connect Workshop'];
export const RATINGS = ['Hot', 'Warm', 'Cold'];
export const SALUTATIONS = ['Mr.', 'Ms.', 'Miss', 'Mrs.', 'Dr.', 'Prof.'];
export const PRODUCTS = ['UPI', 'BBPS', 'CBDC', 'Customization', 'EFRM', 'ERP', 'HSM', 'IMPS', 'MBS', 'ODR', 'QYNX', 'RedHat', 'Super App', 'AML', 'CHS', 'Embedded Payments', 'RIDP', 'EWS', 'UPI 123', 'F5', 'IBMB', 'Interoperable IBMB', 'Banking Connect (IBMB)', 'Evok', 'Banking SuperApp + Omnichannel', 'BBPS Corporate (B2B)', 'BBPS Retail', 'CashPoint', 'DPDP', 'ERP - Infinity', 'KMS', 'LPaaS', 'MMS (Merchant Management Suite)', 'OBS', 'QYNX/Soundbox', 'Run Time Application', 'Wallet Payment', 'NA', 'Others'];
export const PRODUCTS_2_4 = ['BBPS', 'CBDC', 'Customization', 'EFRM', 'ERP', 'HSM', 'IMPS', 'MBS', 'ODR', 'QYNX', 'RedHat', 'Super App', 'UPI', 'UPI 123', 'F5', 'IBMB', 'Interoperable IBMB', 'Others'];
const QYNX = ['Soundbox', 'Standee', 'QR Generation', 'Merchant App', 'Admin Portal', 'TMS', 'MQTT', 'SDK', 'Simcard'];
const SUPER_APP = ['Banking SuperApp - Retail', 'Banking SuperApp - Corporate'];
/** Module picklists (multi-select) by product. Products not listed have no modules. */
export const MODULES = {
  UPI: ['UPI', 'Acquiring Switch', 'Issuer Switch', 'CC on UPI', 'Credit Line on UPI', 'Merchant Switch', 'PP on UPI', 'PPI on UPI', 'TPAP'],
  'UPI 123': ['UPI', 'Acquiring Switch', 'Issuer Switch', 'Merchant Switch'],
  QYNX, 'QYNX/Soundbox': QYNX,
  IMPS: ['Beneficiary', 'Remittance'],
  ERP: ['ERP Jewellery', 'ERP Society'], 'ERP - Infinity': ['ERP Jewellery', 'ERP Society'],
  BBPS: ['Operating Unit', 'Angel Institution'],
  'BBPS Retail': ['COU', 'BOU', 'AI - Bill Direct', 'UPMS'],
  'BBPS Corporate (B2B)': ['Buyer', 'Seller'],
  IBMB: ['Issuer', 'Acquirer'], 'Interoperable IBMB': ['Issuer', 'Acquirer'], 'Banking Connect (IBMB)': ['Issuer', 'Acquirer'],
  'Super App': SUPER_APP, 'Banking SuperApp + Omnichannel': SUPER_APP
};
/** Multi-select values are stored as "A; B" strings. */
export const splitMulti = (v) => (Array.isArray(v) ? v : String(v || '').split(';').map((x) => x.trim()).filter((x) => x && x !== '—'));
export const joinMulti = (list) => list.join('; ');
export const INDUSTRIES = ['Banking', 'Digital Solution', 'Fintech', 'Fintech Solution', 'International Client', 'IT Solutions', 'Payment Aggregator', 'Payment Gateway', 'Regulator', 'Student', 'TPAP', 'Other'];
// Sub Industry depends on Industry. Values are not in the field sheets; these are demo placeholders.
export const SUB_INDUSTRIES = {
  Banking: ['Public Sector Bank', 'Private Bank', 'Coop Bank', 'Regional Rural Bank', 'Small Finance Bank', 'Payments Bank', 'Foreign Bank', 'NBFC'],
  Fintech: ['Lending', 'Payments', 'Wealth', 'Insurance'], 'Fintech Solution': ['Lending', 'Payments', 'Wealth', 'Insurance'],
  'Payment Aggregator': ['Online', 'Offline'], 'Payment Gateway': ['Online', 'Offline']
};
export const ACCOUNT_SIZES = ['Large', 'Medium', 'Small'];
export const VERTICALS_PRODUCT = ['TSP', 'EVOK'];
export const productVertical = (recordType) => (recordType === 'PPAS' ? 'EVOK' : 'TSP');
export const STATES = ['Karnataka', 'Kerala', 'Tamil Nadu', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Gujarat', 'Delhi'];
export const COUNTRIES = ['India', 'UAE', 'Singapore', 'Nepal', 'Bangladesh', 'Sri Lanka', 'Other'];
export const LEAD_STATUSES = ['New', 'Working', 'Nurturing', 'Unqualified', 'Qualified'];
export const DISQUALIFICATION_REASONS = ['No budget', 'No need', 'Wrong product fit', 'Chose a competitor', 'Duplicate lead', 'Not reachable', 'Other'];
export const YES_NO = ['Yes', 'No'];

export const STAGES = [
  { name: 'Qualification', prob: 10, forecast: 'Pipeline', open: true },
  { name: 'Needs Analysis', prob: 25, forecast: 'Pipeline', open: true },
  { name: 'Impact Analysis', prob: 40, forecast: 'Pipeline', open: true },
  { name: 'Proposal', prob: 60, forecast: 'Best Case', open: true },
  { name: 'Negotiation', prob: 80, forecast: 'Commit', open: true },
  { name: 'Closed Won', prob: 100, forecast: 'Closed', open: false },
  { name: 'Closed Lost', prob: 0, forecast: 'Omitted', open: false },
  { name: 'No Bid', prob: 0, forecast: 'Omitted', open: false },
  { name: 'On Hold', prob: 0, forecast: 'Omitted', open: false }
];
export const stageMeta = (name) => STAGES.find((s) => s.name === name) || STAGES[0];
export const OPEN_STAGES = STAGES.filter((s) => s.open).map((s) => s.name);

export const TERRITORIES = ['South', 'North + West', 'Pan India (Partnership)', 'International'];
export const REGIONS = ['Domestic', 'International'];
export const OPP_TYPES = ['Existing Billing', 'Farming', 'Hunting'];
export const BUSINESS_TYPES = ['Existing Business', 'New Business'];
export const TENDER_TYPES = ['Non RFP', 'RFP', 'PoC', 'Empanelment', 'Proposal'];
/** RFP and Empanelment deals go through a tender (synopsis, EMD, compliance). */
export const isTender = (t) => t === 'RFP' || t === 'Empanelment' || t === 'Yes';
export const COMPETITORS = ['Finacus', 'FSS', 'Infrasoft', 'Justpay', 'List software Ltd', 'Mindgate', 'Mobileware', 'Razorpay', 'RS software', 'Sarvatra', 'Others'];
export const LOST_REASONS = ['Change in Priorities', 'Competition', 'Customer went cold', 'Price', 'Product Fitment', 'Project Cancelled', 'Technically Not Qualified', 'Others'];
export const HOLD_REASONS = ['Internal', 'External', 'Both(Internal & External)'];
export const BILLING_FREQUENCIES = ['One Time', 'Monthly', 'Quarterly', 'Annual'];
export const CONTRACT_YEARS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
export const SOLUTION_TYPES = ['Product', 'Service', 'Hybrid'];
export const SERVICE_MODELS = ['SaaS', 'Licence', 'Hybrid', 'Not Applicable'];
export const PRODUCT_OWNERS = ['NPST', 'Third Party', 'Hybrid'];
export const HOSTING = ['Cloud', 'On-premise'];
export const FORECAST_CATEGORIES = ['Omitted', 'Pipeline', 'Best Case', 'Commit', 'Closed'];
// FY27 revenue phasing: Q1 is entered directly; Q2–Q4 are the sum of their months.
export const FY27_MONTHS = [
  { q: 'Q2', months: [['fy27Jul', 'Jul 2026'], ['fy27Aug', 'Aug 2026'], ['fy27Sep', 'Sep 2026']] },
  { q: 'Q3', months: [['fy27Oct', 'Oct 2026'], ['fy27Nov', 'Nov 2026'], ['fy27Dec', 'Dec 2026']] },
  { q: 'Q4', months: [['fy27Jan', 'Jan 2027'], ['fy27Feb', 'Feb 2027'], ['fy27Mar', 'Mar 2027']] }
];
export const OVERRIDE_REASONS = ['Customer timeline/urgency', 'Competitive pressure', 'Budget / fiscal cycle', 'Management directive', 'Strategic deal', 'Other'];

const iso = (d) => d.toISOString().slice(0, 10);
export const today = () => iso(new Date());
export const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

/** Default values for the "New lead" form. */
export function defaultLead(user) {
  return {
    recordType: 'TSP',
    middleName: '',
    suffix: '',
    leadSource: 'Sales Outbound',
    employeeReferral: '',
    rating: 'Warm',
    productTsp2: '—', productTsp3: '—', productTsp4: '—', module2: '', module3: '', module4: '', productRemark: '',
    rfp: false,
    owner: user?.name || '',
    status: 'New',
    notes: '', additionalRemarks: '',
    // SPOC 2
    spocFirstName: '', spocLastName: '', spocDesignation: '', spocEmail: '', spocPhone: '',
    // industry
    industry: 'Banking', subIndustry: '', currentVolume: '', yearlyVolumeProjection: '',
    // address
    street: '', city: '', zip: '', country: 'India',
    // qualification checks / BANT
    budgetApproved: false, need: '', authority: '', timelineKnown: '', timeline: '',
    salutation: '', firstName: '', lastName: '', company: '', designation: '', email: '', phone: '', mobile: '', website: '', state: '',
    productTsp: '', module: '',
    subIndustry: '',
  };
}

/** Default values for the "New opportunity" form. */
export function defaultOpportunity(user, overrides = {}) {
  return {
    name: '',
    account: '',
    owner: user?.name || '',
    presales: '—',
    stage: 'Qualification',
    closeDate: plusDays(90),
    currency: 'INR',
    arr: '',
    oneTime: '',
    productTsp: '',
    module: '',
    productTsp2: '—',
    oppType: 'Hunting',
    businessType: 'New Business',
    leadSource: 'Sales Outbound',
    territory: 'South',
    region: 'Domestic',
    industry: 'Banking',
    tender: 'Non RFP',
    hosting: 'On-premise',
    solutionType: 'Product',
    serviceModel: 'Licence',
    productOwner: 'NPST',
    contractYears: '3',
    billingFrequency: 'Annual',
    partner: 'No',
    competitors: [],
    compellingEvent: '',
    painPoint: '',
    transactions: '',
    nextStep: '',
    ...overrides
  };
}
