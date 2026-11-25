import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityProduct } from '../entities/opportunity-product.entity';
import { productVertical, stageMeta } from '../stages/stage-definitions';
import {
  amountFirstYear,
  category,
  fy27Quarters,
  tcv,
} from '../common/opportunity-calculations';
import { EDITABLE_FIELDS, EditableField } from './opportunity-fields';

/**
 * The one opportunity shape returned by every endpoint that returns an opportunity
 * (GET one, list, create, PATCH, stage moves, contributors).
 *
 * - Field names match the entity (camelCase). DECIMAL values are strings, e.g. "1500000.00".
 * - Values starting with `_` are calculated on read and never stored.
 */

/** Read-only fields set by workflows (stage moves, commercials, PO receipt). */
const SYSTEM_FIELDS = [
  'id', 'publicId', 'stage',
  'closedValue', 'earlyClose', 'overrideReason', 'overrideJustification',
  'licence', 'milestones', 'amcTerm', 'poNumber', 'poFileDocumentId',
  'holdFallbacks', 'currentCommercialLines',
  'createdByUserId', 'lastModifiedByUserId',
] as const satisfies readonly (keyof Opportunity)[];

type PlainField = EditableField | (typeof SYSTEM_FIELDS)[number];

export type OpportunityProductResponse = {
  id: string;
  productSlot: number;
  productTsp: string;
  modules: string[];
};

export type OpportunityResponse = { [K in PlainField]: Opportunity[K] } & {
  /** Stage the opportunity was in when put on hold (frontend `holdFrom`). */
  holdFrom: string | null;
  holdAt: string | null;
  reopenedAt: string | null;
  products: OpportunityProductResponse[];
  _prob: number;
  _forecast: string;
  _vertical: string;
  /** ARR + one-time fees (first-year amount / deal value). */
  _amount: number;
  /** First year + year2..year5. */
  _tcv: number;
  /** updatedArr when set, else arr. */
  _totalArr: number;
  /** CAT 1..CAT 5 by first-year amount. */
  _category: string;
  _fy27Q1: number;
  _fy27Q2: number;
  _fy27Q3: number;
  _fy27Q4: number;
  _fy27: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

const PLAIN_FIELDS: readonly PlainField[] = [...SYSTEM_FIELDS, ...EDITABLE_FIELDS];

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

function mapProduct(p: OpportunityProduct): OpportunityProductResponse {
  return {
    id: p.id,
    productSlot: p.productSlot,
    productTsp: p.productTsp,
    modules: p.modules ?? [],
  };
}

export function toOpportunityResponse(o: Opportunity): OpportunityResponse {
  const plain: Record<string, unknown> = {};
  for (const key of PLAIN_FIELDS) {
    plain[key] = o[key] ?? null;
  }

  const meta = stageMeta(o.stage);
  const amount = amountFirstYear(o.arr, o.oneTime);
  const fy27 = fy27Quarters(o);

  return {
    ...(plain as { [K in PlainField]: Opportunity[K] }),
    holdFrom: o.holdFromStage ?? null,
    holdAt: iso(o.holdAt),
    reopenedAt: iso(o.reopenedAt),
    products: [...(o.products ?? [])]
      .sort((a, b) => a.productSlot - b.productSlot)
      .map(mapProduct),
    _prob: meta.prob,
    _forecast: meta.forecast,
    _vertical: productVertical(o.recordType),
    _amount: amount,
    _tcv: tcv(o.arr, o.oneTime, o.year2, o.year3, o.year4, o.year5),
    _totalArr: Number(o.updatedArr) || Number(o.arr) || 0,
    _category: category(amount),
    _fy27Q1: fy27.q1,
    _fy27Q2: fy27.q2,
    _fy27Q3: fy27.q3,
    _fy27Q4: fy27.q4,
    _fy27: fy27.total,
    createdAt: iso(o.createdAt) as string,
    updatedAt: iso(o.updatedAt) as string,
    deletedAt: iso(o.deletedAt),
  };
}
