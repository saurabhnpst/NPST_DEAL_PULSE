import { useMemo, useState } from 'react';
import { opportunityService } from '../services/opportunityService.js';
import { uiOpportunityToCreate, apiOpportunityToUi } from '../mappers/opportunityMapper.js';
import { useBusinessData } from '../store/BusinessData.jsx';
import { Drawer, Input, Select, TextArea, Badge } from './ui.jsx';
import LeadPicker from './LeadPicker.jsx';
import { useAuth } from '../store/Auth.jsx';
import { useStore, inr, category } from '../store/Store.jsx';
import { defaultOpportunity, stageMeta, PRODUCTS, PRODUCTS_2_4, MODULES, OPP_TYPES, LEAD_SOURCES, TERRITORIES, COMPETITORS, OPEN_STAGES, TENDER_TYPES, isTender, REGIONS, INDUSTRIES, HOSTING } from '../data/defaults.js';
import { MultiPick } from './ui.jsx';
import { ownerOptions, PRESALES_OPTIONS } from '../data/peopleOptions.js';
import { validateOpportunity, errorCount } from '../data/validators.js';

/**
 * "New opportunity" drawer. Tag an existing lead first — account, owner,
 * product and lead source are carried over and the lead is converted on save.
 * Pass `fromLead` to open already tagged (convert flow).
 */
/** Fields carried from a lead into the new opportunity. */
const fromLeadFields = (l) => ({
  leadId: l.id, convertedFrom: l.id,
  name: `${l.company}_${l.productTsp}`, account: l.company, leadSource: l.leadSource,
  productTsp: l.productTsp, module: l.module, productTsp2: l.productTsp2 || '—', module2: l.module2 || '', productTsp3: l.productTsp3 || '—', productTsp4: l.productTsp4 || '—', productRemark: l.productRemark || '',
  tender: l.rfp ? 'RFP' : 'Non RFP',
  industry: l.industry || 'Banking', subIndustry: l.subIndustry || '', industryRemark: l.industryRemark || '',
  currentVolume: l.currentVolume || '', yearlyVolumeProjection: l.yearlyVolumeProjection || '',
  spocFirstName: l.spocFirstName || l.firstName || '', spocLastName: l.spocLastName || l.lastName || '',
  region: l.country && l.country !== 'India' ? 'International' : 'Domestic',
  // non-RFP lead: no Pre-Sales / Solution; Sales owns every stage from Qualification onwards
  ...(l.rfp ? {} : { presales: '—', skipPresales: true })
});
/** Undo the non-RFP setup when the tagged lead changes to an RFP lead or is removed. */
const RFP_PATH = { presales: '—', skipPresales: false };

export default function NewOpportunity({ onClose, onCreated, fromLead }) {
  const { user, userName, userIdByName } = useAuth();
  const { state, dispatch } = useStore();
  const { reloadOpportunities, reloadLeads } = useBusinessData() || {};
  const owners = ownerOptions(user);
  const owner = owners[0] || '';
  const requireLead = !fromLead;
  const [v, setV] = useState(() => defaultOpportunity(user, fromLead ? {
    ...fromLeadFields(fromLead), owner: fromLead.owner || owner
  } : { leadId: '' }));
  const [tagged, setTagged] = useState(fromLead || null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const errors = useMemo(() => validateOpportunity(v, { requireLead }), [v, requireLead]);
  const f = (k) => (val) => setV({ ...v, [k]: val });
  const accounts = Array.from(new Set([v.account, ...state.opportunities.map((o) => o.account), ...state.leads.map((l) => l.company)])).filter(Boolean).sort();
  const total = (Number(v.arr) || 0) + (Number(v.oneTime) || 0);
  const meta = stageMeta(v.stage);
  const errFor = (k) => (showErrors || (v[k] !== undefined && String(v[k]).trim() !== '' && v[k] !== '—') ? errors[k] : undefined);

  const tagLead = (lead) => {
    setTagged(lead);
    setV((prev) => ({ ...prev, ...(lead.rfp && prev.skipPresales ? RFP_PATH : {}), ...fromLeadFields(lead), owner: lead.owner || prev.owner }));
  };
  const clearLead = () => {
    setTagged(null);
    setV((prev) => ({ ...prev, ...(prev.skipPresales ? RFP_PATH : {}), leadId: '', account: '', leadSource: 'Sales Outbound' }));
  };
  const save = async () => {
    const n = errorCount(errors);
    if (n) { setShowErrors(true); return setErr(`Fix the highlighted fields before saving (${n} issue${n > 1 ? 's' : ''}).`); }
    setSaving(true);
    setErr('');
    try {
      const created = await opportunityService.create(uiOpportunityToCreate(v, userIdByName));
      const ui = apiOpportunityToUi(created, userName);
      if (ui) {
        dispatch({ type: 'UPSERT_OPP', opp: ui });
      }
      await reloadOpportunities?.();
      await reloadLeads?.();
      onCreated?.(ui?.id);
    } catch (e) {
      setErr(e?.message || 'Could not create opportunity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer full title={fromLead ? `Convert lead · ${fromLead.company}` : 'New opportunity'} onClose={onClose} footer={<>
      <button className="btn-p" onClick={save} disabled={saving}>{saving ? 'Saving…' : fromLead ? 'Convert and create' : 'Save'}</button>
      <button className="btn" onClick={onClose}>Cancel</button>
    </>}>
      <p className="defaults">
        {requireLead
          ? `Tag a lead to carry over the account, owner, product, modules, industry, SPOC and lead source. Stage Qualification, currency INR, close date 90 days out, type Hunting, region Domestic and hosting On-premise are pre-filled.`
          : `Pre-filled with default values: stage Qualification, owner, currency INR, close date 90 days out, type Hunting, region Domestic, hosting On-premise, plus account, product, modules, industry, SPOC and lead source carried from the lead.`}
        {v.skipPresales && ' Non-RFP lead: no Pre-Sales owner — Sales handles every stage, and Pre-Sales / Solution cannot edit it.'}
      </p>
      {err && <p className="err" role="alert">{err}</p>}

      <div className="sec">Lead &amp; account context</div>
      <div className="grid2">
        <Field2 label="Select / Tag Lead" required={requireLead} error={errFor('leadId')} span>
          {requireLead
            ? <LeadPicker leads={state.leads} value={v.leadId} onSelect={tagLead} onClear={clearLead} error={errFor('leadId')} />
            : <input className="in ro" readOnly value={tagged ? `${tagged.salutation} ${tagged.firstName} ${tagged.lastName} · ${tagged.company}` : '—'} />}
        </Field2>
        <Field2 label="Account Name" required error={errFor('account')}>
          <input className={'in' + (errFor('account') ? ' err' : '')} list="acct-list" value={v.account} aria-invalid={errFor('account') ? 'true' : undefined} onChange={(e) => f('account')(e.target.value)} />
          <datalist id="acct-list">{accounts.map((a) => <option key={a} value={a} />)}</datalist>
        </Field2>
        <Select label="Opportunity Owner" required value={v.owner} onChange={f('owner')} options={owners} />
        <Select label="Lead Source" value={v.leadSource} onChange={f('leadSource')} options={LEAD_SOURCES} />
        <Select label="Region" value={v.region} onChange={f('region')} options={REGIONS} />
        <Select label="Territory" value={v.territory} onChange={f('territory')} options={TERRITORIES} />
        <Select label="Opportunity Type" value={v.oppType} onChange={f('oppType')} options={OPP_TYPES} />
        <Select label="Tender" value={v.tender} onChange={f('tender')} options={TENDER_TYPES} />
        <Select label="Industry" value={v.industry} onChange={f('industry')} options={INDUSTRIES} />
      </div>
      {tagged && <TaggedLead lead={tagged} />}

      <div className="sec">Opportunity details</div>
      <div className="grid2">
        <Input label="Opportunity Name" required value={v.name} error={errFor('name')} onChange={f('name')} note="Defaults to product · company on tagging" />
        {v.skipPresales
          ? <Input label="Pre-Sales owner" value="— · not needed for a non-RFP lead" readOnly />
          : <Select label="Pre-Sales owner" value={v.presales} onChange={f('presales')} options={PRESALES_OPTIONS} />}
        <Select label="Stage" required value={v.stage} error={errFor('stage')} onChange={f('stage')} options={OPEN_STAGES} note={`Probability ${meta.prob}% · Forecast ${meta.forecast}`} />
        <Input label="Expected close date" required type="date" value={v.closeDate} error={errFor('closeDate')} onChange={f('closeDate')} note="Must be a future date" />
      </div>

      <div className="sec">Deal size</div>
      <div className="grid2">
        <Input label="Annual Recurring Revenue (ARR) (₹)" required type="number" value={v.arr} error={errFor('arr')} onChange={f('arr')} note={inr(Number(v.arr) || 0)} />
        <Input label="One Time Fees (₹)" type="number" value={v.oneTime} error={errFor('oneTime')} onChange={f('oneTime')} note={inr(Number(v.oneTime) || 0)} />
        <Input label="Amount (First Year)" value={`${inr(total)} · ${category(total)}`} readOnly note="ARR + One Time Fees, calculated" />
        <Select label="Currency" required value={v.currency} error={errFor('currency')} onChange={f('currency')} options={['INR', 'USD']} />
      </div>

      <div className="sec">Product description</div>
      <div className="grid2">
        <Select label="Product" required value={v.productTsp} error={errFor('productTsp')} onChange={(p) => setV({ ...v, productTsp: p, module: '' })} options={PRODUCTS} />
        <MultiPick label={'Module ' + v.productTsp} value={v.module} onChange={f('module')} options={MODULES[v.productTsp] || []} />
        <Select label="Product TSP 2" value={v.productTsp2} onChange={(p) => setV({ ...v, productTsp2: p, module2: '' })} options={['—', ...PRODUCTS_2_4]} />
        <Select label="Hosting" value={v.hosting} onChange={f('hosting')} options={HOSTING} />
      </div>

      <div className="sec">Qualification</div>
      <div className="grid2">
        <Select label="Is Partner involved?" value={v.partner} onChange={f('partner')} options={['No', 'Yes']} />
        <MultiPick label="Competition" value={(v.competitors || []).join('; ')} onChange={(x) => setV({ ...v, competitors: x ? x.split('; ') : [] })} options={COMPETITORS} />
        <Input label="Compelling Event" value={v.compellingEvent} onChange={f('compellingEvent')} />
        <Input label="Pain point" value={v.painPoint} onChange={f('painPoint')} />
      </div>
      <TextArea label="Next steps" value={v.nextStep} onChange={f('nextStep')} rows={2} />
    </Drawer>
  );
}

function Field2({ label, children, required, error, span }) {
  return (
    <label className="fl" style={span ? { gridColumn: '1 / -1' } : undefined}>
      <span>{label}{required && <span className="req" aria-hidden="true"> *</span>}</span>
      {children}
      {error && <span className="note err-txt" role="alert">{error}</span>}
    </label>
  );
}

function TaggedLead({ lead }) {
  return (
    <div className="lead-tag">
      <div className="lead-tag-av">{(lead.firstName || '?')[0]}{(lead.lastName || '')[0] || ''}</div>
      <div style={{ minWidth: 0 }}>
        <div className="w600 s14">{lead.salutation} {lead.firstName} {lead.lastName}</div>
        <div className="s12 muted">{lead.designation} · {lead.company}</div>
        <div className="s12 muted">{lead.email} · {lead.phone}{lead.mobile ? ' · ' + lead.mobile : ''}</div>
      </div>
      <span className="row gap8" style={{ marginLeft: 'auto' }}>
        <span className="s12 muted">{lead.leadSource}</span>
        <Badge>{lead.status}</Badge>
      </span>
    </div>
  );
}
