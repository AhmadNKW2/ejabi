'use client';

import Link from 'next/link';
import { FormEvent, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { btnPrimary, inputClass, labelClass } from '@/lib/cn';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push(params.get('next') || '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تسجيل الدخول');
    }
  }

  return (
    <div className="mx-auto my-10 max-w-[480px] rounded-2xl bg-ink-2 px-6 py-7">
      <h1 className="mb-[18px] font-cairo text-2xl font-black text-amber">تسجيل الدخول</h1>
      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className={labelClass}>البريد الإلكتروني</label>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className={labelClass}>كلمة المرور</label>
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error ? <p className="my-2 text-[13px] text-danger">{error}</p> : null}
        <button className={btnPrimary} type="submit">
          دخول
        </button>
      </form>
      <p className="mt-4 text-slate">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="text-amber no-underline hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
