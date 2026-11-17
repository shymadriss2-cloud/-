import { addDays, getTodayLocalISO } from '../engine/planner';
import type { AppColorPalette, AppState, AppTheme } from '../types/plan';

const STORAGE_KEY = 'mihrab_quran_planner_v1';

export const DEFAULT_APP_STATE: AppState = {
  plan: null,
  dayLogs: {},
  pageProgress: {},
  taskTimes: {
    sabaq: '05:30',
    sabqi: '16:15',
    manzil: '21:30',
  },
  verifiedDuas: {},
  celebratedJuz: [],
  reminders: {
    enabled: false,
    sabaqTime: '05:30',
    sabqiTime: '16:15',
    manzilTime: '21:30',
    dailyReminderEnabled: false,
    dailyReminderTime: '08:00',
  },
  theme: 'sakina',
  darkMode: false,
  accentColor: 'emerald',
  methodProgress: null,
};

function resolveAppearanceFromLegacy(parsed: Partial<AppState>): {
  darkMode: boolean;
  accentColor: AppColorPalette;
  theme: AppTheme;
} {
  const legacyTheme = (parsed.theme as AppTheme) ?? 'sakina';
  const darkMode =
    typeof parsed.darkMode === 'boolean' ? parsed.darkMode : legacyTheme === 'layl';
  const accentColor: AppColorPalette =
    parsed.accentColor ?? (legacyTheme === 'ward' ? 'linen' : 'emerald');
  return { darkMode, accentColor, theme: legacyTheme };
}

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const appearance = resolveAppearanceFromLegacy(parsed);
    return {
      ...DEFAULT_APP_STATE,
      ...parsed,
      ...appearance,
      taskTimes: {
        ...DEFAULT_APP_STATE.taskTimes,
        ...(parsed.taskTimes ?? {}),
      },
      reminders: {
        ...DEFAULT_APP_STATE.reminders,
        ...(parsed.reminders ?? {}),
      },
      dayLogs: parsed.dayLogs ?? {},
      pageProgress: parsed.pageProgress ?? {},
      verifiedDuas: parsed.verifiedDuas ?? {},
      celebratedJuz: Array.isArray(parsed.celebratedJuz) ? parsed.celebratedJuz : [],
    };
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export function saveAppState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues cleanly
  }
}

const THEME_COLOR_MAP: Record<AppColorPalette, { light: string; dark: string }> = {
  emerald: { light: '#1f5e4b', dark: '#0f1614' },
  linen: { light: '#26594c', dark: '#141310' },
  sapphire: { light: '#1d4e89', dark: '#0e131b' },
  amber: { light: '#8c5e1a', dark: '#14120e' },
  plum: { light: '#5b3e73', dark: '#131018' },
};

export function applyAppearanceToDocument(
  darkMode: boolean,
  accentColor: AppColorPalette
): void {
  const root = document.documentElement;
  root.classList.remove(
    'dark',
    'theme-ward',
    'palette-linen',
    'palette-sapphire',
    'palette-amber',
    'palette-plum'
  );
  if (darkMode) {
    root.classList.add('dark');
  }
  if (accentColor !== 'emerald') {
    root.classList.add(`palette-${accentColor}`);
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const colors = THEME_COLOR_MAP[accentColor] ?? THEME_COLOR_MAP.emerald;
    metaTheme.setAttribute('content', darkMode ? colors.dark : colors.light);
  }
}

/**
 * Creates a deterministic autostart state when ?autostart=1 is used for verification.
 */
export function buildAutostartSeedState(): AppState {
  const today = getTodayLocalISO();
  const startDate = addDays(today, -14);
  return {
    ...DEFAULT_APP_STATE,
    plan: {
      startDate,
      order: 'A',
      locked: true,
      createdAt: new Date().toISOString(),
    },
  };
}

export function validateImportedState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<AppState>;
  if (obj.plan !== null && obj.plan !== undefined) {
    if (
      typeof obj.plan.startDate !== 'string' ||
      (obj.plan.order !== 'A' && obj.plan.order !== 'B')
    ) {
      return null;
    }
  }
  const appearance = resolveAppearanceFromLegacy(obj);
  return {
    ...DEFAULT_APP_STATE,
    ...obj,
    ...appearance,
    taskTimes: {
      ...DEFAULT_APP_STATE.taskTimes,
      ...(obj.taskTimes ?? {}),
    },
    reminders: {
      ...DEFAULT_APP_STATE.reminders,
      ...(obj.reminders ?? {}),
    },
    dayLogs: obj.dayLogs ?? {},
    pageProgress: obj.pageProgress ?? {},
    verifiedDuas: obj.verifiedDuas ?? {},
    celebratedJuz: Array.isArray(obj.celebratedJuz) ? obj.celebratedJuz : [],
  };
}
