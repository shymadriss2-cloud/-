import test from 'node:test';
import assert from 'node:assert/strict';
import { getDueReminders } from './reminders';
import type { ReminderSettings } from '../types/plan';

const BASE_REMINDERS: ReminderSettings = {
  enabled: false,
  sabaqTime: '05:30',
  sabqiTime: '16:15',
  manzilTime: '21:30',
  dailyReminderEnabled: false,
  dailyReminderTime: '08:00',
};

test('Daily reminder fires independently even when specific task reminders are disabled', () => {
  const fired = new Set<string>();
  const settings: ReminderSettings = {
    ...BASE_REMINDERS,
    enabled: false,
    dailyReminderEnabled: true,
    dailyReminderTime: '09:15',
  };

  // At 05:30 (sabaqTime), nothing fires because task reminders are off
  assert.equal(getDueReminders(settings, '05:30', '2026-11-17', fired).length, 0);

  // At 09:15, daily reminder fires
  const due = getDueReminders(settings, '09:15', '2026-11-17', fired);
  assert.equal(due.length, 1);
  assert.equal(due[0].id, 'daily');

  // Once marked fired, it does not fire again in the same minute/day
  fired.add(due[0].fireKey);
  assert.equal(getDueReminders(settings, '09:15', '2026-11-17', fired).length, 0);
});

test('Task reminders and daily reminder can both fire at the same time independently', () => {
  const fired = new Set<string>();
  const settings: ReminderSettings = {
    ...BASE_REMINDERS,
    enabled: true,
    sabaqTime: '08:00',
    dailyReminderEnabled: true,
    dailyReminderTime: '08:00',
  };

  const due = getDueReminders(settings, '08:00', '2026-11-17', fired);
  assert.equal(due.length, 2);
  assert.deepEqual(
    due.map((d) => d.id),
    ['sabaq', 'daily']
  );
});

test('Changing daily reminder time allows firing at the newly customized time', () => {
  const fired = new Set<string>();
  const settings1: ReminderSettings = {
    ...BASE_REMINDERS,
    dailyReminderEnabled: true,
    dailyReminderTime: '08:00',
  };

  const due1 = getDueReminders(settings1, '08:00', '2026-11-17', fired);
  assert.equal(due1.length, 1);
  fired.add(due1[0].fireKey);

  const settings2: ReminderSettings = {
    ...settings1,
    dailyReminderTime: '20:30',
  };
  const due2 = getDueReminders(settings2, '20:30', '2026-11-17', fired);
  assert.equal(due2.length, 1);
  assert.equal(due2[0].id, 'daily');
});
