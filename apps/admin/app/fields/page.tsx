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
import { CatalogField, CatalogMajor } from '@ejabi/shared';
import { api, ApiError } from '@/lib/api';
import { Modal } from '@/components/Modal';
import { Toggle } from '@/components/Toggle';
import { Select } from '@/components/Select';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { RequireAdmin } from '@/components/RequireAdmin';
import { IconButton } from '@/components/IconButton';

type FieldRow = CatalogField & { majors: CatalogMajor[] };

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'z-20' : ''}
    >
      <button type="button" className="cursor-grab px-1 text-slate" aria-label="سحب" {...attributes} {...listeners}>
        ⋮⋮
      </button>
    </div>
  );
}

export default function FieldsPage() {
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [open, setOpen] = useState<'field' | 'major' | null>(null);
  const [editingField, setEditingField] = useState<FieldRow | null>(null);
  const [editingMajor, setEditingMajor] = useState<CatalogMajor | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [fieldForm, setFieldForm] = useState({ labelAr: '', labelEn: '', icon: '📁' });
  const [majorForm, setMajorForm] = useState({
    fieldId: '',
    labelAr: '',
    labelEn: '',
    icon: '📘',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ type: 'field' | 'major'; id: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    const rows = await api<FieldRow[]>('/admin/fields');
    setFields(rows.map((f) => ({ ...f, majors: f.majors.filter((m) => !m.isCustom) })));
    setExpanded((prev) => {
      const next = { ...prev };
      rows.forEach((f) => {
        if (next[f.id] === undefined) next[f.id] = true;
      });
      return next;
    });
  }

  useEffect(() => {
    load()
      .catch(() => setFields([]))
      .finally(() => setLoading(false));
  }, []);

  function startField() {
    setEditingField(null);
    setFieldForm({ labelAr: '', labelEn: '', icon: '📁' });
    setError('');
    setOpen('field');
  }
  function startMajor(fieldId?: string) {
    setEditingMajor(null);
    setMajorForm({
      fieldId: fieldId || fields[0]?.id || '',
      labelAr: '',
      labelEn: '',
      icon: '📘',
    });
    setError('');
    setOpen('major');
  }

  async function saveField(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editingField) {
        await api(`/admin/fields/${editingField.id}`, { method: 'PATCH', body: JSON.stringify(fieldForm) });
      } else {
        await api('/admin/fields', { method: 'POST', body: JSON.stringify(fieldForm) });
      }
      setOpen(null);
      await load();
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
        labelEn: majorForm.labelEn,
        icon: majorForm.icon || '📘',
        isCustom: false,
      };
      if (editingMajor) {
        await api(`/admin/majors/${editingMajor.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/majors', { method: 'POST', body: JSON.stringify(payload) });
      }
      setOpen(null);
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
    await load();
  }
  async function toggleMajor(row: CatalogMajor) {
    await api(`/admin/majors/${row.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !row.isActive }) });
    await load();
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

    const parent = fields.find((f) => f.majors.some((m) => m.id === active.id));
    if (!parent || !parent.majors.some((m) => m.id === over.id)) return;
    const oldIndex = parent.majors.findIndex((m) => m.id === active.id);
    const newIndex = parent.majors.findIndex((m) => m.id === over.id);
    const moved = arrayMove(parent.majors, oldIndex, newIndex);
    setFields((list) => list.map((f) => (f.id === parent.id ? { ...f, majors: moved } : f)));
    await api('/admin/majors/reorder', { method: 'PATCH', body: JSON.stringify({ ids: moved.map((m) => m.id) }) });
  }

  const fieldOpts = fields.map((f) => ({ value: f.id, label: `${f.icon} ${f.labelAr}`, sub: f.labelEn }));

  return (
    <RequireAdmin>
      <LoadingOverlay show={loading || busy} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-cairo text-2xl font-black text-amber">الحقول والتخصصات</h1>
        <div className="flex gap-2">
          <button className="rounded-lg bg-ink-3 px-4 py-2" onClick={() => startMajor()}>
            إضافة تخصص
          </button>
          <button className="rounded-lg bg-amber px-4 py-2 font-bold text-ink" onClick={startField}>
            إضافة حقل
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={[...fields.map((f) => f.id), ...fields.flatMap((f) => f.majors.map((m) => m.id))]}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.map((field) => {
              const openField = expanded[field.id] !== false;
              return (
                <div key={field.id} className="rounded-2xl bg-ink-2">
                  <div className="flex flex-wrap items-center gap-3 px-3 py-3">
                    <DragHandle id={field.id} />
                    <button
                      type="button"
                      className="text-slate"
                      onClick={() => setExpanded((s) => ({ ...s, [field.id]: !openField }))}
                    >
                      {openField ? '▾' : '▸'}
                    </button>
                    <span className="text-xl">{field.icon}</span>
                    <div className={`min-w-0 flex-1 ${field.isActive ? '' : 'opacity-50'}`}>
                      <div className="font-bold">{field.labelAr}</div>
                      <div className="text-xs text-slate">{field.labelEn}</div>
                    </div>
                    <Toggle checked={field.isActive} onChange={() => toggleField(field)} />
                    <div className="flex items-center gap-1.5">
                      <IconButton icon="add" label="إضافة تخصص" onClick={() => startMajor(field.id)} />
                      <IconButton
                        icon="edit"
                        label="تعديل"
                        onClick={() => {
                          setEditingField(field);
                          setFieldForm({ labelAr: field.labelAr, labelEn: field.labelEn, icon: field.icon });
                          setError('');
                          setOpen('field');
                        }}
                      />
                      <IconButton
                        icon="delete"
                        label="حذف"
                        tone="danger"
                        onClick={() => setPendingDelete({ type: 'field', id: field.id })}
                      />
                    </div>
                  </div>

                  {openField ? (
                    <div className="border-t border-white/10 px-3 py-3">
                      {field.majors.length === 0 ? (
                        <p className="px-2 py-3 text-sm text-slate">لا توجد تخصصات في هذا الحقل.</p>
                      ) : (
                        <div className="space-y-2">
                          {field.majors.map((major) => (
                            <div
                              key={major.id}
                              className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-3 px-3 py-2"
                            >
                              <DragHandle id={major.id} />
                              <span>{major.icon}</span>
                              <div className={`min-w-0 flex-1 ${major.isActive ? '' : 'opacity-50'}`}>
                                <div className="font-bold">{major.labelAr}</div>
                                <div className="text-xs text-slate">{major.labelEn}</div>
                              </div>
                              <Toggle checked={major.isActive} onChange={() => toggleMajor(major)} />
                              <div className="flex items-center gap-1.5">
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
                                <IconButton
                                  icon="delete"
                                  label="حذف"
                                  tone="danger"
                                  onClick={() => setPendingDelete({ type: 'major', id: major.id })}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <Modal open={open === 'field'} title={editingField ? 'تعديل الحقل' : 'إضافة حقل'} onClose={() => setOpen(null)}>
        <form onSubmit={saveField} className="space-y-3">
          <div className="mb-3">
            <label>الاسم بالعربي</label>
            <input value={fieldForm.labelAr} onChange={(e) => setFieldForm((s) => ({ ...s, labelAr: e.target.value }))} required />
          </div>
          <div className="mb-3">
            <label>الاسم بالإنجليزي</label>
            <input value={fieldForm.labelEn} onChange={(e) => setFieldForm((s) => ({ ...s, labelEn: e.target.value }))} required />
          </div>
          <div className="mb-3">
            <label>الأيقونة</label>
            <input value={fieldForm.icon} onChange={(e) => setFieldForm((s) => ({ ...s, icon: e.target.value }))} />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="rounded-lg bg-amber px-4 py-2 font-bold text-ink" type="submit">
            حفظ
          </button>
        </form>
      </Modal>

      <Modal open={open === 'major'} title={editingMajor ? 'تعديل التخصص' : 'إضافة تخصص'} onClose={() => setOpen(null)}>
        <form onSubmit={saveMajor} className="space-y-3">
          <div className="mb-3">
            <label>الحقل</label>
            <Select value={majorForm.fieldId} options={fieldOpts} onChange={(v) => setMajorForm((s) => ({ ...s, fieldId: v }))} />
          </div>
          <div className="mb-3">
            <label>الاسم بالعربي</label>
            <input value={majorForm.labelAr} onChange={(e) => setMajorForm((s) => ({ ...s, labelAr: e.target.value }))} required />
          </div>
          <div className="mb-3">
            <label>الاسم بالإنجليزي</label>
            <input value={majorForm.labelEn} onChange={(e) => setMajorForm((s) => ({ ...s, labelEn: e.target.value }))} required />
          </div>
          <div className="mb-3">
            <label>الأيقونة</label>
            <input value={majorForm.icon} onChange={(e) => setMajorForm((s) => ({ ...s, icon: e.target.value }))} />
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
