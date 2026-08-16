'use client';

import { motion } from 'framer-motion';

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? 'bg-teal' : 'bg-ink-3'
        }`}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-paper shadow"
          animate={{ x: checked ? 20 : 0 }}
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </span>
      {label ? <span className="text-sm text-slate">{label}</span> : null}
    </button>
  );
}
