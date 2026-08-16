'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="إغلاق" />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-ink-2 p-6 shadow-2xl ${
              wide ? 'max-w-6xl' : 'max-w-lg'
            }`}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-cairo text-xl font-black text-amber">{title}</h2>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate hover:bg-white/10 hover:text-paper"
                onClick={onClose}
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" strokeWidth={1.85} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
