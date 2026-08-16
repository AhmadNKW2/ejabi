'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

type Field = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'checkbox' | 'select';
  options?: { value: string; label: string }[];
};

export function CrudPage<T extends { id: string }>({
  title,
  path,
  columns,
  fields,
  toForm,
  fromForm,
}: {
  title: string;
  path: string;
  columns: { key: string; label: string; render?: (row: T) => React.ReactNode }[];
  fields: Field[];
  toForm?: (row: T) => Record<string, string | number | boolean | null>;
  fromForm?: (form: Record<string, string>) => Record<string, unknown>;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  async function load() {
    const data = await api<T[]>(path);
    setRows(data);
  }

  useEffect(() => {
    load().catch(() => setRows([]));
  }, [path]);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    const defaults: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === 'checkbox') defaults[f.key] = 'true';
    });
    setForm(defaults);
  }

  function startEdit(row: T) {
    setEditing(row);
    setCreating(false);
    const src = toForm ? toForm(row) : (row as unknown as Record<string, string | number | boolean | null>);
    setForm(
      Object.fromEntries(
        fields.map((f) => {
          const v = src[f.key];
          if (v === true) return [f.key, 'true'];
          if (v === false) return [f.key, 'false'];
          return [f.key, v == null ? '' : String(v)];
        }),
      ),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const payload = fromForm
      ? fromForm(form)
      : Object.fromEntries(
          fields.map((f) => {
            const v = form[f.key];
            if (f.type === 'number') return [f.key, v === '' ? null : Number(v)];
            if (f.type === 'checkbox') return [f.key, v === 'true'];
            return [f.key, v];
          }),
        );
    try {
      if (editing) {
        await api(`${path}/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api(path, { method: 'POST', body: JSON.stringify(payload) });
      }
      setCreating(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر الحفظ');
    }
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا العنصر؟')) return;
    await api(`${path}/${id}`, { method: 'DELETE' });
    await load();
  }

  const showForm = creating || editing;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-cairo text-2xl font-black text-amber">{title}</h1>
        <button className="bg-amber text-ink rounded-lg px-4 py-2 font-cairo font-bold" onClick={startCreate}>
          إضافة
        </button>
      </div>
      {error ? <p className="text-danger text-sm mb-3">{error}</p> : null}
      {showForm ? (
        <form onSubmit={onSubmit} className="bg-ink-2 rounded-xl p-4 mb-6 grid md:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={form[f.key] || ''}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  required
                >
                  <option value="">اختر</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <select
                  value={form[f.key] || 'true'}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                >
                  <option value="true">نشط</option>
                  <option value="false">غير نشط</option>
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  step={f.type === 'number' ? 'any' : undefined}
                  value={form[f.key] || ''}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-amber text-ink rounded-lg px-4 py-2 font-bold" type="submit">
              حفظ
            </button>
            <button
              type="button"
              className="bg-ink-3 rounded-lg px-4 py-2"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
      <div className="overflow-x-auto bg-ink-2 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-amber font-cairo">
              {columns.map((c) => (
                <th key={c.key} className="text-right p-3 border-b border-white/10">
                  {c.label}
                </th>
              ))}
              <th className="p-3 border-b border-white/10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5">
                {columns.map((c) => (
                  <td key={c.key} className="p-3">
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
                <td className="p-3 whitespace-nowrap">
                  <button className="text-amber ml-3" onClick={() => startEdit(row)}>
                    تعديل
                  </button>
                  <button className="text-danger" onClick={() => remove(row.id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
