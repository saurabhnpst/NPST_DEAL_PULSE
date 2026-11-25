import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { VERTICALS } from '../data/verticals.js';
import { fetchCurrentUser, fetchUsers, login as commandLogin, logout as commandLogout } from '../services/authService.js';
import { setApiUser } from '../api/apiClient.js';
import { setPeople } from '../data/peopleOptions.js';

const Ctx = createContext(null);

// auth-service role → frontend vertical (which screens and actions the user gets).
const ROLE_TO_VERTICAL = { sales: 'sales', pl_head: 'pl', presales: 'solution' };

function verticalFor(me, picked) {
  const roles = (me?.roles || []).map((r) => r.toLowerCase());
  for (const r of roles) if (ROLE_TO_VERTICAL[r]) return ROLE_TO_VERTICAL[r];
  // admin (or a user without a DealPulse role) uses the vertical chosen on the sign-in screen
  return VERTICALS[picked] ? picked : 'sales';
}

const initialsFrom = (name) =>
  name ? name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() : '—';

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [verticalKey, setVerticalKey] = useState(null);
  const [users, setUsers] = useState([]);
  const [booting, setBooting] = useState(true);

  const applySession = useCallback(async (me, picked) => {
    setApiUser(me);
    // load the user directory first, so owner names are known before business data loads
    try {
      const list = await fetchUsers();
      setPeople(list);
      setUsers(list);
    } catch {
      setUsers([]);
    }
    setProfile(me);
    setVerticalKey(verticalFor(me, picked || sessionStorage.getItem('dealpulse-vertical')));
    if (picked) sessionStorage.setItem('dealpulse-vertical', picked);
  }, []);

  // Restore an existing session on page load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (me && !cancelled) await applySession(me);
      } catch {
        /* auth-service unavailable — show login */
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applySession]);

  const login = async (picked, email, password) => {
    if (!email || !password) return 'Enter your work email and password.';
    try {
      await commandLogin(email.trim(), password);
      const me = await fetchCurrentUser();
      if (!me) return 'Signed in, but your profile is unavailable.';
      await applySession(me, picked);
      return null;
    } catch (err) {
      return err?.message ?? 'Sign-in failed.';
    }
  };

  const logout = async () => {
    await commandLogout();
    sessionStorage.removeItem('dealpulse-vertical');
    setApiUser(null);
    setProfile(null);
    setVerticalKey(null);
    setUsers([]);
  };

  const v = profile && verticalKey ? VERTICALS[verticalKey] : null;
  const user = profile
    ? { id: profile.id, name: profile.name, email: profile.email, title: v?.label, initials: initialsFrom(profile.name), approvalActorId: profile.approvalActorId }
    : null;
  /** Display name for a business user id (owner ids on leads / opportunities). */
  const userName = useCallback(
    (id) => users.find((u) => String(u.id) === String(id))?.name || (id ? `User ${id}` : '—'),
    [users],
  );
  /** User id for a display name (owner pickers show names); null when not a known user. */
  const userIdByName = useCallback((name) => users.find((u) => u.name === name)?.id || null, [users]);

  return (
    <Ctx.Provider value={{ vertical: v, user, profile, users, userName, userIdByName, can: v?.can || {}, readOnly: !!v?.readOnly, login, logout, booting }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
