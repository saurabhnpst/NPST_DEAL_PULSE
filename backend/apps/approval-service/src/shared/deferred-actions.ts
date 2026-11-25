import { notImplementedError } from './errors';

export interface DeferredActions {
  requestChanges(approvalId: string): Promise<never>;
  salesRecommendation(decisionId: string): Promise<never>;
}

export class NoopDeferredActions implements DeferredActions {
  requestChanges(_approvalId: string): Promise<never> {
    throw notImplementedError('Request changes is not implemented');
  }

  salesRecommendation(_decisionId: string): Promise<never> {
    throw notImplementedError('Sales recommendation is not implemented');
  }
}