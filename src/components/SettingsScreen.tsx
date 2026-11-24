import { useRef, useState } from 'react';
import { Bell, CalendarCheck2, Check, Clock, Download, Lock, Moon, Palette, RotateCcw, Sun, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { COLOR_PALETTES } from '../data/palettes';
import { formatShortArabicDate, type PlanTimelineSummary } from '../engine/planner';
import type { AppColorPalette, AppState, PlanConfig, ReminderSettings } from '../types/plan';
import { validateImportedState } from '../utils/storage';
import { HeroCornerArabesque, ThemeEmblem } from './IslamicOrnament';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsScreenProps {
  state: AppState;
  plan: PlanConfig;
  timeline: PlanTimelineSummary;
  onToggleDarkMode: () => void;
  onChangeAccentColor: (palette: AppColorPalette) => void;
  onUpdateReminders: (reminders: ReminderSettings) => void;
  onImportState: (next: AppState) => void;
  onResetAllData: () => void;
}

export function SettingsScreen({
  state,
  plan,
  timeline,
  onToggleDarkMode,
  onChangeAccentColor,
  onUpdateReminders,
  onImportState,
  onResetAllData,
}: SettingsScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);

  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permState, setPermState] = useState<string>(() =>
    notificationSupported ? Notification.permission : 'unsupported'
  );

  const handleToggleNotifications = async () => {
    if (!state.reminders.enabled) {
      let perm: NotificationPermission | 'unsupported' = notificationSupported
        ? Notification.permission
        : 'unsupported';
      if (notificationSupported && perm === 'default') {
        try {
          perm = await Notification.requestPermission();
        } catch {
          perm = 'denied';
        }
      }
      setPermState(perm);
      onUpdateReminders({ ...state.reminders, enabled: true });
      if (perm === 'granted') {
        setStatusMessage('تم تفعيل تذكيرات المهام بإشعارات المتصفح بنجاح.');
      } else {
        setStatusMessage(
          'تم تفعيل تذكيرات المهام (سيظهر التنبيه داخل التطبيق لعدم توفر إذن إشعارات المتصفح).'
        );
      }
    } else {
      onUpdateReminders({ ...state.reminders, enabled: false });
      setStatusMessage('تم إيقاف تذكيرات المهام المحددة.');
    }
  };

  const handleToggleDailyReminder = async () => {
    if (!state.reminders.dailyReminderEnabled) {
      let perm: NotificationPermission | 'unsupported' = notificationSupported
        ? Notification.permission
        : 'unsupported';
      if (notificationSupported && perm === 'default') {
        try {
          perm = await Notification.requestPermission();
        } catch {
          perm = 'denied';
        }
      }
      setPermState(perm);
      onUpdateReminders({ ...state.reminders, dailyReminderEnabled: true });
      if (perm === 'granted') {
        setStatusMessage(
          `تم تفعيل التذكير اليومي الساعة ${state.reminders.dailyReminderTime}.`
        );
      } else {
        setStatusMessage(
          `تم تفعيل التذكير اليومي الساعة ${state.reminders.dailyReminderTime} (سيظهر داخل التطبيق لعدم توفر إذن المتصفح).`
        );
      }
    } else {
      onUpdateReminders({ ...state.reminders, dailyReminderEnabled: false });
      setStatusMessage('تم إيقاف التذكير اليومي العام.');
    }
  };

  const handleTestNotification = () => {
    if (notificationSupported && Notification.permission === 'granted') {
      new Notification('مِحراب الحفظ', {
        body: 'حان وقت وردك القرآني الهادئ — بارك الله في وقتك.',
      });
      setStatusMessage('تم إرسال إشعار تجريبي.');
    } else {
      setStatusMessage('تنبيه تجريبي: حان وقت وردك القرآني الهادئ — بارك الله في وقتك.');
    }
  };

  const handleTestDailyReminder = () => {
    if (notificationSupported && Notification.permission === 'granted') {
      new Notification('تذكيرك اليومي — مِحراب الحفظ', {
        body: 'لا تنسَ وردك القرآني اليوم، قليل دائم خير من كثير منقطع.',
      });
      setStatusMessage('تم إرسال إشعار التذكير اليومي التجريبي.');
    } else {
      setStatusMessage('تذكيرك اليومي التجريبي: لا تنسَ وردك القرآني اليوم.');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mihrab-quran-backup-${plan.startDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('تم تصدير نسخة احتياطية من بياناتك بصيغة JSON.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validated = validateImportedState(parsed);
      if (!validated) {
        setStatusMessage('ملف النسخة الاحتياطية غير صالح.');
        return;
      }
      onImportState(validated);
      setStatusMessage('تم استيراد بياناتك واستعادتها بنجاح.');
    } catch {
      setStatusMessage('تعذّر قراءة الملف. تأكد من اختيار ملف JSON صحيح.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <section className="card-hero rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <HeroCornerArabesque className="absolute -left-6 -top-6 h-44 w-44 text-[var(--accent)] opacity-[0.20]" />
        <div className="relative z-10">
          <p className="text-xs text-[var(--text-muted)]">تخصيص المظهر والتنبيهات والنسخ الاحتياطي</p>
          <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            الإعدادات
          </h1>
        </div>
      </section>

      {statusMessage && (
        <div
          role="status"
          className="card-elevated rounded-xl border border-[var(--accent)]/35 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-primary)]"
        >
          {statusMessage}
        </div>
      )}

      {/* Locked Plan Info & Completion Dates */}
      <section
        data-testid="settings-plan-dates"
        className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                بيانات الخطة الثابتة ومواعيد الإتمام
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                المسار المعتمد:{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {plan.order === 'A' ? 'أ (من الفاتحة صعوداً)' : 'ب (من جزء عمّ نزولاً)'}
                </span>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            <span>خطة ٣٦ شهراً ثابتة</span>
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
            <p className="text-xs text-[var(--text-muted)]">تاريخ البداية</p>
            <p className="mt-1.5 text-base font-bold tabular-nums text-[var(--text-primary)]">
              {formatShortArabicDate(plan.startDate)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">انطلاق الورد اليومي</p>
          </div>

          <div
            data-testid="settings-memorization-end-date"
            className="rounded-xl border border-[var(--accent)]/35 bg-[var(--accent-soft)]/35 p-4"
          >
            <p className="text-xs font-medium text-[var(--accent)]">موعد إنهاء الحفظ</p>
            <p className="mt-1.5 text-base font-bold tabular-nums text-[var(--text-primary)]">
              {formatShortArabicDate(timeline.memorizationEndDate)}
            </p>
            <p className="mt-1 text-xs tabular-nums text-[var(--text-secondary)]">
              إتمام ٦٠٤ صفحات · متبقي {timeline.daysRemainingToMemorization} يوم
            </p>
          </div>

          <div
            data-testid="settings-consolidation-end-date"
            className="rounded-xl border border-[var(--gold)]/35 bg-[var(--gold-soft)]/45 p-4"
          >
            <p className="text-xs font-medium text-[var(--gold)]">موعد إنهاء التثبيت</p>
            <p className="mt-1.5 text-base font-bold tabular-nums text-[var(--text-primary)]">
              {formatShortArabicDate(timeline.consolidationEndDate)}
            </p>
            <p className="mt-1 text-xs tabular-nums text-[var(--text-secondary)]">
              ختام المراجعة الشاملة · متبقي {timeline.daysRemainingToConsolidation} يوم
            </p>
          </div>
        </div>
      </section>

      {/* Appearance: Dark Mode + Color Palette Selector */}
      <section className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
          <div className="flex items-center gap-2.5">
            {state.darkMode ? (
              <Moon className="h-5 w-5 text-[var(--accent)]" />
            ) : (
              <Sun className="h-5 w-5 text-[var(--accent)]" />
            )}
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                الوضع الليلي والنهاري
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                بدّل بين الإضاءة النهارية المريحة والوضع الليلي الهادئ
              </p>
            </div>
          </div>

          <div className="inline-flex rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1">
            <button
              type="button"
              onClick={() => state.darkMode && onToggleDarkMode()}
              aria-pressed={!state.darkMode}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium whitespace-nowrap transition-colors ${
                !state.darkMode
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>الوضع النهاري</span>
            </button>
            <button
              type="button"
              onClick={() => !state.darkMode && onToggleDarkMode()}
              aria-pressed={state.darkMode}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-medium whitespace-nowrap transition-colors ${
                state.darkMode
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>الوضع الليلي</span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Palette className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              ثيمات وألوان تغلّف الواجهة بالكامل
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              اختر طابع الألوان الذي يغطي الخلفية والقوائم والبطاقات بتناسق مريح
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_PALETTES.map((p) => {
            const active = state.accentColor === p.id;
            const swatchColor = state.darkMode ? p.darkSwatch : p.lightSwatch;
            const secondaryColor = state.darkMode ? p.darkSecondary : p.lightSecondary;
            const canvasColor = state.darkMode ? p.darkCanvas : p.lightCanvas;
            return (
              <motion.button
                key={p.id}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => onChangeAccentColor(p.id)}
                aria-pressed={active}
                className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-right transition-all ${
                  active
                    ? 'card-elevated border-[var(--accent)] bg-[linear-gradient(145deg,var(--accent-soft)_0%,color-mix(in_srgb,var(--gold-soft)_55%,var(--bg-surface))_100%)] ring-1 ring-[var(--accent)]/35'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--accent)]/50 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 flex-col overflow-hidden rounded-xl border border-black/15 shadow-xs">
                    <span className="h-4 w-full" style={{ backgroundColor: swatchColor }} />
                    <div className="flex flex-1">
                      <span className="w-1/2" style={{ backgroundColor: secondaryColor }} />
                      <span className="w-1/2" style={{ backgroundColor: canvasColor }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{p.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{p.subtitle}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                      <ThemeEmblem palette={p.id} className="h-3.5 w-3.5 shrink-0" />
                      <span>{p.ornamentLabel}</span>
                    </span>
                  </div>
                </div>
                {active && <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Standalone Daily Reminder */}
      <section className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                التذكير اليومي العام (مستقل)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                إشعار يومي موحّد في وقت تختاره، منفصل عن أوقات السبق والسبقي والمنزل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleDailyReminder}
              aria-pressed={state.reminders.dailyReminderEnabled}
              className={`h-10 rounded-xl px-4 text-xs font-medium whitespace-nowrap transition-colors ${
                state.reminders.dailyReminderEnabled
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {state.reminders.dailyReminderEnabled
                ? 'التذكير اليومي مفعّل'
                : 'تفعيل التذكير اليومي'}
            </button>

            <button
              type="button"
              onClick={handleTestDailyReminder}
              className="h-10 rounded-xl border border-[var(--border-hairline)] px-3.5 text-xs font-medium whitespace-nowrap text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
            >
              تجربة التذكير اليومي
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="rem-daily-time" className="block text-xs text-[var(--text-muted)]">
              وقت التذكير اليومي
            </label>
            <input
              id="rem-daily-time"
              type="time"
              value={state.reminders.dailyReminderTime}
              onChange={(e) =>
                onUpdateReminders({
                  ...state.reminders,
                  dailyReminderTime: e.target.value,
                })
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm tabular-nums text-[var(--text-primary)]"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            حالة إذن الإشعارات:{' '}
            {permState === 'granted'
              ? 'مسموح'
              : permState === 'denied'
              ? 'مرفوض'
              : permState === 'unsupported'
              ? 'غير مدعوم'
              : 'غير محدد'}
          </p>
        </div>
      </section>

      {/* Specific Task Browser Notifications */}
      <section className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                أوقات تذكير المهام المحددة (إشعارات المتصفح)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                تنبيهات منفصلة لكل من السبق والسبقي والمنزل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleNotifications}
              aria-pressed={state.reminders.enabled}
              className={`h-10 rounded-xl px-4 text-xs font-medium whitespace-nowrap transition-colors ${
                state.reminders.enabled
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {state.reminders.enabled ? 'تذكيرات المهام مفعّلة' : 'تفعيل تذكيرات المهام'}
            </button>

            <button
              type="button"
              onClick={handleTestNotification}
              className="h-10 rounded-xl border border-[var(--border-hairline)] px-3.5 text-xs font-medium whitespace-nowrap text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
            >
              تجربة إشعار
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rem-sabaq" className="block text-xs text-[var(--text-muted)]">
              تذكير السبق (بعد الفجر)
            </label>
            <input
              id="rem-sabaq"
              type="time"
              value={state.reminders.sabaqTime}
              onChange={(e) =>
                onUpdateReminders({ ...state.reminders, sabaqTime: e.target.value })
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm tabular-nums text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label htmlFor="rem-sabqi" className="block text-xs text-[var(--text-muted)]">
              تذكير السبقي (العصر)
            </label>
            <input
              id="rem-sabqi"
              type="time"
              value={state.reminders.sabqiTime}
              onChange={(e) =>
                onUpdateReminders({ ...state.reminders, sabqiTime: e.target.value })
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm tabular-nums text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label htmlFor="rem-manzil" className="block text-xs text-[var(--text-muted)]">
              تذكير المنزل (قبل النوم)
            </label>
            <input
              id="rem-manzil"
              type="time"
              value={state.reminders.manzilTime}
              onChange={(e) =>
                onUpdateReminders({ ...state.reminders, manzilTime: e.target.value })
              }
              className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-sm tabular-nums text-[var(--text-primary)]"
            />
          </div>
        </div>
      </section>

      {/* Export / Import */}
      <section className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          النسخ الاحتياطي والخصوصية
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          جميع بياناتك محفوظة محلياً على جهازك فقط. يمكنك تصدير نسخة احتياطية أو استعادتها في أي وقت.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="btn-accent-glow inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-xs font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
          >
            <Download className="h-4 w-4" />
            <span>تصدير البيانات (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
          >
            <Upload className="h-4 w-4" />
            <span>استيراد البيانات (JSON)</span>
          </button>

          <PWAInstallButton variant="settings" />

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
            aria-label="اختيار ملف النسخة الاحتياطية"
          />
        </div>

        <div className="mt-6 border-t border-[var(--border-hairline)] pt-5">
          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--danger)]/35 px-4 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>مسح جميع البيانات والبدء من جديد</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-[var(--danger)]">
                هل أنت متأكد من مسح السجل بالكامل؟ (يُفضّل تصدير نسخة احتياطية أولاً)
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmingReset(false);
                  onResetAllData();
                }}
                className="h-9 rounded-lg bg-[var(--danger)] px-3.5 text-xs font-medium text-white"
              >
                نعم، امسح الكل
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="h-9 rounded-lg border border-[var(--border-hairline)] px-3.5 text-xs font-medium text-[var(--text-primary)]"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
