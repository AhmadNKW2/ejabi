'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';

export function Nav() {
  return (
    <nav className="sticky top-3 z-[60] mb-[22px] flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-2/70 px-[18px] py-3 backdrop-blur-lg">
      <Link
        href="/"
        className="flex items-center gap-3 font-cairo text-[15px] font-extrabold tracking-[0.2px] text-amber no-underline"
      >
        <BrandMark size={48} className="shadow-mark-sm" alt="" data-nav-mark="" />
        انطلاقتك الدراسية
      </Link>
    </nav>
  );
}
