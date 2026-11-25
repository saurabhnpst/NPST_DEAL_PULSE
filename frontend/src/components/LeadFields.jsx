import { Input, Select, MultiPick } from './ui.jsx';
import {
  LEAD_SOURCES, RATINGS, SALUTATIONS, PRODUCTS, PRODUCTS_2_4, MODULES, STATES, COUNTRIES, INDUSTRIES, SUB_INDUSTRIES, YES_NO, productVertical
} from '../data/defaults.js';
import { ownerOptions } from '../data/peopleOptions.js';
import ContactPicker from './ContactPicker.jsx';
import EmailPicker, { TaggedEmails } from './EmailPicker.jsx';

/** Collapsible form section. `hint` summarises the section while it is closed. */
function Section({ title, hint, open, children, extra }) {
  return (
    <details className="grp lf-sec" open={open}>
      <summary>
        <span className="row gap8" style={{ alignItems: 'baseline', minWidth: 0 }}>
          <span className="lf-title">{title}</span>
          {hint && <span className="lf-hint">{hint}</span>}
        </span>
        <span className="row gap8">{extra}<span className="lf-chev" aria-hidden="true">▾</span></span>
      </summary>
      <div>{children}</div>
    </details>
  );
}

const has = (x) => x !== undefined && x !== null && String(x).trim() !== '' && x !== '—';

/**
 * Shared lead fields, used by "New lead" and the lead detail page.
 * Sections follow "Lead Information.docx": Lead Information, Product Description,
 * SPOC 2 Details, Industry Information, Address Information, Qualification Checks / BANT.
 * Compact 3-column layout; sections other than Lead Information start collapsed on saved leads.
 */
export default function LeadFields({ v, set, readOnly, existing, ai = {}, onPickContact, errors = {}, showErrors = false }) {
  const f = (k) => (val) => set({ ...v, [k]: val });
  const dis = !!readOnly;
  const emails = v.emails || [];
  const tagEmail = (m, contact) => {
    const next = [m, ...emails];
    if (contact && onPickContact) onPickContact({ ...contact, emails: next });
    else set({ ...v, ...(contact || {}), emails: next });
  };
  // Format errors show live as you type; required errors wait for a Save attempt.
  const err = (k) => {
    const m = errors[k];
    if (!m) return undefined;
    return showErrors || has(v[k]) ? m : undefined;
  };
  const note = (t) => (existing ? undefined : t); // helper notes only on the New lead form
  const setProduct = (k, mk) => (p) => set({ ...v, [k]: p, [mk]: '' });
  const subs = SUB_INDUSTRIES[v.industry] || [];
  const anyErr = (keys) => showErrors && keys.some((k) => errors[k]);

  const products = [v.productTsp, v.productTsp2, v.productTsp3, v.productTsp4].filter(has);
  const spocName = [v.spocFirstName, v.spocLastName].filter(has).join(' ');

  return (
    <div className="col gap10 lf">
      <Section title="Lead information" open
        extra={!dis && !existing ? (
          <span className="row gap8" onClick={(e) => e.preventDefault()}>
            {onPickContact && <ContactPicker onPick={onPickContact} />}
            <EmailPicker tagged={emails} onTag={tagEmail} />
          </span>
        ) : null}>
        <div className="grid3">
          <Select label="Salutation" none value={v.salutation} ai={ai.salutation} onChange={f('salutation')} options={SALUTATIONS} disabled={dis} />
          <Input label="First Name" value={v.firstName} ai={ai.firstName} onChange={f('firstName')} readOnly={dis} />
          <Input label="Middle Name" value={v.middleName} ai={ai.middleName} onChange={f('middleName')} readOnly={dis} />
          <Input label="Last Name" required value={v.lastName} error={err('lastName')} ai={ai.lastName} onChange={f('lastName')} readOnly={dis} />
          <Input label="Suffix" value={v.suffix} ai={ai.suffix} onChange={f('suffix')} readOnly={dis} />
          <Input label="Company" required value={v.company} error={err('company')} ai={ai.company} onChange={f('company')} readOnly={dis} note={note('Becomes the Account and Opportunity name')} />
          <Input label="Designation" value={v.designation} ai={ai.designation} onChange={f('designation')} readOnly={dis} />
          <Input label="Email" required type="email" value={v.email} error={err('email')} ai={ai.email} onChange={f('email')} readOnly={dis} placeholder="name@example.com" />
          <Input label="Phone" required value={v.phone} error={err('phone')} ai={ai.phone} onChange={f('phone')} readOnly={dis} note={note('With country code, e.g. +91 20 4100 2233')} />
          <Input label="Mobile" value={v.mobile} error={err('mobile')} ai={ai.mobile} onChange={f('mobile')} readOnly={dis} />
          <Input label="Website" required value={v.website} error={err('website')} ai={ai.website} onChange={f('website')} readOnly={dis} />
          {existing
            ? <Select label="Lead Owner" value={v.owner} onChange={f('owner')} options={[v.owner].filter(Boolean)} disabled={dis} />
            : <Input label="Lead Owner" value={v.owner + ' (you)'} readOnly />}
          <Select label="Lead Source" required none value={v.leadSource} error={err('leadSource')} ai={ai.leadSource} onChange={f('leadSource')} options={LEAD_SOURCES} disabled={dis} />
          <Select label="Rating" required none value={v.rating} error={err('rating')} ai={ai.rating} onChange={f('rating')} options={RATINGS} disabled={dis} />
          <Input label="Lead Status" required value={v.status} readOnly note={note('Every new lead starts as New')} />
          {v.leadSource === 'Employee Referral' && <Input label="Employee Referral" value={v.employeeReferral} ai={ai.employeeReferral} onChange={f('employeeReferral')} readOnly={dis} />}
          {v.leadSource === 'Customer referral' && <Input label="Customer Referral" value={v.customerReferral} onChange={f('customerReferral')} readOnly={dis} />}
          {v.leadSource === 'Partner referral' && <>
            <Input label="Partner Referral" value={v.partnerReferral} onChange={f('partnerReferral')} readOnly={dis} />
            <Input label="Partner Referral Other Remarks" value={v.partnerReferralRemarks} onChange={f('partnerReferralRemarks')} readOnly={dis} />
          </>}
          {v.leadSource === 'Event' && <>
            <Input label="Event" value={v.event} onChange={f('event')} readOnly={dis} placeholder="e.g. GFF 2025" />
            <Input label="Event Other Remarks" value={v.eventRemarks} onChange={f('eventRemarks')} readOnly={dis} />
          </>}
          {v.leadSource === 'Others' && <Input label="Lead Source Other Remark" value={v.leadSourceRemark} onChange={f('leadSourceRemark')} readOnly={dis} />}
          <Select label="Lead Record Type" required value={v.recordType} error={err('recordType')} onChange={f('recordType')} options={['TSP', 'PPAS']} disabled={dis || existing} />
          <Input label="Additional Remarks" value={v.additionalRemarks} onChange={f('additionalRemarks')} readOnly={dis} />
          <label className="fl chk lf-chk"><input type="checkbox" checked={!!v.rfp} disabled={dis} onChange={(e) => set({ ...v, rfp: e.target.checked })} /> RFP / Tender involved</label>
        </div>
        {!existing && emails.length > 0 && <div style={{ marginTop: 12 }}><TaggedEmails emails={emails} onRemove={dis ? null : (id) => set({ ...v, emails: emails.filter((m) => m.id !== id) })} /></div>}
      </Section>

      <Section title="Product description" open={!existing || anyErr(['productTsp'])}
        hint={products.length ? products.join(' · ') : 'No product yet'}>
        <div className="grid3">
          <Select label="Product" required none value={v.productTsp} error={err('productTsp')} ai={ai.productTsp} disabled={dis} onChange={setProduct('productTsp', 'module')} options={PRODUCTS} />
          <Input label="Product Vertical" value={productVertical(v.recordType)} readOnly />
          <Input label="Product TSP Other Remark" value={v.productRemark} onChange={f('productRemark')} readOnly={dis} />
          <MultiPick label={'Module ' + (v.productTsp || '')} span value={v.module} onChange={f('module')} options={MODULES[v.productTsp] || []} disabled={dis} />
          <Select label="Product TSP 2" value={v.productTsp2} ai={ai.productTsp2} onChange={setProduct('productTsp2', 'module2')} options={['—', ...PRODUCTS_2_4]} disabled={dis} />
          <Select label="Product TSP 3" value={v.productTsp3 || '—'} onChange={setProduct('productTsp3', 'module3')} options={['—', ...PRODUCTS_2_4]} disabled={dis} />
          <Select label="Product TSP 4" value={v.productTsp4 || '—'} onChange={setProduct('productTsp4', 'module4')} options={['—', ...PRODUCTS_2_4]} disabled={dis} />
          {has(v.productTsp2) && <MultiPick label={'Module ' + v.productTsp2 + ' 2'} span value={v.module2} onChange={f('module2')} options={MODULES[v.productTsp2] || []} disabled={dis} />}
          {has(v.productTsp3) && <MultiPick label={'Module ' + v.productTsp3 + ' 3'} span value={v.module3} onChange={f('module3')} options={MODULES[v.productTsp3] || []} disabled={dis} />}
          {has(v.productTsp4) && <MultiPick label={'Module ' + v.productTsp4 + ' 4'} span value={v.module4} onChange={f('module4')} options={MODULES[v.productTsp4] || []} disabled={dis} />}
        </div>
      </Section>

      <Section title="Qualification checks / BANT" open={!existing}
        hint={`Need ${v.need || '—'} · Budget ${v.budgetApproved ? 'approved' : 'not confirmed'}${v.timelineKnown === 'Yes' && v.timeline ? ' · ' + v.timeline : ''}`}>
        <div className="grid3">
          <Select label="Do they have a need?" none value={v.need} onChange={f('need')} options={YES_NO} disabled={dis}
            note={v.need === 'No' ? 'No → mark Unqualified, or Nurturing to reconnect in 3–6 months.' : note('Yes is needed to submit for approval.')} />
          <Input label="Who is the authority?" value={v.authority} onChange={f('authority')} readOnly={dis} placeholder="e.g. CIO, IT Committee" />
          <Select label="Do we know the timeline?" none value={v.timelineKnown} onChange={f('timelineKnown')} options={YES_NO} disabled={dis} />
          {v.timelineKnown === 'Yes' && <Input label="Timeline" value={v.timeline} onChange={f('timeline')} readOnly={dis} placeholder="e.g. Go-live by Mar 2027" />}
          <label className="fl chk lf-chk"><input type="checkbox" checked={!!v.budgetApproved} disabled={dis} onChange={(e) => set({ ...v, budgetApproved: e.target.checked })} /> Do they have an approved budget?</label>
        </div>
      </Section>

      <Section title="SPOC 2 details" hint={spocName ? `${spocName}${has(v.spocDesignation) ? ' · ' + v.spocDesignation : ''}` : 'Not added'} open={anyErr(['spocEmail', 'spocPhone'])}>
        <div className="grid3">
          <Input label="SPOC First Name" value={v.spocFirstName} onChange={f('spocFirstName')} readOnly={dis} />
          <Input label="SPOC Last Name" value={v.spocLastName} onChange={f('spocLastName')} readOnly={dis} />
          <Input label="SPOC Designation" value={v.spocDesignation} onChange={f('spocDesignation')} readOnly={dis} />
          <Input label="SPOC Email Id" type="email" value={v.spocEmail} error={err('spocEmail')} onChange={f('spocEmail')} readOnly={dis} placeholder="name@example.com" />
          <Input label="SPOC Contact Number" value={v.spocPhone} error={err('spocPhone')} onChange={f('spocPhone')} readOnly={dis} />
        </div>
      </Section>

      <Section title="Industry information" hint={[v.industry, v.subIndustry, v.currentVolume].filter(has).join(' · ') || '—'}>
        <div className="grid3">
          <Select label="Industry" none value={v.industry} onChange={(x) => set({ ...v, industry: x, subIndustry: '' })} options={INDUSTRIES} disabled={dis} />
          {subs.length > 0 && <Select label="Sub Industry" none value={v.subIndustry} onChange={f('subIndustry')} options={subs} disabled={dis} />}
          {v.industry === 'Other' && <Input label="Industry Remark" value={v.industryRemark} onChange={f('industryRemark')} readOnly={dis} />}
          <Input label="Current Yearly Volume/Transactions" value={v.currentVolume} onChange={f('currentVolume')} readOnly={dis} placeholder="e.g. 12 Cr / year" />
        </div>
      </Section>

      <Section title="Address information" hint={[v.city, v.state, v.country].filter(has).join(', ') || '—'}>
        <div className="grid3">
          <Input label="Street" value={v.street} onChange={f('street')} readOnly={dis} />
          <Input label="City" value={v.city} onChange={f('city')} readOnly={dis} />
          <Select label="State/Province" none value={v.state} ai={ai.state} onChange={f('state')} options={STATES} disabled={dis} />
          <Input label="Zip/Postal Code" value={v.zip} onChange={f('zip')} readOnly={dis} />
          <Select label="Country" none value={v.country} onChange={f('country')} options={COUNTRIES} disabled={dis} />
        </div>
      </Section>

      {existing && emails.length > 0 && (
        <Section title="Tagged emails" hint={`${emails.length} email${emails.length > 1 ? 's' : ''}`}>
          <TaggedEmails emails={emails} />
        </Section>
      )}
    </div>
  );
}
