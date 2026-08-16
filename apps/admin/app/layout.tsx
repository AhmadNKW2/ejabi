import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { SiteSettingsProvider } from '@/lib/settings';
import { Shell } from '@/components/Shell';
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
  title: 'لوحة الإدارة | انطلاقتك الدراسية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body>
        <AuthProvider>
          <SiteSettingsProvider>
            <Shell>{children}</Shell>
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
