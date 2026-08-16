'use client';

import { useEffect, useState } from 'react';
import { APPLICATION_STATUS_LABELS, ApplicationDto, ApplicationStatus } from '@ejabi/shared';
import { api } from '@/lib/api';
import { Pills } from '@/components/Pills';
import { Modal } from '@/components/Modal';
import { RequireAdmin } from '@/components/RequireAdmin';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ApplicationChoiceTree } from '@/components/ApplicationChoiceTree';

export default function ApplicationsListPage() {
  const [rows, setRows] = useState<ApplicationDto[]>([]);
  const [status, setStatus] = useState('');
  const [view, setView] = useState<ApplicationDto | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = status ? `?status=${status}` : '';
    setBusy(true);
    api<ApplicationDto[]>(`/admin/applications${q}`)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setBusy(false));
  }, [status]);

  async function setRowStatus(id: string, next: ApplicationStatus) {
    await api(`/admin/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  async function openOrder(id: string) {
    setBusy(true);
    try {
      setView(await api<ApplicationDto>(`/admin/applications/${id}`));
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAdmin>
      <LoadingOverlay show={busy && !view} />
      <h1 className="mb-4 font-cairo text-2xl font-black text-amber">الطلبات</h1>
      <div className="mb-5">
        <Pills
          value={status}
          onChange={setStatus}
          items={[
            { id: '', label: 'الكل' },
            ...Object.entries(APPLICATION_STATUS_LABELS).map(([id, label]) => ({ id, label })),
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl bg-ink-2 px-4 py-10 text-center text-slate">
          لا توجد طلبات بهذه الحالة.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl bg-ink-2 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold">{r.user?.fullName}</div>
                  <div className="text-xs text-slate">
                    {r.user?.email} · {new Date(r.createdAt).toLocaleDateString('ar')}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-amber px-3 py-1.5 text-sm font-bold text-ink"
                  onClick={() => openOrder(r.id)}
                >
                  عرض الطلب
                </button>
              </div>
              <Pills
                value={r.status}
                onChange={(v) => setRowStatus(r.id, v as ApplicationStatus)}
                items={Object.entries(APPLICATION_STATUS_LABELS).map(([id, label]) => ({ id, label }))}
              />
            </div>
          ))}
        </div>
      )}

      <Modal open={!!view} wide title="تفاصيل الطلب" onClose={() => setView(null)}>
        {view ? (
          <div>
            <div className="mb-5 rounded-xl bg-ink-3 p-4">
              <div className="font-cairo text-lg font-bold">{view.user?.fullName}</div>
              <div className="mt-1 text-sm text-slate">
                {view.user?.email} · {view.user?.phone || 'بدون هاتف'} ·{' '}
                {new Date(view.createdAt).toLocaleDateString('ar')}
              </div>
            </div>
            <ApplicationChoiceTree choices={view.choices} />
          </div>
        ) : null}
      </Modal>
    </RequireAdmin>
  );
}
