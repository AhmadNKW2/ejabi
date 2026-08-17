'use client';

import { useEffect, useState } from 'react';
import { Inbox, Phone } from 'lucide-react';
import { APPLICATION_STATUS_LABELS, ApplicationDto, ApplicationStatus } from '@ejabi/shared';
import { api } from '@/lib/api';
import { Pills } from '@/components/Pills';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { RequireAdmin } from '@/components/RequireAdmin';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ApplicationChoiceTree } from '@/components/ApplicationChoiceTree';
import { StatusBadge, formatAppDate } from '@/components/ApplicationStatus';

const STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }));

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
    setView((current) => (current?.id === id ? { ...current, status: next } : current));
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

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cairo text-2xl font-black text-amber">الطلبات</h1>
          <p className="mt-1 text-sm text-slate">
            {rows.length === 0 ? 'لا توجد طلبات في هذا التصفية.' : `${rows.length} طلبات`}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl bg-ink-2 px-4 py-3">
        <Pills
          nowrap
          value={status}
          onChange={setStatus}
          items={[{ id: '', label: 'الكل' }, ...STATUS_OPTIONS.map((s) => ({ id: s.value, label: s.label }))]}
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-ink-2 px-6 py-16 text-center">
          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/10 text-amber">
            <Inbox size={32} strokeWidth={1.7} />
          </span>
          <h2 className="font-cairo text-lg font-black">لا توجد طلبات</h2>
          <p className="mt-2 max-w-[36ch] text-sm leading-7 text-slate">
            عندما يرسل طالب ثلاثة خيارات، سيظهر طلبه هنا للمتابعة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="rounded-2xl bg-ink-2 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-slate">{formatAppDate(r.createdAt)}</span>
                  </div>
                  <h2 className="font-cairo text-xl font-black text-paper">{r.user?.fullName || 'طالب'}</h2>
                  {r.user?.phone ? (
                    <a
                      href={`tel:${r.user.phone}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate no-underline hover:text-amber"
                      dir="ltr"
                    >
                      <Phone size={14} strokeWidth={1.9} />
                      {r.user.phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-slate">بدون هاتف</p>
                  )}
                </div>

                <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:min-w-[200px]">
                  <Select
                    searchable={false}
                    value={r.status}
                    options={STATUS_OPTIONS}
                    onChange={(v) => setRowStatus(r.id, v as ApplicationStatus)}
                  />
                  <button
                    type="button"
                    className="rounded-xl bg-amber px-4 py-2.5 font-cairo text-sm font-bold text-ink"
                    onClick={() => openOrder(r.id)}
                  >
                    عرض الطلب
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!view} wide title="تفاصيل الطلب" onClose={() => setView(null)}>
        {view ? (
          <div>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-ink-3 p-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={view.status} />
                  <span className="text-xs text-slate">{formatAppDate(view.createdAt)}</span>
                </div>
                <h3 className="font-cairo text-xl font-black">{view.user?.fullName || 'طالب'}</h3>
                {view.user?.phone ? (
                  <a
                    href={`tel:${view.user.phone}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate no-underline hover:text-amber"
                    dir="ltr"
                  >
                    <Phone size={14} strokeWidth={1.9} />
                    {view.user.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate">بدون هاتف</p>
                )}
              </div>
              <div className="w-full min-w-[180px] sm:w-56">
                <Select
                  searchable={false}
                  value={view.status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => setRowStatus(view.id, v as ApplicationStatus)}
                />
              </div>
            </div>
            <p className="mb-3 font-cairo text-sm font-extrabold text-amber">الخيارات حسب الأفضلية</p>
            <ApplicationChoiceTree choices={view.choices} />
          </div>
        ) : null}
      </Modal>
    </RequireAdmin>
  );
}
