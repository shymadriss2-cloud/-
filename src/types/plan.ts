export type MemorizationOrder = 'A' | 'B';

export type PlanTrackId =
  | 'intensive_1y'
  | 'two_years'
  | 'three_years'
  | 'juz_per_month'
  | 'five_years';

export type PlanDirection = 'forward' | 'backward';

export type PlanStartMode = 'from_start' | 'from_nas' | 'juz_amma_first' | 'custom';

export type TaskKind = 'sabaq' | 'sabqi' | 'manzil' | 'friday_review' | 'full_review';

export type TaskRating = 'perfect' | 'hesitated' | 'mistakes';

export type PageStatus = 'not_started' | 'memorized' | 'strong' | 'needs_review';

export type AppTheme = 'sakina' | 'ward' | 'layl';

export type AppColorPalette =
  | 'emerald'
  | 'linen'
  | 'sapphire'
  | 'amber'
  | 'plum'
  | 'rose'
  | 'burgundy'
  | 'teal'
  | 'olive'
  | 'sunset';

export type ScreenId =
  | 'today'
  | 'method'
  | 'plan'
  | 'mushaf'
  | 'stats'
  | 'tips'
  | 'duas'
  | 'settings';

export interface JuzRange {
  juz: number;
  startPage: number;
  endPage: number;
  pageCount: number;
}

export interface PlanConfig {
  startDate: string; // YYYY-MM-DD
  order: MemorizationOrder;
  locked: boolean;
  createdAt: string;
  trackId?: PlanTrackId;
  startMode?: PlanStartMode;
  startPage?: number; // 1..604
  direction?: PlanDirection;
}

export interface TaskTimePreferences {
  sabaq: string; // e.g. "05:30" (بعد الفجر)
  sabqi: string; // e.g. "16:00" (العصر)
  manzil: string; // e.g. "21:30" (قبل النوم)
}

export interface TaskCompletionRecord {
  completed: boolean;
  rating?: TaskRating;
  completedAt?: string;
  durationSeconds?: number;
  retroactive?: boolean;
}

export interface DayLog {
  date: string;
  tasks: Partial<Record<TaskKind, TaskCompletionRecord>>;
  recitedToTeacher?: boolean;
  teacherNote?: string;
  caughtUpPages?: number[];
  manualConfirmed?: boolean;
  manualPages?: number[];
  manualNote?: string;
  confirmedAfterMidnightAt?: string;
}

export interface PageProgress {
  page: number;
  status: PageStatus;
  lastRating?: TaskRating;
  lastReviewedAt?: string;
  memorizedAt?: string;
  extraReviewPending: boolean;
  reviewCount: number;
}

export interface ReminderSettings {
  enabled: boolean;
  sabaqTime: string;
  sabqiTime: string;
  manzilTime: string;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
}

export interface PageMethodState {
  sightReads: number; // 0..10
  completedSteps: number[]; // step indices 0..4
}

export interface MethodProgress {
  date: string;
  sightReads: number; // 0..10
  completedSteps: number[]; // step indices 0..4
  byPage?: Record<number, PageMethodState>;
}

export interface AppState {
  plan: PlanConfig | null;
  dayLogs: Record<string, DayLog>;
  pageProgress: Record<number, PageProgress>;
  taskTimes: TaskTimePreferences;
  verifiedDuas: Record<string, boolean>;
  celebratedJuz: number[];
  reminders: ReminderSettings;
  theme: AppTheme;
  darkMode: boolean;
  accentColor: AppColorPalette;
  methodProgress: MethodProgress | null;
  methodDurations?: Record<number, number>;
}

export interface PlannedDay {
  date: string;
  dayIndex: number; // 0-based from startDate
  monthNumber: number; // 1..36 (or higher for 5y plan)
  dayOfWeek: number; // 0 (Sun) .. 6 (Sat)
  phase: 'memorization' | 'consolidation' | 'full_review';
  sabaqPage: number | null;
  sabaqPages?: number[];
  sabaqJuz: number | null;
  sabqiPages: number[];
  manzilPages: number[];
  weeklyReviewPages: number[];
  isFriday: boolean;
  isSaturday: boolean;
  fullReviewJuz: number | null;
  fullReviewPages: number[];
}

export interface JuzScheduleSummary {
  juz: number;
  startPage: number;
  endPage: number;
  pageCount: number;
  startDate: string | null;
  endDate: string | null;
}
