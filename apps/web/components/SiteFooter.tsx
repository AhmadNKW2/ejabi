'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="mt-auto">
      <p className="mx-auto mb-[18px] max-w-[1160px] px-4 text-center text-[13px] leading-[1.9] text-slate max-[900px]:mb-3.5 max-[900px]:px-3">
        الأرقام <b className="font-bold text-amber">تقديرات إرشادية</b> للتخطيط الأولي، وقد تختلف بين الجامعات داخل الدولة نفسها.
      </p>

      <footer className="border-t border-line bg-page-deep">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-start justify-between gap-9 px-6 pb-7 pt-9 max-[900px]:px-4 max-[900px]:pb-[22px] max-[900px]:pt-7">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2.5 font-cairo text-base font-extrabold text-amber no-underline [&>span]:shadow-mark-sm"
            >
              <BrandMark size={52} alt="" />
              انطلاقتك الدراسية
            </Link>
            <p className="m-0 max-w-[42ch] text-sm leading-[1.9] text-slate">
              اختر مسارك الجامعي، قارن السنوات والتكلفة، وقدّم ثلاثة خيارات مرتبة حسب أولويتك.
            </p>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5 pb-[calc(16px+env(safe-area-inset-bottom))] text-[12.5px] text-slate max-[900px]:px-4">
          <span>© {year} انطلاقتك الدراسية</span>
          <span>جميع الحقوق محفوظة</span>
        </div>
      </footer>
    </div>
  );
}
