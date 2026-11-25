import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { addMonths, formatShortArabicDate, getTodayLocalISO } from '../engine/planner';
import type { MemorizationOrder } from '../types/plan';
import { AppLogo } from './AppLogo';

interface SetupScreenProps {
  onConfirmPlan: (startDate: string, order: MemorizationOrder) => void;
}

export function SetupScreen({ onConfirmPlan }: SetupScreenProps) {
  const [startDate, setStartDate] = useState<string>(() => getTodayLocalISO());
  const [order, setOrder] = useState<MemorizationOrder>('A');
  const [confirmedLock, setConfirmedLock] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const phase1EndDate = startDate ? addMonths(startDate, 30) : '';
  const planEndDate = startDate ? addMonths(startDate, 36) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      setErrorMsg('يرجى تحديد تاريخ بداية الخطة.');
      return;
    }
    if (!confirmedLock) {
      setErrorMsg('يرجى تأكيد الموافقة على تثبيت الخطة لمدة ٣ سنوات.');
      return;
    }
    setErrorMsg('');
    onConfirmPlan(startDate, order);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] px-4 py-8 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/25 bg-[linear-gradient(145deg,var(--accent-soft)_0%,var(--bg-surface)_100%)] text-[var(--accent)] shadow-sm">
            <AppLogo variant="badge" className="h-11 w-11" />
          </div>
          <h1 className="font-display text-3xl font-bold leading-relaxed text-[var(--text-primary)] md:text-4xl">
            وِرْد مُدَّكِر
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)] md:text-base">
            خطة هادئة ثابتة لحفظ القرآن الكريم كاملاً في ٣ سنوات وفق مصحف المدينة المنورة (٦٠٤ صفحات)
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 md:p-8"
        >
          <div className="border-b border-[var(--border-hairline)] pb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              إعداد الخطة الثابتة (خطوة واحدة قبل البدء)
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              الأشهر ١–٣٠: صفحة واحدة يومياً من الأحد إلى الخميس، والجمعة مراجعة وتسميع، والسبت
              استدراك وراحة. الأشهر ٣١–٣٦: مراجعة شاملة بواقع جزء يومياً.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <label
                htmlFor="plan-start-date"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                ١. تاريخ بداية الخطة
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1">
                  <input
                    id="plan-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 text-sm tabular-nums text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                    required
                  />
                </div>
                {startDate && (
                  <p className="text-xs text-[var(--text-muted)]">
                    نهاية الحفظ: <span className="font-medium text-[var(--text-secondary)]">{formatShortArabicDate(phase1EndDate)}</span>
                    {' · '}
                    ختام التثبيت: <span className="font-medium text-[var(--text-secondary)]">{formatShortArabicDate(planEndDate)}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-[var(--text-primary)]">
                ٢. ترتيب مسار الحفظ
              </span>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setOrder('A')}
                  aria-pressed={order === 'A'}
                  className={`flex flex-col items-start rounded-xl border p-4 text-right transition-colors ${
                    order === 'A'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    المسار أ: من الفاتحة صعوداً
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    من الجزء ١ (صفحة ١) حتى الجزء ٣٠ (صفحة ٦٠٤) بالترتيب المتتابع للمصحف.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrder('B')}
                  aria-pressed={order === 'B'}
                  className={`flex flex-col items-start rounded-xl border p-4 text-right transition-colors ${
                    order === 'B'
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    المسار ب: من جزء عمّ نزولاً
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    من الجزء ٣٠ نزولاً إلى الجزء ١، مع حفظ الصفحات تصاعدياً داخل كل جزء (مثال: ٥٨٢ ← ٦٠٤).
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <div className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  <p className="font-medium text-[var(--text-primary)]">
                    خطة مقفلة وثابتة لنجاح الاستمرارية
                  </p>
                  <p className="mt-1">
                    بعد تثبيت الخطة لا يمكن تعديل تاريخ البداية أو المسار، ولا تتغير الجدولة عند الغياب؛
                    بل تترحّل الصفحات الفائتة تلقائياً إلى يوم السبت للاستدراك، وتحفظ بياناتك محلياً
                    على جهازك فقط.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={confirmedLock}
                onChange={(e) => {
                  setConfirmedLock(e.target.checked);
                  if (e.target.checked) setErrorMsg('');
                }}
                className="h-5 w-5 rounded border-[var(--border-hairline)] accent-[var(--accent)]"
              />
              <span>أؤكد اختياري وأرغب في تثبيت الخطة والبدء</span>
            </label>

            {errorMsg && (
              <p role="alert" className="text-sm font-medium text-[var(--danger)]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="btn-accent-glow inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>تثبيت الخطة والبدء</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
