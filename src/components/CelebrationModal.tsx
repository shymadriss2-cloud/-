import { AnimatePresence, motion } from 'motion/react';
import { Award, CheckCircle2, X } from 'lucide-react';
import { JUZ_NAMES_AR } from '../engine/mushaf';

interface CelebrationModalProps {
  juz: number | null;
  onClose: () => void;
}

export function CelebrationModal({ juz, onClose }: CelebrationModalProps) {
  return (
    <AnimatePresence>
      {juz !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebration-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center shadow-lg"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق نافذة التهنئة"
              className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ scale: 0.7, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.08 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--gold)]"
            >
              <Award className="h-10 w-10" />
            </motion.div>

            <p className="text-xs font-medium text-[var(--gold)]">إنجاز مبارك</p>
            <h2
              id="celebration-title"
              className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)]"
            >
              أتممت {JUZ_NAMES_AR[juz] ?? `الجزء ${juz}`}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              الحمد لله الذي بنعمته تتم الصالحات. استمر بثبات وهدوء، واجعل مراجعة هذا الجزء ضمن وردك
              ليرسخ في صدرك.
            </p>

            <p className="font-display mt-4 rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-base text-[var(--text-primary)]">
              «رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ»
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>مواصلة الرحلة</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
