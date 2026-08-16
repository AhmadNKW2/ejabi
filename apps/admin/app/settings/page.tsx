'use client';

import { CatalogView } from '@ejabi/shared';
import { useState } from 'react';
import { RequireAdmin } from '@/components/RequireAdmin';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useSiteSettings } from '@/lib/settings';
import { ApiError } from '@/lib/api';

const OPTIONS: { id: CatalogView; title: string; points: string[] }[] = [
  {
    id: 'view1',
    title: 'العرض 1',
    points: [
      'لوحة الإدارة تعرض صور الجامعات مع إمكانية الرفع.',
      'موقع الطلاب يعرض البطاقات بالصور والأعلام.',
    ],
  },
  {
    id: 'view2',
    title: 'العرض 2',
    points: [
      'لوحة الإدارة بلا صور للكتالوج، مع الإبقاء على أعلام الدول فقط.',
      'موقع الطلاب يعرض كل الخطوات كحبوب نصية بلا صور ولا أعلام.',
    ],
  },
];

export default function SettingsPage() {
  const { catalogView, setCatalogView } = useSiteSettings();
  const [saving, setSaving] = useState<CatalogView | null>(null);
  const [error, setError] = useState('');

  async function choose(view: CatalogView) {
    if (view === catalogView) return;
    setError('');
    setSaving(view);
    try {
      await setCatalogView(view);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'تعذر حفظ الإعداد');
    } finally {
      setSaving(null);
    }
  }

  return (
    <RequireAdmin>
      <LoadingOverlay show={saving !== null} />
      <h1 className="mb-2 font-cairo text-2xl font-black text-amber">الإعدادات</h1>
      <p className="mb-6 max-w-[54ch] text-sm leading-7 text-slate">
        اختر شكل العرض في لوحة الإدارة وموقع الطلاب. التغيير يظهر فورًا للزوار بعد تحديث الصفحة.
      </p>
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => {
          const active = catalogView === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option.id)}
              className={`rounded-2xl border-0 p-5 text-right transition-colors ${
                active ? 'bg-amber text-ink' : 'bg-ink-2 text-paper hover:bg-ink-3'
              }`}
            >
              <div className={`font-cairo text-xl font-black ${active ? 'text-ink' : 'text-amber'}`}>
                {option.title}
              </div>
              <ul className={`mt-3 space-y-2 text-sm leading-7 ${active ? 'text-ink/80' : 'text-slate'}`}>
                {option.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className={`mt-4 text-sm font-bold ${active ? 'text-ink' : 'text-slate'}`}>
                {active ? 'محدد الآن' : 'اضغط للاختيار'}
              </div>
            </button>
          );
        })}
      </div>
    </RequireAdmin>
  );
}
