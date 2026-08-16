'use client';

import { CatalogView, SiteSettings, parseCatalogView } from '@ejabi/shared';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type SiteSettingsContextValue = {
  catalogView: CatalogView;
  hideCatalogImages: boolean;
  loading: boolean;
  setCatalogView: (view: CatalogView) => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [catalogView, setView] = useState<CatalogView>('view1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api<SiteSettings>('/admin/settings')
      .then((row) => setView(parseCatalogView(row.catalogView)))
      .catch(() => setView('view1'))
      .finally(() => setLoading(false));
  }, [user]);

  const value = useMemo<SiteSettingsContextValue>(
    () => ({
      catalogView,
      hideCatalogImages: catalogView === 'view2',
      loading,
      setCatalogView: async (view) => {
        const row = await api<SiteSettings>('/admin/settings', {
          method: 'PATCH',
          body: JSON.stringify({ catalogView: view }),
        });
        setView(parseCatalogView(row.catalogView));
      },
    }),
    [catalogView, loading],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}

export function useOptionalSiteSettings() {
  return useContext(SiteSettingsContext);
}
