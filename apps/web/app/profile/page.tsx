'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { btnGhost, btnPrimary, inputClass, labelClass } from '@/lib/cn';

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login?next=/profile');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone || '');
    }
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/users/me', { method: 'PATCH', body: JSON.stringify({ fullName, phone }) });
      await refreshUser();
      setMessage('تم حفظ البيانات');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر الحفظ');
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('تم تغيير كلمة المرور');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تغيير كلمة المرور');
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto my-10 max-w-[480px] rounded-2xl bg-ink-2 px-6 py-7">
      <h1 className="mb-[18px] font-cairo text-2xl font-black text-amber">الملف الشخصي</h1>
      <form onSubmit={saveProfile}>
        <div className="mb-3">
          <label className={labelClass}>الاسم</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className={labelClass}>البريد</label>
          <input className={inputClass} value={user.email} disabled />
        </div>
        <div className="mb-3">
          <label className={labelClass}>الهاتف</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button className={btnPrimary} type="submit">
          حفظ البيانات
        </button>
      </form>
      <form onSubmit={savePassword} className="mt-7">
        <div className="mb-3">
          <label className={labelClass}>كلمة المرور الحالية</label>
          <input className={inputClass} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className={labelClass}>كلمة المرور الجديدة</label>
          <input className={inputClass} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        </div>
        <button className={btnGhost} type="submit">
          تغيير كلمة المرور
        </button>
      </form>
      {message ? <p className="text-teal">{message}</p> : null}
      {error ? <p className="my-2 text-[13px] text-danger">{error}</p> : null}
    </div>
  );
}
