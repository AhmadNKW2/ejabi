'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RequireAdmin } from '@/components/RequireAdmin';

type StudentRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
  _count: { applications: number };
};

export default function StudentsPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<StudentRow[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      const query = q ? `?q=${encodeURIComponent(q)}` : '';
      api<StudentRow[]>(`/admin/students${query}`).then(setRows).catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <RequireAdmin>
      <h1 className="mb-4 font-cairo text-2xl font-black text-amber">الطلاب</h1>
      <input
        className="mb-4 max-w-sm"
        placeholder="بحث بالاسم أو البريد أو الهاتف"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {rows.length === 0 ? (
        <div className="rounded-xl bg-ink-2 px-4 py-10 text-center text-slate">
          لا يوجد طلاب مطابقون.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-ink-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-cairo text-amber">
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">البريد</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الطلبات</th>
                <th className="p-3 text-right">التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                  <td className="p-3 font-bold">{r.fullName}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.phone || '—'}</td>
                  <td className="p-3">{r._count.applications}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleDateString('ar')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </RequireAdmin>
  );
}
