import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import type { TodayPageFocusStatus } from '../engine/planner';
import type { MethodProgress, TaskRating } from '../types/plan';
import { ArabesqueDivider, HeroCornerArabesque } from './IslamicOrnament';
import { TodayPageBadge } from './TodayPageBadge';

interface MethodScreenProps {
  todaySabaqPage: number | null;
  previousPage: number | null;
  todayFocus: TodayPageFocusStatus;
  progress: MethodProgress | null;
  customDurations?: Record<number, number>;
  todayIso: string;
  onUpdateProgress: (next: MethodProgress) => void;
  onUpdateDuration: (stepId: number, minutes: number) => void;
  onCompleteTodaySabaq?: (rating: TaskRating) => void;
}

interface MethodStepDef {
  id: number;
  title: string;
  suggestedMinutes: number;
  description: string;
  helper: string;
}

const STEPS: MethodStepDef[] = [
  {
    id: 0,
    title: '١. قراءة الصفحة بالنظر ١٠ مرات',
    suggestedMinutes: 6,
    description:
      'اقرأ الصفحة كاملة من المصحف بهدوء وتأنٍ عشر مرات متتالية مع إمعان النظر في مواضع الآيات وأواخر السطور.',
    helper: 'استخدم عدّاد القراءات أدناه لإحصاء المرات العشر.',
  },
  {
    id: 1,
    title: '٢. الحفظ آيةً بآية مع التكرار',
    suggestedMinutes: 12,
    description:
      'احفظ الآية الأولى وكررها غيباً ٣–٥ مرات، ثم الآية الثانية كذلك، ثم اجمع الأولى والثانية معاً حتى نهاية الصفحة.',
    helper: 'ركّز على ربط نهاية كل آية ببداية الآية التالية.',
  },
  {
    id: 2,
    title: '٣. التسميع غيباً دون نظر',
    suggestedMinutes: 5,
    description:
      'أغلق المصحف واسمع الصفحة كاملة غيباً من أولها إلى آخرها بصوت مسموع، ثم راجع أي موضع تردّدت فيه.',
    helper: 'لا تنتقل للخطوة التالية قبل تسميع الصفحة متصلة بلا توقف.',
  },
  {
    id: 3,
    title: '٤. الربط بالصفحة السابقة',
    suggestedMinutes: 4,
    description:
      'اسمع السطرين الأخيرين من الصفحة السابقة متصلين بالصفحة الجديدة كاملة لتثبيت التسلسل الذهني بين الصفحات.',
    helper: 'هذا الربط يمنع التوقف عند رؤوس الصفحات مستقبلاً.',
  },
  {
    id: 4,
    title: '٥. التسميع قبل النوم',
    suggestedMinutes: 4,
    description:
      'قبل أن تنام بدقائق، استذكر الصفحة غيباً في ذهنك أو في ركعتي وتر؛ فالنوم يثبّت آخر ما استحضره الدماغ.',
    helper: 'اجعلها خاتمة يومك لترسخ الصفحة في الذاكرة طويلة المدى.',
  },
];

function StepTimer({
  minutes,
  stepId,
}: {
  minutes: number;
  stepId: number;
}) {
  const initialSeconds = Math.max(1, minutes) * 60;
  const [remaining, setRemaining] = useState<number>(initialSeconds);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    setRunning(false);
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 shadow-xs">
      <span className="font-mono-num text-sm font-medium text-[var(--text-primary)]">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? `إيقاف مؤقت الخطوة ${stepId + 1}` : `بدء مؤقت الخطوة ${stepId + 1}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--accent)] hover:bg-[var(--bg-subtle)]"
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => {
          setRunning(false);
          setRemaining(initialSeconds);
        }}
        aria-label={`إعادة ضبط مؤقت الخطوة ${stepId + 1}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function MethodScreen({
  todaySabaqPage,
  previousPage,
  todayFocus,
  progress,
  customDurations = {},
  todayIso,
  onUpdateProgress,
  onUpdateDuration,
  onCompleteTodaySabaq,
}: MethodScreenProps) {
  const [pickingFinishRating, setPickingFinishRating] = useState<boolean>(false);

  const activeProgress: MethodProgress =
    progress && progress.date === todayIso
      ? progress
      : { date: todayIso, sightReads: 0, completedSteps: [] };

  const toggleStep = (stepId: number) => {
    const exists = activeProgress.completedSteps.includes(stepId);
    const nextSteps = exists
      ? activeProgress.completedSteps.filter((id) => id !== stepId)
      : [...activeProgress.completedSteps, stepId];
    onUpdateProgress({ ...activeProgress, completedSteps: nextSteps });
  };

  const incrementSightReads = () => {
    const nextCount = Math.min(10, activeProgress.sightReads + 1);
    const nextSteps =
      nextCount === 10 && !activeProgress.completedSteps.includes(0)
        ? [...activeProgress.completedSteps, 0]
        : activeProgress.completedSteps;
    onUpdateProgress({ ...activeProgress, sightReads: nextCount, completedSteps: nextSteps });
  };

  const resetToday = () => {
    onUpdateProgress({ date: todayIso, sightReads: 0, completedSteps: [] });
  };

  return (
    <div className="space-y-6">
      <section className="card-hero rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <HeroCornerArabesque className="absolute -left-6 -top-6 h-48 w-48 text-[var(--accent)] opacity-[0.22]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <TodayPageBadge
              focus={todayFocus}
              variant="hero"
              testId="method-hero-page-badge"
            />
            <div>
              <p className="text-xs text-[var(--text-muted)]">منهجية متدرجة بمؤقتات قابلة للتعديل</p>
              <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
                طريقة الحفظ الفعّالة
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {todaySabaqPage !== null
                  ? `تُطبَّق على صفحة اليوم: صفحة ${todaySabaqPage}${
                      previousPage ? ` · الربط مع صفحة ${previousPage}` : ''
                    }`
                  : 'خمس خطوات عملية لترسيخ الصفحة الواحدة في الذاكرة طويلة المدى'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-semibold tabular-nums text-[var(--accent)]">
              {activeProgress.completedSteps.length} / {STEPS.length} خطوات
            </span>
            <button
              type="button"
              onClick={resetToday}
              className="h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              إعادة ضبط الجلسة
            </button>
            {todaySabaqPage !== null && onCompleteTodaySabaq && !todayFocus.isCompleted && (
              <button
                type="button"
                onClick={() => setPickingFinishRating((v) => !v)}
                className="btn-accent-glow inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-xs font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>إنهاء حفظ صفحة {todaySabaqPage}</span>
              </button>
            )}
          </div>
        </div>

        {pickingFinishRating && todaySabaqPage !== null && onCompleteTodaySabaq && !todayFocus.isCompleted && (
          <div className="relative z-10 mt-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              اختر تقييم إتقان صفحة {todaySabaqPage} لاعتماد إنهاء مهمة اليوم:
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:max-w-md">
              <button
                type="button"
                onClick={() => {
                  setPickingFinishRating(false);
                  onCompleteTodaySabaq('perfect');
                }}
                className="h-10 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]"
              >
                ممتاز
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickingFinishRating(false);
                  onCompleteTodaySabaq('hesitated');
                }}
                className="h-10 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold-soft)] text-xs font-semibold text-[var(--gold)]"
              >
                متردد
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickingFinishRating(false);
                  onCompleteTodaySabaq('mistakes');
                }}
                className="h-10 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] text-xs font-semibold text-[var(--danger)]"
              >
                أخطاء
              </button>
            </div>
          </div>
        )}

        <ArabesqueDivider className="relative z-10 mt-5" />
      </section>

      <div className="space-y-4">
        {STEPS.map((step) => {
          const isDone = activeProgress.completedSteps.includes(step.id);
          const stepMinutes = customDurations[step.id] ?? step.suggestedMinutes;
          const isCustomized = stepMinutes !== step.suggestedMinutes;

          return (
            <section
              key={step.id}
              className={`card-interactive rounded-2xl border p-5 ${
                isDone
                  ? 'border-[var(--accent)]/45 bg-[var(--accent-soft)]/35'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>الزمن المقترح:</span>
                    <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-1.5 py-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateDuration(step.id, Math.max(1, stepMinutes - 1))}
                        aria-label={`إنقاص زمن الخطوة ${step.id + 1}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={stepMinutes}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          if (!Number.isNaN(parsed)) {
                            onUpdateDuration(step.id, Math.min(120, Math.max(1, parsed)));
                          }
                        }}
                        aria-label={`تعديل مدة الخطوة ${step.id + 1} بالدقائق`}
                        className="w-9 bg-transparent text-center text-xs font-semibold tabular-nums text-[var(--text-primary)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-[11px] text-[var(--text-muted)]">د</span>
                      <button
                        type="button"
                        onClick={() => onUpdateDuration(step.id, Math.min(120, stepMinutes + 1))}
                        aria-label={`زيادة زمن الخطوة ${step.id + 1}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {isCustomized && (
                      <button
                        type="button"
                        onClick={() => onUpdateDuration(step.id, step.suggestedMinutes)}
                        aria-label={`استعادة الزمن الافتراضي للخطوة ${step.id + 1}`}
                        className="text-[11px] font-medium text-[var(--accent)] hover:underline"
                      >
                        استعادة ({step.suggestedMinutes} د)
                      </button>
                    )}
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold text-[var(--text-primary)]">
                    {step.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {step.description}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{step.helper}</p>

                  {step.id === 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={incrementSightReads}
                        disabled={activeProgress.sightReads >= 10}
                        className="btn-accent-glow inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-xs font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        <span>تسجيل قراءة بالنظر ({activeProgress.sightReads} / ١٠)</span>
                      </motion.button>
                      <div className="flex items-center gap-1" aria-label="تقدم القراءات العشر">
                        {Array.from({ length: 10 }, (_, idx) => {
                          const filled = idx < activeProgress.sightReads;
                          return (
                            <motion.span
                              key={idx}
                              animate={filled ? { scaleY: [1, 1.3, 1] } : { scaleY: 1 }}
                              transition={{ duration: 0.2 }}
                              className={`h-2.5 w-4 rounded-xs transition-colors ${
                                filled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-muted)]'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step.id === 3 && previousPage !== null && todaySabaqPage !== null && (
                    <p className="mt-3 text-xs font-medium text-[var(--accent)]">
                      التمرين العملي الآن: اربط صفحة {previousPage} بنهايتها ← صفحة {todaySabaqPage}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end">
                  <StepTimer minutes={stepMinutes} stepId={step.id} />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleStep(step.id)}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
                      isDone
                        ? 'border border-[var(--accent)]/40 bg-[var(--bg-surface)] text-[var(--accent)]'
                        : 'border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>مكتملة</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>إتمام الخطوة</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
