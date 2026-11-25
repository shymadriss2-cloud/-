import type {
  DayLog,
  JuzScheduleSummary,
  MemorizationOrder,
  PageProgress,
  PlanDirection,
  PlannedDay,
  PlanTrackId,
  TaskKind,
  TaskRating,
} from '../types/plan';
import {
  buildMemorizationSequence,
  buildSequenceFromConfig,
  getJuzForPage,
  getManzilPagesPerDay,
  getPagesInJuz,
  JUZ_RANGES,
  TOTAL_JUZ,
  TOTAL_MUSHAF_PAGES,
} from './mushaf';
import {
  computeCyclePlanDurationDays,
  getCyclePlanMonthNumber,
  getPagesAssignedOnDay,
} from './plans';

export const ARABIC_WEEKDAYS = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export function parseISODate(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function formatISODate(parts: { year: number; month: number; day: number }): string {
  const y = String(parts.year).padStart(4, '0');
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayLocalISO(now: Date = new Date()): string {
  return formatISODate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

export function addDays(iso: string, days: number): string {
  const { year, month, day } = parseISODate(iso);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return formatISODate({
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
  });
}

export function addMonths(iso: string, months: number): string {
  const { year, month, day } = parseISODate(iso);
  const totalMonths = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonthIndex = totalMonths % 12; // 0..11
  const lastDayOfTarget = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTarget);
  return formatISODate({
    year: targetYear,
    month: targetMonthIndex + 1,
    day: clampedDay,
  });
}

export function getDayOfWeek(iso: string): number {
  const { year, month, day } = parseISODate(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getPlanMonthNumber(startDate: string, targetDate: string): number {
  if (targetDate < startDate) return 0;
  for (let m = 1; m <= 36; m++) {
    const boundary = addMonths(startDate, m);
    if (targetDate < boundary) return m;
  }
  return 36;
}

export function formatArabicDate(iso: string): string {
  const { year, month, day } = parseISODate(iso);
  const dow = getDayOfWeek(iso);
  return `${ARABIC_WEEKDAYS[dow]}، ${day} ${ARABIC_MONTHS[month - 1]} ${year}`;
}

export function formatShortArabicDate(iso: string): string {
  const { year, month, day } = parseISODate(iso);
  return `${day} ${ARABIC_MONTHS[month - 1]} ${year}`;
}

export function diffDays(fromIso: string, toIso: string): number {
  const a = parseISODate(fromIso);
  const b = parseISODate(toIso);
  const utcA = Date.UTC(a.year, a.month - 1, a.day);
  const utcB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

export interface PlanTimelineSummary {
  startDate: string;
  memorizationEndDate: string;
  consolidationEndDate: string;
  daysRemainingToMemorization: number;
  daysRemainingToConsolidation: number;
  remainingSabaqDays: number;
  memorizationPercentByTime: number;
}

export function getPlanTimelineSummary(
  calendar: PlannedDay[],
  startDate: string,
  referenceDate: string
): PlanTimelineSummary {
  let lastSabaqDate: string | null = null;
  let remainingSabaqDays = 0;

  for (const day of calendar) {
    if (day.sabaqPage !== null) {
      lastSabaqDate = day.date;
      if (day.date >= referenceDate) {
        remainingSabaqDays++;
      }
    }
  }

  const fallbackPlanEnd = addDays(addMonths(startDate, 36), -1);
  const memorizationEndDate = lastSabaqDate ?? addDays(addMonths(startDate, 30), -1);
  const consolidationEndDate =
    calendar.length > 0 ? calendar[calendar.length - 1].date : fallbackPlanEnd;

  const daysRemainingToMemorization = Math.max(0, diffDays(referenceDate, memorizationEndDate));
  const daysRemainingToConsolidation = Math.max(0, diffDays(referenceDate, consolidationEndDate));

  const totalMemSpan = Math.max(1, diffDays(startDate, memorizationEndDate));
  const elapsedMemDays = Math.min(totalMemSpan, Math.max(0, diffDays(startDate, referenceDate)));
  const memorizationPercentByTime = Math.round((elapsedMemDays / totalMemSpan) * 100);

  return {
    startDate,
    memorizationEndDate,
    consolidationEndDate,
    daysRemainingToMemorization,
    daysRemainingToConsolidation,
    remainingSabaqDays,
    memorizationPercentByTime,
  };
}

export interface TodayPageFocusStatus {
  mode: 'sabaq' | 'friday' | 'saturday' | 'full_review' | 'consolidation' | 'none';
  primaryPage: number | null;
  secondaryPages: number[];
  juz: number | null;
  isCompleted: boolean;
  areAllTasksDone: boolean;
  completedTaskCount: number;
  totalTaskCount: number;
}

export function getTodayPageFocusStatus(
  plannedDay: PlannedDay | null,
  dayLog: DayLog | undefined,
  pageProgress: Record<number, PageProgress>,
  missedPages: MissedPageInfo[] = []
): TodayPageFocusStatus {
  if (!plannedDay) {
    return {
      mode: 'none',
      primaryPage: null,
      secondaryPages: [],
      juz: null,
      isCompleted: false,
      areAllTasksDone: false,
      completedTaskCount: 0,
      totalTaskCount: 0,
    };
  }

  if (plannedDay.phase === 'full_review') {
    const completed = Boolean(dayLog?.tasks.full_review?.completed);
    return {
      mode: 'full_review',
      primaryPage: plannedDay.fullReviewPages[0] ?? null,
      secondaryPages: plannedDay.fullReviewPages,
      juz: plannedDay.fullReviewJuz,
      isCompleted: completed,
      areAllTasksDone: completed,
      completedTaskCount: completed ? 1 : 0,
      totalTaskCount: 1,
    };
  }

  if (plannedDay.isSaturday) {
    const caughtUp = Boolean(dayLog?.caughtUpPages && dayLog.caughtUpPages.length > 0);
    const done =
      missedPages.length === 0 ? Boolean(dayLog?.manualConfirmed || caughtUp) : false;
    return {
      mode: 'saturday',
      primaryPage: missedPages[0]?.page ?? null,
      secondaryPages: missedPages.map((m) => m.page),
      juz: missedPages[0]?.juz ?? null,
      isCompleted: done,
      areAllTasksDone: done,
      completedTaskCount: done ? 1 : 0,
      totalTaskCount: missedPages.length > 0 ? 1 : 0,
    };
  }

  if (plannedDay.isFriday) {
    const activeKinds: TaskKind[] = [];
    if (plannedDay.weeklyReviewPages.length > 0) activeKinds.push('friday_review');
    if (plannedDay.sabqiPages.length > 0) activeKinds.push('sabqi');
    if (plannedDay.manzilPages.length > 0) activeKinds.push('manzil');
    const completedTaskCount = activeKinds.filter((k) => Boolean(dayLog?.tasks[k]?.completed)).length;
    const totalTaskCount = activeKinds.length;
    const fridayReviewDone = Boolean(dayLog?.tasks.friday_review?.completed);
    const areAllTasksDone = totalTaskCount > 0 && completedTaskCount === totalTaskCount;
    const primaryPage = plannedDay.weeklyReviewPages[0] ?? null;

    return {
      mode: 'friday',
      primaryPage,
      secondaryPages: plannedDay.weeklyReviewPages,
      juz: primaryPage ? getJuzForPage(primaryPage) : null,
      isCompleted: fridayReviewDone || areAllTasksDone,
      areAllTasksDone,
      completedTaskCount,
      totalTaskCount,
    };
  }

  const todaySabaqPages =
    plannedDay.sabaqPages && plannedDay.sabaqPages.length > 0
      ? plannedDay.sabaqPages
      : plannedDay.sabaqPage !== null
      ? [plannedDay.sabaqPage]
      : [];

  if (todaySabaqPages.length > 0) {
    const sabaqDone =
      Boolean(dayLog?.tasks.sabaq?.completed) ||
      todaySabaqPages.every((p) => (pageProgress[p]?.status ?? 'not_started') !== 'not_started');
    const sabqiDone = Boolean(dayLog?.tasks.sabqi?.completed);
    const manzilDone = Boolean(dayLog?.tasks.manzil?.completed);

    let totalTaskCount = 1;
    let completedTaskCount = sabaqDone ? 1 : 0;
    if (plannedDay.sabqiPages.length > 0) {
      totalTaskCount++;
      if (sabqiDone) completedTaskCount++;
    }
    if (plannedDay.manzilPages.length > 0) {
      totalTaskCount++;
      if (manzilDone) completedTaskCount++;
    }

    const areAllTasksDone = completedTaskCount === totalTaskCount;
    return {
      mode: 'sabaq',
      primaryPage: todaySabaqPages[0],
      secondaryPages: todaySabaqPages.length > 1 ? todaySabaqPages : [],
      juz: plannedDay.sabaqJuz ?? getJuzForPage(todaySabaqPages[0]),
      isCompleted: sabaqDone,
      areAllTasksDone,
      completedTaskCount,
      totalTaskCount,
    };
  }

  // Consolidation or rest/0-page cycle day
  const activeKinds: TaskKind[] = [];
  if (plannedDay.sabqiPages.length > 0) activeKinds.push('sabqi');
  if (plannedDay.manzilPages.length > 0) activeKinds.push('manzil');
  const completedTaskCount = activeKinds.filter((k) => Boolean(dayLog?.tasks[k]?.completed)).length;
  const totalTaskCount = activeKinds.length;
  const areAllTasksDone =
    totalTaskCount > 0 ? completedTaskCount === totalTaskCount : Boolean(dayLog?.manualConfirmed);

  return {
    mode: 'consolidation',
    primaryPage: plannedDay.sabqiPages[0] ?? null,
    secondaryPages: plannedDay.sabqiPages,
    juz: plannedDay.sabqiPages[0] ? getJuzForPage(plannedDay.sabqiPages[0]) : null,
    isCompleted: areAllTasksDone,
    areAllTasksDone,
    completedTaskCount,
    totalTaskCount,
  };
}

function takeRotatingPages(
  pool: number[],
  count: number,
  cursor: number
): { picked: number[]; nextCursor: number } {
  if (pool.length === 0 || count <= 0) {
    return { picked: [], nextCursor: cursor };
  }
  const actualCount = Math.min(count, pool.length);
  const picked: number[] = [];
  let idx = cursor % pool.length;
  for (let i = 0; i < actualCount; i++) {
    picked.push(pool[idx]);
    idx = (idx + 1) % pool.length;
  }
  return { picked, nextCursor: idx };
}

export interface GenerateCalendarOptions {
  trackId?: PlanTrackId;
  startPage?: number;
  direction?: PlanDirection;
}

/**
 * Generates the complete fixed plan calendar from startDate.
 * Keeps the legacy 3-year plan logic completely unchanged.
 */
export function generatePlanCalendar(
  startDate: string,
  order: MemorizationOrder,
  options?: GenerateCalendarOptions
): PlannedDay[] {
  const trackId: PlanTrackId = options?.trackId ?? 'three_years';
  const sequence =
    options?.startPage !== undefined && options?.direction !== undefined
      ? buildSequenceFromConfig(options.startPage, options.direction)
      : buildMemorizationSequence(order);

  // Integer-cycle plans (1y, 2y, juz/month, 5y)
  if (trackId !== 'three_years') {
    const totalDays = computeCyclePlanDurationDays(trackId, TOTAL_MUSHAF_PAGES);
    const days: PlannedDay[] = [];
    let seqIdx = 0;
    let manzilCursor = 0;

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const current = addDays(startDate, dayIndex);
      const dow = getDayOfWeek(current);
      const monthNumber = getCyclePlanMonthNumber(trackId, dayIndex);
      const pagesToday = getPagesAssignedOnDay(trackId, dayIndex);
      const sabaqPages =
        pagesToday > 0 ? sequence.slice(seqIdx, Math.min(TOTAL_MUSHAF_PAGES, seqIdx + pagesToday)) : [];

      const sabqiPages = sequence.slice(Math.max(0, seqIdx - 7), seqIdx);
      const olderPool = sequence.slice(0, Math.max(0, seqIdx - 7));
      const isWeeklyRestDay =
        (trackId === 'intensive_1y' || trackId === 'two_years') && dayIndex % 7 === 6;

      let manzilPages: number[] = [];
      if (!isWeeklyRestDay && olderPool.length > 0) {
        const { picked, nextCursor } = takeRotatingPages(
          olderPool,
          getManzilPagesPerDay(Math.min(30, monthNumber)),
          manzilCursor
        );
        manzilPages = picked;
        manzilCursor = nextCursor;
      }

      seqIdx += sabaqPages.length;

      days.push({
        date: current,
        dayIndex,
        monthNumber,
        dayOfWeek: dow,
        phase: 'memorization',
        sabaqPage: sabaqPages[0] ?? null,
        sabaqPages,
        sabaqJuz: sabaqPages[0] ? getJuzForPage(sabaqPages[0]) : null,
        sabqiPages: isWeeklyRestDay ? [] : sabqiPages,
        manzilPages,
        weeklyReviewPages: [],
        isFriday: false,
        isSaturday: isWeeklyRestDay,
        fullReviewJuz: null,
        fullReviewPages: [],
      });
    }

    return days;
  }

  // Legacy 3-year plan (strictly preserved)
  const phase1End = addMonths(startDate, 30);
  const planEnd = addMonths(startDate, 36);

  const days: PlannedDay[] = [];
  let current = startDate;
  let dayIndex = 0;
  let seqIdx = 0;
  let manzilCursor = 0;
  let currentWeekSabaqPages: number[] = [];
  let fullReviewDayOffset = 0;

  while (current < planEnd) {
    const dow = getDayOfWeek(current);
    const monthNumber = getPlanMonthNumber(startDate, current);

    // Reset weekly accumulator on Sunday
    if (dow === 0) {
      currentWeekSabaqPages = [];
    }

    if (current < phase1End) {
      const manzilTarget = getManzilPagesPerDay(monthNumber);
      const isFriday = dow === 5;
      const isSaturday = dow === 6;

      if (!isFriday && !isSaturday) {
        // Sunday - Thursday
        if (seqIdx < TOTAL_MUSHAF_PAGES) {
          const sabaqPage = sequence[seqIdx];
          const sabqiPages = sequence.slice(Math.max(0, seqIdx - 7), seqIdx);
          const olderPool = sequence.slice(0, Math.max(0, seqIdx - 7));
          const { picked: manzilPages, nextCursor } = takeRotatingPages(
            olderPool,
            manzilTarget,
            manzilCursor
          );
          manzilCursor = nextCursor;
          currentWeekSabaqPages.push(sabaqPage);
          seqIdx++;

          days.push({
            date: current,
            dayIndex,
            monthNumber,
            dayOfWeek: dow,
            phase: 'memorization',
            sabaqPage,
            sabaqPages: [sabaqPage],
            sabaqJuz: getJuzForPage(sabaqPage),
            sabqiPages,
            manzilPages,
            weeklyReviewPages: [],
            isFriday: false,
            isSaturday: false,
            fullReviewJuz: null,
            fullReviewPages: [],
          });
        } else {
          // Consolidation period after 604 pages finish (~month 28-30)
          const sabqiPages = sequence.slice(TOTAL_MUSHAF_PAGES - 7, TOTAL_MUSHAF_PAGES);
          const olderPool = sequence.slice(0, TOTAL_MUSHAF_PAGES - 7);
          const { picked: manzilPages, nextCursor } = takeRotatingPages(
            olderPool,
            manzilTarget,
            manzilCursor
          );
          manzilCursor = nextCursor;

          days.push({
            date: current,
            dayIndex,
            monthNumber,
            dayOfWeek: dow,
            phase: 'consolidation',
            sabaqPage: null,
            sabaqPages: [],
            sabaqJuz: null,
            sabqiPages,
            manzilPages,
            weeklyReviewPages: [],
            isFriday: false,
            isSaturday: false,
            fullReviewJuz: null,
            fullReviewPages: [],
          });
        }
      } else if (isFriday) {
        // Friday: review week's 5 pages + teacher recitation + routine review
        const sabqiPages = sequence.slice(Math.max(0, seqIdx - 7), seqIdx);
        const olderPool = sequence.slice(0, Math.max(0, seqIdx - 7));
        const { picked: manzilPages, nextCursor } = takeRotatingPages(
          olderPool,
          manzilTarget,
          manzilCursor
        );
        manzilCursor = nextCursor;

        days.push({
          date: current,
          dayIndex,
          monthNumber,
          dayOfWeek: dow,
          phase: seqIdx < TOTAL_MUSHAF_PAGES ? 'memorization' : 'consolidation',
          sabaqPage: null,
          sabaqPages: [],
          sabaqJuz: null,
          sabqiPages,
          manzilPages,
          weeklyReviewPages: [...currentWeekSabaqPages],
          isFriday: true,
          isSaturday: false,
          fullReviewJuz: null,
          fullReviewPages: [],
        });
      } else {
        // Saturday: catch-up + rest
        days.push({
          date: current,
          dayIndex,
          monthNumber,
          dayOfWeek: dow,
          phase: seqIdx < TOTAL_MUSHAF_PAGES ? 'memorization' : 'consolidation',
          sabaqPage: null,
          sabaqPages: [],
          sabaqJuz: null,
          sabqiPages: [],
          manzilPages: [],
          weeklyReviewPages: [],
          isFriday: false,
          isSaturday: true,
          fullReviewJuz: null,
          fullReviewPages: [],
        });
      }
    } else {
      // Months 31-36: Full review phase, 1 Juz per day (~6 cycles)
      const cyclePos = fullReviewDayOffset % TOTAL_JUZ;
      const reviewJuz = order === 'A' ? cyclePos + 1 : TOTAL_JUZ - cyclePos;
      fullReviewDayOffset++;

      days.push({
        date: current,
        dayIndex,
        monthNumber,
        dayOfWeek: dow,
        phase: 'full_review',
        sabaqPage: null,
        sabaqPages: [],
        sabaqJuz: null,
        sabqiPages: [],
        manzilPages: [],
        weeklyReviewPages: [],
        isFriday: dow === 5,
        isSaturday: dow === 6,
        fullReviewJuz: reviewJuz,
        fullReviewPages: getPagesInJuz(reviewJuz),
      });
    }

    current = addDays(current, 1);
    dayIndex++;
  }

  return days;
}

export function getJuzScheduleSummaries(
  calendar: PlannedDay[],
  order: MemorizationOrder
): JuzScheduleSummary[] {
  const map = new Map<number, { startDate: string | null; endDate: string | null }>();
  for (let j = 1; j <= TOTAL_JUZ; j++) {
    map.set(j, { startDate: null, endDate: null });
  }

  const firstSeenJuz: number[] = [];
  const seenJuz = new Set<number>();

  for (const day of calendar) {
    const pages =
      day.sabaqPages && day.sabaqPages.length > 0
        ? day.sabaqPages
        : day.sabaqPage !== null
        ? [day.sabaqPage]
        : [];
    for (const p of pages) {
      const juz = getJuzForPage(p);
      if (!seenJuz.has(juz)) {
        seenJuz.add(juz);
        firstSeenJuz.push(juz);
      }
      const entry = map.get(juz)!;
      if (!entry.startDate) entry.startDate = day.date;
      entry.endDate = day.date;
    }
  }

  const fallbackOrder =
    order === 'A'
      ? JUZ_RANGES.map((r) => r.juz)
      : [...JUZ_RANGES].sort((a, b) => b.juz - a.juz).map((r) => r.juz);

  const finalOrder =
    firstSeenJuz.length > 0
      ? [...firstSeenJuz, ...fallbackOrder.filter((j) => !seenJuz.has(j))]
      : fallbackOrder;

  const rangeByJuz = new Map(JUZ_RANGES.map((r) => [r.juz, r]));

  return finalOrder.map((juzNum) => {
    const r = rangeByJuz.get(juzNum)!;
    const dates = map.get(r.juz)!;
    return {
      juz: r.juz,
      startPage: r.startPage,
      endPage: r.endPage,
      pageCount: r.pageCount,
      startDate: dates.startDate,
      endDate: dates.endDate,
    };
  });
}

export interface MissedPageInfo {
  page: number;
  juz: number;
  scheduledDate: string;
}

/**
 * Returns scheduled Sabaq pages strictly before referenceDate that have not been memorized yet.
 */
export function getMissedPages(
  calendar: PlannedDay[],
  pageProgress: Record<number, PageProgress>,
  referenceDate: string
): MissedPageInfo[] {
  const missed: MissedPageInfo[] = [];
  for (const day of calendar) {
    if (day.date >= referenceDate) break;
    const pages =
      day.sabaqPages && day.sabaqPages.length > 0
        ? day.sabaqPages
        : day.sabaqPage !== null
        ? [day.sabaqPage]
        : [];
    for (const p of pages) {
      const prog = pageProgress[p];
      if (!prog || prog.status === 'not_started') {
        missed.push({
          page: p,
          juz: getJuzForPage(p),
          scheduledDate: day.date,
        });
      }
    }
  }
  return missed;
}

export function isBehindScheduleWarning(missedPages: MissedPageInfo[]): boolean {
  return missedPages.length > 3;
}

export function getExtraReviewPages(pageProgress: Record<number, PageProgress>): number[] {
  return Object.values(pageProgress)
    .filter((p) => p.extraReviewPending || p.status === 'needs_review')
    .map((p) => p.page)
    .sort((a, b) => a - b);
}

/**
 * Applies a task rating to pageProgress cleanly:
 * - 'perfect' -> status 'strong', clears extraReviewPending
 * - 'hesitated' -> status 'memorized', clears extraReviewPending
 * - 'mistakes' -> status 'needs_review', sets extraReviewPending = true
 */
export function applyRatingToPages(
  prev: Record<number, PageProgress>,
  pages: number[],
  rating: TaskRating,
  kind: TaskKind,
  timestampIso: string,
  memorizedAtOverride?: string
): Record<number, PageProgress> {
  if (pages.length === 0) return prev;
  const next = { ...prev };
  for (const page of pages) {
    if (page < 1 || page > TOTAL_MUSHAF_PAGES) continue;
    const existing = next[page] ?? {
      page,
      status: 'not_started',
      extraReviewPending: false,
      reviewCount: 0,
    };

    const nextStatus =
      rating === 'perfect'
        ? 'strong'
        : rating === 'hesitated'
        ? 'memorized'
        : 'needs_review';

    next[page] = {
      ...existing,
      status: nextStatus,
      lastRating: rating,
      lastReviewedAt: timestampIso,
      memorizedAt: existing.memorizedAt ?? memorizedAtOverride ?? timestampIso,
      extraReviewPending: rating === 'mistakes',
      reviewCount: existing.reviewCount + 1,
    };
  }
  return next;
}

export function getCompletedJuzList(pageProgress: Record<number, PageProgress>): number[] {
  const completed: number[] = [];
  for (const range of JUZ_RANGES) {
    let allDone = true;
    for (let p = range.startPage; p <= range.endPage; p++) {
      const status = pageProgress[p]?.status ?? 'not_started';
      if (status === 'not_started') {
        allDone = false;
        break;
      }
    }
    if (allDone) completed.push(range.juz);
  }
  return completed;
}

export function getJuzCompletionStats(
  pageProgress: Record<number, PageProgress>,
  juz: number
): { done: number; total: number; strong: number; needsReview: number; percent: number } {
  const range = JUZ_RANGES.find((r) => r.juz === juz)!;
  let done = 0;
  let strong = 0;
  let needsReview = 0;
  for (let p = range.startPage; p <= range.endPage; p++) {
    const status = pageProgress[p]?.status ?? 'not_started';
    if (status !== 'not_started') done++;
    if (status === 'strong') strong++;
    if (status === 'needs_review') needsReview++;
  }
  return {
    done,
    total: range.pageCount,
    strong,
    needsReview,
    percent: Math.round((done / range.pageCount) * 100),
  };
}

export function hasDayActivity(log?: DayLog): boolean {
  if (!log) return false;
  const anyTask = Object.values(log.tasks || {}).some((t) => t?.completed);
  return Boolean(
    anyTask ||
      log.recitedToTeacher ||
      (log.caughtUpPages && log.caughtUpPages.length > 0) ||
      log.manualConfirmed
  );
}

export function getTotalActiveDays(dayLogs: Record<string, DayLog>): number {
  let count = 0;
  for (const log of Object.values(dayLogs)) {
    if (hasDayActivity(log)) {
      count++;
    }
  }
  return count;
}

export function buildPageRange(startPage: number, endPage?: number | null): number[] {
  if (!Number.isFinite(startPage)) return [];
  const start = Math.trunc(startPage);
  if (start < 1 || start > TOTAL_MUSHAF_PAGES) return [];
  if (endPage === undefined || endPage === null || !Number.isFinite(endPage)) {
    return [start];
  }
  const end = Math.trunc(endPage);
  if (end < start || end > TOTAL_MUSHAF_PAGES) {
    return [start];
  }
  const pages: number[] = [];
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  return pages;
}

export function getUnconfirmedRecentPastDays(
  calendar: PlannedDay[],
  dayLogs: Record<string, DayLog>,
  referenceDate: string,
  maxLookbackDays = 7
): PlannedDay[] {
  const earliest = addDays(referenceDate, -maxLookbackDays);
  const recent: PlannedDay[] = [];
  for (const day of calendar) {
    if (day.date >= referenceDate) break;
    if (day.date < earliest) continue;
    if (day.isSaturday && day.phase !== 'full_review') continue;
    if (!hasDayActivity(dayLogs[day.date])) {
      recent.push(day);
    }
  }
  return recent.reverse();
}

export interface ConfirmPastDayParams {
  dayLogs: Record<string, DayLog>;
  pageProgress: Record<number, PageProgress>;
  startDate: string;
  todayIso: string;
  targetDate: string;
  pages: number[];
  rating: TaskRating;
  note?: string;
  plannedDay?: PlannedDay | null;
  nowIso: string;
}

export function confirmPastDayRecord(params: ConfirmPastDayParams): {
  dayLogs: Record<string, DayLog>;
  pageProgress: Record<number, PageProgress>;
  appliedPages: number[];
} {
  const {
    dayLogs,
    pageProgress,
    startDate,
    todayIso,
    targetDate,
    pages,
    rating,
    note,
    plannedDay,
    nowIso,
  } = params;

  if (targetDate < startDate || targetDate > todayIso) {
    return { dayLogs, pageProgress, appliedPages: [] };
  }

  const appliedPages = Array.from(
    new Set(
      pages
        .map((p) => Math.trunc(p))
        .filter((p) => Number.isFinite(p) && p >= 1 && p <= TOTAL_MUSHAF_PAGES)
    )
  ).sort((a, b) => a - b);

  const taskKind: TaskKind =
    plannedDay?.phase === 'full_review'
      ? 'full_review'
      : plannedDay?.isFriday
      ? 'friday_review'
      : 'sabaq';

  const existingLog = dayLogs[targetDate] ?? { date: targetDate, tasks: {} };
  const mergedManualPages = Array.from(
    new Set([...(existingLog.manualPages ?? []), ...appliedPages])
  ).sort((a, b) => a - b);

  const trimmedNote = note?.trim();
  const isRetroactive = targetDate < todayIso;

  const nextLog: DayLog = {
    ...existingLog,
    manualConfirmed: true,
    manualPages: mergedManualPages,
    manualNote: trimmedNote || existingLog.manualNote,
    confirmedAfterMidnightAt: isRetroactive ? nowIso : existingLog.confirmedAfterMidnightAt,
    tasks: {
      ...existingLog.tasks,
      [taskKind]: {
        completed: true,
        rating,
        completedAt: nowIso,
        durationSeconds: existingLog.tasks[taskKind]?.durationSeconds ?? 0,
        retroactive: isRetroactive,
      },
    },
  };

  const nextProgress =
    appliedPages.length > 0
      ? applyRatingToPages(
          pageProgress,
          appliedPages,
          rating,
          taskKind,
          nowIso,
          targetDate
        )
      : pageProgress;

  return {
    dayLogs: {
      ...dayLogs,
      [targetDate]: nextLog,
    },
    pageProgress: nextProgress,
    appliedPages,
  };
}

/**
 * Computes current streak of consecutive days ending on referenceDate (or yesterday if today isn't logged yet)
 * where at least one task or post-midnight manual confirmation was completed (or Saturday rest day if no tasks were missed).
 */
export function computeCurrentStreak(
  dayLogs: Record<string, DayLog>,
  startDate: string,
  referenceDate: string
): number {
  if (referenceDate < startDate) return 0;

  let cursor = referenceDate;
  if (!hasDayActivity(dayLogs[cursor])) {
    cursor = addDays(referenceDate, -1);
  }

  let streak = 0;
  while (cursor >= startDate) {
    const dow = getDayOfWeek(cursor);
    if (hasDayActivity(dayLogs[cursor])) {
      streak++;
      cursor = addDays(cursor, -1);
    } else if (dow === 6 && streak > 0) {
      // Saturday rest day preserves streak if days before it were active
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function getMemorizedStats(pageProgress: Record<number, PageProgress>) {
  let memorizedCount = 0;
  let strongCount = 0;
  let needsReviewCount = 0;
  for (let p = 1; p <= TOTAL_MUSHAF_PAGES; p++) {
    const st = pageProgress[p]?.status ?? 'not_started';
    if (st !== 'not_started') memorizedCount++;
    if (st === 'strong') strongCount++;
    if (st === 'needs_review') needsReviewCount++;
  }
  const percent = Number(((memorizedCount / TOTAL_MUSHAF_PAGES) * 100).toFixed(1));
  return {
    memorizedCount,
    strongCount,
    needsReviewCount,
    notStartedCount: TOTAL_MUSHAF_PAGES - memorizedCount,
    percent,
  };
}

export function getPagesPerMonthStats(
  pageProgress: Record<number, PageProgress>
): Array<{ monthKey: string; label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const prog of Object.values(pageProgress)) {
    if (prog.status !== 'not_started' && prog.memorizedAt) {
      const monthKey = prog.memorizedAt.slice(0, 7);
      counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1);
    }
  }
  const keys = Array.from(counts.keys()).sort();
  return keys.map((key) => {
    const [y, m] = key.split('-').map(Number);
    return {
      monthKey: key,
      label: `${ARABIC_MONTHS[m - 1]} ${y}`,
      count: counts.get(key)!,
    };
  });
}

export interface WeeklyStatsPoint {
  weekStart: string;
  weekEnd: string;
  shortLabel: string;
  rangeLabel: string;
  count: number;
}

function toLocalISODateFromTimestamp(ts: string): string {
  if (!ts.includes('T')) {
    return ts.slice(0, 10);
  }
  const parsed = new Date(ts);
  if (Number.isNaN(parsed.getTime())) {
    return ts.slice(0, 10);
  }
  return getTodayLocalISO(parsed);
}

/**
 * Returns 13 Sunday-to-Saturday week buckets (~3 months) ending with referenceDate's week,
 * counting memorized pages by their memorizedAt date.
 */
export function getPagesPerWeekLast3Months(
  pageProgress: Record<number, PageProgress>,
  referenceDate: string
): WeeklyStatsPoint[] {
  const WEEKS_COUNT = 13;
  const currentDow = getDayOfWeek(referenceDate);
  const currentWeekStart = addDays(referenceDate, -currentDow);

  const buckets: WeeklyStatsPoint[] = [];
  for (let i = WEEKS_COUNT - 1; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -i * 7);
    const weekEnd = addDays(weekStart, 6);
    const startParts = parseISODate(weekStart);
    const endParts = parseISODate(weekEnd);
    buckets.push({
      weekStart,
      weekEnd,
      shortLabel: `${startParts.day}/${startParts.month}`,
      rangeLabel: `${startParts.day} ${ARABIC_MONTHS[startParts.month - 1]} – ${endParts.day} ${ARABIC_MONTHS[endParts.month - 1]}`,
      count: 0,
    });
  }

  const firstWeekStart = buckets[0].weekStart;
  const lastWeekEnd = buckets[buckets.length - 1].weekEnd;

  for (const prog of Object.values(pageProgress)) {
    if (prog.status === 'not_started' || !prog.memorizedAt) continue;
    const dateIso = toLocalISODateFromTimestamp(prog.memorizedAt);
    if (dateIso < firstWeekStart || dateIso > lastWeekEnd) continue;

    for (const bucket of buckets) {
      if (dateIso >= bucket.weekStart && dateIso <= bucket.weekEnd) {
        bucket.count += 1;
        break;
      }
    }
  }

  return buckets;
}
