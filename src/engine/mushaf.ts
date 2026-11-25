import { PLAN_CONFIG } from '../config/planConfig';
import type { JuzRange, MemorizationOrder, PlanDirection } from '../types/plan';

export const TOTAL_MUSHAF_PAGES = PLAN_CONFIG.TOTAL_MUSHAF_PAGES;
export const TOTAL_JUZ = PLAN_CONFIG.TOTAL_JUZ;

export const JUZ_RANGES: JuzRange[] = Array.from({ length: TOTAL_JUZ }, (_, idx) => {
  const juz = idx + 1;
  if (juz === 1) {
    return { juz: 1, startPage: 1, endPage: 21, pageCount: 21 };
  }
  if (juz === 30) {
    return { juz: 30, startPage: 582, endPage: TOTAL_MUSHAF_PAGES, pageCount: TOTAL_MUSHAF_PAGES - 581 };
  }
  const startPage = 22 + (juz - 2) * 20;
  const endPage = startPage + 19;
  return { juz, startPage, endPage, pageCount: 20 };
});

export interface JuzBeginningInfo {
  juz: number;
  surah: string;
  ayah: number;
  opening: string;
}

export const JUZ_BEGINNINGS: Record<number, JuzBeginningInfo> = {
  1: { juz: 1, surah: 'الفاتحة', ayah: 1, opening: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
  2: { juz: 2, surah: 'البقرة', ayah: 142, opening: 'سَيَقُولُ السُّفَهَاءُ' },
  3: { juz: 3, surah: 'البقرة', ayah: 253, opening: 'تِلْكَ الرُّسُلُ' },
  4: { juz: 4, surah: 'آل عمران', ayah: 92, opening: 'لَن تَنَالُوا الْبِرَّ' },
  5: { juz: 5, surah: 'النساء', ayah: 24, opening: 'وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ' },
  6: { juz: 6, surah: 'النساء', ayah: 148, opening: 'لَا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ' },
  7: { juz: 7, surah: 'المائدة', ayah: 82, opening: 'لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً' },
  8: { juz: 8, surah: 'الأنعام', ayah: 111, opening: 'وَلَوْ أَنَّنَا نَزَّلْنَا' },
  9: { juz: 9, surah: 'الأعراف', ayah: 88, opening: 'قَالَ الْمَلَأُ' },
  10: { juz: 10, surah: 'الأنفال', ayah: 41, opening: 'وَاعْلَمُوا أَنَّمَا غَنِمْتُم' },
  11: { juz: 11, surah: 'التوبة', ayah: 93, opening: 'إِنَّمَا السَّبِيلُ عَلَى الَّذِينَ يَسْتَأْذِنُونَكَ' },
  12: { juz: 12, surah: 'هود', ayah: 6, opening: 'وَمَا مِن دَابَّةٍ' },
  13: { juz: 13, surah: 'يوسف', ayah: 53, opening: 'وَمَا أُبَرِّئُ نَفْسِي' },
  14: { juz: 14, surah: 'الحجر', ayah: 1, opening: 'الر' },
  15: { juz: 15, surah: 'الإسراء', ayah: 1, opening: 'سُبْحَانَ الَّذِي أَسْرَىٰ' },
  16: { juz: 16, surah: 'الكهف', ayah: 75, opening: 'قَالَ أَلَمْ أَقُل لَّكَ' },
  17: { juz: 17, surah: 'الأنبياء', ayah: 1, opening: 'اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ' },
  18: { juz: 18, surah: 'المؤمنون', ayah: 1, opening: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ' },
  19: { juz: 19, surah: 'الفرقان', ayah: 21, opening: 'وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا' },
  20: { juz: 20, surah: 'النمل', ayah: 56, opening: 'فَمَا كَانَ جَوَابَ قَوْمِهِ' },
  21: { juz: 21, surah: 'العنكبوت', ayah: 46, opening: 'وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ' },
  22: { juz: 22, surah: 'الأحزاب', ayah: 31, opening: 'وَمَن يَقْنُتْ مِنكُنَّ' },
  23: { juz: 23, surah: 'يس', ayah: 28, opening: 'وَمَا أَنزَلْنَا عَلَىٰ قَوْمِهِ مِن بَعْدِهِ' },
  24: { juz: 24, surah: 'الزمر', ayah: 32, opening: 'فَمَنْ أَظْلَمُ مِمَّن كَذَبَ' },
  25: { juz: 25, surah: 'فصلت', ayah: 47, opening: 'إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ' },
  26: { juz: 26, surah: 'الأحقاف', ayah: 1, opening: 'حم' },
  27: { juz: 27, surah: 'الذاريات', ayah: 31, opening: 'قَالَ فَمَا خَطْبُكُمْ' },
  28: { juz: 28, surah: 'المجادلة', ayah: 1, opening: 'قَدْ سَمِعَ اللَّهُ' },
  29: { juz: 29, surah: 'الملك', ayah: 1, opening: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ' },
  30: { juz: 30, surah: 'النبأ', ayah: 1, opening: 'عَمَّ يَتَسَاءَلُونَ' },
};

export const JUZ_NAMES_AR: Record<number, string> = {
  1: 'الجزء الأول (بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ)',
  2: 'الجزء الثاني (سَيَقُولُ السُّفَهَاءُ)',
  3: 'الجزء الثالث (تِلْكَ الرُّسُلُ)',
  4: 'الجزء الرابع (لَن تَنَالُوا الْبِرَّ)',
  5: 'الجزء الخامس (وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ)',
  6: 'الجزء السادس (لَا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ)',
  7: 'الجزء السابع (لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً)',
  8: 'الجزء الثامن (وَلَوْ أَنَّنَا نَزَّلْنَا)',
  9: 'الجزء التاسع (قَالَ الْمَلَأُ)',
  10: 'الجزء العاشر (وَاعْلَمُوا أَنَّمَا غَنِمْتُم)',
  11: 'الجزء الحادي عشر (إِنَّمَا السَّبِيلُ)',
  12: 'الجزء الثاني عشر (وَمَا مِن دَابَّةٍ)',
  13: 'الجزء الثالث عشر (وَمَا أُبَرِّئُ نَفْسِي)',
  14: 'الجزء الرابع عشر (الر)',
  15: 'الجزء الخامس عشر (سُبْحَانَ الَّذِي أَسْرَىٰ)',
  16: 'الجزء السادس عشر (قَالَ أَلَمْ أَقُل لَّكَ)',
  17: 'الجزء السابع عشر (اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ)',
  18: 'الجزء الثامن عشر (قَدْ أَفْلَحَ الْمُؤْمِنُونَ)',
  19: 'الجزء التاسع عشر (وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا)',
  20: 'الجزء العشرون (فَمَا كَانَ جَوَابَ قَوْمِهِ)',
  21: 'الجزء الحادي والعشرون (وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ)',
  22: 'الجزء الثاني والعشرون (وَمَن يَقْنُتْ مِنكُنَّ)',
  23: 'الجزء الثالث والعشرون (وَمَا أَنزَلْنَا عَلَىٰ قَوْمِهِ)',
  24: 'الجزء الرابع والعشرون (فَمَنْ أَظْلَمُ مِمَّن كَذَبَ)',
  25: 'الجزء الخامس والعشرون (إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ)',
  26: 'الجزء السادس والعشرون (حم)',
  27: 'الجزء السابع والعشرون (قَالَ فَمَا خَطْبُكُمْ)',
  28: 'الجزء الثامن والعشرون (قَدْ سَمِعَ اللَّهُ)',
  29: 'الجزء التاسع والعشرون (تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ)',
  30: 'الجزء الثلاثون (عَمَّ يَتَسَاءَلُونَ)',
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

/**
 * Builds an exact 604-page sequence without duplicates starting from startPage in the given direction,
 * wrapping around at Mushaf boundaries so the full Mushaf is memorized once.
 */
export function buildSequenceFromConfig(
  startPage: number,
  direction: PlanDirection,
  totalPages: number = TOTAL_MUSHAF_PAGES
): number[] {
  const clampedStart = Math.min(totalPages, Math.max(1, Math.trunc(startPage)));
  const pages: number[] = [];
  if (direction === 'forward') {
    for (let p = clampedStart; p <= totalPages; p++) pages.push(p);
    for (let p = 1; p < clampedStart; p++) pages.push(p);
  } else {
    for (let p = clampedStart; p >= 1; p--) pages.push(p);
    for (let p = totalPages; p > clampedStart; p--) pages.push(p);
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
  if (pages.length === 2) return `الصفحتان ${pages[0]} و${pages[1]}`;
  const step = pages[1] - pages[0];
  const contiguous =
    (step === 1 || step === -1) &&
    pages.every((p, idx) => idx === 0 || p === pages[idx - 1] + step);
  if (contiguous) {
    return `صفحات ${pages[0]}–${pages[pages.length - 1]}`;
  }
  if (pages.length <= 4) {
    return `صفحات ${pages.join('، ')}`;
  }
  return `${pages.length} صفحات (${pages[0]} ... ${pages[pages.length - 1]})`;
}

export function formatMemorizationPagesAr(pages: number[], dayNumber?: number): string {
  if (pages.length === 0) return 'لا يوجد';
  const body =
    pages.length === 1
      ? `صفحة ${pages[0]}`
      : pages.length === 2
      ? `الصفحتان ${pages[0]} و${pages[1]}`
      : formatPageRangeAr(pages);
  return dayNumber !== undefined ? `اليوم ${dayNumber}: ${body}` : body;
}

