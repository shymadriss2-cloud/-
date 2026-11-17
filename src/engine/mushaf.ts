import type { JuzRange, MemorizationOrder } from '../types/plan';

export const TOTAL_MUSHAF_PAGES = 604;
export const TOTAL_JUZ = 30;

export const JUZ_RANGES: JuzRange[] = Array.from({ length: TOTAL_JUZ }, (_, idx) => {
  const juz = idx + 1;
  if (juz === 1) {
    return { juz: 1, startPage: 1, endPage: 21, pageCount: 21 };
  }
  if (juz === 30) {
    return { juz: 30, startPage: 582, endPage: 604, pageCount: 23 };
  }
  const startPage = 22 + (juz - 2) * 20;
  const endPage = startPage + 19;
  return { juz, startPage, endPage, pageCount: 20 };
});

export const JUZ_NAMES_AR: Record<number, string> = {
  1: 'الجزء الأول (آلم)',
  2: 'الجزء الثاني (سيقول)',
  3: 'الجزء الثالث (تلك الرسل)',
  4: 'الجزء الرابع (لن تنالوا)',
  5: 'الجزء الخامس (والمحصنات)',
  6: 'الجزء السادس (لا يحب الله)',
  7: 'الجزء السابع (وإذا سمعوا)',
  8: 'الجزء الثامن (ولو أننا)',
  9: 'الجزء التاسع (قال الملأ)',
  10: 'الجزء العاشر (واعلموا)',
  11: 'الجزء الحادي عشر (يعتذرون)',
  12: 'الجزء الثاني عشر (وما من دابة)',
  13: 'الجزء الثالث عشر (وما أبرئ)',
  14: 'الجزء الرابع عشر (ربما)',
  15: 'الجزء الخامس عشر (سبحان الذي)',
  16: 'الجزء السادس عشر (قال ألم)',
  17: 'الجزء السابع عشر (اقترب)',
  18: 'الجزء الثامن عشر (قد أفلح)',
  19: 'الجزء التاسع عشر (وقال الذين)',
  20: 'الجزء العشرون (أمن خلق)',
  21: 'الجزء الحادي والعشرون (اتل ما أوحي)',
  22: 'الجزء الثاني والعشرون (ومن يقنت)',
  23: 'الجزء الثالث والعشرون (وما لي)',
  24: 'الجزء الرابع والعشرون (فمن أظلم)',
  25: 'الجزء الخامس والعشرون (إليه يرد)',
  26: 'الجزء السادس والعشرون (حم)',
  27: 'الجزء السابع والعشرون (قال فما خطبكم)',
  28: 'الجزء الثامن والعشرون (قد سمع الله)',
  29: 'الجزء التاسع والعشرون (تبارك الذي)',
  30: 'الجزء الثلاثون (عمّ)',
};

export function getJuzForPage(page: number): number {
  if (page < 1 || page > TOTAL_MUSHAF_PAGES) {
    throw new RangeError(`Page number out of bounds: ${page}`);
  }
  for (const range of JUZ_RANGES) {
    if (page >= range.startPage && page <= range.endPage) {
      return range.juz;
    }
  }
  return 30;
}

export function getPagesInJuz(juz: number): number[] {
  const range = JUZ_RANGES.find((r) => r.juz === juz);
  if (!range) {
    throw new RangeError(`Juz out of bounds: ${juz}`);
  }
  const pages: number[] = [];
  for (let p = range.startPage; p <= range.endPage; p++) {
    pages.push(p);
  }
  return pages;
}

/**
 * Order A: Page 1 -> 604 (Al-Fatiha forward)
 * Order B: Juz 30 backward to Juz 1, pages forward within each Juz
 */
export function buildMemorizationSequence(order: MemorizationOrder): number[] {
  if (order === 'A') {
    return Array.from({ length: TOTAL_MUSHAF_PAGES }, (_, i) => i + 1);
  }
  const pages: number[] = [];
  for (let juz = TOTAL_JUZ; juz >= 1; juz--) {
    pages.push(...getPagesInJuz(juz));
  }
  return pages;
}

export function getManzilPagesPerDay(monthNumber: number): number {
  if (monthNumber <= 6) return 3;
  if (monthNumber <= 15) return 5;
  if (monthNumber <= 24) return 8;
  return 10;
}

export function formatPageRangeAr(pages: number[]): string {
  if (pages.length === 0) return 'لا يوجد';
  if (pages.length === 1) return `صفحة ${pages[0]}`;
  const sorted = [...pages].sort((a, b) => a - b);
  const contiguous = sorted.every((p, idx) => idx === 0 || p === sorted[idx - 1] + 1);
  if (contiguous) {
    return `صفحات ${sorted[0]}–${sorted[sorted.length - 1]}`;
  }
  if (pages.length <= 4) {
    return `صفحات ${pages.join('، ')}`;
  }
  return `${pages.length} صفحات (${pages[0]} ... ${pages[pages.length - 1]})`;
}
