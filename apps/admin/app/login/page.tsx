'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('jordan.adnan@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/applications');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر الدخول');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-ink-2 p-8"
      >
        <div className="mb-4 flex justify-center">
          <img src="/logo.jpg" alt="" className="h-20 w-20 rounded-full object-cover" />
        </div>
        <h1 className="mb-6 text-center font-cairo text-2xl font-black text-amber">دخول الإدارة</h1>
        <div className="mb-3">
          <label>البريد</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label>كلمة المرور</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
        <button className="w-full rounded-lg bg-amber py-3 font-cairo font-bold text-ink" type="submit">
          دخول
        </button>
      </form>
    </div>
  );
}
