import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookCheck,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getDailyDua } from '../data/duas';
import { getDailyTip } from '../data/tips';
import { formatPageRangeAr, getJuzForPage, JUZ_NAMES_AR, TOTAL_MUSHAF_PAGES } from '../engine/mushaf';
import {
  formatArabicDate,
  formatShortArabicDate,
  getJuzCompletionStats,
  type MissedPageInfo,
} from '../engine/planner';
import type {
  DayLog,
  PageProgress,
  PlannedDay,
  ScreenId,
  TaskKind,
  TaskRating,
  TaskTimePreferences,
} from '../types/plan';
import { ProgressRing } from './ProgressRing';

interface TodayScreenProps {
  todayIso: string;
  startDate: string;
  plannedDay: PlannedDay | null;
  dayLog: DayLog | undefined;
  pageProgress: Record<number, PageProgress>;
  taskTimes: TaskTimePreferences;
  missedPages: MissedPageInfo[];
  extraReviewPages: number[];
  streak: number;
  memorizedCount: number;
  verifiedDuas: Record<string, boolean>;
  onUpdateTaskTime: (key: keyof TaskTimePreferences, time: string) => void;
  onCompleteTask: (
    date: string,
    kind: TaskKind,
    pages: number[],
    rating: TaskRating,
    durationSeconds: number
  ) => void;
  onUpdateFridayTeacher: (date: string, recited: boolean, note: string) => void;
  onCatchUpPage: (date: string, page: number) => void;
  onResolveExtraReview: (page: number) => void;
  onToggleDuaVerified: (duaId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

const RATING_LABELS: Record<TaskRating, { label: string; tone: string }> = {
  perfect: {
    label: 'ممتاز',
    tone: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30',
  },
  hesitated: {
    label: 'متردد',
    tone: 'bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/30',
  },
  mistakes: {
    label: 'أخطاء',
    tone: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/30',
  },
};

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

interface TaskCardProps {
  kind: TaskKind;
  title: string;
  subtitle: string;
  suggestedLabel: string;
  timeValue?: string;
  onTimeChange?: (val: string) => void;
  pages: number[];
  record?: { completed: boolean; rating?: TaskRating; durationSeconds?: number };
  emptyText?: string;
  onSubmitRating: (rating: TaskRating, elapsedSeconds: number) => void;
}

function DailyTaskCard({
  kind,
  title,
  subtitle,
  suggestedLabel,
  timeValue,
  onTimeChange,
  pages,
  record,
  emptyText,
  onSubmitRating,
}: TaskCardProps) {
  const [seconds, setSeconds] = useState<number>(record?.durationSeconds ?? 0);
  const [running, setRunning] = useState<boolean>(false);
  const [pickingRating, setPickingRating] = useState<boolean>(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const isCompleted = Boolean(record?.completed);
  const hasPages = pages.length > 0;

  return (
    <motion.section
      layout
      className={`rounded-2xl border p-5 transition-colors ${
        isCompleted
          ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/35'
          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{suggestedLabel}</span>
            {timeValue !== undefined && onTimeChange ? (
              <label className="inline-flex items-center gap-1.5">
                <span className="sr-only">وقت {title}</span>
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => onTimeChange(e.target.value)}
                  aria-label={`تعديل وقت ${title}`}
                  className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-0.5 text-xs tabular-nums text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>
            ) : null}
          </div>

          <h3 className="mt-1.5 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>

          <div className="mt-3 text-sm font-medium text-[var(--text-primary)]">
            {hasPages ? (
              <span>
                {formatPageRangeAr(pages)}
                {pages.length === 1 ? ` · الجزء ${getJuzForPage(pages[0])}` : ''}
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">{emptyText ?? 'لا توجد صفحات مجدولة اليوم'}</span>
            )}
          </div>
        </div>

        {hasPages && (
          <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              <span className="font-mono-num text-sm font-medium text-[var(--text-primary)]">
                {formatTimer(seconds)}
              </span>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                aria-label={running ? `إيقاف مؤقت ${title}` : `تشغيل مؤقت ${title}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--accent)] transition-colors hover:bg-[var(--bg-subtle)]"
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setSeconds(0);
                }}
                aria-label={`تصفير مؤقت ${title}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {!pickingRating ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setRunning(false);
                  setPickingRating(true);
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  isCompleted
                    ? 'border border-[var(--accent)]/40 bg-[var(--bg-surface)] text-[var(--accent)] hover:bg-[var(--bg-subtle)]'
                    : 'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]'
                }`}
              >
                <Check className="h-4 w-4" />
                <span>{isCompleted ? 'تحديث التقييم' : 'تم'}</span>
              </motion.button>
            ) : null}
          </div>
        )}
      </div>

      {isCompleted && record?.rating && !pickingRating && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-hairline)] pt-3 text-xs"
        >
          <span className="text-[var(--text-secondary)]">التقييم المسجّل:</span>
          <span
            className={`rounded-lg border px-2.5 py-1 font-medium ${RATING_LABELS[record.rating].tone}`}
          >
            {RATING_LABELS[record.rating].label}
          </span>
        </motion.div>
      )}

      <AnimatePresence>
        {pickingRating && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 border-t border-[var(--border-hairline)] pt-4"
            data-testid={`rating-picker-${kind}`}
          >
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              قيّم جودة الحفظ والمراجعة لهذا الورد:
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {(['perfect', 'hesitated', 'mistakes'] as TaskRating[]).map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setPickingRating(false);
                    onSubmitRating(r, seconds);
                  }}
                  className={`h-11 rounded-xl border text-sm font-medium transition-colors hover:opacity-90 ${RATING_LABELS[r].tone}`}
                >
                  {RATING_LABELS[r].label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export function TodayScreen({
  todayIso,
  startDate,
  plannedDay,
  dayLog,
  pageProgress,
  taskTimes,
  missedPages,
  extraReviewPages,
  streak,
  memorizedCount,
  verifiedDuas,
  onUpdateTaskTime,
  onCompleteTask,
  onUpdateFridayTeacher,
  onCatchUpPage,
  onResolveExtraReview,
  onToggleDuaVerified,
  onNavigate,
}: TodayScreenProps) {
  const dayIndex = plannedDay?.dayIndex ?? 0;
  const dailyDua = getDailyDua(dayIndex);
  const dailyTip = getDailyTip(dayIndex);

  const activeJuz =
    plannedDay?.sabaqJuz ??
    plannedDay?.fullReviewJuz ??
    (plannedDay?.sabqiPages.length
      ? getJuzForPage(plannedDay.sabqiPages[plannedDay.sabqiPages.length - 1])
      : 1);
  const juzStats = getJuzCompletionStats(pageProgress, activeJuz);

  const [teacherNoteDraft, setTeacherNoteDraft] = useState<string>(dayLog?.teacherNote ?? '');
  useEffect(() => {
    setTeacherNoteDraft(dayLog?.teacherNote ?? '');
  }, [dayLog?.teacherNote, todayIso]);

  const phaseLabel =
    plannedDay?.phase === 'full_review'
      ? 'مرحلة المراجعة الشاملة (الأشهر ٣١–٣٦)'
      : plannedDay?.phase === 'consolidation'
      ? 'مرحلة التثبيت'
      : 'مرحلة الحفظ والتثبيت (الأشهر ١–٣٠)';

  return (
    <div className="space-y-6">
      {/* Top Overview Strip */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">
              {formatArabicDate(todayIso)}
              {plannedDay ? ` · الشهر ${plannedDay.monthNumber} من ٣٦` : ''}
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              ورد اليوم
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{phaseLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">سلسلة الاستمرار</p>
                <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                  {streak} يوم
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ProgressRing
                percent={juzStats.percent}
                size={68}
                strokeWidth={6}
                label={`${juzStats.percent}%`}
                sublabel={`ج ${activeJuz}`}
              />
              <div>
                <p className="text-xs text-[var(--text-muted)]">{JUZ_NAMES_AR[activeJuz]}</p>
                <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {juzStats.done} / {juzStats.total} صفحة
                </p>
                <p className="text-xs tabular-nums text-[var(--text-muted)]">
                  الإجمالي: {memorizedCount} / {TOTAL_MUSHAF_PAGES}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gentle Warning if > 3 pages behind */}
      {missedPages.length > 3 && (
        <section
          role="status"
          className="rounded-2xl border border-[var(--warn)]/30 bg-[var(--warn-soft)] p-4 text-sm"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warn)]" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                تنبيه لطيف: لديك {missedPages.length} صفحات متأخرة عن الخطة
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                لا تقلق ولا تغيّر الخطة الثابتة؛ يمكنك استدراك الصفحات الفائتة تدريجياً في يوم
                السبت المخصص للمراجعة والاستدراك.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Before start date or after 36 months */}
      {!plannedDay ? (
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {todayIso < startDate
              ? `تبدأ خطتك يوم ${formatShortArabicDate(startDate)}`
              : 'أتممت بفضل الله فترة ٣٦ شهراً من الخطة'}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {todayIso < startDate
              ? 'يمكنك استعراض الجدول الكامل من صفحة الخطة وتجهيز مصحفك وأوقات المراجعة.'
              : 'يمكنك متابعة المراجعة الشاملة عبر خريطة المصحف والإحصائيات.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('plan')}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-ink)]"
          >
            استعراض الخطة الكاملة
          </button>
        </section>
      ) : plannedDay.phase === 'full_review' ? (
        /* Months 31-36 Full Review Card */
        <DailyTaskCard
          kind="full_review"
          title={`مراجعة ${JUZ_NAMES_AR[plannedDay.fullReviewJuz ?? 1]}`}
          subtitle="ورد المراجعة الشاملة اليومي (جزء كامل يومياً)"
          suggestedLabel="الورد اليومي الثابت"
          pages={plannedDay.fullReviewPages}
          record={dayLog?.tasks.full_review}
          onSubmitRating={(rating, secs) =>
            onCompleteTask(todayIso, 'full_review', plannedDay.fullReviewPages, rating, secs)
          }
        />
      ) : plannedDay.isSaturday ? (
        /* Saturday: Catch-up + Rest */
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-[var(--text-muted)]">يوم السبت · الاستدراك والراحة</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                استدراك الصفحات الفائتة
              </h2>
            </div>
            <span className="text-xs font-medium tabular-nums text-[var(--text-secondary)]">
              {missedPages.length === 0
                ? 'لا توجد صفحات متأخرة'
                : `${missedPages.length} صفحة للاستدراك`}
            </span>
          </div>

          {missedPages.length === 0 ? (
            <div className="mt-4 rounded-xl bg-[var(--accent-soft)]/50 p-4 text-sm text-[var(--text-secondary)]">
              ما شاء الله! لا توجد عليك صفحات فائتة. استمتع بيوم راحة هادئ أو راجع ما تحب من
              الأجزاء السابقة.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border-hairline)] rounded-xl border border-[var(--border-hairline)]">
              {missedPages.map((m) => (
                <li
                  key={m.page}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      صفحة {m.page} · الجزء {m.juz}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      مجدولة في {formatShortArabicDate(m.scheduledDate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCatchUpPage(todayIso, m.page)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-xs font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تم الاستدراك</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        /* Sun-Thu (and Friday with Weekly Review + Teacher Recitation) */
        <div className="space-y-4">
          {plannedDay.isFriday ? (
            <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">يوم الجمعة · التثبيت الأسبوعي</p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    مراجعة صفحات الأسبوع (٥ صفحات) والتسميع
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {formatPageRangeAr(plannedDay.weeklyReviewPages)}
                  </p>
                </div>
                {plannedDay.weeklyReviewPages.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      onCompleteTask(
                        todayIso,
                        'friday_review',
                        plannedDay.weeklyReviewPages,
                        'perfect',
                        0
                      )
                    }
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium ${
                      dayLog?.tasks.friday_review?.completed
                        ? 'border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    <span>
                      {dayLog?.tasks.friday_review?.completed
                        ? 'تمت مراجعة الأسبوع'
                        : 'إتمام مراجعة الأسبوع'}
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3 border-t border-[var(--border-hairline)] pt-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={Boolean(dayLog?.recitedToTeacher)}
                    onChange={(e) =>
                      onUpdateFridayTeacher(todayIso, e.target.checked, teacherNoteDraft)
                    }
                    className="h-5 w-5 rounded border-[var(--border-hairline)] accent-[var(--accent)]"
                  />
                  <span>تم التسميع للمعلم / المعلمة</span>
                </label>

                <div>
                  <label
                    htmlFor="teacher-note-input"
                    className="block text-xs text-[var(--text-muted)]"
                  >
                    ملاحظة قصيرة حول التسميع
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="teacher-note-input"
                      type="text"
                      value={teacherNoteDraft}
                      onChange={(e) => setTeacherNoteDraft(e.target.value)}
                      onBlur={() =>
                        onUpdateFridayTeacher(
                          todayIso,
                          Boolean(dayLog?.recitedToTeacher),
                          teacherNoteDraft
                        )
                      }
                      placeholder="مثال: ضبط التشكيل في أول صفحة ١٤"
                      className="h-10 flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFridayTeacher(
                          todayIso,
                          Boolean(dayLog?.recitedToTeacher),
                          teacherNoteDraft
                        )
                      }
                      className="h-10 rounded-xl border border-[var(--border-hairline)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <DailyTaskCard
              kind="sabaq"
              title="١. السبق (الحفظ الجديد)"
              subtitle="صفحة واحدة جديدة بإتقان وربط"
              suggestedLabel="المقترح: بعد الفجر"
              timeValue={taskTimes.sabaq}
              onTimeChange={(val) => onUpdateTaskTime('sabaq', val)}
              pages={plannedDay.sabaqPage !== null ? [plannedDay.sabaqPage] : []}
              record={dayLog?.tasks.sabaq}
              emptyText="أتممت حفظ جميع صفحات المصحف — اليوم للتثبيت والمراجعة"
              onSubmitRating={(rating, secs) =>
                onCompleteTask(
                  todayIso,
                  'sabaq',
                  plannedDay.sabaqPage !== null ? [plannedDay.sabaqPage] : [],
                  rating,
                  secs
                )
              }
            />
          )}

          <DailyTaskCard
            kind="sabqi"
            title="٢. السبقي (القريب)"
            subtitle="مراجعة آخر ٧ صفحات محفوظة"
            suggestedLabel="المقترح: العصر"
            timeValue={taskTimes.sabqi}
            onTimeChange={(val) => onUpdateTaskTime('sabqi', val)}
            pages={plannedDay.sabqiPages}
            record={dayLog?.tasks.sabqi}
            emptyText="يبدأ السبقي بعد حفظ أول صفحة"
            onSubmitRating={(rating, secs) =>
              onCompleteTask(todayIso, 'sabqi', plannedDay.sabqiPages, rating, secs)
            }
          />

          <DailyTaskCard
            kind="manzil"
            title="٣. المنزل (المراجعة الدورية)"
            subtitle="تدوير الصفحات الأقدم لترسيخها"
            suggestedLabel="المقترح: قبل النوم"
            timeValue={taskTimes.manzil}
            onTimeChange={(val) => onUpdateTaskTime('manzil', val)}
            pages={plannedDay.manzilPages}
            record={dayLog?.tasks.manzil}
            emptyText="يبدأ المنزل تلقائياً بعد تجاوز أول ٧ صفحات"
            onSubmitRating={(rating, secs) =>
              onCompleteTask(todayIso, 'manzil', plannedDay.manzilPages, rating, secs)
            }
          />
        </div>
      )}

      {/* Extra Review Queue (Pages rated Mistakes) */}
      {extraReviewPages.length > 0 && (
        <section className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--bg-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              صفحات مضافة للمراجعة الإضافية ({extraReviewPages.length})
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('mushaf')}
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              عرض في خريطة المصحف
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {extraReviewPages.slice(0, 12).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onResolveExtraReview(p)}
                title="اضغط عند إتمام المراجعة بإتقان"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 text-xs font-medium text-[var(--danger)] transition-colors hover:opacity-85"
              >
                <span>صفحة {p}</span>
                <Check className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Daily Dua & Daily Tip */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>دعاء اليوم من القرآن</span>
              <span>
                {dailyDua.surahName} · آية {dailyDua.ayahRef}
              </span>
            </div>
            <p className="font-display mt-3 text-xl leading-loose text-[var(--text-primary)]">
              «{dailyDua.text}»
            </p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{dailyDua.occasion}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={Boolean(verifiedDuas[dailyDua.id])}
                onChange={() => onToggleDuaVerified(dailyDua.id)}
                className="h-4 w-4 rounded accent-[var(--accent)]"
              />
              <span>تحقق من المصحف</span>
            </label>
            <button
              type="button"
              onClick={() => onNavigate('duas')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              <BookCheck className="h-3.5 w-3.5" />
              <span>كل الأدعية</span>
            </button>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>نصيحة اليوم</span>
              <span>{dailyTip.categoryLabel}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
              {dailyTip.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              {dailyTip.body}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-hairline)] pt-3">
            <button
              type="button"
              onClick={() => onNavigate('method')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>طريقة الحفظ المتقن</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tips')}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              تصفح ٤٥ نصيحة
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
