'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { btnPrimary, inputClass, labelClass } from '@/lib/cn';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await register({ fullName, email, phone: phone || undefined, password });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر إنشاء الحساب');
    }
  }

  return (
    <div className="mx-auto my-10 max-w-[480px] rounded-2xl bg-ink-2 px-6 py-7">
      <h1 className="mb-[18px] font-cairo text-2xl font-black text-amber">إنشاء حساب</h1>
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className={labelClass}>الاسم الكامل</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className={labelClass}>البريد الإلكتروني</label>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className={labelClass}>رقم الهاتف</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className={labelClass}>كلمة المرور (8 أحرف على الأقل)</label>
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error ? <p className="my-2 text-[13px] text-danger">{error}</p> : null}
        <button className={btnPrimary} type="submit">
          تسجيل
        </button>
      </form>
      <p className="mt-4 text-slate">
        لديك حساب؟{' '}
        <Link href="/login" className="text-amber no-underline hover:underline">
          دخول
        </Link>
      </p>
    </div>
  );
}
