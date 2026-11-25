import { PLAN_CONFIG } from '../config/planConfig';
import { getSurahEntryForPage } from '../data/surahs';
import type { PlanConfig, PlannedDay, PlanTrackId } from '../types/plan';

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
 * Integer ceil division: ceil(a / b) = floor((a + b - 1) / b) for a >= 0, b > 0.
 */
export function ceilDiv(a: number, b: number): number {
  if (a <= 0) return 0;
  return Math.floor((a + b - 1) / b);
}

/**
 * Integer-division ceil distribution across N days for P pages:
 * a[i] = ceil((i + 1) * P / N) - ceil(i * P / N)
 * Starts Day 0 with 1 page and yields D=905 for 20/30, D=1810 for 7/21.
 */
export function buildCeilCyclePattern(pagesInCycle: number, cycleDays: number): number[] {
  const pattern: number[] = [];
  for (let i = 0; i < cycleDays; i++) {
    const cur = ceilDiv((i + 1) * pagesInCycle, cycleDays);
    const prev = ceilDiv(i * pagesInCycle, cycleDays);
    pattern.push(cur - prev);
  }
  return pattern;
}

export const PLAN_TRACKS: Record<PlanTrackId, PlanTrackDefinition> = {
  intensive_1y: {
    id: 'intensive_1y',
    title: 'سنة مكثفة',
    subtitle: 'لأصحاب الهمم العالية والتفرغ اليومي',
    rateLabel: 'صفحتان يومياً · 6 أيام في الأسبوع (12 صفحة/أسبوع)',
    cycleDays: 7,
    pagesPerDay: [2, 2, 2, 2, 2, 2, 0],
    legacyMemorizationDays: 352,
    legacyTotalDays: 352,
  },
  two_years: {
    id: 'two_years',
    title: 'سنتان',
    subtitle: 'حفظ متواصل بوتيرة يومية ميسّرة',
    rateLabel: 'صفحة يومياً · 6 أيام في الأسبوع (6 صفحات/أسبوع)',
    cycleDays: 7,
    pagesPerDay: [1, 1, 1, 1, 1, 1, 0],
    legacyMemorizationDays: 704,
    legacyTotalDays: 704,
  },
  three_years: {
    id: 'three_years',
    title: 'ثلاث سنوات (الخطة الأساسية)',
    subtitle: 'الخطة المتوازنة مع التثبيت والمراجعة الشاملة',
    rateLabel: '5 صفحات في الأسبوع (الأحد–الخميس + مراجعة الجمعة)',
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
    rateLabel: '20 صفحة كل 30 يوماً موزعة بالتساوي',
    cycleDays: 30,
    pagesPerDay: buildCeilCyclePattern(20, 30),
    legacyMemorizationDays: 905,
    legacyTotalDays: 905,
  },
  five_years: {
    id: 'five_years',
    title: 'خمس سنوات (طويلة الأمد)',
    subtitle: 'خطوة ثابتة هادئة مع المشاغل اليومية',
    rateLabel: '7 صفحات كل 3 أسابيع موزعة بالتساوي',
    cycleDays: 21,
    pagesPerDay: buildCeilCyclePattern(7, 21),
    legacyMemorizationDays: 1810,
    legacyTotalDays: 1810,
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

export function getPlanTotalMonths(trackId: PlanTrackId = 'three_years'): number {
  if (trackId === 'three_years') {
    return 36;
  }
  const totalDays = computeCyclePlanDurationDays(trackId, PLAN_CONFIG.TOTAL_MUSHAF_PAGES);
  return Math.ceil(totalDays / 30.44);
}

export function getCyclePlanMonthNumber(trackId: PlanTrackId, dayIndex: number): number {
  const totalMonths = getPlanTotalMonths(trackId);
  const safeDayIndex = Math.max(0, dayIndex);
  return Math.min(totalMonths, Math.floor(safeDayIndex / 30.44) + 1);
}

export function formatUserPathSummary(plan: PlanConfig, calendar: PlannedDay[]): string {
  const trackId: PlanTrackId = plan.trackId ?? 'three_years';
  const planName =
    trackId === 'three_years' ? 'ثلاث سنوات (الخطة الأساسية)' : PLAN_TRACKS[trackId].title;

  const scheduledPages: number[] = [];
  for (const day of calendar) {
    if (day.sabaqPages && day.sabaqPages.length > 0) {
      scheduledPages.push(...day.sabaqPages);
    } else if (day.sabaqPage !== null) {
      scheduledPages.push(day.sabaqPage);
    }
  }

  const startPage = plan.startPage ?? scheduledPages[0] ?? 1;
  const endPage =
    scheduledPages.length > 0
      ? scheduledPages[scheduledPages.length - 1]
      : startPage === 1
      ? PLAN_CONFIG.TOTAL_MUSHAF_PAGES
      : startPage - 1;

  const startSurah = getSurahEntryForPage(startPage);
  const directionLabel =
    plan.direction === 'backward' ? 'عكس ترتيب المصحف' : 'بترتيب المصحف';

  return `مسارك: ${planName} · تبدأ من صفحة ${startPage} (${startSurah.name}) · ${directionLabel} · تنتهي عند صفحة ${endPage}`;
}

export function getDisplayTrackTitle(trackId: PlanTrackId = 'three_years'): string {
  return trackId === 'three_years' ? 'ثلاث سنوات (الخطة الأساسية)' : PLAN_TRACKS[trackId].title;
}

export function getPlanWeeklyGoal(trackId: PlanTrackId = 'three_years'): number {
  switch (trackId) {
    case 'intensive_1y':
      return 12;
    case 'two_years':
      return 6;
    case 'three_years':
      return 5;
    case 'juz_per_month':
      return Number(((20 * 7) / 30).toFixed(2)); // 4.67
    case 'five_years':
      return Number((7 / 3).toFixed(2)); // 2.33
  }
}

function addDaysIsoLocal(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = String(dt.getUTCFullYear()).padStart(4, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getIsoDayOfWeek(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function getThreeYearStartSundayInfo(startDateIso: string): {
  isFridayOrSaturday: boolean;
  firstSabaqDateIso: string;
  firstSabaqDDMMYYYY: string;
  memorizationEndDateIso: string;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDateIso.trim());
  if (!match) {
    return {
      isFridayOrSaturday: false,
      firstSabaqDateIso: startDateIso,
      firstSabaqDDMMYYYY: '',
      memorizationEndDateIso: startDateIso,
    };
  }
  const dow = getIsoDayOfWeek(startDateIso);
  const offsetToFirstSabaq = dow === 5 ? 2 : dow === 6 ? 1 : 0;
  const firstSabaqDateIso = addDaysIsoLocal(startDateIso, offsetToFirstSabaq);

  // Count forward until 604 Sun-Thu days have occurred starting from startDateIso
  let memCount = 0;
  let offset = 0;
  while (memCount < PLAN_CONFIG.TOTAL_MUSHAF_PAGES) {
    const curDow = (dow + offset) % 7;
    if (curDow !== 5 && curDow !== 6) {
      memCount++;
      if (memCount === PLAN_CONFIG.TOTAL_MUSHAF_PAGES) break;
    }
    offset++;
  }
  const memorizationEndDateIso = addDaysIsoLocal(startDateIso, offset);

  return {
    isFridayOrSaturday: dow === 5 || dow === 6,
    firstSabaqDateIso,
    firstSabaqDDMMYYYY: isoToDDMMYYYY(firstSabaqDateIso),
    memorizationEndDateIso,
  };
}


