'use client';

import { AnimatePresence, motion } from 'framer-motion';

export function LoadingOverlay({
  show,
  label = 'جاري التحميل...',
}: {
  show: boolean;
  label?: string;
}) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#060c14]/72 backdrop-blur-[12px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3.5 rounded-[22px] bg-ink-2 px-9 py-7 shadow-sheet"
          >
            <span className="h-11 w-11 animate-spin rounded-full border-2 border-amber/25 border-t-amber" />
            <span className="font-cairo text-sm font-extrabold text-paper">{label}</span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
