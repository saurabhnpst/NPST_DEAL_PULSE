import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './Auth.jsx';
import { leadService } from '../services/leadService.js';
import { listAllOpportunities } from '../services/opportunityService.js';
import { rfpService } from '../services/rfpService.js';
import { approvalService } from '../services/approvalService.js';
import { loadCompliance, loadDecisions, loadEvaluations, loadSynopses } from '../services/workflowService.js';
import { apiLeadToUi } from '../mappers/leadMapper.js';
import { normalizeOpportunityList } from '../mappers/opportunityMapper.js';
import { useStore } from './Store.jsx';

const Ctx = createContext(null);

export function BusinessDataProvider({ children }) {
  const { vertical, userName } = useAuth();
  const { dispatch } = useStore();
  const [leadsError, setLeadsError] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [oppsError, setOppsError] = useState(null);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [rfpsError, setRfpsError] = useState(null);
  const [rfpsLoading, setRfpsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState(null);
  const [approvalsLoading, setApprovalsLoading] = useState(false);


  const reloadLeads = useCallback(async () => {
    if (!vertical) return;
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const rows = await leadService.list();
      const list = Array.isArray(rows) ? rows.map((r) => apiLeadToUi(r, userName)) : [];
      dispatch({ type: 'SET_LEADS', leads: list });
    } catch (e) {
      dispatch({ type: 'SET_LEADS', leads: [] });
      setLeadsError(e);
    } finally {
      setLeadsLoading(false);
    }
  }, [vertical, dispatch, userName]);

  const reloadOpportunities = useCallback(async () => {
    if (!vertical) return;
    setOppsLoading(true);
    setOppsError(null);
    try {
      const list = normalizeOpportunityList(await listAllOpportunities(), userName);
      dispatch({ type: 'SET_OPPORTUNITIES', opportunities: list });
    } catch (e) {
      dispatch({ type: 'SET_OPPORTUNITIES', opportunities: [] });
      setOppsError(e);
    } finally {
      setOppsLoading(false);
    }
  }, [vertical, dispatch, userName]);

  const reloadRfps = useCallback(async () => {
    if (!vertical) return;
    setRfpsLoading(true);
    setRfpsError(null);
    try {
      const body = await rfpService.list();
      const list = Array.isArray(body) ? body : body?.items ?? [];
      dispatch({ type: 'SET_RFPS', rfps: list });
    } catch (e) {
      dispatch({ type: 'SET_RFPS', rfps: [] });
      setRfpsError(e);
    } finally {
      setRfpsLoading(false);
    }
  }, [vertical, dispatch]);

  const reloadApprovals = useCallback(async () => {
    if (!vertical) return;
    setApprovalsLoading(true);
    setApprovalsError(null);
    try {
      const list = await approvalService.list();
      dispatch({ type: 'SET_API_APPROVALS', apiApprovals: Array.isArray(list) ? list : [] });
    } catch (e) {
      dispatch({ type: 'SET_API_APPROVALS', apiApprovals: [] });
      setApprovalsError(e);
    } finally {
      setApprovalsLoading(false);
    }
  }, [vertical, dispatch]);

  /** P&L decisions, Pre-PO evaluations, RFP synopses and compliance matrices (each list loads on its own). */
  const reloadWorkflow = useCallback(async () => {
    if (!vertical) return;
    const safe = (p, empty) => p.catch(() => empty);
    const [decisions, evaluations, synopses, compliance] = await Promise.all([
      safe(loadDecisions(userName), []),
      safe(loadEvaluations(), []),
      safe(loadSynopses(userName), []),
      safe(loadCompliance(userName), { rows: [], meta: {} }),
    ]);
    dispatch({ type: 'SET_WORKFLOW', data: { decisions, evaluations, synopses, compliance: compliance.rows, complianceMeta: compliance.meta } });
  }, [vertical, dispatch, userName]);

  const reloadAll = useCallback(async () => {
    await Promise.all([reloadLeads(), reloadOpportunities(), reloadRfps(), reloadApprovals(), reloadWorkflow()]);
  }, [reloadLeads, reloadOpportunities, reloadRfps, reloadApprovals, reloadWorkflow]);

  useEffect(() => {
    if (!vertical) return;
    reloadAll();
  }, [vertical, reloadAll]);

  const value = useMemo(
    () => ({
      leadsLoading,
      leadsError,
      oppsLoading,
      oppsError,
      rfpsLoading,
      rfpsError,
      approvalsLoading,
      approvalsError,
      reloadLeads,
      reloadOpportunities,
      reloadRfps,
      reloadApprovals,
      reloadWorkflow,
      reloadAll,
    }),
    [
      leadsLoading,
      leadsError,
      oppsLoading,
      oppsError,
      rfpsLoading,
      rfpsError,
      approvalsLoading,
      approvalsError,
      reloadLeads,
      reloadOpportunities,
      reloadRfps,
      reloadApprovals,
      reloadWorkflow,
      reloadAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useBusinessData = () => useContext(Ctx);