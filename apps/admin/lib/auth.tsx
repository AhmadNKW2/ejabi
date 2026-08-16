'use client';

import { UserPublic } from '@ejabi/shared';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from './api';

type AuthContextValue = {
  user: UserPublic | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserPublic>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<UserPublic>('/auth/me')
      .then((me) => {
        if (me.role !== 'ADMIN') {
          setUser(null);
        } else {
          setUser(me);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const me = await api<UserPublic>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (me.role !== 'ADMIN') {
          await api('/auth/logout', { method: 'POST' });
          throw new ApiError(403, 'هذا الحساب ليس حساب مدير');
        }
        setUser(me);
        return me;
      },
      logout: async () => {
        await api('/auth/logout', { method: 'POST' });
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
