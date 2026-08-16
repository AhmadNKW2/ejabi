'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { BrandMark } from '@/components/BrandMark';

export function Nav() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="sticky top-3 z-[60] mb-[22px] flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-2/70 px-[18px] py-3 backdrop-blur-lg">
      <Link
        href="/"
        className="flex items-center gap-3 font-cairo text-[15px] font-extrabold tracking-[0.2px] text-amber no-underline"
      >
        <BrandMark size={48} className="shadow-mark-sm" alt="" data-nav-mark="" />
        انطلاقتك الدراسية
      </Link>
      <div className="flex flex-wrap items-center gap-3.5">
        {!loading && user ? (
          <>
            <Link href="/applications" className="cursor-pointer border-0 bg-transparent font-tajawal text-[13.5px] text-paper no-underline hover:text-amber">
              طلباتي
            </Link>
            <Link href="/profile" className="cursor-pointer border-0 bg-transparent font-tajawal text-[13.5px] text-paper no-underline hover:text-amber">
              {user.fullName}
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="cursor-pointer border-0 bg-transparent p-0 font-tajawal text-[13.5px] text-paper hover:text-amber"
            >
              خروج
            </button>
          </>
        ) : !loading ? (
          <>
            <Link href="/login" className="cursor-pointer font-tajawal text-[13.5px] text-paper no-underline hover:text-amber">
              دخول
            </Link>
            <Link
              href="/register"
              className="rounded-[10px] bg-amber px-3.5 py-2 font-cairo text-[13px] font-extrabold text-ink no-underline hover:brightness-105"
            >
              إنشاء حساب
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
