/** Mirrors `frontend/src/data/defaults.js` stage metadata (source of truth). */

export type StageName =
  | 'Qualification'
  | 'Needs Analysis'
  | 'Impact Analysis'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost'
  | 'No Bid'
  | 'On Hold';

export type StageDefinition = {
  name: StageName;
  prob: number;
  forecast: string;
  open: boolean;
};

export const STAGES: StageDefinition[] = [
  { name: 'Qualification', prob: 10, forecast: 'Pipeline', open: true },
  { name: 'Needs Analysis', prob: 25, forecast: 'Pipeline', open: true },
  { name: 'Impact Analysis', prob: 40, forecast: 'Pipeline', open: true },
  { name: 'Proposal', prob: 60, forecast: 'Best Case', open: true },
  { name: 'Negotiation', prob: 80, forecast: 'Commit', open: true },
  { name: 'Closed Won', prob: 100, forecast: 'Closed', open: false },
  { name: 'Closed Lost', prob: 0, forecast: 'Omitted', open: false },
  { name: 'No Bid', prob: 0, forecast: 'Omitted', open: false },
  { name: 'On Hold', prob: 0, forecast: 'Omitted', open: false },
];

export const OPEN_STAGES = STAGES.filter((s) => s.open).map((s) => s.name) as string[];
export const EARLY_STAGES = ['Qualification', 'Needs Analysis', 'Impact Analysis', 'Proposal'];
export const CLOSEABLE_STAGES: string[] = [...OPEN_STAGES, 'On Hold', 'No Bid'];

export const HOLD_REASONS = ['Internal', 'External', 'Both(Internal & External)'];
export const LOST_REASONS = [
  'Change in Priorities',
  'Competition',
  'Customer went cold',
  'Price',
  'Product Fitment',
  'Project Cancelled',
  'Technically Not Qualified',
  'Others',
];
export const OVERRIDE_REASONS = [
  'Customer timeline/urgency',
  'Competitive pressure',
  'Budget / fiscal cycle',
  'Management directive',
  'Strategic deal',
  'Other',
];

export function stageMeta(name: string): StageDefinition {
  return STAGES.find((s) => s.name === name) ?? STAGES[0];
}

export function openStageIndex(stage: string): number {
  return OPEN_STAGES.indexOf(stage);
}

export function nextOpenStage(stage: string): string | null {
  const idx = openStageIndex(stage);
  if (idx < 0 || idx >= OPEN_STAGES.length - 1) return null;
  return OPEN_STAGES[idx + 1];
}

export function isOpenStage(stage: string): boolean {
  return OPEN_STAGES.includes(stage);
}

export function isCloseableStage(stage: string): boolean {
  return CLOSEABLE_STAGES.includes(stage);
}

export function productVertical(recordType: string): 'TSP' | 'EVOK' {
  return recordType === 'PPAS' ? 'EVOK' : 'TSP';
}