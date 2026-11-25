import { useMemo, useState } from 'react';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import {
  formatMemorizationPagesAr,
  formatPageRangeAr,
  JUZ_BEGINNINGS,
  JUZ_NAMES_AR,
} from '../engine/mushaf';
import {
  ARABIC_WEEKDAYS,
  formatArabicDate,
  formatShortArabicDate,
  getJuzCompletionStats,
  getJuzScheduleSummaries,
  hasDayActivity,
  type PlanTimelineSummary,
} from '../engine/planner';
import { getPlanTotalMonths, PLAN_TRACKS } from '../engine/plans';
import type { DayLog, MemorizationOrder, PageProgress, PlanConfig, PlannedDay, TaskRating } from '../types/plan';
import { ProgressRing } from './ProgressRing';

interface PlanScreenProps {
  calendar: PlannedDay[];
  order: MemorizationOrder;
  plan?: PlanConfig;
  pathSummary?: string;
  timeline?: PlanTimelineSummary;
  todayIso: string;
  pageProgress: Record<number, PageProgress>;
  dayLogs: Record<string, DayLog>;
  onConfirmPastWork: (
    targetDate: string,
    pages: number[],
    rating: TaskRating,
    note?: string
  ) => void;
}

type PlanTab = 'weekly' | 'monthly' | 'juz';

export function PlanScreen({
  calendar,
  order,
  plan,
  pathSummary,
  timeline,
  todayIso,
  pageProgress,
  dayLogs,
  onConfirmPastWork,
}: PlanScreenProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>('weekly');
  const activeTrack = PLAN_TRACKS[plan?.trackId ?? 'three_years'];
  const activeTrackTitle =
    plan?.trackId === 'three_years' || !plan?.trackId
      ? 'ثلاث سنوات (الخطة الأساسية)'
      : activeTrack.title;
  const maxMonths = getPlanTotalMonths(plan?.trackId ?? 'three_years');
  const remainingWeeks = timeline ? Math.ceil(timeline.daysRemainingToMemorization / 7) : 0;

  const todayIndex = useMemo(() => {
    const idx = calendar.findIndex((d) => d.date === todayIso);
    return idx >= 0 ? idx : 0;
  }, [calendar, todayIso]);

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return calendar[todayIndex]?.monthNumber ?? 1;
  });

  // Compute week start index (aligned to Sunday)
  const [weekStartIndex, setWeekStartIndex] = useState<number>(() => {
    const day = calendar[todayIndex];
    if (!day) return 0;
    return Math.max(0, todayIndex - day.dayOfWeek);
  });

  const [inspectedDay, setInspectedDay] = useState<PlannedDay | null>(
    () => calendar[todayIndex] ?? calendar[0] ?? null
  );

  const monthDays = useMemo(
    () => calendar.filter((d) => d.monthNumber === selectedMonth),
    [calendar, selectedMonth]
  );

  const weekDays = useMemo(
    () => calendar.slice(weekStartIndex, Math.min(calendar.length, weekStartIndex + 7)),
    [calendar, weekStartIndex]
  );

  const juzSummaries = useMemo(
    () => getJuzScheduleSummaries(calendar, order),
    [calendar, order]
  );

  const jumpToToday = () => {
    const day = calendar[todayIndex];
    if (!day) return;
    setSelectedMonth(day.monthNumber);
    setWeekStartIndex(Math.max(0, todayIndex - day.dayOfWeek));
    setInspectedDay(day);
  };

  return (
    <div className="space-y-6">
      <section className="card-hero rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">
              {activeTrackTitle} · خطة ثابتة ومقفلة
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              جدول الخطة الكامل
            </h1>
            {pathSummary && (
              <p
                data-testid="plan-path-summary"
                className="mt-1.5 text-xs font-medium text-[var(--text-secondary)]"
              >
                {pathSummary}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1">
              {(
                [
                  { id: 'weekly', label: 'الأسبوعي' },
                  { id: 'monthly', label: `الشهري (${maxMonths} شهراً)` },
                  { id: 'juz', label: 'جدول الأجزاء (30)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-9 rounded-lg px-3.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab !== 'juz' && (
              <button
                type="button"
                onClick={jumpToToday}
                className="h-10 rounded-xl border border-[var(--border-hairline)] px-3.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              >
                العودة لليوم
              </button>
            )}
          </div>
        </div>

        {timeline && (
          <div
            data-testid="plan-locked-summary"
            className="mt-4 grid gap-3 border-t border-[var(--border-hairline)] pt-4 sm:grid-cols-3"
          >
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Lock className="h-3 w-3 text-[var(--accent)]" />
                <span>المعدل المعتمد</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">
                {activeTrack.rateLabel}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5">
              <p className="text-[11px] text-[var(--text-muted)]">الأسابيع المتبقية لختم الحفظ</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-[var(--accent)]">
                {remainingWeeks} أسبوعاً ({timeline.daysRemainingToMemorization} يوماً)
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5">
              <p className="text-[11px] text-[var(--text-muted)]">تاريخ الختم المتوقع</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-[var(--text-primary)]">
                {formatShortArabicDate(timeline.memorizationEndDate)}
              </p>
            </div>
          </div>
        )}
      </section>

      {activeTab === 'weekly' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
            <button
              type="button"
              onClick={() => setWeekStartIndex((i) => Math.max(0, i - 7))}
              disabled={weekStartIndex === 0}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
              <span>الأسبوع السابق</span>
            </button>

            <span className="text-sm font-medium text-[var(--text-primary)]">
              {weekDays[0] ? formatShortArabicDate(weekDays[0].date) : ''} —{' '}
              {weekDays[weekDays.length - 1]
                ? formatShortArabicDate(weekDays[weekDays.length - 1].date)
                : ''}
            </span>

            <button
              type="button"
              onClick={() =>
                setWeekStartIndex((i) => Math.min(Math.max(0, calendar.length - 7), i + 7))
              }
              disabled={weekStartIndex + 7 >= calendar.length}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
            >
              <span>الأسبوع التالي</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {weekDays.map((day) => {
              const isToday = day.date === todayIso;
              return (
                <div
                  key={day.date}
                  className={`rounded-2xl border p-4 ${
                    isToday
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]/35'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {ARABIC_WEEKDAYS[day.dayOfWeek]}
                    </span>
                    <span className="tabular-nums text-[var(--text-muted)]">
                      {formatShortArabicDate(day.date)}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    الشهر {day.monthNumber} ·{' '}
                    {day.phase === 'full_review'
                      ? 'مراجعة شاملة'
                      : day.isSaturday
                      ? 'استدراك وراحة'
                      : day.isFriday
                      ? 'مراجعة الأسبوع'
                      : 'حفظ ومراجعة'}
                  </p>

                  <div className="mt-3 space-y-2 border-t border-[var(--border-hairline)] pt-3 text-xs">
                    {day.phase === 'full_review' ? (
                      <p className="font-semibold text-[var(--accent)]">
                        مراجعة الجزء {day.fullReviewJuz} كاملاً
                      </p>
                    ) : day.isSaturday ? (
                      <p className="text-[var(--text-secondary)]">
                        استدراك الصفحات الفائتة + راحة
                      </p>
                    ) : day.isFriday ? (
                      <>
                        <p className="font-medium text-[var(--text-primary)]">
                          مراجعة الأسبوع: {formatPageRangeAr(day.weeklyReviewPages)}
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          السبقي: {formatPageRangeAr(day.sabqiPages)}
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          المنزل: {formatPageRangeAr(day.manzilPages)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-[var(--accent)]">
                          السبق:{' '}
                          {day.sabaqPages && day.sabaqPages.length > 0
                            ? `${formatMemorizationPagesAr(day.sabaqPages, day.dayIndex + 1)} (الجزء ${day.sabaqJuz})`
                            : day.sabaqPage !== null
                            ? `${formatMemorizationPagesAr([day.sabaqPage], day.dayIndex + 1)} (الجزء ${day.sabaqJuz})`
                            : 'تثبيت عام'}
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          السبقي: {formatPageRangeAr(day.sabqiPages)}
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          المنزل: {formatPageRangeAr(day.manzilPages)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'monthly' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMonth((m) => Math.max(1, m - 1))}
                disabled={selectedMonth <= 1}
                aria-label="الشهر السابق"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="text-[var(--text-secondary)]">اختر الشهر:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  aria-label={`اختر الشهر من ${maxMonths} شهراً`}
                  className="h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {Array.from({ length: maxMonths }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      الشهر {m}{' '}
                      {activeTrack.isLegacyThreeYear
                        ? m <= 30
                          ? '(الحفظ)'
                          : '(المراجعة الشاملة)'
                        : '(الحفظ)'}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setSelectedMonth((m) => Math.min(maxMonths, m + 1))}
                disabled={selectedMonth >= maxMonths}
                aria-label="الشهر التالي"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs text-[var(--text-muted)]">
              {activeTrack.isLegacyThreeYear && selectedMonth > 30
                ? 'نظام جزء كامل يومياً'
                : 'نظام السبق والسبقي والمنزل'}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 lg:col-span-2">
              <div className="mb-2 hidden grid-cols-7 gap-2 text-center text-xs font-medium text-[var(--text-muted)] sm:grid">
                {ARABIC_WEEKDAYS.map((wd) => (
                  <div key={wd} className="py-1">
                    {wd}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
                {monthDays.length > 0 &&
                  Array.from({ length: monthDays[0].dayOfWeek }, (_, i) => (
                    <div key={`pad-${i}`} className="hidden sm:block" />
                  ))}
                {monthDays.map((day) => {
                  const isToday = day.date === todayIso;
                  const isSelected = inspectedDay?.date === day.date;
                  const isConfirmed = hasDayActivity(dayLogs[day.date]);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setInspectedDay(day)}
                      className={`flex min-h-[76px] flex-col justify-between rounded-xl border p-2.5 text-right transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                          : isToday
                          ? 'border-[var(--gold)] bg-[var(--gold-soft)]/50'
                          : isConfirmed
                          ? 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/25 hover:border-[var(--accent)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="tabular-nums font-medium text-[var(--text-secondary)]">
                          {day.date.slice(8)}/{day.date.slice(5, 7)}
                        </span>
                        {isConfirmed ? (
                          <span
                            title="يوم مؤكد في السلسلة"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] text-[var(--accent-ink)]"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] sm:hidden">
                            {ARABIC_WEEKDAYS[day.dayOfWeek]}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-[var(--text-primary)]">
                        {day.phase === 'full_review'
                          ? `جزء ${day.fullReviewJuz}`
                          : day.isSaturday
                          ? 'استدراك'
                          : day.isFriday
                          ? 'تسميع'
                          : day.sabaqPages && day.sabaqPages.length === 2
                          ? `ص ${day.sabaqPages[0]} و${day.sabaqPages[1]}`
                          : day.sabaqPages && day.sabaqPages.length > 2
                          ? `ص ${day.sabaqPages[0]}–${day.sabaqPages[day.sabaqPages.length - 1]}`
                          : day.sabaqPage !== null
                          ? `ص ${day.sabaqPage}`
                          : 'تثبيت'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Detail Side Panel */}
            <aside className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
              {inspectedDay ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">
                        تفاصيل اليوم · الشهر {inspectedDay.monthNumber}
                      </p>
                      <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                        {formatArabicDate(inspectedDay.date)}
                      </h2>
                    </div>

                    {hasDayActivity(dayLogs[inspectedDay.date]) && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>مؤكد</span>
                      </span>
                    )}
                  </div>

                  {inspectedDay.phase === 'full_review' ? (
                    <div className="space-y-2 border-t border-[var(--border-hairline)] pt-3 text-sm">
                      <p className="font-semibold text-[var(--accent)]">
                        {JUZ_NAMES_AR[inspectedDay.fullReviewJuz ?? 1]}
                      </p>
                      <p className="text-[var(--text-secondary)]">
                        {formatPageRangeAr(inspectedDay.fullReviewPages)}
                      </p>
                    </div>
                  ) : inspectedDay.isSaturday ? (
                    <p className="border-t border-[var(--border-hairline)] pt-3 text-sm text-[var(--text-secondary)]">
                      يوم السبت مخصص لاستدراك الصفحات الفائتة والراحة الذهنية.
                    </p>
                  ) : (
                    <div className="space-y-3 border-t border-[var(--border-hairline)] pt-3 text-sm">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {inspectedDay.isFriday ? 'مراجعة صفحات الأسبوع' : 'السبق'}
                        </p>
                        <p className="mt-0.5 font-medium text-[var(--text-primary)]">
                          {inspectedDay.isFriday
                            ? formatPageRangeAr(inspectedDay.weeklyReviewPages)
                            : inspectedDay.sabaqPages && inspectedDay.sabaqPages.length > 0
                            ? `${formatMemorizationPagesAr(inspectedDay.sabaqPages, inspectedDay.dayIndex + 1)} · الجزء ${inspectedDay.sabaqJuz}`
                            : inspectedDay.sabaqPage !== null
                            ? `${formatMemorizationPagesAr([inspectedDay.sabaqPage], inspectedDay.dayIndex + 1)} · الجزء ${inspectedDay.sabaqJuz}`
                            : 'تثبيت ومراجعة عامة'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[var(--text-muted)]">السبقي (آخر ٧ صفحات)</p>
                        <p className="mt-0.5 font-medium text-[var(--text-primary)]">
                          {formatPageRangeAr(inspectedDay.sabqiPages)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[var(--text-muted)]">المنزل (المراجعة الدورية)</p>
                        <p className="mt-0.5 font-medium text-[var(--text-primary)]">
                          {formatPageRangeAr(inspectedDay.manzilPages)}
                        </p>
                      </div>
                    </div>
                  )}

                  {dayLogs[inspectedDay.date]?.manualNote && (
                    <p className="rounded-xl bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      ملاحظة: {dayLogs[inspectedDay.date]?.manualNote}
                    </p>
                  )}

                  {!hasDayActivity(dayLogs[inspectedDay.date]) && inspectedDay.date <= todayIso && (
                    <div className="border-t border-[var(--border-hairline)] pt-3">
                      <p className="text-xs text-[var(--text-secondary)]">
                        لم يُؤكَّد هذا اليوم بعد في سلسلة الاستمرار.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const pages =
                            inspectedDay.sabaqPages && inspectedDay.sabaqPages.length > 0
                              ? inspectedDay.sabaqPages
                              : inspectedDay.sabaqPage !== null
                              ? [inspectedDay.sabaqPage]
                              : inspectedDay.weeklyReviewPages.length > 0
                              ? inspectedDay.weeklyReviewPages
                              : inspectedDay.fullReviewPages.length > 0
                              ? inspectedDay.fullReviewPages
                              : [];
                          onConfirmPastWork(
                            inspectedDay.date,
                            pages,
                            'perfect',
                            inspectedDay.date < todayIso ? 'تأكيد بعد منتصف الليل من الجدول' : 'تأكيد من الجدول'
                          );
                        }}
                        className="btn-accent-glow mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-xs font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تأكيد واحتساب هذا اليوم في السلسلة</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">اختر يوماً لعرض تفاصيله.</p>
              )}
            </aside>
          </div>
        </section>
      )}

      {activeTab === 'juz' && (
        <section className="overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)]">
                  <th className="px-4 py-3 font-medium">الجزء</th>
                  <th className="px-4 py-3 font-medium">الصفحات</th>
                  <th className="px-4 py-3 font-medium">تاريخ البداية</th>
                  <th className="px-4 py-3 font-medium">تاريخ الإتمام</th>
                  <th className="px-4 py-3 font-medium">الإنجاز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {juzSummaries.map((item) => {
                  const stats = getJuzCompletionStats(pageProgress, item.juz);
                  const beginning = JUZ_BEGINNINGS[item.juz];
                  return (
                    <tr key={item.juz} className="hover:bg-[var(--bg-canvas)]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">
                          {JUZ_NAMES_AR[item.juz]}
                        </p>
                        {beginning && (
                          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {beginning.surah} {beginning.ayah} · {beginning.opening}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">
                        {item.startPage}–{item.endPage} ({item.pageCount} ص)
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">
                        {item.startDate ? formatShortArabicDate(item.startDate) : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">
                        {item.endDate ? formatShortArabicDate(item.endDate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <ProgressRing
                            percent={stats.percent}
                            size={38}
                            strokeWidth={4}
                            label={`${stats.percent}%`}
                          />
                          <span className="text-xs tabular-nums text-[var(--text-muted)]">
                            {stats.done}/{stats.total}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
