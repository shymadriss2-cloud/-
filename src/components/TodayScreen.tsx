import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  BookCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  History,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getDailyDua } from '../data/duas';
import { getDailyTip } from '../data/tips';
import {
  formatMemorizationPagesAr,
  formatPageRangeAr,
  getJuzForPage,
  JUZ_NAMES_AR,
  TOTAL_MUSHAF_PAGES,
} from '../engine/mushaf';
import {
  addDays,
  buildPageRange,
  formatArabicDate,
  formatShortArabicDate,
  getJuzCompletionStats,
  getUnconfirmedRecentPastDays,
  type MissedPageInfo,
  type PlanTimelineSummary,
  type TodayPageFocusStatus,
} from '../engine/planner';
import { getPlanTotalMonths } from '../engine/plans';
import type {
  DayLog,
  PageProgress,
  PlanConfig,
  PlannedDay,
  ScreenId,
  TaskKind,
  TaskRating,
  TaskTimePreferences,
} from '../types/plan';
import { ArabesqueDivider, CardSuggestionOrnament, HeroCornerArabesque, ThemeEmblem } from './IslamicOrnament';
import { ProgressRing } from './ProgressRing';
import { StreakFlame } from './StreakFlame';
import { TodayPageBadge } from './TodayPageBadge';

interface TodayScreenProps {
  todayIso: string;
  startDate: string;
  plan: PlanConfig;
  pathSummary: string;
  calendar: PlannedDay[];
  plannedDay: PlannedDay | null;
  dayLog: DayLog | undefined;
  dayLogs: Record<string, DayLog>;
  pageProgress: Record<number, PageProgress>;
  taskTimes: TaskTimePreferences;
  missedPages: MissedPageInfo[];
  extraReviewPages: number[];
  streak: number;
  memorizedCount: number;
  timeline: PlanTimelineSummary;
  todayFocus: TodayPageFocusStatus;
  verifiedDuas: Record<string, boolean>;
  onUpdateTaskTime: (key: keyof TaskTimePreferences, time: string) => void;
  onCompleteTask: (
    date: string,
    kind: TaskKind,
    pages: number[],
    rating: TaskRating,
    durationSeconds: number
  ) => void;
  onConfirmPastWork: (
    targetDate: string,
    pages: number[],
    rating: TaskRating,
    note?: string
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
  dayNumber?: number;
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
  dayNumber,
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
      className={`card-interactive rounded-2xl border p-5 ${
        isCompleted
          ? 'border-[var(--accent)]/45 bg-[var(--accent-soft)]/35'
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
                {kind === 'sabaq'
                  ? formatMemorizationPagesAr(pages, dayNumber)
                  : formatPageRangeAr(pages)}
                {pages.length === 1 ||
                getJuzForPage(pages[0]) === getJuzForPage(pages[pages.length - 1])
                  ? ` · الجزء ${getJuzForPage(pages[0])}`
                  : ''}
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
                    : 'btn-accent-glow bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]'
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
  plan,
  pathSummary,
  calendar,
  plannedDay,
  dayLog,
  dayLogs,
  pageProgress,
  taskTimes,
  missedPages,
  extraReviewPages,
  streak,
  memorizedCount,
  timeline,
  todayFocus,
  verifiedDuas,
  onUpdateTaskTime,
  onCompleteTask,
  onConfirmPastWork,
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

  const yesterdayIso = useMemo(() => addDays(todayIso, -1), [todayIso]);
  const unconfirmedRecentDays = useMemo(
    () => getUnconfirmedRecentPastDays(calendar, dayLogs, todayIso, 7),
    [calendar, dayLogs, todayIso]
  );

  const defaultRetroDate =
    yesterdayIso >= startDate ? yesterdayIso : todayIso;
  const getSuggestedPageForDate = (iso: string): string => {
    const day = calendar.find((d) => d.date === iso);
    if (!day) return '';
    if (day.sabaqPage !== null) return String(day.sabaqPage);
    if (day.weeklyReviewPages.length > 0) return String(day.weeklyReviewPages[0]);
    if (day.fullReviewPages.length > 0) return String(day.fullReviewPages[0]);
    return '';
  };

  const [showRetroPanel, setShowRetroPanel] = useState<boolean>(
    () => unconfirmedRecentDays.length > 0 && todayIso > startDate
  );
  const [retroDate, setRetroDate] = useState<string>(defaultRetroDate);
  const [retroStartPage, setRetroStartPage] = useState<string>(() =>
    getSuggestedPageForDate(defaultRetroDate)
  );
  const [retroEndPage, setRetroEndPage] = useState<string>('');
  const [retroRating, setRetroRating] = useState<TaskRating>('perfect');
  const [retroNote, setRetroNote] = useState<string>('');
  const [retroError, setRetroError] = useState<string | null>(null);

  const handleRetroDateChange = (nextDate: string) => {
    setRetroDate(nextDate);
    setRetroError(null);
    const suggested = getSuggestedPageForDate(nextDate);
    if (suggested) {
      setRetroStartPage(suggested);
      setRetroEndPage('');
    }
  };

  const handleQuickConfirmDay = (day: PlannedDay, rating: TaskRating = 'perfect') => {
    const pages =
      day.sabaqPages && day.sabaqPages.length > 0
        ? day.sabaqPages
        : day.sabaqPage !== null
        ? [day.sabaqPage]
        : day.weeklyReviewPages.length > 0
        ? day.weeklyReviewPages
        : day.fullReviewPages.length > 0
        ? day.fullReviewPages
        : [];
    onConfirmPastWork(
      day.date,
      pages,
      rating,
      day.date === yesterdayIso ? 'تأكيد بعد منتصف الليل' : 'تأكيد يدوي ليوم فائت'
    );
  };

  const handleSubmitRetroForm = (e: FormEvent) => {
    e.preventDefault();
    if (!retroDate || retroDate < startDate || retroDate > todayIso) {
      setRetroError('يرجى اختيار تاريخ بين بداية الخطة وتاريخ اليوم.');
      return;
    }
    const trimmedStart = retroStartPage.trim();
    const trimmedEnd = retroEndPage.trim();
    let pages: number[] = [];

    if (trimmedStart !== '') {
      const startNum = Number(trimmedStart);
      if (!Number.isInteger(startNum) || startNum < 1 || startNum > TOTAL_MUSHAF_PAGES) {
        setRetroError('رقم الصفحة يجب أن يكون بين ١ و ٦٠٤.');
        return;
      }
      if (trimmedEnd !== '') {
        const endNum = Number(trimmedEnd);
        if (!Number.isInteger(endNum) || endNum < startNum || endNum > TOTAL_MUSHAF_PAGES) {
          setRetroError('رقم صفحة النهاية يجب أن يكون أكبر من أو يساوي صفحة البداية وحتى ٦٠٤.');
          return;
        }
        pages = buildPageRange(startNum, endNum);
      } else {
        pages = [startNum];
      }
    }

    setRetroError(null);
    onConfirmPastWork(
      retroDate,
      pages,
      retroRating,
      retroNote.trim() || (retroDate < todayIso ? 'تأكيد بعد منتصف الليل' : 'تأكيد يدوي')
    );
    setRetroEndPage('');
    setRetroNote('');
  };

  const totalMonths = getPlanTotalMonths(plan.trackId ?? 'three_years');
  const isLegacyThreeYear = !plan.trackId || plan.trackId === 'three_years';
  const phaseLabel = isLegacyThreeYear
    ? plannedDay?.phase === 'full_review'
      ? 'مرحلة المراجعة الشاملة (الأشهر 31–36)'
      : plannedDay?.phase === 'consolidation'
      ? 'مرحلة التثبيت'
      : 'مرحلة الحفظ والتثبيت (الأشهر 1–30)'
    : `مرحلة الحفظ (الأشهر 1–${totalMonths})`;

  return (
    <div className="space-y-6">
      {/* Top Overview Strip */}
      <section className="card-hero rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 md:p-6">
        <HeroCornerArabesque className="absolute -left-6 -top-6 h-48 w-48 text-[var(--accent)] opacity-[0.22]" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <TodayPageBadge
              focus={todayFocus}
              variant="hero"
              testId="today-hero-page-badge"
            />
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">
                {formatArabicDate(todayIso)}
                {plannedDay ? ` · الشهر ${plannedDay.monthNumber} من ${totalMonths}` : ''}
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
                ورد اليوم
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{phaseLabel}</p>
              <p
                data-testid="today-path-summary"
                className="mt-1.5 text-xs font-medium text-[var(--text-secondary)]"
              >
                {pathSummary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            {(() => {
              const isStreakLit =
                todayFocus.areAllTasksDone || Boolean(dayLog?.manualConfirmed);
              return (
                <div
                  data-testid="today-streak-box"
                  data-lit={isStreakLit ? 'true' : 'false'}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-300 ${
                    isStreakLit
                      ? 'border-amber-400/55 bg-gradient-to-l from-amber-500/12 via-[var(--bg-surface)]/80 to-orange-500/10 shadow-sm'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]/75'
                  }`}
                >
                  <StreakFlame
                    lit={isStreakLit}
                    size="sm"
                    testId="today-streak-flame"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-[var(--text-muted)]">سلسلة الاستمرار</p>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                          isStreakLit
                            ? 'bg-amber-500/18 text-amber-700 dark:text-amber-300'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                        }`}
                      >
                        {isStreakLit ? 'مشتعلة اليوم' : 'أنجز ورد اليوم للحفاظ عليها'}
                      </span>
                    </div>
                    <p
                      data-testid="today-streak-value"
                      className="text-lg font-semibold tabular-nums text-[var(--text-primary)]"
                    >
                      {streak} يوم
                    </p>
                  </div>
                </div>
              );
            })()}

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
        <ArabesqueDivider className="relative z-10 mt-5" />
      </section>

      {/* Remaining Days to Finish Memorization */}
      <section
        data-testid="today-remaining-days-card"
        className="card-suggestion rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
      >
        <CardSuggestionOrnament className="pointer-events-none absolute -bottom-4 -left-4 text-[var(--accent)] opacity-[0.20]" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                <ThemeEmblem className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
                <span>الأيام المتبقية لإنهاء الحفظ</span>
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <p
                  data-testid="today-remaining-memorization-days"
                  className="text-2xl font-bold tabular-nums text-[var(--text-primary)]"
                >
                  {memorizedCount >= TOTAL_MUSHAF_PAGES
                    ? 'تم إنهاء الحفظ بفضل الله'
                    : `${timeline.daysRemainingToMemorization} يوم`}
                </p>
                {memorizedCount < TOTAL_MUSHAF_PAGES && (
                  <span className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[var(--accent)]">
                    موعد الختم: {formatShortArabicDate(timeline.memorizationEndDate)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {memorizedCount >= TOTAL_MUSHAF_PAGES
                  ? `متبقي لإنهاء التثبيت والمراجعة الشاملة: ${timeline.daysRemainingToConsolidation} يوم (حتى ${formatShortArabicDate(timeline.consolidationEndDate)})`
                  : `المتبقي من المصحف: ${TOTAL_MUSHAF_PAGES - memorizedCount} صفحة · ${timeline.remainingSabaqDays} يوم حفظ مجدول`}
              </p>
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-52">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>إنجاز صفحات الحفظ</span>
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                {Math.round((memorizedCount / TOTAL_MUSHAF_PAGES) * 100)}%
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((memorizedCount / TOTAL_MUSHAF_PAGES) * 100))}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] tabular-nums text-[var(--text-muted)]">
              {memorizedCount} من {TOTAL_MUSHAF_PAGES} صفحة
            </p>
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

      {/* After-Midnight / Manual & Numeric Retroactive Work Confirmation */}
      {todayIso >= startDate && (
        <section className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  تأكيد الإنجاز بعد منتصف الليل / الإدخال اليدوي والرقمي
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  نسيت تأكيد إنهاء مهامك قبل منتصف الليل؟ أكّد العمل الآن برقم الصفحة أو يدوياً ليُحتسب في سلسلة الاستمرار.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRetroPanel((v) => !v)}
              aria-expanded={showRetroPanel}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 text-xs font-medium whitespace-nowrap text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
            >
              <span>{showRetroPanel ? 'إخفاء اللوحة' : 'تأكيد يوم فائت / إدخال رقمي'}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showRetroPanel ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showRetroPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-5 border-t border-[var(--border-hairline)] pt-4">
                  {/* Quick confirmation for recent unconfirmed days (Yesterday highlighted) */}
                  {unconfirmedRecentDays.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-[var(--text-secondary)]">
                        أيام قريبة لم تُؤكَّد بعد (تأكيد يدوي سريع):
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {unconfirmedRecentDays.slice(0, 4).map((d) => {
                          const isYesterday = d.date === yesterdayIso;
                          const targetLabel =
                            d.sabaqPage !== null
                              ? `صفحة ${d.sabaqPage} (الجزء ${d.sabaqJuz})`
                              : d.isFriday
                              ? 'مراجعة الأسبوع'
                              : d.fullReviewJuz
                              ? `الجزء ${d.fullReviewJuz}`
                              : 'مراجعة وتثبيت';
                          return (
                            <div
                              key={d.date}
                              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
                                isYesterday
                                  ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/35'
                                  : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)]'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isYesterday && (
                                    <span className="rounded-md bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-ink)]">
                                      أمس
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                                    {formatShortArabicDate(d.date)}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                                  {targetLabel}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickConfirmDay(d, 'perfect')}
                                  className="btn-accent-glow inline-flex h-9 items-center gap-1 rounded-xl bg-[var(--accent)] px-3 text-xs font-medium whitespace-nowrap text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>{isYesterday ? 'تأكيد يوم أمس' : 'تأكيد اليوم'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRetroDateChange(d.date)}
                                  className="inline-flex h-9 items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium whitespace-nowrap text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                >
                                  تخصيص
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Numeric + Manual Confirmation Form */}
                  <form
                    onSubmit={handleSubmitRetroForm}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4"
                  >
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      إدخال رقمي ويدوي مخصص (تحديد التاريخ ورقم الصفحة)
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label
                          htmlFor="retro-date-input"
                          className="block text-xs font-medium text-[var(--text-secondary)]"
                        >
                          تاريخ الإنجاز
                        </label>
                        <input
                          id="retro-date-input"
                          type="date"
                          min={startDate}
                          max={todayIso}
                          value={retroDate}
                          onChange={(e) => handleRetroDateChange(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-sm tabular-nums text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="retro-start-page"
                          className="block text-xs font-medium text-[var(--text-secondary)]"
                        >
                          من صفحة (إدخال رقمي ١–٦٠٤)
                        </label>
                        <input
                          id="retro-start-page"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={TOTAL_MUSHAF_PAGES}
                          value={retroStartPage}
                          onChange={(e) => {
                            setRetroStartPage(e.target.value);
                            setRetroError(null);
                          }}
                          placeholder="مثال: 15"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-sm tabular-nums text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="retro-end-page"
                          className="block text-xs font-medium text-[var(--text-secondary)]"
                        >
                          إلى صفحة (اختياري)
                        </label>
                        <input
                          id="retro-end-page"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={TOTAL_MUSHAF_PAGES}
                          value={retroEndPage}
                          onChange={(e) => {
                            setRetroEndPage(e.target.value);
                            setRetroError(null);
                          }}
                          placeholder="صفحة واحدة"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-sm tabular-nums text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>

                      <div>
                        <span className="block text-xs font-medium text-[var(--text-secondary)]">
                          تقييم الإتقان
                        </span>
                        <div className="mt-1 grid grid-cols-3 gap-1.5">
                          {(['perfect', 'hesitated', 'mistakes'] as TaskRating[]).map((r) => {
                            const selected = retroRating === r;
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setRetroRating(r)}
                                aria-pressed={selected}
                                className={`h-10 rounded-xl border text-xs font-medium transition-colors ${
                                  selected
                                    ? `${RATING_LABELS[r].tone} ring-1 ring-current`
                                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                              >
                                {RATING_LABELS[r].label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <label
                          htmlFor="retro-note-input"
                          className="block text-xs font-medium text-[var(--text-secondary)]"
                        >
                          ملاحظة يدوية (اختياري)
                        </label>
                        <input
                          id="retro-note-input"
                          type="text"
                          value={retroNote}
                          onChange={(e) => setRetroNote(e.target.value)}
                          placeholder="مثال: أتممت الحفظ والمراجعة قبل الفجر وتأخرت عن تسجيله"
                          className="mt-1 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.97 }}
                        className="btn-accent-glow inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-medium whitespace-nowrap text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تأكيد واحتساب في السلسلة</span>
                      </motion.button>
                    </div>

                    {retroError && (
                      <p role="alert" className="mt-2.5 text-xs font-medium text-[var(--danger)]">
                        {retroError}
                      </p>
                    )}
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Before start date or after 36 months */}
      {!plannedDay ? (
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {todayIso < startDate
              ? `تبدأ خطتك يوم ${formatShortArabicDate(startDate)}`
              : `أتممت بفضل الله فترة ${totalMonths} شهراً من الخطة`}
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
            (() => {
              const sabaqPagesToday =
                plannedDay.sabaqPages && plannedDay.sabaqPages.length > 0
                  ? plannedDay.sabaqPages
                  : plannedDay.sabaqPage !== null
                  ? [plannedDay.sabaqPage]
                  : [];
              return (
                <DailyTaskCard
                  kind="sabaq"
                  title="١. السبق (الحفظ الجديد)"
                  subtitle={
                    sabaqPagesToday.length > 1
                      ? `${sabaqPagesToday.length} صفحات جديدة بإتقان وربط`
                      : 'صفحة واحدة جديدة بإتقان وربط'
                  }
                  suggestedLabel="المقترح: بعد الفجر"
                  timeValue={taskTimes.sabaq}
                  onTimeChange={(val) => onUpdateTaskTime('sabaq', val)}
                  pages={sabaqPagesToday}
                  dayNumber={dayIndex + 1}
                  record={dayLog?.tasks.sabaq}
                  emptyText={
                    plannedDay.phase === 'memorization'
                      ? 'لا توجد صفحة حفظ جديدة اليوم وفق وتيرة خطتك — ركّز على المراجعة'
                      : 'أتممت حفظ جميع صفحات المصحف — اليوم للتثبيت والمراجعة'
                  }
                  onSubmitRating={(rating, secs) =>
                    onCompleteTask(todayIso, 'sabaq', sabaqPagesToday, rating, secs)
                  }
                />
              );
            })()
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

      {/* Daily Dua & Daily Tip Suggestion Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <section
          data-testid="today-dua-suggestion-card"
          className="card-suggestion flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
        >
          <CardSuggestionOrnament className="pointer-events-none absolute -bottom-4 -left-4 text-[var(--gold)] opacity-[0.24]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--gold)]">
                <ThemeEmblem className="h-4 w-4 shrink-0" />
                <span>دعاء اليوم من القرآن</span>
              </span>
              <span>
                {dailyDua.surahName} · آية {dailyDua.ayahRef}
              </span>
            </div>
            <p className="font-display mt-3 text-xl leading-loose text-[var(--text-primary)]">
              «{dailyDua.text}»
            </p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{dailyDua.occasion}</p>
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] pt-3">
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

        <section
          data-testid="today-tip-suggestion-card"
          className="card-suggestion flex flex-col justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
        >
          <CardSuggestionOrnament className="pointer-events-none absolute -bottom-4 -left-4 text-[var(--accent)] opacity-[0.22]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent)]">
                <ThemeEmblem className="h-4 w-4 shrink-0" />
                <span>نصيحة اليوم</span>
              </span>
              <span>{dailyTip.categoryLabel}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
              {dailyTip.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              {dailyTip.body}
            </p>
          </div>

          <div className="relative z-10 mt-4 flex items-center justify-between border-t border-[var(--border-hairline)] pt-3">
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
