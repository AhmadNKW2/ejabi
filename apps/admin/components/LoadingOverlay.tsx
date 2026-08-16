'use client';

import { AnimatePresence, motion } from 'framer-motion';

export function LoadingOverlay({ show, label = 'جاري التحميل...' }: { show: boolean; label?: string }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0c1826]/70 backdrop-blur-[10px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3 rounded-2xl bg-ink-2/90 px-8 py-6 shadow-2xl"
          >
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-amber/25 border-t-amber" />
            <span className="text-sm text-slate">{label}</span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
