'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Phone } from 'lucide-react';
import { ApplicationDto } from '@ejabi/shared';
import { api } from '@/lib/api';
import { RequireAdmin } from '@/components/RequireAdmin';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ApplicationChoiceTree } from '@/components/ApplicationChoiceTree';
import { StatusBadge, formatAppDate } from '@/components/ApplicationStatus';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<ApplicationDto | null>(null);

  useEffect(() => {
    api<ApplicationDto>(`/admin/applications/${params.id}`).then(setApp).catch(() => setApp(null));
  }, [params.id]);

  return (
    <RequireAdmin>
      <LoadingOverlay show={!app} />
      <Link href="/applications" className="text-sm text-slate no-underline hover:text-amber">
        رجوع إلى الطلبات
      </Link>
      {app ? (
        <>
          <div className="mb-6 mt-4 rounded-2xl bg-ink-2 p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={app.status} />
              <span className="text-xs text-slate">{formatAppDate(app.createdAt)}</span>
            </div>
            <h1 className="font-cairo text-2xl font-black text-paper">{app.user?.fullName || 'طالب'}</h1>
            {app.user?.phone ? (
              <a
                href={`tel:${app.user.phone}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate no-underline hover:text-amber"
                dir="ltr"
              >
                <Phone size={14} strokeWidth={1.9} />
                {app.user.phone}
              </a>
            ) : (
              <p className="mt-2 text-sm text-slate">بدون هاتف</p>
            )}
          </div>
          <p className="mb-3 font-cairo text-sm font-extrabold text-amber">الخيارات حسب الأفضلية</p>
          <ApplicationChoiceTree choices={app.choices} />
        </>
      ) : null}
    </RequireAdmin>
  );
}
