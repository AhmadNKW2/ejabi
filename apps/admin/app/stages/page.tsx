'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CatalogStage } from '@ejabi/shared';
import { GraduationCap, GripVertical, Minus, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Toggle } from '@/components/Toggle';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { RequireAdmin } from '@/components/RequireAdmin';
import { IconButton } from '@/components/IconButton';

function yearsLabel(n: number) {
  if (n === 1) return 'سنة دراسية';
  if (n === 2) return 'سنتان دراسيتان';
  return 'سنوات دراسية';
}

function StageCard({
  stage,
  index,
  onEdit,
  onDelete,
  onToggle,
}: {
  stage: CatalogStage;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative rounded-2xl bg-ink-2 p-4 sm:p-5 ${isDragging ? 'z-20 shadow-2xl ring-1 ring-amber/30' : ''} ${
        stage.isActive ? '' : 'opacity-55'
      }`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="cursor-grab touch-none rounded-lg p-1 text-slate hover:text-amber"
            aria-label="سحب للترتيب"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={18} strokeWidth={1.85} />
          </button>
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-cairo text-lg font-black ${
              stage.isActive ? 'bg-amber/15 text-amber' : 'bg-ink-3 text-slate'
            }`}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="truncate font-cairo text-xl font-black text-paper">{stage.labelAr}</h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden min-w-[5.5rem] text-center sm:block">
            <div className="font-cairo text-3xl font-black leading-none text-amber">{stage.years}</div>
            <div className="mt-1 text-[11px] text-slate">{yearsLabel(stage.years)}</div>
          </div>
          <div className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-bold text-amber sm:hidden">
            {stage.years} {stage.years === 1 ? 'سنة' : 'سنوات'}
          </div>
          <div className="h-10 w-px bg-line max-[520px]:hidden" />
          <Toggle checked={!!stage.isActive} onChange={onToggle} />
          <div className="flex items-center gap-1.5">
            <IconButton icon="edit" label="تعديل" onClick={onEdit} />
            <IconButton icon="delete" label="حذف" tone="danger" onClick={onDelete} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function StagesPage() {
  const [rows, setRows] = useState<CatalogStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogStage | null>(null);
  const [labelAr, setLabelAr] = useState('');
  const [years, setYears] = useState(4);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<CatalogStage | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    setRows(await api<CatalogStage[]>('/admin/stages'));
  }

  useEffect(() => {
    load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  function startAdd() {
    setEditing(null);
    setLabelAr('');
    setYears(4);
    setError('');
    setOpen(true);
  }

  function startEdit(row: CatalogStage) {
    setEditing(row);
    setLabelAr(row.labelAr);
    setYears(row.years);
    setError('');
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        labelAr: labelAr.trim(),
        labelEn: editing?.labelEn || labelAr.trim(),
        icon: '',
        years,
        isActive: editing?.isActive ?? true,
      };
      if (editing) {
        await api(`/admin/stages/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/stages', { method: 'POST', body: JSON.stringify(payload) });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await api(`/admin/stages/${pendingDelete.id}`, { method: 'DELETE' });
      setPendingDelete(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: CatalogStage) {
    await api(`/admin/stages/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    setRows((list) => list.map((r) => (r.id === row.id ? { ...r, isActive: !r.isActive } : r)));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rows, oldIndex, newIndex);
    setRows(next);
    await api('/admin/stages/reorder', { method: 'PATCH', body: JSON.stringify({ ids: next.map((r) => r.id) }) });
  }

  const activeCount = rows.filter((r) => r.isActive).length;

  return (
    <RequireAdmin>
      <LoadingOverlay show={loading || busy} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cairo text-2xl font-black text-amber">المراحل الدراسية</h1>
          <p className="mt-1 text-sm text-slate">
            {rows.length === 0
              ? 'أضف المراحل التي تظهر للطلاب عند اختيار الجامعة.'
              : `${activeCount} من ${rows.length} ظاهرة للطلاب · اسحب لإعادة الترتيب`}
          </p>
        </div>
        <button className="rounded-xl bg-amber px-4 py-2.5 font-cairo font-bold text-ink" onClick={startAdd}>
          إضافة مرحلة
        </button>
      </div>

      {loading ? null : rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-ink-2 px-6 py-16 text-center">
          <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/10 text-amber">
            <GraduationCap size={32} strokeWidth={1.7} />
          </span>
          <h2 className="font-cairo text-lg font-black">لا توجد مراحل بعد</h2>
          <p className="mt-2 max-w-[36ch] text-sm leading-7 text-slate">
            أضف دبلوم، بكالوريوس، ماجستير أو أي مرحلة أخرى ثم حدّد عدد سنواتها.
          </p>
          <button className="mt-5 rounded-xl bg-amber px-4 py-2.5 font-cairo font-bold text-ink" onClick={startAdd}>
            إضافة أول مرحلة
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="relative space-y-3">
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-8 top-8 right-[42px] w-px bg-gradient-to-b from-amber/50 via-line to-line max-[640px]:hidden"
              />
              {rows.map((row, index) => (
                <StageCard
                  key={row.id}
                  stage={row}
                  index={index}
                  onEdit={() => startEdit(row)}
                  onDelete={() => setPendingDelete(row)}
                  onToggle={() => toggle(row)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal open={open} title={editing ? 'تعديل المرحلة' : 'إضافة مرحلة'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-5">
          <div>
            <label>اسم المرحلة</label>
            <input value={labelAr} onChange={(e) => setLabelAr(e.target.value)} placeholder="مثال: بكالوريوس" required />
          </div>
          <div>
            <label>مدة الدراسة</label>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center rounded-2xl bg-ink-3 p-1">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate hover:bg-ink-2 hover:text-amber"
                  onClick={() => setYears((n) => Math.max(1, n - 1))}
                  aria-label="إنقاص سنة"
                >
                  <Minus size={16} strokeWidth={2.2} />
                </button>
                <div className="min-w-[3.25rem] text-center font-cairo text-2xl font-black text-amber">{years}</div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate hover:bg-ink-2 hover:text-amber"
                  onClick={() => setYears((n) => Math.min(12, n + 1))}
                  aria-label="زيادة سنة"
                >
                  <Plus size={16} strokeWidth={2.2} />
                </button>
              </div>
              <span className="text-sm text-slate">{yearsLabel(years)}</span>
            </div>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2 pt-1">
            <button className="rounded-xl bg-amber px-5 py-2.5 font-bold text-ink" type="submit">
              حفظ
            </button>
            <button type="button" className="rounded-xl bg-ink-3 px-5 py-2.5" onClick={() => setOpen(false)}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!pendingDelete} title="حذف المرحلة" onClose={() => setPendingDelete(null)}>
        <p className="mb-5 leading-7 text-slate">
          حذف <span className="font-bold text-paper">{pendingDelete?.labelAr}</span> سيخفيها من الجامعات والطلاب.
        </p>
        <div className="flex gap-2">
          <button className="rounded-xl bg-danger px-4 py-2 font-bold text-paper" onClick={confirmDelete}>
            حذف
          </button>
          <button className="rounded-xl bg-ink-3 px-4 py-2" onClick={() => setPendingDelete(null)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </RequireAdmin>
  );
}
