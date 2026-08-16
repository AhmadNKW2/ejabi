'use client';

import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { ComponentType } from 'react';

type IconName = 'edit' | 'delete' | 'add' | 'change';
type Tone = 'amber' | 'danger' | 'slate';

const icons: Record<IconName, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  edit: Pencil,
  delete: Trash2,
  add: Plus,
  change: RefreshCw,
};

const tones = {
  amber:
    'text-amber bg-amber/10 hover:bg-amber/22 hover:shadow-[0_8px_18px_-10px_rgba(232,163,61,.85)]',
  danger:
    'text-danger bg-danger/10 hover:bg-danger/22 hover:shadow-[0_8px_18px_-10px_rgba(201,106,79,.85)]',
  slate:
    'text-slate bg-white/[0.04] hover:bg-white/10 hover:text-paper',
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
  tone?: Tone;
}) {
  const Icon = icons[icon];
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/70 ${tones[tone]}`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} aria-hidden />
    </button>
  );
}
