'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';
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
import { api, ApiError } from '@/lib/api';
import { Modal } from './Modal';
import { Toggle } from './Toggle';
import { NumberInput } from './NumberInput';
import { Select, SelectOption } from './Select';
import { MultiSelect } from './MultiSelect';
import { Pills } from './Pills';
import { LoadingOverlay } from './LoadingOverlay';
import { IconButton } from './IconButton';
import { MajorStageOffering, MajorStageOfferings } from './MajorStageOfferings';

function parseOfferings(value: string | boolean | undefined): MajorStageOffering[] {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value) as MajorStageOffering[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type FormField =
  | { key: string; label: string; hint?: string; type?: 'text' | 'icon' | 'url'; placeholder?: string }
  | { key: string; label: string; hint?: string; type: 'number'; step?: string }
  | { key: string; label: string; hint?: string; type: 'toggle' }
  | { key: string; label: string; hint?: string; type: 'select'; options: SelectOption[] }
  | { key: string; label: string; hint?: string; type: 'multiselect'; options: SelectOption[] }
  | { key: string; label: string; hint?: string; type: 'major-stages'; majors: SelectOption[]; stages: SelectOption[] };

function SortRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl bg-ink-2 px-3 py-3 ${
        isDragging ? 'z-20 scale-[1.01] shadow-xl' : ''
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none px-1 text-lg leading-none text-slate hover:text-amber"
        aria-label="سحب للترتيب"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function CatalogManager<T extends { id: string; isActive?: boolean }>({
  title,
  path,
  fields,
  renderItem,
  toForm,
  fromForm,
  defaults,
  onFieldChange,
  filterPills,
  filterOf,
  description,
  wideModal,
}: {
  title: string;
  path: string;
  fields: FormField[];
  renderItem: (row: T) => ReactNode;
  toForm: (row: T) => Record<string, string | boolean>;
  fromForm: (form: Record<string, string | boolean>) => Record<string, unknown>;
  defaults?: Record<string, string | boolean>;
  onFieldChange?: (
    key: string,
    value: string | boolean,
    setForm: Dispatch<SetStateAction<Record<string, string | boolean>>>,
  ) => void;
  filterPills?: { id: string; label: string; icon?: ReactNode }[];
  filterOf?: (row: T) => string;
  description?: string;
  wideModal?: boolean;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [extraFilter, setExtraFilter] = useState('');
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    try {
      setRows(await api<T[]>(path));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [path]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter === 'active' && !r.isActive) return false;
      if (statusFilter === 'inactive' && r.isActive) return false;
      if (extraFilter && filterOf && filterOf(r) !== extraFilter) return false;
      return true;
    });
  }, [rows, statusFilter, extraFilter, filterOf]);

  function startAdd() {
    setEditing(null);
    setForm({ isActive: true, ...(defaults || {}) });
    setError('');
    setOpen(true);
  }

  function startEdit(row: T) {
    setEditing(row);
    setForm(toForm(row));
    setError('');
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = fromForm(form);
      if (editing) {
        await api(`${path}/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api(path, { method: 'POST', body: JSON.stringify(payload) });
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
    await api(`${path}/${pendingDelete.id}`, { method: 'DELETE' });
    setPendingDelete(null);
    await load();
  }

  async function toggle(row: T) {
    await api(`${path}/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    setRows((list) => list.map((r) => (r.id === row.id ? { ...r, isActive: !r.isActive } : r)));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.findIndex((r) => r.id === active.id);
    const newIndex = visible.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const moved = arrayMove(visible, oldIndex, newIndex);
    const visibleIds = new Set(moved.map((r) => r.id));
    let i = 0;
    const next = rows.map((r) => (visibleIds.has(r.id) ? moved[i++] : r));
    setRows(next);
    await api(`${path}/reorder`, { method: 'PATCH', body: JSON.stringify({ ids: next.map((r) => r.id) }) });
  }

  return (
    <div>
      <LoadingOverlay show={busy || loading} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-cairo text-2xl font-black text-amber">{title}</h1>
        <button
          className="rounded-lg bg-amber px-4 py-2 font-cairo font-bold text-ink"
          onClick={startAdd}
        >
          إضافة
        </button>
      </div>
      {description ? <p className="-mt-2 mb-5 text-sm leading-7 text-slate">{description}</p> : null}

      <div className="mb-4 flex flex-col gap-3">
        <Pills
          value={statusFilter}
          onChange={setStatusFilter}
          items={[
            { id: '', label: 'الكل' },
            { id: 'active', label: 'نشط' },
            { id: 'inactive', label: 'متوقف' },
          ]}
        />
        {filterPills?.length ? (
          <Pills value={extraFilter} onChange={setExtraFilter} items={filterPills} />
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-slate">جاري التحميل...</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl bg-ink-2 px-4 py-10 text-center text-slate">
          لا توجد عناصر. اضغط «إضافة» لإنشاء عنصر جديد.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
                {visible.map((row) => (
                  <SortRow key={row.id} id={row.id}>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`min-w-0 flex-1 ${row.isActive ? '' : 'opacity-50'}`}>{renderItem(row)}</div>
                      <Toggle checked={!!row.isActive} onChange={() => toggle(row)} />
                      <div className="flex items-center gap-1.5">
                        <IconButton icon="edit" label="تعديل" onClick={() => startEdit(row)} />
                        <IconButton icon="delete" label="حذف" tone="danger" onClick={() => setPendingDelete(row)} />
                      </div>
                    </div>
                  </SortRow>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal open={open} title={editing ? 'تعديل' : 'إضافة'} onClose={() => setOpen(false)} wide={wideModal}>
        <form onSubmit={save} className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label>{f.label}</label>
              {f.hint ? <p className="-mt-1 mb-2 text-xs leading-6 text-slate">{f.hint}</p> : null}
              {f.type === 'toggle' ? (
                <Toggle
                  checked={form[f.key] === true}
                  onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                />
              ) : f.type === 'number' ? (
                <NumberInput
                  value={String(form[f.key] ?? '')}
                  step={f.step}
                  onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                />
              ) : f.type === 'select' ? (
                <Select
                  value={String(form[f.key] ?? '')}
                  options={f.options}
                  onChange={(v) => {
                    setForm((s) => ({ ...s, [f.key]: v }));
                    onFieldChange?.(f.key, v, setForm);
                  }}
                />
              ) : f.type === 'major-stages' ? (
                <MajorStageOfferings
                  value={parseOfferings(form[f.key])}
                  majors={f.majors}
                  stages={f.stages}
                  onChange={(offerings) => setForm((s) => ({ ...s, [f.key]: JSON.stringify(offerings) }))}
                />
              ) : f.type === 'multiselect' ? (
                <MultiSelect
                  values={String(form[f.key] ?? '')
                    .split(',')
                    .filter(Boolean)}
                  options={f.options}
                  onChange={(ids) => setForm((s) => ({ ...s, [f.key]: ids.join(',') }))}
                />
              ) : (
                <>
                  <input
                    type={f.type === 'url' ? 'url' : 'text'}
                    value={String(form[f.key] ?? '')}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={
                      f.placeholder ||
                      (f.type === 'icon' ? 'مثال: 🎓' : f.type === 'url' ? 'https://...' : undefined)
                    }
                  />
                  {f.type === 'url' && String(form[f.key] || '') ? (
                    <img
                      src={String(form[f.key])}
                      alt=""
                      className="mt-2 h-12 w-12 rounded-full bg-paper object-contain p-1"
                    />
                  ) : null}
                </>
              )}
            </div>
          ))}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2 pt-2">
            <button className="rounded-lg bg-amber px-4 py-2 font-bold text-ink" type="submit">
              حفظ
            </button>
            <button type="button" className="rounded-lg bg-ink-3 px-4 py-2" onClick={() => setOpen(false)}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!pendingDelete} title="تأكيد الحذف" onClose={() => setPendingDelete(null)}>
        <p className="mb-5 text-slate">هل تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذه الخطوة.</p>
        <div className="flex gap-2">
          <button className="rounded-lg bg-danger px-4 py-2 font-bold text-paper" onClick={confirmDelete}>
            حذف
          </button>
          <button className="rounded-lg bg-ink-3 px-4 py-2" onClick={() => setPendingDelete(null)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}
