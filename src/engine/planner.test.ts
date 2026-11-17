import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMemorizationSequence,
  getJuzForPage,
  getManzilPagesPerDay,
  JUZ_RANGES,
  TOTAL_MUSHAF_PAGES,
} from './mushaf';
import {
  applyRatingToPages,
  computeCurrentStreak,
  generatePlanCalendar,
  getExtraReviewPages,
  getJuzScheduleSummaries,
  getMissedPages,
  getPagesPerWeekLast3Months,
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
