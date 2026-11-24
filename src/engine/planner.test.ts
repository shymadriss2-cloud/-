import test from 'node:test';
import assert from 'node:assert/strict';
import type { DayLog } from '../types/plan';
import {
  buildMemorizationSequence,
  getJuzForPage,
  getManzilPagesPerDay,
  JUZ_BEGINNINGS,
  JUZ_NAMES_AR,
  JUZ_RANGES,
  TOTAL_MUSHAF_PAGES,
} from './mushaf';
import {
  applyRatingToPages,
  buildPageRange,
  computeCurrentStreak,
  confirmPastDayRecord,
  diffDays,
  generatePlanCalendar,
  getExtraReviewPages,
  getJuzScheduleSummaries,
  getMissedPages,
  getPagesPerWeekLast3Months,
  getPlanTimelineSummary,
  getTodayPageFocusStatus,
  getTotalActiveDays,
  getUnconfirmedRecentPastDays,
  isBehindScheduleWarning,
} from './planner';

test('Madani mushaf juz boundaries sum to 604 pages with exact counts', () => {
  assert.equal(JUZ_RANGES.length, 30);
  assert.deepEqual(JUZ_RANGES[0], { juz: 1, startPage: 1, endPage: 21, pageCount: 21 });
  assert.deepEqual(JUZ_RANGES[1], { juz: 2, startPage: 22, endPage: 41, pageCount: 20 });
  assert.deepEqual(JUZ_RANGES[28], { juz: 29, startPage: 562, endPage: 581, pageCount: 20 });
  assert.deepEqual(JUZ_RANGES[29], { juz: 30, startPage: 582, endPage: 604, pageCount: 23 });

  const sum = JUZ_RANGES.reduce((acc, r) => acc + r.pageCount, 0);
  assert.equal(sum, TOTAL_MUSHAF_PAGES);
  assert.equal(getJuzForPage(1), 1);
  assert.equal(getJuzForPage(21), 1);
  assert.equal(getJuzForPage(22), 2);
  assert.equal(getJuzForPage(582), 30);
  assert.equal(getJuzForPage(604), 30);
});

test('Order A and Order B sequences cover all 604 pages accurately', () => {
  const seqA = buildMemorizationSequence('A');
  assert.equal(seqA.length, 604);
  assert.equal(seqA[0], 1);
  assert.equal(seqA[603], 604);

  const seqB = buildMemorizationSequence('B');
  assert.equal(seqB.length, 604);
  assert.equal(new Set(seqB).size, 604);
  // Starts with Juz 30 pages 582..604 forward
  assert.equal(seqB[0], 582);
  assert.equal(seqB[22], 604);
  // Then Juz 29 pages 562..581 forward
  assert.equal(seqB[23], 562);
  assert.equal(seqB[42], 581);
  // Ends with Juz 1 pages 1..21 forward
  assert.equal(seqB[603], 21);
});

test('Manzil page counts match month tiers', () => {
  assert.equal(getManzilPagesPerDay(1), 3);
  assert.equal(getManzilPagesPerDay(6), 3);
  assert.equal(getManzilPagesPerDay(7), 5);
  assert.equal(getManzilPagesPerDay(15), 5);
  assert.equal(getManzilPagesPerDay(16), 8);
  assert.equal(getManzilPagesPerDay(24), 8);
  assert.equal(getManzilPagesPerDay(25), 10);
  assert.equal(getManzilPagesPerDay(30), 10);
});

test('Full 36-month calendar schedules all 604 pages, Friday reviews, Sabqi, Manzil, and Months 31-36 full review', () => {
  // 2026-11-15 is a Sunday
  const cal = generatePlanCalendar('2026-11-15', 'A');
  assert.ok(cal.length >= 1095 && cal.length <= 1097);

  const sabaqDays = cal.filter((d) => d.sabaqPage !== null);
  assert.equal(sabaqDays.length, 604);
  assert.equal(sabaqDays[0].sabaqPage, 1);
  assert.equal(sabaqDays[603].sabaqPage, 604);

  // Day 1 (Sun): no Sabqi, no Manzil
  assert.deepEqual(sabaqDays[0].sabqiPages, []);
  assert.deepEqual(sabaqDays[0].manzilPages, []);

  // Day 6 (index 5 = next Sunday): Sabqi has 5 previous pages
  assert.deepEqual(sabaqDays[5].sabqiPages, [1, 2, 3, 4, 5]);

  // Day 10 (index 9): Sabqi has last 7 pages [3..9], older pool [1, 2] -> Manzil picks [1, 2]
  assert.deepEqual(sabaqDays[9].sabqiPages, [3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(sabaqDays[9].manzilPages, [1, 2]);

  // First Friday (2026-11-20) has 5 weekly review pages [1,2,3,4,5]
  const firstFriday = cal.find((d) => d.date === '2026-11-20');
  assert.ok(firstFriday);
  assert.equal(firstFriday.isFriday, true);
  assert.deepEqual(firstFriday.weeklyReviewPages, [1, 2, 3, 4, 5]);

  // First Saturday (2026-11-21) has no Sabaq
  const firstSaturday = cal.find((d) => d.date === '2026-11-21');
  assert.ok(firstSaturday);
  assert.equal(firstSaturday.isSaturday, true);
  assert.equal(firstSaturday.sabaqPage, null);

  // Months 31-36 full review phase: 1 juz per day (~6 cycles)
  const fullReviewDays = cal.filter((d) => d.phase === 'full_review');
  assert.ok(fullReviewDays.length >= 180);
  assert.equal(fullReviewDays[0].fullReviewJuz, 1);
  assert.equal(fullReviewDays[30].fullReviewJuz, 1);

  // Juz schedule summaries cover all 30 juz
  const summaries = getJuzScheduleSummaries(cal, 'A');
  assert.equal(summaries.length, 30);
  assert.equal(summaries[0].startDate, '2026-11-15');
  assert.ok(summaries[29].endDate !== null);
});

test('Missed pages, gentle >3 warning, extra review on mistakes, and streak calculation', () => {
  const cal = generatePlanCalendar('2026-11-15', 'A');
  let progress = {};

  // Reference date 2026-11-20 (Friday): Sun..Thu (5 days = pages 1..5) are before Friday
  let missed = getMissedPages(cal, progress, '2026-11-20');
  assert.equal(missed.length, 5);
  assert.equal(isBehindScheduleWarning(missed), true);

  // Mark pages 1 and 2 memorized -> 3 missed (<= 3, no warning)
  progress = applyRatingToPages(progress, [1, 2], 'perfect', 'sabaq', '2026-11-16T06:00:00Z');
  missed = getMissedPages(cal, progress, '2026-11-20');
  assert.equal(missed.length, 3);
  assert.equal(isBehindScheduleWarning(missed), false);

  // Rate page 3 with 'mistakes' -> memorized attempt done, automatically queued in extra review
  progress = applyRatingToPages(progress, [3], 'mistakes', 'sabaq', '2026-11-17T06:00:00Z');
  assert.deepEqual(getExtraReviewPages(progress), [3]);

  // Re-rate page 3 as 'perfect' -> cleared from extra review
  progress = applyRatingToPages(progress, [3], 'perfect', 'sabqi', '2026-11-18T16:00:00Z');
  assert.deepEqual(getExtraReviewPages(progress), []);

  // Streak across Sun, Mon, Tue
  const logs = {
    '2026-11-15': { date: '2026-11-15', tasks: { sabaq: { completed: true } } },
    '2026-11-16': { date: '2026-11-16', tasks: { sabaq: { completed: true } } },
    '2026-11-17': { date: '2026-11-17', tasks: { sabaq: { completed: true } } },
  };
  assert.equal(computeCurrentStreak(logs, '2026-11-15', '2026-11-17'), 3);
});

test('getPagesPerWeekLast3Months buckets memorized pages across 13 weekly intervals', () => {
  // Reference date: Tuesday 2026-11-17 -> current week Sun 2026-11-15 .. Sat 2026-11-21
  const progress = {
    1: {
      page: 1,
      status: 'strong' as const,
      memorizedAt: '2026-11-15',
      extraReviewPending: false,
      reviewCount: 1,
    },
    2: {
      page: 2,
      status: 'memorized' as const,
      memorizedAt: '2026-11-17',
      extraReviewPending: false,
      reviewCount: 1,
    },
    3: {
      page: 3,
      status: 'strong' as const,
      memorizedAt: '2026-11-10', // previous week (Sun 2026-11-08 .. Sat 2026-11-14)
      extraReviewPending: false,
      reviewCount: 1,
    },
    4: {
      page: 4,
      status: 'strong' as const,
      memorizedAt: '2026-06-01', // older than 3 months -> excluded
      extraReviewPending: false,
      reviewCount: 1,
    },
    5: {
      page: 5,
      status: 'not_started' as const,
      memorizedAt: '2026-11-16', // not_started -> excluded
      extraReviewPending: false,
      reviewCount: 0,
    },
  };

  const weekly = getPagesPerWeekLast3Months(progress, '2026-11-17');
  assert.equal(weekly.length, 13);
  assert.equal(weekly[12].weekStart, '2026-11-15');
  assert.equal(weekly[12].count, 2);
  assert.equal(weekly[11].weekStart, '2026-11-08');
  assert.equal(weekly[11].count, 1);
  assert.equal(
    weekly.reduce((sum, w) => sum + w.count, 0),
    3
  );
});

test('confirmPastDayRecord restores streak after midnight, updates active days, and anchors page progress to targetDate', () => {
  const startDate = '2026-11-15'; // Sun
  const cal = generatePlanCalendar(startDate, 'A');
  // User completed Sun (15th) and Mon (16th), forgot Tue (17th) before midnight, now it is Wed (18th)
  let dayLogs: Record<string, DayLog> = {
    '2026-11-15': { date: '2026-11-15', tasks: { sabaq: { completed: true } } },
    '2026-11-16': { date: '2026-11-16', tasks: { sabaq: { completed: true } } },
  };
  let pageProgress = applyRatingToPages({}, [1, 2], 'perfect', 'sabaq', '2026-11-16T20:00:00Z', '2026-11-16');

  // On Wed 2026-11-18 before confirming Tue: streak is broken (0) and active days = 2
  assert.equal(computeCurrentStreak(dayLogs, startDate, '2026-11-18'), 0);
  assert.equal(getTotalActiveDays(dayLogs), 2);

  // Recent unconfirmed past days should highlight 2026-11-17 (yesterday) first
  const unconfirmed = getUnconfirmedRecentPastDays(cal, dayLogs, '2026-11-18');
  assert.equal(unconfirmed[0].date, '2026-11-17');

  // User confirms Tue 2026-11-17 after midnight with numeric page 3 (and range helper test)
  assert.deepEqual(buildPageRange(3, 5), [3, 4, 5]);
  assert.deepEqual(buildPageRange(3, null), [3]);

  const result = confirmPastDayRecord({
    dayLogs,
    pageProgress,
    startDate,
    todayIso: '2026-11-18',
    targetDate: '2026-11-17',
    pages: buildPageRange(3),
    rating: 'perfect',
    note: 'تأكيد بعد منتصف الليل',
    plannedDay: unconfirmed[0],
    nowIso: '2026-11-18T01:15:00Z',
  });

  dayLogs = result.dayLogs;
  pageProgress = result.pageProgress;

  // Streak is fully restored to 3 days and total active days is 3
  assert.equal(computeCurrentStreak(dayLogs, startDate, '2026-11-18'), 3);
  assert.equal(getTotalActiveDays(dayLogs), 3);
  assert.equal(dayLogs['2026-11-17'].manualConfirmed, true);
  assert.equal(dayLogs['2026-11-17'].tasks.sabaq?.retroactive, true);
  // Page 3 is marked strong and anchored to 2026-11-17 (not 2026-11-18)
  assert.equal(pageProgress[3].status, 'strong');
  assert.equal(pageProgress[3].memorizedAt, '2026-11-17');
  // Page 3 is no longer considered missed on 2026-11-18
  const missed = getMissedPages(cal, pageProgress, '2026-11-18');
  assert.equal(missed.some((m) => m.page === 3), false);
});

test('All 30 Juz beginnings match verified Surah, Ayah, and opening text', () => {
  assert.equal(Object.keys(JUZ_BEGINNINGS).length, 30);
  assert.equal(Object.keys(JUZ_NAMES_AR).length, 30);

  assert.deepEqual(JUZ_BEGINNINGS[1], {
    juz: 1,
    surah: 'الفاتحة',
    ayah: 1,
    opening: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  });
  assert.deepEqual(JUZ_BEGINNINGS[7], {
    juz: 7,
    surah: 'المائدة',
    ayah: 82,
    opening: 'لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً',
  });
  assert.deepEqual(JUZ_BEGINNINGS[11], {
    juz: 11,
    surah: 'التوبة',
    ayah: 93,
    opening: 'إِنَّمَا السَّبِيلُ عَلَى الَّذِينَ يَسْتَأْذِنُونَكَ',
  });
  assert.deepEqual(JUZ_BEGINNINGS[14], {
    juz: 14,
    surah: 'الحجر',
    ayah: 1,
    opening: 'الر',
  });
  assert.deepEqual(JUZ_BEGINNINGS[20], {
    juz: 20,
    surah: 'النمل',
    ayah: 56,
    opening: 'فَمَا كَانَ جَوَابَ قَوْمِهِ',
  });
  assert.deepEqual(JUZ_BEGINNINGS[21], {
    juz: 21,
    surah: 'العنكبوت',
    ayah: 46,
    opening: 'وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ',
  });
  assert.deepEqual(JUZ_BEGINNINGS[23], {
    juz: 23,
    surah: 'يس',
    ayah: 28,
    opening: 'وَمَا أَنزَلْنَا عَلَىٰ قَوْمِهِ مِن بَعْدِهِ',
  });
  assert.deepEqual(JUZ_BEGINNINGS[30], {
    juz: 30,
    surah: 'النبأ',
    ayah: 1,
    opening: 'عَمَّ يَتَسَاءَلُونَ',
  });
  assert.match(JUZ_NAMES_AR[1], /بِسْمِ اللَّهِ/);
  assert.match(JUZ_NAMES_AR[14], /الر/);
  assert.match(JUZ_NAMES_AR[21], /وَلَا تُجَادِلُوا/);
});

test('getPlanTimelineSummary computes memorization end date, consolidation end date, and remaining days accurately', () => {
  const startDate = '2026-11-15';
  const cal = generatePlanCalendar(startDate, 'A');
  const sabaqDays = cal.filter((d) => d.sabaqPage !== null);
  const expectedMemEnd = sabaqDays[sabaqDays.length - 1].date;
  const expectedConsEnd = cal[cal.length - 1].date;

  assert.equal(diffDays('2026-11-15', '2026-11-15'), 0);
  assert.equal(diffDays('2026-11-15', '2026-11-22'), 7);
  assert.equal(diffDays('2026-11-22', '2026-11-15'), -7);

  // On start date
  const atStart = getPlanTimelineSummary(cal, startDate, startDate);
  assert.equal(atStart.memorizationEndDate, expectedMemEnd);
  assert.equal(atStart.consolidationEndDate, expectedConsEnd);
  assert.ok(atStart.memorizationEndDate < atStart.consolidationEndDate);
  assert.equal(atStart.remainingSabaqDays, 604);
  assert.equal(atStart.daysRemainingToMemorization, diffDays(startDate, expectedMemEnd));
  assert.equal(atStart.daysRemainingToConsolidation, diffDays(startDate, expectedConsEnd));

  // One week later (2026-11-22)
  const afterWeek = getPlanTimelineSummary(cal, startDate, '2026-11-22');
  assert.equal(
    afterWeek.daysRemainingToMemorization,
    atStart.daysRemainingToMemorization - 7
  );
  assert.equal(afterWeek.remainingSabaqDays, 599); // First week Sun-Thu (5 pages) passed

  // On final memorization day
  const onMemEnd = getPlanTimelineSummary(cal, startDate, expectedMemEnd);
  assert.equal(onMemEnd.daysRemainingToMemorization, 0);
  assert.equal(onMemEnd.remainingSabaqDays, 1);
  assert.ok(onMemEnd.daysRemainingToConsolidation > 180);

  // After full 36-month plan ends
  const afterPlan = getPlanTimelineSummary(cal, startDate, '2030-01-01');
  assert.equal(afterPlan.daysRemainingToMemorization, 0);
  assert.equal(afterPlan.daysRemainingToConsolidation, 0);
  assert.equal(afterPlan.remainingSabaqDays, 0);
});

test('getTodayPageFocusStatus tracks today page number and completion state across modes', () => {
  const startDate = '2026-11-15'; // Sun
  const cal = generatePlanCalendar(startDate, 'A');

  // Day 10 (has sabaq, sabqi, and manzil)
  const sabaqDays = cal.filter((d) => d.sabaqPage !== null);
  const day10 = sabaqDays[9];
  assert.equal(day10.sabaqPage, 10);

  const beforeDone = getTodayPageFocusStatus(day10, undefined, {}, []);
  assert.equal(beforeDone.mode, 'sabaq');
  assert.equal(beforeDone.primaryPage, 10);
  assert.equal(beforeDone.juz, 1);
  assert.equal(beforeDone.isCompleted, false);
  assert.equal(beforeDone.areAllTasksDone, false);
  assert.equal(beforeDone.totalTaskCount, 3);

  // Completing Sabaq turns isCompleted true (badge changes to theme accent immediately)
  const sabaqOnlyDone = getTodayPageFocusStatus(
    day10,
    { date: day10.date, tasks: { sabaq: { completed: true, rating: 'perfect' } } },
    {},
    []
  );
  assert.equal(sabaqOnlyDone.isCompleted, true);
  assert.equal(sabaqOnlyDone.areAllTasksDone, false);
  assert.equal(sabaqOnlyDone.completedTaskCount, 1);

  // Completing all 3 tasks sets areAllTasksDone true
  const allDone = getTodayPageFocusStatus(
    day10,
    {
      date: day10.date,
      tasks: {
        sabaq: { completed: true, rating: 'perfect' },
        sabqi: { completed: true, rating: 'perfect' },
        manzil: { completed: true, rating: 'perfect' },
      },
    },
    {},
    []
  );
  assert.equal(allDone.isCompleted, true);
  assert.equal(allDone.areAllTasksDone, true);
  assert.equal(allDone.completedTaskCount, 3);

  // Friday mode
  const friday = cal.find((d) => d.isFriday)!;
  const friStatus = getTodayPageFocusStatus(friday, undefined, {}, []);
  assert.equal(friStatus.mode, 'friday');
  assert.equal(friStatus.primaryPage, 1);
  assert.equal(friStatus.isCompleted, false);

  // Full review mode (months 31-36)
  const fullRev = cal.find((d) => d.phase === 'full_review')!;
  const revStatus = getTodayPageFocusStatus(
    fullRev,
    { date: fullRev.date, tasks: { full_review: { completed: true, rating: 'perfect' } } },
    {},
    []
  );
  assert.equal(revStatus.mode, 'full_review');
  assert.equal(revStatus.isCompleted, true);
});
