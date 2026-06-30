import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AdminUserPublic, AuthStatus } from '@msk-panel/shared';
import { api } from '../lib/api';

interface AuthContextValue {
  loading: boolean;
  setupRequired: boolean;
  authenticated: boolean;
  user: AdminUserPublic | null;
  refresh: () => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus>({
    setupRequired: false,
    authenticated: false,
    user: null,
  });

  const refresh = useCallback(async () => {
    const next = await api.getAuthStatus();
    setStatus(next);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setup = async (username: string, password: string) => {
    const next = await api.setupAdmin({ username, password });
    setStatus(next);
  };

  const login = async (username: string, password: string) => {
    const next = await api.login({ username, password });
    setStatus(next);
  };

  const logout = async () => {
    await api.logout();
    setStatus({ setupRequired: false, authenticated: false, user: null });
    await refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        setupRequired: status.setupRequired,
        authenticated: status.authenticated,
        user: status.user,
        refresh,
        setup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
