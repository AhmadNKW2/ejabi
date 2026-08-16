'use client';

import { ReactNode } from 'react';

type IconName = 'edit' | 'delete' | 'change';

const icons: Record<IconName, ReactNode> = {
  edit: (
    <>
      <path d="M13.5 5.2 18.8 10.5" />
      <path d="M4 16.8 13.3 7.5a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L7.2 20H4z" />
    </>
  ),
  delete: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.4 7V5.4A1.4 1.4 0 0 1 10.8 4h2.4A1.4 1.4 0 0 1 14.6 5.4V7" />
      <path d="M8.2 7.5 9 19.1a1.5 1.5 0 0 0 1.5 1.4h3a1.5 1.5 0 0 0 1.5-1.4l.8-11.6" />
      <path d="M10.5 11.2v5.2M13.5 11.2v5.2" />
    </>
  ),
  change: (
    <>
      <path d="M7 8h11l-2.6-2.6" />
      <path d="M17 16H6l2.6 2.6" />
    </>
  ),
};

export function IconButton({
  icon,
  label,
  onClick,
  tone = 'amber',
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  tone?: 'amber' | 'danger';
}) {
  return (
    <button
      type="button"
      className={
        tone === 'danger'
          ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-danger/10 p-0 leading-none text-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-150 hover:-translate-y-px hover:bg-danger/[0.22] hover:shadow-[0_8px_18px_-10px_rgba(201,106,79,0.85)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
          : 'inline-flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-amber/10 p-0 leading-none text-amber shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-150 hover:-translate-y-px hover:bg-amber/[0.22] hover:shadow-[0_8px_18px_-10px_rgba(232,163,61,0.85)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2 focus-visible:ring-offset-ink'
      }
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {icons[icon]}
      </svg>
    </button>
  );
}
