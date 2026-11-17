import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { motion } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'settings';
}

export function PWAInstallButton({ variant = 'sidebar' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={install}
        className={
          variant === 'settings'
            ? 'inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-xs font-medium whitespace-nowrap text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]'
            : 'inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 text-xs font-medium whitespace-nowrap text-[var(--accent)] transition-colors hover:opacity-90'
        }
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>تثبيت التطبيق على الجهاز</span>
      </motion.button>
    );
  }

  if (isIOS) {
    return (
      <>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'settings'
              ? 'inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-medium whitespace-nowrap text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              : 'inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-xs font-medium whitespace-nowrap text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
          }
        >
          <Share className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <span>تثبيت على iPhone / iPad</span>
        </motion.button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3
                  id="ios-install-title"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  تثبيت التطبيق على iPhone و iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="إغلاق"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                <li>١. اضغط على زر <strong>المشاركة (Share)</strong> في شريط Safari.</li>
                <li>٢. مرّر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</li>
                <li>٣. اضغط <strong>إضافة</strong> ليعمل التطبيق دون اتصال كبرنامج مستقل.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 h-10 w-full rounded-xl bg-[var(--accent)] text-xs font-medium text-[var(--accent-ink)]"
              >
                حسناً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
