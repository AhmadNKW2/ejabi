'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { LoadingOverlay } from './LoadingOverlay';

const links = [
  { href: '/', label: 'الرئيسية' },
  { href: '/applications', label: 'الطلبات' },
  { href: '/students', label: 'الطلاب' },
  { href: '/countries', label: 'الدول' },
  { href: '/fields', label: 'الحقول والتخصصات' },
  { href: '/stages', label: 'المراحل' },
  { href: '/universities', label: 'الجامعات والأسعار' },
  { href: '/settings', label: 'الإعدادات' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
      <LoadingOverlay show={navigating || loading} />
      <aside className="border-l border-white/10 bg-ink-2 p-5">
        <div className="mb-8 flex items-center gap-3">
          <img src="/logo.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <div className="font-cairo text-sm font-extrabold text-amber">لوحة الإدارة</div>
            <div className="text-xs text-slate">انطلاقتك الدراسية</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href === '/universities' && pathname === '/prices');
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => {
                  if (l.href !== pathname) setNavigating(true);
                }}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-amber font-bold text-ink' : 'text-paper hover:bg-ink-3'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        {user ? (
          <button className="mt-8 text-sm text-slate hover:text-amber" onClick={() => logout()}>
            خروج ({user.fullName})
          </button>
        ) : null}
      </aside>
      <main className="overflow-x-hidden p-6 lg:p-8">{loading ? null : children}</main>
    </div>
  );
}
