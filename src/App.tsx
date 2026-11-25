import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Grid3X3,
  HeartHandshake,
  Lightbulb,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { AppLogo } from './components/AppLogo';
import { CelebrationModal } from './components/CelebrationModal';
import { DuasScreen } from './components/DuasScreen';
import { ThemePaletteProvider } from './components/IslamicOrnament';
import { MethodScreen } from './components/MethodScreen';
import { MushafMapScreen } from './components/MushafMapScreen';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PlanScreen } from './components/PlanScreen';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SettingsScreen } from './components/SettingsScreen';
import { SetupScreen, type SetupConfirmPayload } from './components/SetupScreen';
import { StatsScreen } from './components/StatsScreen';
import { TipsScreen } from './components/TipsScreen';
import { TodayPageBadge } from './components/TodayPageBadge';
import { TodayScreen } from './components/TodayScreen';
import { COLOR_PALETTES } from './data/palettes';
import {
  applyRatingToPages,
  computeCurrentStreak,
  confirmPastDayRecord,
  formatShortArabicDate,
  generatePlanCalendar,
  getCompletedJuzList,
  getExtraReviewPages,
  getMemorizedStats,
  getMissedPages,
  getPlanTimelineSummary,
  getTodayLocalISO,
  getTodayPageFocusStatus,
} from './engine/planner';
import { formatHHMM, getDueReminders } from './engine/reminders';
import type {
  AppColorPalette,
  AppState,
  MemorizationOrder,
  MethodProgress,
  PageStatus,
  ReminderSettings,
  ScreenId,
  TaskKind,
  TaskRating,
  TaskTimePreferences,
} from './types/plan';
import {
  applyAppearanceToDocument,
  buildAutostartSeedState,
  hasExistingPlanOrProgress,
  loadAppState,
  saveAppState,
} from './utils/storage';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: typeof Sun;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today', label: 'اليوم', icon: Sun },
  { id: 'method', label: 'طريقة الحفظ', icon: Sparkles },
  { id: 'plan', label: 'الخطة', icon: CalendarDays },
  { id: 'mushaf', label: 'خريطة المصحف', icon: Grid3X3 },
  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
  { id: 'tips', label: 'نصائح', icon: Lightbulb },
  { id: 'duas', label: 'أدعية قرآنية', icon: HeartHandshake },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

const VALID_SCREENS = new Set<ScreenId>([
  'today',
  'method',
  'plan',
  'mushaf',
  'stats',
  'tips',
  'duas',
  'settings',
]);

function getInitialScreen(): ScreenId {
  if (typeof window === 'undefined') return 'today';
  const param = new URLSearchParams(window.location.search).get('screen') as ScreenId | null;
  return param && VALID_SCREENS.has(param) ? param : 'today';
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const existing = loadAppState();
    if (!existing.plan && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return buildAutostartSeedState();
      }
    }
    return existing;
  });

  const [activeScreen, setActiveScreen] = useState<ScreenId>(getInitialScreen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [celebratingJuz, setCelebratingJuz] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const firedRemindersRef = useRef<Set<string>>(new Set());

  const todayIso = getTodayLocalISO();

  useEffect(() => {
    saveAppState(state);
    applyAppearanceToDocument(state.darkMode, state.accentColor);
  }, [state]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeScreen]);

  // Subtle notification toast auto-dismiss
  useEffect(() => {
    if (!toastMsg) return;
    const id = window.setTimeout(() => setToastMsg(null), 3200);
    return () => window.clearTimeout(id);
  }, [toastMsg]);

  // Browser notification timer check (handles task reminders & standalone daily reminder)
  useEffect(() => {
    const anyEnabled = state.reminders.enabled || state.reminders.dailyReminderEnabled;
    if (!anyEnabled || typeof window === 'undefined') {
      return;
    }
    const checkReminders = () => {
      const now = new Date();
      const hhmm = formatHHMM(now);
      const dateStr = getTodayLocalISO(now);
      const dueList = getDueReminders(
        state.reminders,
        hhmm,
        dateStr,
        firedRemindersRef.current
      );
      const canUseBrowserNotif =
        'Notification' in window && Notification.permission === 'granted';
      for (const item of dueList) {
        firedRemindersRef.current.add(item.fireKey);
        if (canUseBrowserNotif) {
          new Notification(item.title, { body: item.body });
        }
        setToastMsg(item.body);
      }
    };
    checkReminders();
    const id = window.setInterval(checkReminders, 15000);
    return () => window.clearInterval(id);
  }, [state.reminders]);

  const calendar = useMemo(() => {
    if (!state.plan) return [];
    return generatePlanCalendar(state.plan.startDate, state.plan.order, {
      trackId: state.plan.trackId,
      startPage: state.plan.startPage,
      direction: state.plan.direction,
    });
  }, [state.plan]);

  const plannedToday = useMemo(
    () => calendar.find((d) => d.date === todayIso) ?? null,
    [calendar, todayIso]
  );

  const missedPages = useMemo(
    () => (state.plan ? getMissedPages(calendar, state.pageProgress, todayIso) : []),
    [calendar, state.pageProgress, state.plan, todayIso]
  );

  const extraReviewPages = useMemo(
    () => getExtraReviewPages(state.pageProgress),
    [state.pageProgress]
  );

  const streak = useMemo(
    () => (state.plan ? computeCurrentStreak(state.dayLogs, state.plan.startDate, todayIso) : 0),
    [state.dayLogs, state.plan, todayIso]
  );

  const memorizedStats = useMemo(
    () => getMemorizedStats(state.pageProgress),
    [state.pageProgress]
  );

  const timeline = useMemo(
    () =>
      state.plan
        ? getPlanTimelineSummary(calendar, state.plan.startDate, todayIso)
        : null,
    [calendar, state.plan, todayIso]
  );

  const todayFocus = useMemo(
    () =>
      getTodayPageFocusStatus(
        plannedToday,
        state.dayLogs[todayIso],
        state.pageProgress,
        missedPages
      ),
    [plannedToday, state.dayLogs, todayIso, state.pageProgress, missedPages]
  );

  const checkAndTriggerJuzCelebration = (
    nextProgress: AppState['pageProgress'],
    alreadyCelebrated: number[]
  ): number[] => {
    const completed = getCompletedJuzList(nextProgress);
    const newlyDone = completed.find((j) => !alreadyCelebrated.includes(j));
    if (newlyDone !== undefined) {
      setCelebratingJuz(newlyDone);
      return [...alreadyCelebrated, newlyDone];
    }
    return alreadyCelebrated;
  };

  const handleConfirmPlan = (payload: SetupConfirmPayload) => {
    setState((prev) => ({
      ...prev,
      plan: {
        startDate: payload.startDate,
        order: payload.order,
        trackId: payload.trackId,
        startMode: payload.startMode,
        startPage: payload.startPage,
        direction: payload.direction,
        locked: true,
        createdAt: new Date().toISOString(),
      },
    }));
    setActiveScreen('today');
  };

  const handleUpdateTaskTime = (key: keyof TaskTimePreferences, time: string) => {
    setState((prev) => ({
      ...prev,
      taskTimes: {
        ...prev.taskTimes,
        [key]: time,
      },
    }));
  };

  const handleCompleteTask = (
    date: string,
    kind: TaskKind,
    pages: number[],
    rating: TaskRating,
    durationSeconds: number
  ) => {
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const existingLog = prev.dayLogs[date] ?? { date, tasks: {} };
      const nextLog = {
        ...existingLog,
        tasks: {
          ...existingLog.tasks,
          [kind]: {
            completed: true,
            rating,
            completedAt: nowIso,
            durationSeconds,
          },
        },
      };

      const nextProgress = applyRatingToPages(prev.pageProgress, pages, rating, kind, nowIso);
      const nextCelebrated = checkAndTriggerJuzCelebration(nextProgress, prev.celebratedJuz);

      return {
        ...prev,
        dayLogs: {
          ...prev.dayLogs,
          [date]: nextLog,
        },
        pageProgress: nextProgress,
        celebratedJuz: nextCelebrated,
      };
    });

    if (rating === 'mistakes') {
      setToastMsg('تم تسجيل التقييم وإضافة الصفحات تلقائياً إلى المراجعة الإضافية');
    } else {
      setToastMsg('بارك الله فيك — تم حفظ إنجاز الورد');
    }
  };

  const handleUpdateFridayTeacher = (date: string, recited: boolean, note: string) => {
    setState((prev) => {
      const existingLog = prev.dayLogs[date] ?? { date, tasks: {} };
      return {
        ...prev,
        dayLogs: {
          ...prev.dayLogs,
          [date]: {
            ...existingLog,
            recitedToTeacher: recited,
            teacherNote: note,
          },
        },
      };
    });
  };

  const handleCatchUpPage = (date: string, page: number) => {
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const existingLog = prev.dayLogs[date] ?? { date, tasks: {} };
      const caught = Array.from(new Set([...(existingLog.caughtUpPages ?? []), page]));
      const nextProgress = applyRatingToPages(prev.pageProgress, [page], 'hesitated', 'sabaq', nowIso);
      const nextCelebrated = checkAndTriggerJuzCelebration(nextProgress, prev.celebratedJuz);
      return {
        ...prev,
        dayLogs: {
          ...prev.dayLogs,
          [date]: {
            ...existingLog,
            caughtUpPages: caught,
          },
        },
        pageProgress: nextProgress,
        celebratedJuz: nextCelebrated,
      };
    });
    setToastMsg(`تم استدراك صفحة ${page} بنجاح`);
  };

  const handleConfirmPastWork = (
    targetDate: string,
    pages: number[],
    rating: TaskRating,
    note?: string
  ) => {
    if (!state.plan) return;
    if (targetDate < state.plan.startDate || targetDate > todayIso) return;
    const nowIso = new Date().toISOString();
    const targetPlanned = calendar.find((d) => d.date === targetDate) ?? null;
    setState((prev) => {
      if (!prev.plan) return prev;
      const result = confirmPastDayRecord({
        dayLogs: prev.dayLogs,
        pageProgress: prev.pageProgress,
        startDate: prev.plan.startDate,
        todayIso,
        targetDate,
        pages,
        rating,
        note,
        plannedDay: targetPlanned,
        nowIso,
      });
      const nextCelebrated = checkAndTriggerJuzCelebration(
        result.pageProgress,
        prev.celebratedJuz
      );
      return {
        ...prev,
        dayLogs: result.dayLogs,
        pageProgress: result.pageProgress,
        celebratedJuz: nextCelebrated,
      };
    });
    setToastMsg(
      `تم تأكيد إنجاز ${formatShortArabicDate(targetDate)} واحتسابه في سلسلة الاستمرار`
    );
  };

  const handleSetPageStatus = (page: number, status: PageStatus) => {
    const nowIso = new Date().toISOString();
    setState((prev) => {
      const existing = prev.pageProgress[page] ?? {
        page,
        status: 'not_started',
        extraReviewPending: false,
        reviewCount: 0,
      };
      const nextProgress: AppState['pageProgress'] = {
        ...prev.pageProgress,
        [page]: {
          ...existing,
          status,
          lastReviewedAt: nowIso,
          memorizedAt:
            status !== 'not_started' ? existing.memorizedAt ?? nowIso : undefined,
          extraReviewPending: status === 'needs_review',
          reviewCount: existing.reviewCount + 1,
        },
      };
      const nextCelebrated = checkAndTriggerJuzCelebration(nextProgress, prev.celebratedJuz);
      return {
        ...prev,
        pageProgress: nextProgress,
        celebratedJuz: nextCelebrated,
      };
    });
  };

  const handleResolveExtraReview = (page: number) => {
    handleSetPageStatus(page, 'strong');
    setToastMsg(`تم تحديث صفحة ${page} إلى «متقن»`);
  };

  const handleToggleDuaVerified = (duaId: string) => {
    setState((prev) => ({
      ...prev,
      verifiedDuas: {
        ...prev.verifiedDuas,
        [duaId]: !prev.verifiedDuas[duaId],
      },
    }));
  };

  const handleUpdateMethodProgress = (next: MethodProgress) => {
    setState((prev) => ({ ...prev, methodProgress: next }));
  };

  const handleUpdateMethodDuration = (stepId: number, minutes: number) => {
    const clamped = Math.min(120, Math.max(1, Math.round(minutes)));
    setState((prev) => ({
      ...prev,
      methodDurations: {
        ...(prev.methodDurations ?? {}),
        [stepId]: clamped,
      },
    }));
  };

  const handleToggleDarkMode = () => {
    setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleChangeAccentColor = (accentColor: AppColorPalette) => {
    setState((prev) => ({ ...prev, accentColor }));
  };

  const handleUpdateReminders = (reminders: ReminderSettings) => {
    setState((prev) => ({ ...prev, reminders }));
  };

  const handleImportState = (imported: AppState) => {
    setState(imported);
    setActiveScreen('today');
  };

  // First-run setup gate ONLY if no saved locked plan and no existing memorization progress
  if (!hasExistingPlanOrProgress(state)) {
    return <SetupScreen onConfirmPlan={handleConfirmPlan} />;
  }

  // Defensive fallback if an existing user has recorded progress without a plan object
  const activePlan = state.plan ?? {
    startDate: todayIso,
    order: 'A' as MemorizationOrder,
    locked: true,
    createdAt: new Date().toISOString(),
  };

  const previousPage =
    plannedToday?.sabqiPages && plannedToday.sabqiPages.length > 0
      ? plannedToday.sabqiPages[plannedToday.sabqiPages.length - 1]
      : null;

  const mobilePrimaryTabs: NavItem[] = [
    NAV_ITEMS[0], // اليوم
    NAV_ITEMS[2], // الخطة
    NAV_ITEMS[3], // خريطة المصحف
    NAV_ITEMS[4], // الإحصائيات
  ];

  const mobileDrawerItems: NavItem[] = [
    NAV_ITEMS[1], // طريقة الحفظ
    NAV_ITEMS[5], // نصائح
    NAV_ITEMS[6], // أدعية قرآنية
    NAV_ITEMS[7], // الإعدادات
  ];

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeScreen) ?? NAV_ITEMS[0];

  return (
    <MotionConfig reducedMotion="user">
      <ThemePaletteProvider value={state.accentColor}>
        <div className="app-shell-wrap min-h-screen text-[var(--text-primary)] pb-20 lg:pb-0">
        <div className="mx-auto flex min-h-screen max-w-[1440px]">
          {/* Desktop Right RTL Sidebar */}
          <aside className="card-elevated relative z-10 hidden w-64 shrink-0 border-l border-[var(--border-hairline)] bg-[linear-gradient(180deg,var(--bg-sidebar)_0%,color-mix(in_srgb,var(--accent-soft)_42%,var(--bg-sidebar))_100%)] lg:flex lg:flex-col lg:justify-between">
            <div className="p-5">
              <div className="flex items-center gap-3 border-b border-[var(--border-hairline)] pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent)]/25 bg-[linear-gradient(145deg,var(--accent-soft)_0%,var(--bg-surface)_100%)] text-[var(--accent)] shadow-xs">
                  <AppLogo variant="badge" className="h-7 w-7" />
                </div>
                <span className="font-display text-xl font-bold whitespace-nowrap text-[var(--text-primary)]">
                  وِرْد مُدَّكِر
                </span>
              </div>

              {/* Prominent Today's Page Badge First in Sidebar */}
              <div className="mt-4">
                <TodayPageBadge
                  focus={todayFocus}
                  variant="sidebar"
                  testId="sidebar-today-page-badge"
                  onClick={() => setActiveScreen('today')}
                />
              </div>

              <nav aria-label="التنقل الرئيسي" className="mt-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveScreen(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          className="card-elevated absolute inset-0 rounded-xl border border-[var(--accent)]/30 border-r-[3px] border-r-[var(--accent)] bg-[var(--accent-soft)]"
                        />
                      )}
                      <Icon className="relative z-10 h-4 w-4 shrink-0" />
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-4 border-t border-[var(--border-hairline)] p-5 text-xs text-[var(--text-muted)]">
              {/* Quick Dark Mode & Color Swatches */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--text-secondary)]">الثيم والمظهر</span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={handleToggleDarkMode}
                    aria-label={state.darkMode ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
                    aria-pressed={state.darkMode}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 text-[11px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={state.darkMode ? 'moon' : 'sun'}
                        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                        transition={{ duration: 0.16 }}
                        className="inline-flex"
                      >
                        {state.darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                      </motion.span>
                    </AnimatePresence>
                    <span>{state.darkMode ? 'ليلي' : 'نهاري'}</span>
                  </motion.button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="اختيار لون الواجهة السريع">
                  {COLOR_PALETTES.map((p) => {
                    const active = state.accentColor === p.id;
                    const accent = state.darkMode ? p.darkSwatch : p.lightSwatch;
                    const secondary = state.darkMode ? p.darkSecondary : p.lightSecondary;
                    const canvas = state.darkMode ? p.darkCanvas : p.lightCanvas;
                    return (
                      <motion.button
                        key={p.id}
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleChangeAccentColor(p.id)}
                        aria-label={`تغيير لون الواجهة إلى ${p.title}`}
                        aria-pressed={active}
                        title={p.title}
                        className={`h-6 w-6 rounded-full border transition-transform ${
                          active
                            ? 'scale-110 ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-sidebar)]'
                            : 'border-[var(--border-hairline)] hover:scale-105'
                        }`}
                        style={{
                          background: `conic-gradient(from 40deg, ${accent} 0deg 165deg, ${secondary} 165deg 260deg, ${canvas} 260deg 360deg)`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[var(--border-hairline)] pt-3">
                <p className="font-medium text-[var(--text-secondary)]">
                  بداية الخطة: {formatShortArabicDate(activePlan.startDate)}
                </p>
                <p className="mt-1 tabular-nums">
                  نسبة الإنجاز: {memorizedStats.percent}% ({memorizedStats.memorizedCount} / ٦٠٤)
                </p>
              </div>
              <PWAInstallButton variant="sidebar" />
            </div>
          </aside>

        {/* Main Viewport */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          {/* Compact Top Header (<= 56px on mobile) */}
          <header className="card-elevated sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-t-2 border-t-[var(--accent)] border-b border-b-[var(--border-hairline)] bg-[var(--bg-header)] px-4 backdrop-blur-md lg:h-16 lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <AppLogo variant="badge" className="h-7 w-7 shrink-0 text-[var(--accent)]" />
              <span className="font-display text-lg font-bold whitespace-nowrap">وِرْد مُدَّكِر</span>
              {todayFocus.primaryPage !== null && (
                <button
                  type="button"
                  onClick={() => setActiveScreen('today')}
                  data-testid="mobile-header-page-pill"
                  data-completed={todayFocus.isCompleted ? 'true' : 'false'}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums transition-colors ${
                    todayFocus.isCompleted
                      ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--accent)]'
                  }`}
                >
                  <span>ص {todayFocus.primaryPage}</span>
                </button>
              )}
            </div>

            <span className="hidden text-sm font-semibold text-[var(--text-primary)] lg:inline">
              {activeNavMeta.label}
            </span>

            <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
              {plannedToday
                ? `الشهر ${plannedToday.monthNumber} من ${
                    activePlan.trackId && activePlan.trackId !== 'three_years'
                      ? calendar[calendar.length - 1]?.monthNumber ?? 12
                      : '٣٦'
                  }`
                : 'خطة الـ ٣ سنوات'}
            </span>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                setActiveScreen(activeScreen === 'method' ? 'today' : 'method')
              }
              className="btn-accent-glow inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 text-xs font-medium whitespace-nowrap text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]"
            >
              <BookOpenCheck className="h-3.5 w-3.5" />
              <span>{activeScreen === 'method' ? 'العودة لليوم' : 'طريقة الحفظ'}</span>
            </motion.button>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeScreen === 'today' && timeline && (
                  <TodayScreen
                    todayIso={todayIso}
                    startDate={activePlan.startDate}
                    calendar={calendar}
                    plannedDay={plannedToday}
                    dayLog={state.dayLogs[todayIso]}
                    dayLogs={state.dayLogs}
                    pageProgress={state.pageProgress}
                    taskTimes={state.taskTimes}
                    missedPages={missedPages}
                    extraReviewPages={extraReviewPages}
                    streak={streak}
                    memorizedCount={memorizedStats.memorizedCount}
                    timeline={timeline}
                    todayFocus={todayFocus}
                    verifiedDuas={state.verifiedDuas}
                    onUpdateTaskTime={handleUpdateTaskTime}
                    onCompleteTask={handleCompleteTask}
                    onConfirmPastWork={handleConfirmPastWork}
                    onUpdateFridayTeacher={handleUpdateFridayTeacher}
                    onCatchUpPage={handleCatchUpPage}
                    onResolveExtraReview={handleResolveExtraReview}
                    onToggleDuaVerified={handleToggleDuaVerified}
                    onNavigate={setActiveScreen}
                  />
                )}

                {activeScreen === 'method' && (
                  <MethodScreen
                    todaySabaqPage={plannedToday?.sabaqPage ?? null}
                    previousPage={previousPage}
                    todayFocus={todayFocus}
                    progress={state.methodProgress}
                    customDurations={state.methodDurations}
                    todayIso={todayIso}
                    onUpdateProgress={handleUpdateMethodProgress}
                    onUpdateDuration={handleUpdateMethodDuration}
                    onCompleteTodaySabaq={(rating) => {
                      const sabaqPages =
                        plannedToday?.sabaqPages && plannedToday.sabaqPages.length > 0
                          ? plannedToday.sabaqPages
                          : plannedToday?.sabaqPage !== null && plannedToday?.sabaqPage !== undefined
                          ? [plannedToday.sabaqPage]
                          : [];
                      if (sabaqPages.length > 0) {
                        handleCompleteTask(todayIso, 'sabaq', sabaqPages, rating, 0);
                      }
                    }}
                  />
                )}

                {activeScreen === 'plan' && (
                  <PlanScreen
                    calendar={calendar}
                    order={activePlan.order}
                    plan={activePlan}
                    timeline={timeline ?? undefined}
                    todayIso={todayIso}
                    pageProgress={state.pageProgress}
                    dayLogs={state.dayLogs}
                    onConfirmPastWork={handleConfirmPastWork}
                  />
                )}

                {activeScreen === 'mushaf' && (
                  <MushafMapScreen
                    pageProgress={state.pageProgress}
                    onSetPageStatus={handleSetPageStatus}
                  />
                )}

                {activeScreen === 'stats' && (
                  <StatsScreen
                    pageProgress={state.pageProgress}
                    streak={streak}
                    isTodayCompleted={
                      todayFocus.areAllTasksDone || Boolean(state.dayLogs[todayIso]?.manualConfirmed)
                    }
                    todayIso={todayIso}
                    onResolveWeakPage={handleResolveExtraReview}
                  />
                )}

                {activeScreen === 'tips' && (
                  <TipsScreen dayIndex={plannedToday?.dayIndex ?? 0} />
                )}

                {activeScreen === 'duas' && (
                  <DuasScreen
                    verifiedDuas={state.verifiedDuas}
                    onToggleVerified={handleToggleDuaVerified}
                  />
                )}

                {activeScreen === 'settings' && timeline && (
                  <SettingsScreen
                    state={state}
                    plan={activePlan}
                    timeline={timeline}
                    onToggleDarkMode={handleToggleDarkMode}
                    onChangeAccentColor={handleChangeAccentColor}
                    onUpdateReminders={handleUpdateReminders}
                    onImportState={handleImportState}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (64px) */}
      <nav
        aria-label="التنقل السفلي"
        className="fixed right-0 bottom-0 left-0 z-30 grid h-16 grid-cols-5 border-t border-[var(--border-hairline)] bg-[var(--bg-header)] backdrop-blur-md lg:hidden"
      >
        {mobilePrimaryTabs.map((item) => {
          const Icon = item.icon;
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveScreen(item.id);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                active
                  ? 'font-bold text-[color-mix(in_srgb,var(--accent)_65%,var(--text-primary))]'
                  : 'font-medium text-[var(--text-secondary)]'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center rounded-xl px-3 py-1 transition-colors ${
                  active ? 'bg-[var(--accent-soft)]' : ''
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
            mobileMenuOpen
              ? 'font-bold text-[color-mix(in_srgb,var(--accent)_65%,var(--text-primary))]'
              : 'font-medium text-[var(--text-secondary)]'
          }`}
        >
          <span
            className={`inline-flex items-center justify-center rounded-xl px-3 py-1 transition-colors ${
              mobileMenuOpen ? 'bg-[var(--accent-soft)]' : ''
            }`}
          >
            <Menu className="h-5 w-5" />
          </span>
          <span>المزيد</span>
        </button>
      </nav>

      {/* Mobile More Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-3xl border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 pb-8"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">أقسام التطبيق</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <TodayPageBadge
                  focus={todayFocus}
                  variant="sidebar"
                  testId="mobile-drawer-today-page-badge"
                  onClick={() => {
                    setActiveScreen('today');
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLOR_PALETTES.map((p) => {
                    const active = state.accentColor === p.id;
                    const accent = state.darkMode ? p.darkSwatch : p.lightSwatch;
                    const secondary = state.darkMode ? p.darkSecondary : p.lightSecondary;
                    const canvas = state.darkMode ? p.darkCanvas : p.lightCanvas;
                    return (
                      <motion.button
                        key={p.id}
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleChangeAccentColor(p.id)}
                        aria-label={`لون ${p.title}`}
                        aria-pressed={active}
                        className={`h-6 w-6 rounded-full border transition-transform ${
                          active
                            ? 'scale-110 ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-surface)]'
                            : 'border-[var(--border-hairline)]'
                        }`}
                        style={{
                          background: `conic-gradient(from 40deg, ${accent} 0deg 165deg, ${secondary} 165deg 260deg, ${canvas} 260deg 360deg)`,
                        }}
                      />
                    );
                  })}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleDarkMode}
                  aria-pressed={state.darkMode}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 text-xs font-medium text-[var(--text-primary)]"
                >
                  {state.darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  <span>{state.darkMode ? 'ليلي' : 'نهاري'}</span>
                </motion.button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {mobileDrawerItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveScreen(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex h-12 items-center gap-2.5 rounded-xl border px-3.5 text-sm font-medium ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-intrusive Feedback Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            className="fixed top-18 left-4 z-40 rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] shadow-md lg:left-6"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Mode Status Pill */}
      <OfflineIndicator />

      {/* Juz Completion Celebration Modal */}
        <CelebrationModal
          juz={celebratingJuz}
          onClose={() => setCelebratingJuz(null)}
        />
        </div>
      </ThemePaletteProvider>
    </MotionConfig>
  );
}
