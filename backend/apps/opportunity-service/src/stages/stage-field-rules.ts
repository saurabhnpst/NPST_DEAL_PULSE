import { StageView } from './stage-view';

/** Field rules ported from `GROUPS` in `frontend/src/pages/Opportunity.jsx`. */
export type FieldRule = {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'date' | 'check' | 'select';
  req?: boolean;
  mustBe?: string;
  when?: (v: StageView) => boolean;
  reqIf?: (v: StageView) => boolean;
};

export type FieldGroup = {
  stage?: number;
  always?: boolean;
  fields: FieldRule[];
};

export const joinMulti = (modules?: string[] | null): string =>
  (modules ?? []).filter((m) => m && m !== '—').join('; ');

const T = (key: string, label: string, o: Partial<FieldRule> = {}): FieldRule => ({
  key,
  label,
  kind: 'text',
  ...o,
});
const N = (key: string, label: string, o: Partial<FieldRule> = {}): FieldRule => ({
  key,
  label,
  kind: 'number',
  ...o,
});
const D = (key: string, label: string, o: Partial<FieldRule> = {}): FieldRule => ({
  key,
  label,
  kind: 'date',
  ...o,
});
const S = (key: string, label: string, o: Partial<FieldRule> = {}): FieldRule => ({
  key,
  label,
  kind: 'select',
  ...o,
});
const C = (key: string, label: string, o: Partial<FieldRule> = {}): FieldRule => ({
  key,
  label,
  kind: 'check',
  ...o,
});

export const STAGE_FIELD_GROUPS: FieldGroup[] = [
  {
    always: true,
    fields: [
      T('name', 'Opportunity Name', { req: true }),
      T('owner', 'Opportunity Owner', { req: true }),
      T('account', 'Account Name', { req: true }),
      D('closeDate', 'Close Date', { req: true }),
      S('productTsp', 'Product', { req: true }),
    ],
  },
  {
    stage: 0,
    fields: [
      N('arr', 'Annual Recurring Revenue (ARR)', { req: true }),
      N('oneTime', 'One Time Fees', { req: true }),
      S('currency', 'Currency', { req: true }),
      T('compellingEvent', 'Compelling Event', { req: true }),
    ],
  },
  {
    stage: 1,
    fields: [
      S('reqReceived', 'Confirm Requirements/Doc Received?', { req: true, mustBe: 'Yes' }),
      T('presalesName', 'Pre sales Person Name', {
        when: (v) => v.presalesInvolved === 'Yes',
        reqIf: (v) => v.presalesInvolved === 'Yes',
      }),
    ],
  },
  {
    stage: 2,
    fields: [
      C('demoDone', 'Demo/ POC/Deep Engagement Done?', { req: true }),
      S('sow', 'SOW done?', { req: true, mustBe: 'Yes' }),
    ],
  },
  {
    stage: 3,
    fields: [D('proposalDate', 'Proposal Submission date?', { req: true })],
  },
  {
    stage: 4,
    fields: [
      D('signDate', 'Date of signing the contract?', {
        when: (v) => v.contractSigned === 'Yes',
        reqIf: (v) => v.contractSigned === 'Yes',
      }),
    ],
  },
];

export function isFilled(rule: FieldRule, v: StageView): boolean {
  const val = v[rule.key];
  if (rule.mustBe) return val === rule.mustBe;
  if (rule.kind === 'check') return !!val;
  if (rule.kind === 'number') return Number(val) > 0;
  return (
    val !== undefined
    && val !== null
    && String(val).trim() !== ''
    && val !== '—'
  );
}

/** Same as `missingFor` in `Opportunity.jsx`. */
export function missingRequiredFields(stageIdx: number, v: StageView): string[] {
  return STAGE_FIELD_GROUPS.filter((g) => g.always || g.stage === stageIdx)
    .flatMap((g) =>
      g.fields
        .filter(
          (f) =>
            (f.req || (f.reqIf && f.reqIf(v)))
            && (!f.when || f.when(v))
            && !isFilled(f, v),
        )
        .map((f) => f.label),
    );
}