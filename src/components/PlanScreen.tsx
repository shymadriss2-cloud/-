import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPageRangeAr, JUZ_NAMES_AR } from '../engine/mushaf';
import {
  ARABIC_WEEKDAYS,
  formatArabicDate,
  formatShortArabicDate,
  getJuzCompletionStats,
  getJuzScheduleSummaries,
} from '../engine/planner';
import type { MemorizationOrder, PageProgress, PlannedDay } from '../types/plan';
import { ProgressRing } from './ProgressRing';

interface PlanScreenProps {
  calendar: PlannedDay[];
  order: MemorizationOrder;
  todayIso: string;
  pageProgress: Record<number, PageProgress>;
}

type PlanTab = 'weekly' | 'monthly' | 'juz';

export function PlanScreen({ calendar, order, todayIso, pageProgress }: PlanScreenProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>('weekly');

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
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">
              خطة ثابتة لمدة ٣٦ شهراً · المسار {order === 'A' ? 'أ (من الفاتحة)' : 'ب (من جزء عمّ)'}
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              جدول الخطة الكامل
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1">
              {(
                [
                  { id: 'weekly', label: 'الأسبوعي' },
                  { id: 'monthly', label: 'الشهري (٣٦ شهراً)' },
                  { id: 'juz', label: 'جدول الأجزاء (٣٠)' },
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
                          {day.sabaqPage !== null
                            ? `صفحة ${day.sabaqPage} (الجزء ${day.sabaqJuz})`
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
                  aria-label="اختر الشهر من ٣٦ شهراً"
                  className="h-10 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm text-[var(--text-primary)]"
                >
                  {Array.from({ length: 36 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      الشهر {m} {m <= 30 ? '(الحفظ)' : '(المراجعة الشاملة)'}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setSelectedMonth((m) => Math.min(36, m + 1))}
                disabled={selectedMonth >= 36}
                aria-label="الشهر التالي"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-hairline)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs text-[var(--text-muted)]">
              {selectedMonth <= 30
                ? 'نظام السبق والسبقي والمنزل'
                : 'نظام جزء كامل يومياً'}
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
                          : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="tabular-nums font-medium text-[var(--text-secondary)]">
                          {day.date.slice(8)}/{day.date.slice(5, 7)}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] sm:hidden">
                          {ARABIC_WEEKDAYS[day.dayOfWeek]}
                        </span>
                      </div>

                      <div className="mt-1 text-xs font-semibold text-[var(--text-primary)]">
                        {day.phase === 'full_review'
                          ? `جزء ${day.fullReviewJuz}`
                          : day.isSaturday
                          ? 'استدراك'
                          : day.isFriday
                          ? 'تسميع'
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
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">
                      تفاصيل اليوم · الشهر {inspectedDay.monthNumber}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                      {formatArabicDate(inspectedDay.date)}
                    </h2>
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
                            : inspectedDay.sabaqPage !== null
                            ? `صفحة ${inspectedDay.sabaqPage} · الجزء ${inspectedDay.sabaqJuz}`
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
                  return (
                    <tr key={item.juz} className="hover:bg-[var(--bg-canvas)]">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {JUZ_NAMES_AR[item.juz]}
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
