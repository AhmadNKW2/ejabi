'use client';

import { useMemo, useState } from 'react';
import { SelectOption } from './Select';
import { SearchField } from './SearchField';

export type MajorStageOffering = { majorId: string; stageIds: string[] };

export function MajorStageOfferings({
  value,
  onChange,
  majors,
  stages,
}: {
  value: MajorStageOffering[];
  onChange: (v: MajorStageOffering[]) => void;
  majors: SelectOption[];
  stages: SelectOption[];
}) {
  const [q, setQ] = useState('');

  function toggleMajor(majorId: string) {
    if (value.some((o) => o.majorId === majorId)) {
      onChange(value.filter((o) => o.majorId !== majorId));
      return;
    }
    onChange([...value, { majorId, stageIds: [] }]);
  }

  function toggleStage(majorId: string, stageId: string) {
    onChange(
      value.map((o) => {
        if (o.majorId !== majorId) return o;
        const has = o.stageIds.includes(stageId);
        return {
          ...o,
          stageIds: has ? o.stageIds.filter((id) => id !== stageId) : [...o.stageIds, stageId],
        };
      }),
    );
  }

  function setAllStages(majorId: string, on: boolean) {
    onChange(
      value.map((o) => (o.majorId === majorId ? { ...o, stageIds: on ? stages.map((s) => s.value) : [] } : o)),
    );
  }

  const selectedIds = useMemo(() => new Set(value.map((o) => o.majorId)), [value]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return majors;
    return majors.filter((m) => m.label.toLowerCase().includes(s) || (m.sub && m.sub.toLowerCase().includes(s)));
  }, [majors, q]);

  const selected = filtered.filter((m) => selectedIds.has(m.value));
  const rest = filtered.filter((m) => !selectedIds.has(m.value));
  const searching = Boolean(q.trim());
  const visible = searching ? filtered : [...selected, ...rest];

  return (
    <div className="overflow-hidden rounded-2xl bg-ink-3">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-3">
        <SearchField value={q} onChange={setQ} placeholder="ابحث عن تخصص..." />
        <span className="text-xs text-slate">
          {value.length ? `${value.length} تخصص مختار` : 'لم يُختر أي تخصص بعد'}
        </span>
      </div>
      <div className="max-h-[380px] space-y-2 overflow-auto p-2">
        {majors.length === 0 ? <p className="p-3 text-sm text-slate">لا توجد تخصصات في الكتالوج.</p> : null}
        {!searching && selected.length ? (
          <p className="px-2 pt-1 text-[11px] font-bold tracking-wide text-amber">المختارة</p>
        ) : null}
        {visible.map((major, index) => {
          const offering = value.find((o) => o.majorId === major.value);
          const checked = Boolean(offering);
          const showDivider = !searching && selected.length > 0 && index === selected.length;
          return (
            <div key={major.value}>
              {showDivider ? (
                <p className="mb-2 px-2 pt-2 text-[11px] font-bold tracking-wide text-slate">باقي التخصصات</p>
              ) : null}
              <div className={`rounded-xl p-2 ${checked ? 'bg-ink-2' : 'bg-ink-2/40'}`}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber"
                    checked={checked}
                    onChange={() => toggleMajor(major.value)}
                  />
                  {major.icon}
                  <span className="min-w-0 flex-1 text-sm font-bold">{major.label}</span>
                  {checked ? (
                    <span className="text-[11px] text-slate">
                      {offering?.stageIds.length || 0} / {stages.length} مراحل
                    </span>
                  ) : null}
                </label>
                {checked ? (
                  <div className="mr-6 pb-1">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-[11px] text-amber hover:underline"
                        onClick={() => setAllStages(major.value, true)}
                      >
                        كل المراحل
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-slate hover:underline"
                        onClick={() => setAllStages(major.value, false)}
                      >
                        مسح المراحل
                      </button>
                    </div>
                    {stages.length === 0 ? (
                      <p className="text-xs text-slate">أضف مراحل من صفحة المراحل أولًا.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {stages.map((stage) => {
                          const on = offering?.stageIds.includes(stage.value);
                          return (
                            <button
                              key={stage.value}
                              type="button"
                              onClick={() => toggleStage(major.value, stage.value)}
                              className={`rounded-full border-0 px-2.5 py-1 text-xs transition-colors ${
                                on
                                  ? 'bg-amber/15 text-amber'
                                  : 'bg-ink-3 text-slate hover:bg-white/10'
                              }`}
                            >
                              {stage.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 ? <p className="p-3 text-sm text-slate">لا نتائج لهذا البحث.</p> : null}
      </div>
    </div>
  );
}
