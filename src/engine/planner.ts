import type {
  DayLog,
  JuzScheduleSummary,
  MemorizationOrder,
  PageProgress,
  PlannedDay,
  TaskKind,
  TaskRating,
} from '../types/plan';
import {
  buildMemorizationSequence,
  getJuzForPage,
  getManzilPagesPerDay,
  getPagesInJuz,
  JUZ_RANGES,
  TOTAL_JUZ,
  TOTAL_MUSHAF_PAGES,
} from './mushaf';

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

/**
 * Generates the complete, fixed 36-month calendar from startDate.
 */
export function generatePlanCalendar(
  startDate: string,
  order: MemorizationOrder
): PlannedDay[] {
  const phase1End = addMonths(startDate, 30);
  const planEnd = addMonths(startDate, 36);
  const sequence = buildMemorizationSequence(order);

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

  for (const day of calendar) {
    if (day.sabaqPage !== null && day.sabaqJuz !== null) {
      const entry = map.get(day.sabaqJuz)!;
      if (!entry.startDate) entry.startDate = day.date;
      entry.endDate = day.date;
    }
  }

  const orderedJuz =
    order === 'A'
      ? JUZ_RANGES
      : [...JUZ_RANGES].sort((a, b) => b.juz - a.juz);

  return orderedJuz.map((r) => {
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
    if (day.sabaqPage !== null && day.sabaqJuz !== null) {
      const prog = pageProgress[day.sabaqPage];
      if (!prog || prog.status === 'not_started') {
        missed.push({
          page: day.sabaqPage,
          juz: day.sabaqJuz,
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
  timestampIso: string
): Record<number, PageProgress> {
  if (pages.length === 0) return prev;
  const next = { ...prev };
  for (const page of pages) {
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
      memorizedAt: existing.memorizedAt ?? timestampIso,
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

/**
 * Computes current streak of consecutive days ending on referenceDate (or yesterday if today isn't logged yet)
 * where at least one task was completed (or Saturday rest day if no tasks were missed).
 */
export function computeCurrentStreak(
  dayLogs: Record<string, DayLog>,
  startDate: string,
  referenceDate: string
): number {
  if (referenceDate < startDate) return 0;

  const hasActivity = (date: string): boolean => {
    const log = dayLogs[date];
    if (!log) return false;
    const anyTask = Object.values(log.tasks || {}).some((t) => t?.completed);
    return Boolean(anyTask || log.recitedToTeacher || (log.caughtUpPages && log.caughtUpPages.length > 0));
  };

  let cursor = referenceDate;
  if (!hasActivity(cursor)) {
    cursor = addDays(referenceDate, -1);
  }

  let streak = 0;
  while (cursor >= startDate) {
    const dow = getDayOfWeek(cursor);
    if (hasActivity(cursor)) {
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
