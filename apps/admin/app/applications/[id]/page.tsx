'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { APPLICATION_STATUS_LABELS, ApplicationDto } from '@ejabi/shared';
import { api } from '@/lib/api';
import { RequireAdmin } from '@/components/RequireAdmin';
import { ApplicationChoiceTree } from '@/components/ApplicationChoiceTree';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<ApplicationDto | null>(null);

  useEffect(() => {
    api<ApplicationDto>(`/admin/applications/${params.id}`).then(setApp);
  }, [params.id]);

  if (!app) return <RequireAdmin>جاري التحميل...</RequireAdmin>;

  return (
    <RequireAdmin>
      <Link href="/applications" className="text-sm text-slate hover:text-amber">
        ← رجوع للطلبات
      </Link>
      <h1 className="mb-2 mt-3 font-cairo text-2xl font-black text-amber">تفاصيل الطلب</h1>
      <p className="mb-5 text-slate">
        {app.user?.fullName} · {app.user?.email} · {app.user?.phone || 'بدون هاتف'} ·{' '}
        {APPLICATION_STATUS_LABELS[app.status]}
      </p>
      <ApplicationChoiceTree choices={app.choices} />
    </RequireAdmin>
  );
}
