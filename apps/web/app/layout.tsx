import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { RouteOverlay } from '@/components/RouteOverlay';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['500', '700', '800', '900'],
  variable: '--font-cairo',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'انطلاقتك الدراسية',
  description: 'اختر مسارك الجامعي، قارن السنوات والتكلفة، وقدّم ثلاثة خيارات مرتبة حسب أولويتك.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body>
        <div className="flex min-h-screen flex-col">
          <div className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-5 pb-10 max-[900px]:px-3 max-[900px]:py-[18px] max-[900px]:pb-7 has-[.home]:[&_[data-nav-mark]]:hidden">
            <Nav />
            <RouteOverlay />
            {children}
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
