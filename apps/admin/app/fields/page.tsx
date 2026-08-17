'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { CatalogField, CatalogMajor } from '@ejabi/shared';
import { api, ApiError } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Toggle } from '@/components/Toggle';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { RequireAdmin } from '@/components/RequireAdmin';
import { IconButton } from '@/components/IconButton';

type FieldRow = CatalogField & { majors: CatalogMajor[] };

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`cursor-grab px-1 text-slate hover:text-amber ${isDragging ? 'z-20' : ''}`}
      aria-label="سحب"
      {...attributes}
      {...listeners}
    >
      ⋮⋮
    </button>
  );
}

export default function FieldsPage() {
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [open, setOpen] = useState<'field' | 'major' | null>(null);
  const [editingField, setEditingField] = useState<FieldRow | null>(null);
  const [editingMajor, setEditingMajor] = useState<CatalogMajor | null>(null);
  const [fieldForm, setFieldForm] = useState({ labelAr: '', labelEn: '', icon: '' });
  const [majorForm, setMajorForm] = useState({ fieldId: '', labelAr: '', labelEn: '', icon: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'field' | 'major'; id: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selected = fields.find((f) => f.id === selectedId) ?? fields[0] ?? null;
  const majors = selected?.majors ?? [];

  async function load(preferId?: string) {
    const rows = await api<FieldRow[]>('/admin/fields');
    const next = rows.map((f) => ({ ...f, majors: f.majors.filter((m) => !m.isCustom) }));
    setFields(next);
    setSelectedId((prev) => preferId || (next.some((f) => f.id === prev) ? prev : next[0]?.id || ''));
  }

  useEffect(() => {
    load()
      .catch(() => setFields([]))
      .finally(() => setLoading(false));
  }, []);

  function startField() {
    setEditingField(null);
    setFieldForm({ labelAr: '', labelEn: '', icon: '' });
    setError('');
    setOpen('field');
  }

  function startMajor() {
    if (!selected) return;
    setEditingMajor(null);
    setMajorForm({ fieldId: selected.id, labelAr: '', labelEn: '', icon: '' });
    setError('');
    setOpen('major');
  }

  async function saveField(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...fieldForm, labelEn: fieldForm.labelEn || fieldForm.labelAr };
      if (editingField) {
        await api(`/admin/fields/${editingField.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        await load(editingField.id);
      } else {
        const created = await api<FieldRow>('/admin/fields', { method: 'POST', body: JSON.stringify(payload) });
        await load(created.id);
      }
      setOpen(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  }

  async function saveMajor(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        fieldId: majorForm.fieldId,
        labelAr: majorForm.labelAr,
        labelEn: majorForm.labelEn || majorForm.labelAr,
        icon: majorForm.icon || '',
        isCustom: false,
      };
      if (editingMajor) {
        await api(`/admin/majors/${editingMajor.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/majors', { method: 'POST', body: JSON.stringify(payload) });
      }
      setOpen(null);
      await load(majorForm.fieldId);
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
      const path = pendingDelete.type === 'field' ? '/admin/fields' : '/admin/majors';
      await api(`${path}/${pendingDelete.id}`, { method: 'DELETE' });
      setPendingDelete(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleField(row: FieldRow) {
    await api(`/admin/fields/${row.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !row.isActive }) });
    setFields((list) => list.map((f) => (f.id === row.id ? { ...f, isActive: !f.isActive } : f)));
  }

  async function toggleMajor(row: CatalogMajor) {
    await api(`/admin/majors/${row.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !row.isActive }) });
    setFields((list) =>
      list.map((f) => ({
        ...f,
        majors: f.majors.map((m) => (m.id === row.id ? { ...m, isActive: !m.isActive } : m)),
      })),
    );
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fieldOld = fields.findIndex((f) => f.id === active.id);
    const fieldNew = fields.findIndex((f) => f.id === over.id);
    if (fieldOld >= 0 && fieldNew >= 0) {
      const next = arrayMove(fields, fieldOld, fieldNew);
      setFields(next);
      await api('/admin/fields/reorder', { method: 'PATCH', body: JSON.stringify({ ids: next.map((f) => f.id) }) });
      return;
    }

    if (!selected) return;
    if (!selected.majors.some((m) => m.id === active.id) || !selected.majors.some((m) => m.id === over.id)) return;
    const oldIndex = selected.majors.findIndex((m) => m.id === active.id);
    const newIndex = selected.majors.findIndex((m) => m.id === over.id);
    const moved = arrayMove(selected.majors, oldIndex, newIndex);
    setFields((list) => list.map((f) => (f.id === selected.id ? { ...f, majors: moved } : f)));
    await api('/admin/majors/reorder', { method: 'PATCH', body: JSON.stringify({ ids: moved.map((m) => m.id) }) });
  }

  const majorCount = useMemo(
    () => fields.reduce((n, f) => n + f.majors.length, 0),
    [fields],
  );

  return (
    <RequireAdmin>
      <LoadingOverlay show={loading || busy} />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-cairo text-2xl font-black text-amber">الحقول والتخصصات</h1>
          <p className="mt-1 text-sm text-slate">
            {fields.length} حقول · {majorCount} تخصصات
          </p>
        </div>
        <button className="rounded-xl bg-amber px-4 py-2.5 font-cairo font-bold text-ink" onClick={startField}>
          إضافة حقل
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl bg-ink-2 p-3">
            <p className="mb-2 px-1 text-xs font-extrabold text-amber">الحقول</p>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {fields.map((field) => {
                  const active = field.id === selected?.id;
                  return (
                    <div
                      key={field.id}
                      className={`flex items-center gap-1 rounded-xl px-1.5 py-1.5 ${
                        active ? 'bg-amber/15' : 'hover:bg-ink-3'
                      } ${field.isActive ? '' : 'opacity-50'}`}
                    >
                      <DragHandle id={field.id} />
                      <button
                        type="button"
                        onClick={() => setSelectedId(field.id)}
                        className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-right"
                      >
                        <div className="truncate font-bold">{field.labelAr}</div>
                        <div className="text-[11px] text-slate">{field.majors.length} تخصصات</div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
            {fields.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-slate">أضف حقلًا للبدء.</p>
            ) : null}
          </aside>

          <section className="min-w-0 rounded-2xl bg-ink-2 p-4 sm:p-6">
            {!selected ? (
              <div className="py-16 text-center text-slate">أضف حقلًا أولًا، ثم أضف تخصصاته.</div>
            ) : (
              <>
                <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <h2 className="font-cairo text-xl font-black">{selected.labelAr}</h2>
                    <p className="mt-1 text-sm text-slate">{majors.length} تخصصات في هذا الحقل</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle checked={!!selected.isActive} onChange={() => toggleField(selected)} />
                    <IconButton
                      icon="edit"
                      label="تعديل الحقل"
                      onClick={() => {
                        setEditingField(selected);
                        setFieldForm({ labelAr: selected.labelAr, labelEn: selected.labelEn, icon: selected.icon });
                        setError('');
                        setOpen('field');
                      }}
                    />
                    <IconButton
                      icon="delete"
                      label="حذف الحقل"
                      tone="danger"
                      onClick={() => setPendingDelete({ type: 'field', id: selected.id })}
                    />
                    <button
                      type="button"
                      className="rounded-xl bg-amber px-3.5 py-2 text-sm font-bold text-ink"
                      onClick={startMajor}
                    >
                      إضافة تخصص
                    </button>
                  </div>
                </header>

                {majors.length === 0 ? (
                  <div className="rounded-2xl bg-ink-3 px-4 py-14 text-center text-slate">
                    لا توجد تخصصات بعد. اضغط «إضافة تخصص».
                  </div>
                ) : (
                  <SortableContext items={majors.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {majors.map((major) => (
                        <div
                          key={major.id}
                          className={`flex items-center gap-2 rounded-xl bg-ink-3 px-3 py-2.5 ${
                            major.isActive ? '' : 'opacity-50'
                          }`}
                        >
                          <DragHandle id={major.id} />
                          <IconButton
                            icon="delete"
                            label="حذف التخصص"
                            tone="danger"
                            onClick={() => setPendingDelete({ type: 'major', id: major.id })}
                          />
                          <div className="min-w-0 flex-1 font-bold">{major.labelAr}</div>
                          <Toggle checked={major.isActive} onChange={() => toggleMajor(major)} />
                          <IconButton
                            icon="edit"
                            label="تعديل"
                            onClick={() => {
                              setEditingMajor(major);
                              setMajorForm({
                                fieldId: major.fieldId,
                                labelAr: major.labelAr,
                                labelEn: major.labelEn,
                                icon: major.icon,
                              });
                              setError('');
                              setOpen('major');
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                )}
              </>
            )}
          </section>
        </div>
      </DndContext>

      <Modal open={open === 'field'} title={editingField ? 'تعديل الحقل' : 'إضافة حقل'} onClose={() => setOpen(null)}>
        <form onSubmit={saveField} className="space-y-3">
          <div>
            <label>اسم الحقل</label>
            <input
              value={fieldForm.labelAr}
              onChange={(e) => setFieldForm((s) => ({ ...s, labelAr: e.target.value }))}
              required
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="rounded-lg bg-amber px-4 py-2 font-bold text-ink" type="submit">
            حفظ
          </button>
        </form>
      </Modal>

      <Modal open={open === 'major'} title={editingMajor ? 'تعديل التخصص' : 'إضافة تخصص'} onClose={() => setOpen(null)}>
        <form onSubmit={saveMajor} className="space-y-3">
          <div>
            <label>اسم التخصص</label>
            <input
              value={majorForm.labelAr}
              onChange={(e) => setMajorForm((s) => ({ ...s, labelAr: e.target.value }))}
              required
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="rounded-lg bg-amber px-4 py-2 font-bold text-ink" type="submit">
            حفظ
          </button>
        </form>
      </Modal>

      <Modal open={!!pendingDelete} title="تأكيد الحذف" onClose={() => setPendingDelete(null)}>
        <p className="mb-5 text-slate">هل تريد حذف هذا العنصر؟</p>
        <div className="flex gap-2">
          <button className="rounded-lg bg-danger px-4 py-2 font-bold text-paper" onClick={confirmDelete}>
            حذف
          </button>
          <button className="rounded-lg bg-ink-3 px-4 py-2" onClick={() => setPendingDelete(null)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </RequireAdmin>
  );
}
