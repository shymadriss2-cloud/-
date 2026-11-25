import { PLAN_CONFIG } from '../config/planConfig';
import type { PlanTrackId } from '../types/plan';

export interface PlanTrackDefinition {
  id: PlanTrackId;
  title: string;
  subtitle: string;
  rateLabel: string;
  cycleDays: number;
  pagesPerDay: number[];
  isLegacyThreeYear?: boolean;
  legacyMemorizationDays: number;
  legacyTotalDays: number;
}

/**
 * Integer-division even distribution across N days for P pages:
 * a[i] = floor((i + 1) * P / N) - floor(i * P / N)
 */
export function buildEvenCyclePattern(pagesInCycle: number, cycleDays: number): number[] {
  const pattern: number[] = [];
  for (let i = 0; i < cycleDays; i++) {
    const cur = Math.floor(((i + 1) * pagesInCycle) / cycleDays);
    const prev = Math.floor((i * pagesInCycle) / cycleDays);
    pattern.push(cur - prev);
  }
  return pattern;
}

export const PLAN_TRACKS: Record<PlanTrackId, PlanTrackDefinition> = {
  intensive_1y: {
    id: 'intensive_1y',
    title: 'سنة مكثفة',
    subtitle: 'لأصحاب الهمم العالية والتفرغ اليومي',
    rateLabel: 'صفحتان يومياً · ٦ أيام في الأسبوع (١٢ صفحة/أسبوع)',
    cycleDays: 7,
    pagesPerDay: [2, 2, 2, 2, 2, 2, 0],
    legacyMemorizationDays: 352,
    legacyTotalDays: 352,
  },
  two_years: {
    id: 'two_years',
    title: 'سنتان',
    subtitle: 'حفظ متواصل بوتيرة يومية ميسّرة',
    rateLabel: 'صفحة يومياً · ٦ أيام في الأسبوع (٦ صفحات/أسبوع)',
    cycleDays: 7,
    pagesPerDay: [1, 1, 1, 1, 1, 1, 0],
    legacyMemorizationDays: 704,
    legacyTotalDays: 704,
  },
  three_years: {
    id: 'three_years',
    title: 'ثلاث سنوات (الخطة الحالية)',
    subtitle: 'الخطة المتوازنة مع التثبيت والمراجعة الشاملة',
    rateLabel: '٥ صفحات في الأسبوع (الأحد–الخميس + مراجعة الجمعة)',
    cycleDays: 7,
    pagesPerDay: [1, 1, 1, 1, 1, 0, 0],
    isLegacyThreeYear: true,
    legacyMemorizationDays: 846,
    legacyTotalDays: 1096,
  },
  juz_per_month: {
    id: 'juz_per_month',
    title: 'جزء كل شهر',
    subtitle: 'وتيرة مرنة متدرجة على مدار الشهر',
    rateLabel: '٢٠ صفحة كل ٣٠ يوماً موزعة بالتساوي',
    cycleDays: 30,
    pagesPerDay: buildEvenCyclePattern(20, 30),
    legacyMemorizationDays: 906,
    legacyTotalDays: 906,
  },
  five_years: {
    id: 'five_years',
    title: 'خمس سنوات (طويلة الأمد)',
    subtitle: 'خطوة ثابتة هادئة مع المشاغل اليومية',
    rateLabel: '٧ صفحات كل ٣ أسابيع موزعة بالتساوي',
    cycleDays: 21,
    pagesPerDay: buildEvenCyclePattern(7, 21),
    legacyMemorizationDays: 1812,
    legacyTotalDays: 1812,
  },
};

export const PLAN_TRACK_LIST: PlanTrackDefinition[] = [
  PLAN_TRACKS.intensive_1y,
  PLAN_TRACKS.two_years,
  PLAN_TRACKS.three_years,
  PLAN_TRACKS.juz_per_month,
  PLAN_TRACKS.five_years,
];

/**
 * Returns the number of new pages assigned strictly on day index d (0-based from startDate)
 * for a cycle-pattern plan.
 */
export function getPagesAssignedOnDay(trackId: PlanTrackId, dayIndex: number): number {
  const def = PLAN_TRACKS[trackId];
  const pattern = def.pagesPerDay;
  const idx = ((dayIndex % pattern.length) + pattern.length) % pattern.length;
  return pattern[idx];
}

/**
 * Cumulative required pages by the end of day index d (0-based from startDate),
 * capped at totalMushafPages (default from PLAN_CONFIG.TOTAL_MUSHAF_PAGES = 604).
 */
export function getRequiredPagesByDayIndex(
  trackId: PlanTrackId,
  dayIndex: number,
  totalMushafPages: number = PLAN_CONFIG.TOTAL_MUSHAF_PAGES
): number {
  if (dayIndex < 0) return 0;
  const def = PLAN_TRACKS[trackId];
  const pattern = def.pagesPerDay;
  const cycleLen = pattern.length;
  const cycleSum = pattern.reduce((acc, n) => acc + n, 0);

  const inclusiveDays = dayIndex + 1;
  const fullCycles = Math.floor(inclusiveDays / cycleLen);
  const rem = inclusiveDays % cycleLen;

  let total = fullCycles * cycleSum;
  for (let i = 0; i < rem; i++) {
    total += pattern[i];
  }
  return Math.min(totalMushafPages, total);
}

/**
 * Finds the exact first number of days needed to reach totalMushafPages (604)
 * using the exact same cumulative simulation function.
 */
export function computeCyclePlanDurationDays(
  trackId: PlanTrackId,
  totalMushafPages: number = PLAN_CONFIG.TOTAL_MUSHAF_PAGES
): number {
  let dayIndex = 0;
  while (getRequiredPagesByDayIndex(trackId, dayIndex, totalMushafPages) < totalMushafPages) {
    dayIndex++;
    if (dayIndex > 20000) break; // safety guard
  }
  return dayIndex + 1;
}

export function formatApproximateYears(days: number): string {
  return (days / PLAN_CONFIG.DAYS_PER_YEAR).toFixed(2);
}

export function formatWeeksFromDays(days: number): number {
  return Math.ceil(days / 7);
}

const EASTERN_TO_LATIN_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => EASTERN_TO_LATIN_MAP[ch] ?? ch);
}

export function isoToDDMMYYYY(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function parseDDMMYYYYToIso(input: string): string | null {
  const normalized = toLatinDigits(input).trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

