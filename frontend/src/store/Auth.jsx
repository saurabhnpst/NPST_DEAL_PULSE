import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { VERTICALS } from '../data/verticals.js';
import { fetchCurrentUser, login as commandLogin, logout as commandLogout } from '../services/authService.js';

const VERTICAL_KEY = 'dealpulse-vertical';
const Ctx = createContext(null);

function pickVerticalFromRoles(me) {
  if (!me?.roles?.length) return null;
  const roleSet = new Set(me.roles.map((r) => r.toLowerCase()));
  if (roleSet.has('admin') || roleSet.has('manager')) return 'sales';
  if (roleSet.has('employee')) return 'sales';
  return null;
}

export function AuthProvider({ children }) {
  const [vertical, setVertical] = useState(() => {
    try {
      const v = sessionStorage.getItem(VERTICAL_KEY);
      return v && VERTICALS[v] ? v : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);

  const applySession = useCallback((me, verticalKey) => {
    setProfile(me);
    if (verticalKey) {
      try {
        sessionStorage.setItem(VERTICAL_KEY, verticalKey);
      } catch {
        /* ignore */
      }
      setVertical(verticalKey);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (cancelled) return;
        if (me) {
          const stored = (() => {
            try {
              return sessionStorage.getItem(VERTICAL_KEY);
            } catch {
              return null;
            }
          })();
          const key = stored && VERTICALS[stored] ? stored : pickVerticalFromRoles(me) ?? 'sales';
          applySession(me, key);
        }
      } catch {
        /* Command Module unavailable — show login */
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = async (verticalKey, email, password) => {
    const v = VERTICALS[verticalKey];
    if (!v) return 'Choose your vertical.';
    if (!email || !password) return 'Enter your work email and password.';
    try {
      await commandLogin(email.trim(), password);
      const me = await fetchCurrentUser();
      if (!me) return 'Signed in, but profile is unavailable. Check Command Module setup.';
      applySession(me, verticalKey);
      return null;
    } catch (err) {
      return err?.message ?? 'Sign-in failed.';
    }
  };

  const logout = async () => {
    await commandLogout();
    try {
      sessionStorage.removeItem(VERTICAL_KEY);
    } catch {
      /* ignore */
    }
    setProfile(null);
    setVertical(null);
  };

  const switchTo = (k) => {
    try {
      sessionStorage.setItem(VERTICAL_KEY, k);
    } catch {
      /* ignore */
    }
    setVertical(k);
  };

  const v = vertical ? VERTICALS[vertical] : null;
  const user = profile
    ? { name: profile.name, email: profile.email, title: profile.roles?.[0] ?? v?.user?.title }
  : v?.user;

  return (
    <Ctx.Provider
      value={{
        vertical: v,
        user,
        profile,
        can: v?.can || {},
        readOnly: !!v?.readOnly,
        login,
        logout,
        switchTo,
        booting,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);