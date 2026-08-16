'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APPLICATION_STATUS_LABELS, ApplicationDto } from '@ejabi/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ApplicationChoiceTree } from '@/components/ApplicationChoiceTree';

function formatAppDate(value: string) {
  return new Date(value).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationDto[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/login?next=/applications');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      api<ApplicationDto[]>('/applications').then(setApps).catch(() => setApps([]));
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="mx-auto mb-10 mt-2 max-w-[860px]">
      <header>
        <h1 className="mb-1.5 font-cairo text-[28px] font-black text-amber">طلباتي</h1>
        <p className="mb-[22px] text-[14.5px] leading-[1.8] text-slate">كل طلب مرتب حسب الجامعة، ثم التخصصات، ثم المرحلة وسعرها.</p>
      </header>

      {apps.length === 0 ? (
        <div className="rounded-[10px] bg-ink-2 px-1 py-5 text-center text-sm text-slate">
          لا توجد طلبات بعد. أكمل المقارنة وقدّم من اللوحة الرئيسية.
        </div>
      ) : (
        <div className="grid gap-[18px]">
          {apps.map((app) => (
            <article key={app.id} className="overflow-hidden rounded-[20px] bg-ink-2 shadow-ticket">
              <header className="flex items-start justify-between gap-3 border-b border-line bg-amber-fade px-[18px] pb-3.5 pt-[18px]">
                <div>
                  <p className="mb-1 font-cairo text-[11.5px] font-extrabold tracking-[0.6px] text-amber">طلب دراسي</p>
                  <time className="text-[13.5px] text-slate" dateTime={app.createdAt}>
                    {formatAppDate(app.createdAt)}
                  </time>
                </div>
                <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber/[0.12] px-3 py-1.5 font-cairo text-[12.5px] font-extrabold text-amber">
                  {APPLICATION_STATUS_LABELS[app.status]}
                </span>
              </header>
              <ApplicationChoiceTree choices={app.choices} />
              {app.adminNote ? (
                <p className="m-0 border-t border-dashed border-line px-[18px] py-3 pb-4 text-[13.5px] leading-[1.8] text-slate">
                  <strong className="text-amber">ملاحظة الفريق: </strong>
                  {app.adminNote}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
