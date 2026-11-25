import type { ReminderSettings } from '../types/plan';

export interface DueReminderNotification {
  fireKey: string;
  id: 'sabaq' | 'sabqi' | 'manzil' | 'daily';
  title: string;
  body: string;
}

export function formatHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Determines which browser notifications should fire right now,
 * keeping the standalone Daily Reminder strictly independent of task reminders.
 */
export function getDueReminders(
  reminders: ReminderSettings,
  currentHHMM: string,
  dateStr: string,
  alreadyFiredKeys: Set<string>
): DueReminderNotification[] {
  const due: DueReminderNotification[] = [];

  if (reminders.enabled) {
    const taskEntries: Array<['sabaq' | 'sabqi' | 'manzil', string, string]> = [
      ['sabaq', reminders.sabaqTime, 'حان موعد حفظ السبق اليومي'],
      ['sabqi', reminders.sabqiTime, 'حان موعد مراجعة السبقي (آخر ٧ صفحات)'],
      ['manzil', reminders.manzilTime, 'حان موعد مراجعة المنزل قبل النوم'],
    ];

    for (const [id, targetTime, body] of taskEntries) {
      const fireKey = `${dateStr}:${id}:${targetTime}`;
      if (currentHHMM === targetTime && !alreadyFiredKeys.has(fireKey)) {
        due.push({
          fireKey,
          id,
          title: 'وِرْد مُدَّكِر',
          body,
        });
      }
    }
  }

  if (reminders.dailyReminderEnabled) {
    const fireKey = `${dateStr}:daily:${reminders.dailyReminderTime}`;
    if (currentHHMM === reminders.dailyReminderTime && !alreadyFiredKeys.has(fireKey)) {
      due.push({
        fireKey,
        id: 'daily',
        title: 'تذكيرك اليومي — وِرْد مُدَّكِر',
        body: 'لا تنسَ وردك القرآني اليوم، قليل دائم خير من كثير منقطع.',
      });
    }
  }

  return due;
}
