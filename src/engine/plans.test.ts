import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_CONFIG } from '../config/planConfig';
import { buildSequenceFromConfig } from './mushaf';
import { addDays, diffDays, generatePlanCalendar } from './planner';
import {
  computeCyclePlanDurationDays,
  getPagesAssignedOnDay,
  getRequiredPagesByDayIndex,
  isoToDDMMYYYY,
  parseDDMMYYYYToIso,
  PLAN_TRACKS,
  toLatinDigits,
} from './plans';
import { DEFAULT_APP_STATE, hasExistingPlanOrProgress } from '../utils/storage';

test('Cycle plans reach exact target durations: 1y=352, 2y=704, juz/month=906, 5y=1812', () => {
  assert.equal(computeCyclePlanDurationDays('intensive_1y'), 352);
  assert.equal(computeCyclePlanDurationDays('two_years'), 704);
  assert.equal(computeCyclePlanDurationDays('juz_per_month'), 906);
  assert.equal(computeCyclePlanDurationDays('five_years'), 1812);
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

test('Five-year plan assigns 0 pages on days 0 and 1, and exactly 1 page on day 2', () => {
  assert.equal(getPagesAssignedOnDay('five_years', 0), 0);
  assert.equal(getPagesAssignedOnDay('five_years', 1), 0);
  assert.equal(getPagesAssignedOnDay('five_years', 2), 1);

  assert.equal(getRequiredPagesByDayIndex('five_years', 0), 0);
  assert.equal(getRequiredPagesByDayIndex('five_years', 1), 0);
  assert.equal(getRequiredPagesByDayIndex('five_years', 2), 1);
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

