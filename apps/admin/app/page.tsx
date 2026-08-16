'use client';

import { useEffect, useState } from 'react';
import { AdminStats } from '@ejabi/shared';
import { api } from '@/lib/api';
import { RequireAdmin } from '@/components/RequireAdmin';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<AdminStats>('/admin/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        ['الطلاب', stats.students],
        ['الطلبات', stats.applications],
        ['قيد المراجعة', stats.pendingApplications],
        ['الدول', stats.countries],
        ['الحقول', stats.fields],
        ['التخصصات', stats.majors],
        ['المراحل', stats.stages],
        ['الجامعات', stats.universities],
      ]
    : [];

  return (
    <RequireAdmin>
      <LoadingOverlay show={loading} />
      <h1 className="mb-6 font-cairo text-2xl font-black text-amber">لوحة المعلومات</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-xl bg-ink-2 p-5">
            <div className="text-sm text-slate">{label}</div>
            <div className="mt-2 font-cairo text-3xl font-black text-paper">{value}</div>
          </div>
        ))}
      </div>
    </RequireAdmin>
  );
}
