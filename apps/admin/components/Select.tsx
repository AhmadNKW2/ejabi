'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type SelectOption = {
  value: string;
  label: string;
  sub?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = 'اختر',
  searchable = true,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(s) || (o.sub && o.sub.toLowerCase().includes(s)),
    );
  }, [options, q]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setQ('');
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-[10px] border-0 bg-ink-3 px-3 py-2.5 text-right"
        onClick={() => setOpen((v) => !v)}
      >
        {selected?.icon}
        <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-slate'}`}>
          {selected ? selected.label : placeholder}
        </span>
        {selected?.sub ? <span className="text-xs text-slate">{selected.sub}</span> : null}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-slate">
          ▾
        </motion.span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl bg-ink-2 p-2 shadow-xl"
          >
            {searchable ? (
              <input
                autoFocus
                className="mb-2"
                placeholder="بحث..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            ) : null}
            {filtered.map((o) => (
              <button
                type="button"
                key={o.value}
                disabled={o.disabled}
                className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-right ${
                  o.disabled
                    ? 'cursor-not-allowed opacity-40'
                    : o.value === value
                      ? 'bg-ink-3 hover:bg-ink-3'
                      : 'hover:bg-ink-3'
                }`}
                onClick={() => {
                  if (o.disabled) return;
                  onChange(o.value);
                  setOpen(false);
                  setQ('');
                }}
              >
                {o.icon}
                <span className="flex-1">{o.label}</span>
                {o.disabled ? <span className="text-xs text-slate">مضاف</span> : null}
                {!o.disabled && o.sub ? <span className="text-xs text-slate">{o.sub}</span> : null}
              </button>
            ))}
            {filtered.length === 0 ? <p className="p-3 text-sm text-slate">لا نتائج</p> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
