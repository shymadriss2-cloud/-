import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_CONFIG } from '../config/planConfig';
import { buildSequenceFromConfig, formatMemorizationPagesAr, formatPageRangeAr } from './mushaf';
import {
  addDays,
  computeCurrentStreak,
  diffDays,
  generatePlanCalendar,
  getJuzScheduleSummaries,
  getPlanTimelineSummary,
  getUnconfirmedRecentPastDays,
} from './planner';
import {
  computeCyclePlanDurationDays,
  formatUserPathSummary,
  formatWeeksFromDays,
  getCyclePlanMonthNumber,
  getPagesAssignedOnDay,
  getPlanTotalMonths,
  getPlanWeeklyGoal,
  getRequiredPagesByDayIndex,
  getThreeYearStartSundayInfo,
  isoToDDMMYYYY,
  parseDDMMYYYYToIso,
  PLAN_TRACKS,
  toLatinDigits,
} from './plans';
import { DEFAULT_APP_STATE, hasExistingPlanOrProgress } from '../utils/storage';

test('Cycle plans reach exact target durations: 1y=352, 2y=704, juz/month=905, 5y=1810', () => {
  assert.equal(computeCyclePlanDurationDays('intensive_1y'), 352);
  assert.equal(computeCyclePlanDurationDays('two_years'), 704);
  assert.equal(computeCyclePlanDurationDays('juz_per_month'), 905);
  assert.equal(computeCyclePlanDurationDays('five_years'), 1810);

  assert.equal(formatWeeksFromDays(905), 130);
  assert.equal(formatWeeksFromDays(1810), 259);
  assert.equal(addDays('2026-11-25', 905 - 1), '2029-05-17');
  assert.equal(addDays('2026-11-25', 1810 - 1), '2031-11-08');
});

test('Legacy 3-year plan preserves exact 846 memorization days and 1096 total days', () => {
  const startDate = '2026-11-24';
  const cal = generatePlanCalendar(startDate, 'A', { trackId: 'three_years' });
  assert.equal(cal.length, 1096);

  const sabaqDays = cal.filter((d) => d.sabaqPage !== null);
  assert.equal(sabaqDays.length, PLAN_CONFIG.TOTAL_MUSHAF_PAGES);

  const lastSabaq = sabaqDays[sabaqDays.length - 1];
  const memDays = diffDays(startDate, lastSabaq.date) + 1;
  assert.equal(memDays, 846);
  assert.equal(PLAN_TRACKS.three_years.legacyMemorizationDays, 846);
  assert.equal(PLAN_TRACKS.three_years.legacyTotalDays, 1096);
});

test('Juz-per-month (20/30) and five-year (7/21) plans start Day 0 with 1 page using integer ceil formula', () => {
  // Juz per month: pattern repeats [1, 1, 0]
  assert.equal(getPagesAssignedOnDay('juz_per_month', 0), 1);
  assert.equal(getPagesAssignedOnDay('juz_per_month', 1), 1);
  assert.equal(getPagesAssignedOnDay('juz_per_month', 2), 0);
  assert.equal(getPagesAssignedOnDay('juz_per_month', 3), 1);

  assert.equal(getRequiredPagesByDayIndex('juz_per_month', 0), 1);
  assert.equal(getRequiredPagesByDayIndex('juz_per_month', 1), 2);
  assert.equal(getRequiredPagesByDayIndex('juz_per_month', 2), 2);

  // Juz per month from Juz Amma (page 582 forward)
  const juzCal = generatePlanCalendar('2026-11-25', 'B', {
    trackId: 'juz_per_month',
    startPage: 582,
    direction: 'forward',
  });
  assert.deepEqual(juzCal[0].sabaqPages, [582]);
  assert.deepEqual(juzCal[1].sabaqPages, [583]);
  assert.deepEqual(juzCal[2].sabaqPages, []);
  assert.deepEqual(juzCal[3].sabaqPages, [584]);
  const juzTimeline = getPlanTimelineSummary(juzCal, '2026-11-25', '2026-11-25');
  assert.equal(juzTimeline.memorizationEndDate, '2029-05-17');
  assert.equal(juzTimeline.remainingPlanSpanDays, 905);

  // Five-year: pages on days 0, 3, 6, ...
  assert.equal(getPagesAssignedOnDay('five_years', 0), 1);
  assert.equal(getPagesAssignedOnDay('five_years', 1), 0);
  assert.equal(getPagesAssignedOnDay('five_years', 2), 0);
  assert.equal(getPagesAssignedOnDay('five_years', 3), 1);

  assert.equal(getRequiredPagesByDayIndex('five_years', 0), 1);
  assert.equal(getRequiredPagesByDayIndex('five_years', 1), 1);
  assert.equal(getRequiredPagesByDayIndex('five_years', 2), 1);
  assert.equal(getRequiredPagesByDayIndex('five_years', 3), 2);

  // Five-year from An-Nas backward
  const fiveCal = generatePlanCalendar('2026-11-25', 'B', {
    trackId: 'five_years',
    startPage: 604,
    direction: 'backward',
  });
  assert.deepEqual(fiveCal[0].sabaqPages, [604]);
  assert.deepEqual(fiveCal[1].sabaqPages, []);
  assert.deepEqual(fiveCal[2].sabaqPages, []);
  assert.deepEqual(fiveCal[3].sabaqPages, [603]);
  const fiveTimeline = getPlanTimelineSummary(fiveCal, '2026-11-25', '2026-11-25');
  assert.equal(fiveTimeline.memorizationEndDate, '2031-11-08');
  assert.equal(fiveTimeline.remainingPlanSpanDays, 1810);

  // Five-year Day 2 (2026-11-26) has no new Sabaq page, only Sabqi review of [604]
  assert.deepEqual(fiveCal[1].sabqiPages, [604]);

  // Scheduled 0-task rest days (e.g. 2y every 7th day) are skipped in unconfirmed past days and preserve streak
  const twoYearCal = generatePlanCalendar('2026-11-19', 'A', {
    trackId: 'two_years',
    startPage: 1,
    direction: 'forward',
  });
  // Day index 6 is 2026-11-25 (weekly rest day with 0 tasks)
  const twoYearLogs: Record<string, { date: string; tasks: { sabaq?: { completed: boolean } } }> = {};
  for (let i = 0; i < 6; i++) {
    twoYearLogs[twoYearCal[i].date] = {
      date: twoYearCal[i].date,
      tasks: { sabaq: { completed: true } },
    };
  }
  const unconfirmed2y = getUnconfirmedRecentPastDays(twoYearCal, twoYearLogs, '2026-11-26');
  assert.equal(unconfirmed2y.some((d) => d.date === twoYearCal[6].date), false);
  assert.equal(computeCurrentStreak(twoYearLogs, '2026-11-19', '2026-11-25', twoYearCal), 6);
});

test('Weekly goals and 3-year weekend start dates compute accurately', () => {
  assert.equal(getPlanWeeklyGoal('intensive_1y'), 12);
  assert.equal(getPlanWeeklyGoal('two_years'), 6);
  assert.equal(getPlanWeeklyGoal('three_years'), 5);
  assert.equal(getPlanWeeklyGoal('juz_per_month'), 4.67);
  assert.equal(getPlanWeeklyGoal('five_years'), 2.33);

  const wedInfo = getThreeYearStartSundayInfo('2026-11-25');
  assert.equal(wedInfo.isFridayOrSaturday, false);
  assert.equal(wedInfo.memorizationEndDateIso, '2029-03-19');

  const friInfo = getThreeYearStartSundayInfo('2026-11-27');
  assert.equal(friInfo.isFridayOrSaturday, true);
  assert.equal(friInfo.firstSabaqDateIso, '2026-11-29');
  assert.equal(friInfo.firstSabaqDDMMYYYY, '29/11/2026');
  assert.equal(friInfo.memorizationEndDateIso, '2029-03-21');

  const satInfo = getThreeYearStartSundayInfo('2026-11-28');
  assert.equal(satInfo.isFridayOrSaturday, true);
  assert.equal(satInfo.firstSabaqDateIso, '2026-11-29');
  assert.equal(satInfo.firstSabaqDDMMYYYY, '29/11/2026');
  assert.equal(satInfo.memorizationEndDateIso, '2029-03-21');
});

test('Intensive 1y and 2y plans assign 0 pages on every 7th day from startDate', () => {
  for (let week = 0; week < 20; week++) {
    const seventhDayIndex = week * 7 + 6;
    assert.equal(getPagesAssignedOnDay('intensive_1y', seventhDayIndex), 0);
    assert.equal(getPagesAssignedOnDay('two_years', seventhDayIndex), 0);
  }
});

test('All cycle plans equal 604 on final day and strictly less than 604 one day earlier', () => {
  const cycleTracks = ['intensive_1y', 'two_years', 'juz_per_month', 'five_years'] as const;
  for (const trackId of cycleTracks) {
    const totalDays = computeCyclePlanDurationDays(trackId);
    const lastIdx = totalDays - 1;
    assert.equal(getRequiredPagesByDayIndex(trackId, lastIdx), PLAN_CONFIG.TOTAL_MUSHAF_PAGES);
    assert.ok(
      getRequiredPagesByDayIndex(trackId, lastIdx - 1) < PLAN_CONFIG.TOTAL_MUSHAF_PAGES,
      `${trackId} day before end should be < 604`
    );

    const cal = generatePlanCalendar('2026-11-24', 'A', {
      trackId,
      startPage: 1,
      direction: 'forward',
    });
    assert.equal(cal.length, totalDays);
    assert.equal(cal[cal.length - 1].date, addDays('2026-11-24', totalDays - 1));
    const totalScheduledPages = cal.flatMap((d) => d.sabaqPages ?? []);
    assert.equal(totalScheduledPages.length, PLAN_CONFIG.TOTAL_MUSHAF_PAGES);
    assert.equal(new Set(totalScheduledPages).size, PLAN_CONFIG.TOTAL_MUSHAF_PAGES);
  }
});

test('Starting from An-Nas (604) backward starts at 604 and finishes at 1 with no duplicates', () => {
  const seq = buildSequenceFromConfig(PLAN_CONFIG.TOTAL_MUSHAF_PAGES, 'backward');
  assert.equal(seq.length, PLAN_CONFIG.TOTAL_MUSHAF_PAGES);
  assert.equal(seq[0], 604);
  assert.equal(seq[seq.length - 1], 1);
  assert.equal(new Set(seq).size, PLAN_CONFIG.TOTAL_MUSHAF_PAGES);
});

test('Custom wrap-around sequence covers all 604 pages once in both directions', () => {
  const fwd = buildSequenceFromConfig(293, 'forward'); // Al-Kahf
  assert.equal(fwd[0], 293);
  assert.equal(fwd[fwd.length - 1], 292);
  assert.equal(new Set(fwd).size, 604);

  const bwd = buildSequenceFromConfig(582, 'backward'); // An-Naba
  assert.equal(bwd[0], 582);
  assert.equal(bwd[bwd.length - 1], 583);
  assert.equal(new Set(bwd).size, 604);
});

test('hasExistingPlanOrProgress blocks first-run setup whenever plan or progress exists', () => {
  assert.equal(hasExistingPlanOrProgress(DEFAULT_APP_STATE), false);

  assert.equal(
    hasExistingPlanOrProgress({
      ...DEFAULT_APP_STATE,
      plan: {
        startDate: '2026-11-24',
        order: 'A',
        locked: true,
        createdAt: '2026-11-24T00:00:00Z',
      },
    }),
    true
  );

  assert.equal(
    hasExistingPlanOrProgress({
      ...DEFAULT_APP_STATE,
      pageProgress: {
        1: {
          page: 1,
          status: 'strong',
          extraReviewPending: false,
          reviewCount: 1,
        },
      },
    }),
    true
  );
});

test('toLatinDigits, isoToDDMMYYYY, and parseDDMMYYYYToIso format and validate dates accurately', () => {
  assert.equal(toLatinDigits('١. صفحتان · ٦ أيام (١٢/٢٠٢٦)'), '1. صفحتان · 6 أيام (12/2026)');
  assert.equal(isoToDDMMYYYY('2026-11-25'), '25/11/2026');
  assert.equal(parseDDMMYYYYToIso('25/11/2026'), '2026-11-25');
  assert.equal(parseDDMMYYYYToIso('٢٥/١١/٢٠٢٦'), '2026-11-25');
  assert.equal(parseDDMMYYYYToIso('31/02/2026'), null); // invalid calendar date
  assert.equal(parseDDMMYYYYToIso('2026-11-25'), null); // wrong order
});

test('Month counts use ceil(totalDays / 30.44) for cycle plans and 36 for legacy 3-year plan', () => {
  assert.equal(getPlanTotalMonths('intensive_1y'), 12);
  assert.equal(getPlanTotalMonths('two_years'), 24);
  assert.equal(getPlanTotalMonths('juz_per_month'), 30);
  assert.equal(getPlanTotalMonths('five_years'), 60);
  assert.equal(getPlanTotalMonths('three_years'), 36);

  assert.equal(getCyclePlanMonthNumber('intensive_1y', 0), 1);
  assert.equal(getCyclePlanMonthNumber('intensive_1y', 351), 12);
  assert.equal(getCyclePlanMonthNumber('juz_per_month', 904), 30);
  assert.equal(getCyclePlanMonthNumber('five_years', 1809), 60);
});

test('Intensive 1y starting from An-Nas backward assigns [604, 603] on Day 1 and [602, 601] on Day 2', () => {
  const cal = generatePlanCalendar('2026-11-25', 'B', {
    trackId: 'intensive_1y',
    startPage: 604,
    direction: 'backward',
  });
  assert.deepEqual(cal[0].sabaqPages, [604, 603]);
  assert.deepEqual(cal[1].sabaqPages, [602, 601]);
  assert.equal(cal[0].monthNumber, 1);
  assert.equal(cal[cal.length - 1].monthNumber, 12);

  assert.equal(formatPageRangeAr(cal[0].sabaqPages!), 'الصفحتان 604 و603');
  assert.equal(formatMemorizationPagesAr(cal[0].sabaqPages!, 1), 'اليوم 1: الصفحتان 604 و603');

  const juzOrder = getJuzScheduleSummaries(cal, 'B').map((j) => j.juz);
  assert.equal(juzOrder[0], 30);
  assert.equal(juzOrder[juzOrder.length - 1], 1);

  const summary = formatUserPathSummary(
    {
      startDate: '2026-11-25',
      order: 'B',
      trackId: 'intensive_1y',
      startMode: 'from_nas',
      startPage: 604,
      direction: 'backward',
      locked: true,
      createdAt: '2026-11-25T00:00:00Z',
    },
    cal
  );
  assert.equal(
    summary,
    'مسارك: سنة مكثفة · تبدأ من صفحة 604 (الناس) · عكس ترتيب المصحف · تنتهي عند صفحة 1'
  );
});

test('Custom Al-Kahf (293) forward orders Juz summaries from 15 wrapping through 30 and 1..14', () => {
  const cal = generatePlanCalendar('2026-11-25', 'A', {
    trackId: 'two_years',
    startPage: 293,
    direction: 'forward',
  });
  const juzOrder = getJuzScheduleSummaries(cal, 'A').map((j) => j.juz);
  assert.equal(juzOrder[0], 15);
  assert.equal(juzOrder[1], 16);
  assert.equal(juzOrder[juzOrder.length - 1], 14);
});

