'use client';

import { cn } from '@/lib/cn';

export function OptionPills({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string; caption?: string }[];
  value: string | null;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2.5', className)}>
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'rounded-full border px-3.5 py-2 font-cairo text-sm font-extrabold leading-tight transition-colors',
              active
                ? 'border-amber bg-amber text-ink'
                : 'border-white/15 bg-ink-3 text-paper hover:border-amber/45 hover:bg-white/[0.06]',
            )}
          >
            {item.label}
            {item.caption ? (
              <small
                className={cn(
                  'ms-1.5 font-tajawal text-[11px] font-medium',
                  active ? 'text-ink/70' : 'text-slate',
                )}
              >
                {item.caption}
              </small>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
