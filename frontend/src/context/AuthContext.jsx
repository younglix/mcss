import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearTokens, getAccessToken, setTokens } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'anonymous'

  const hydrate = useCallback(async () => {
    if (!getAccessToken()) {
      setStatus('anonymous');
      return;
    }
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setPermissions(data.permissions);
      setRoles(data.roles);
      setStatus('authenticated');
    } catch {
      clearTokens();
      setUser(null);
      setPermissions([]);
      setRoles([]);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const applySession = (data) => {
    setTokens({ access: data.access, refresh: data.refresh });
    setUser(data.user);
    setPermissions(data.permissions);
    setStatus('authenticated');
  };

  const login = useCallback(async (loginId, password) => {
    const data = await api.post('/auth/login', { login: loginId, password }, { auth: false });
    if (data.requires_2fa) {
      return { requiresOtp: true, challengeId: data.challenge_id };
    }
    applySession(data);
    return { requiresOtp: false, user: data.user, permissions: data.permissions };
  }, []);

  const verifyOtp = useCallback(async (challengeId, code) => {
    const data = await api.post('/auth/verify-otp', { challenge_id: challengeId, code }, { auth: false });
    applySession(data);
    return { user: data.user, permissions: data.permissions };
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('mcss-refresh-token');
    try {
      await api.post('/auth/logout', { refresh });
    } catch {
      // best-effort — clear local session regardless of network/API outcome
    }
    clearTokens();
    setUser(null);
    setPermissions([]);
    setRoles([]);
    setStatus('anonymous');
  }, []);

  const hasPermission = useCallback((code) => permissions.includes('*') || permissions.includes(code), [permissions]);

  const value = {
    user,
    permissions,
    roles,
    status,
    isAuthenticated: status === 'authenticated',
    isSuperAdmin: permissions.includes('*'),
    login,
    verifyOtp,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
