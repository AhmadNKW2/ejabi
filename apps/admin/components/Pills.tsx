'use client';

import { ReactNode } from 'react';

export function Pills({
  items,
  value,
  onChange,
  nowrap,
}: {
  items: { id: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  nowrap?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${nowrap ? 'flex-nowrap overflow-x-auto pb-1' : 'flex-wrap'}`}>
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id || 'all'}
            type="button"
            onClick={() => onChange(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'bg-amber font-bold text-ink'
                : 'border-0 bg-ink-3 text-paper hover:bg-white/10'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
