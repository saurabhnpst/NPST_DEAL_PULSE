import { stageMeta } from '../stages/stage-definitions';

const num = (x: unknown) => Number(x) || 0;

/** First-year deal size: ARR + one-time (frontend `dealValue`). */
export function dealValue(arr: string | number, oneTime: string | number): number {
  return num(arr) + num(oneTime);
}

export function amountFirstYear(arr: string | number, oneTime: string | number): number {
  return dealValue(arr, oneTime);
}

export function tcv(
  arr: string | number,
  oneTime: string | number,
  year2?: string | number | null,
  year3?: string | number | null,
  year4?: string | number | null,
  year5?: string | number | null,
): number {
  return (
    amountFirstYear(arr, oneTime)
    + num(year2)
    + num(year3)
    + num(year4)
    + num(year5)
  );
}

export function category(amount: number): string {
  const cr = amount / 1e7;
  if (cr < 1) return 'CAT 1';
  if (cr < 10) return 'CAT 2';
  if (cr < 50) return 'CAT 3';
  if (cr < 100) return 'CAT 4';
  return 'CAT 5';
}

type Fy27Months = {
  fy27Q1?: unknown; fy27Jul?: unknown; fy27Aug?: unknown; fy27Sep?: unknown;
  fy27Oct?: unknown; fy27Nov?: unknown; fy27Dec?: unknown;
  fy27Jan?: unknown; fy27Feb?: unknown; fy27Mar?: unknown;
};

/** FY27 phasing (frontend `fy27Q`): Q1 is entered directly, Q2–Q4 are month sums. */
export function fy27Quarters(v: Fy27Months) {
  const q1 = num(v.fy27Q1);
  const q2 = num(v.fy27Jul) + num(v.fy27Aug) + num(v.fy27Sep);
  const q3 = num(v.fy27Oct) + num(v.fy27Nov) + num(v.fy27Dec);
  const q4 = num(v.fy27Jan) + num(v.fy27Feb) + num(v.fy27Mar);
  return { q1, q2, q3, q4, total: q1 + q2 + q3 + q4 };
}

export function weightedAmount(stage: string, arr: string, oneTime: string): number {
  return dealValue(arr, oneTime) * (stageMeta(stage).prob / 100);
}

export function commercialLineTotal(q: number, unitPrices: number[], versionIndex: number): number {
  const p = unitPrices[versionIndex] ?? unitPrices[unitPrices.length - 1] ?? 0;
  return (Number(q) || 1) * num(p);
}

export function commercialVersionTotal(
  lines: { q: number; p: number[] }[],
  versionIndex: number,
): number {
  return lines.reduce((sum, l) => sum + commercialLineTotal(l.q, l.p, versionIndex), 0);
}