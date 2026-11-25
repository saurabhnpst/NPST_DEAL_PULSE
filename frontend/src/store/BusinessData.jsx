import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './Auth.jsx';
import { leadService } from '../services/leadService.js';
import { opportunityService } from '../services/opportunityService.js';
import { rfpService } from '../services/rfpService.js';
import { approvalService } from '../services/approvalService.js';
import { apiLeadToUi } from '../mappers/leadMapper.js';
import { normalizeOpportunityList } from '../mappers/opportunityMapper.js';
import { useStore } from './Store.jsx';

const Ctx = createContext(null);

export function BusinessDataProvider({ children }) {
  const { vertical, user, profile } = useAuth();
  const { dispatch } = useStore();
  const [leadsError, setLeadsError] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [oppsError, setOppsError] = useState(null);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [rfpsError, setRfpsError] = useState(null);
  const [rfpsLoading, setRfpsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState(null);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const ownerLabel = user?.name || profile?.name || '';

  const reloadLeads = useCallback(async () => {
    if (!vertical) return;
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const rows = await leadService.list();
      const list = Array.isArray(rows) ? rows.map((r) => apiLeadToUi(r, ownerLabel)) : [];
      dispatch({ type: 'SET_LEADS', leads: list });
    } catch (e) {
      dispatch({ type: 'SET_LEADS', leads: [] });
      setLeadsError(e);
    } finally {
      setLeadsLoading(false);
    }
  }, [vertical, dispatch, ownerLabel]);

  const reloadOpportunities = useCallback(async () => {
    if (!vertical) return;
    setOppsLoading(true);
    setOppsError(null);
    try {
      const rows = await opportunityService.list();
      const list = normalizeOpportunityList(rows);
      dispatch({ type: 'SET_OPPORTUNITIES', opportunities: list });
    } catch (e) {
      dispatch({ type: 'SET_OPPORTUNITIES', opportunities: [] });
      setOppsError(e);
    } finally {
      setOppsLoading(false);
    }
  }, [vertical, dispatch]);

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

  const reloadAll = useCallback(async () => {
    await Promise.all([reloadLeads(), reloadOpportunities(), reloadRfps(), reloadApprovals()]);
  }, [reloadLeads, reloadOpportunities, reloadRfps, reloadApprovals]);

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
      reloadAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useBusinessData = () => useContext(Ctx);