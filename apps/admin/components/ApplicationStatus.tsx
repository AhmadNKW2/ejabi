'use client';

import { ApplicationStatus, APPLICATION_STATUS_LABELS } from '@ejabi/shared';

export const STATUS_TONE: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber/15 text-amber',
  CONTACTED: 'bg-teal/15 text-teal',
  IN_PROGRESS: 'bg-paper/10 text-paper',
  ACCEPTED: 'bg-teal/20 text-teal',
  REJECTED: 'bg-danger/15 text-danger',
  CANCELLED: 'bg-white/5 text-slate',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${STATUS_TONE[status]}`}>
      {APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

export function formatAppDate(value: string) {
  return new Date(value).toLocaleDateString('ar', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
