import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPageRangeAr } from '../engine/mushaf';
import type { TodayPageFocusStatus } from '../engine/planner';
import {
  HeroCornerArabesque,
  MihrabCrownOrnament,
  ThemeEmblem,
} from './IslamicOrnament';

interface TodayPageBadgeProps {
  focus: TodayPageFocusStatus;
  variant: 'sidebar' | 'hero';
  testId?: string;
  onClick?: () => void;
}

function getBadgeTitle(focus: TodayPageFocusStatus): string {
  if (focus.preSabaqSundayDDMMYYYY) {
    return 'اليوم مراجعة وتثبيت';
  }
  switch (focus.mode) {
    case 'sabaq':
      return 'صفحة الحفظ اليوم';
    case 'friday':
      return 'مراجعة الأسبوع';
    case 'saturday':
      return focus.primaryPage !== null ? 'صفحة الاستدراك' : 'اليوم بلا حفظ جديد';
    case 'full_review':
      return 'الجزء المراجَع اليوم';
    case 'consolidation':
    case 'none':
      return 'اليوم بلا حفظ جديد';
    default:
      return 'صفحة اليوم';
  }
}

function getMainDisplay(focus: TodayPageFocusStatus): { main: string; sub: string } {
  if (focus.preSabaqSundayDDMMYYYY) {
    return {
      main: 'تثبيت',
      sub: `تبدأ صفحات الحفظ الجديدة يوم الأحد ${focus.preSabaqSundayDDMMYYYY}`,
    };
  }
  if (focus.mode === 'full_review' && focus.juz !== null) {
    return {
      main: String(focus.juz),
      sub: `جزء · ${formatPageRangeAr(focus.secondaryPages)}`,
    };
  }
  if (focus.mode === 'friday' && focus.secondaryPages.length > 0) {
    return {
      main: String(focus.primaryPage ?? ''),
      sub: `${formatPageRangeAr(focus.secondaryPages)}`,
    };
  }
  if (focus.mode === 'saturday' && focus.primaryPage === null) {
    return {
      main: 'راحة',
      sub: 'لا توجد صفحات فائتة',
    };
  }
  if (focus.mode === 'sabaq' && focus.secondaryPages.length > 1) {
    const pages = focus.secondaryPages;
    const main =
      pages.length === 2
        ? `${pages[0]} و${pages[1]}`
        : `${pages[0]}–${pages[pages.length - 1]}`;
    return {
      main,
      sub: focus.juz ? `الجزء ${focus.juz}` : 'المصحف الشريف',
    };
  }
  if (focus.mode === 'consolidation' && !focus.hasReviewWork) {
    return {
      main: 'راحة',
      sub: 'لا توجد صفحات للمراجعة اليوم',
    };
  }
  if (focus.primaryPage !== null) {
    return {
      main: String(focus.primaryPage),
      sub: focus.juz ? `الجزء ${focus.juz}` : 'المصحف الشريف',
    };
  }
  if (focus.hasReviewWork) {
    return {
      main: 'مراجعة',
      sub: 'مراجعة وتثبيت المحفوظ',
    };
  }
  return {
    main: 'راحة',
    sub: 'لا توجد مهام مجدولة اليوم',
  };
}

export function TodayPageBadge({ focus, variant, testId, onClick }: TodayPageBadgeProps) {
  const title = getBadgeTitle(focus);
  const { main, sub } = getMainDisplay(focus);
  const completed = focus.isCompleted;
  const isNoSabaqMode =
    focus.mode === 'consolidation' ||
    focus.mode === 'none' ||
    (focus.mode === 'saturday' && focus.primaryPage === null) ||
    Boolean(focus.preSabaqSundayDDMMYYYY);

  const pendingBadgeText = isNoSabaqMode
    ? focus.hasReviewWork
      ? 'مراجعة'
      : 'راحة'
    : 'قيد الحفظ';

  const sidebarPendingBadgeText = isNoSabaqMode
    ? focus.hasReviewWork
      ? 'مراجعة'
      : 'راحة'
    : 'مطلوب اليوم';

  if (variant === 'sidebar') {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        data-testid={testId ?? 'sidebar-today-page-badge'}
        data-completed={completed ? 'true' : 'false'}
        aria-label={`${title}: ${main} (${sub})${completed ? ' — تم الإنهاء' : ''}`}
        className={`mihrab-tile-shape group relative w-full overflow-hidden border-2 p-3.5 text-right transition-all duration-300 ${
          completed
            ? 'btn-accent-glow border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
            : 'card-elevated border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)]/60'
        }`}
      >
        {/* Inner subtle ornamental frame */}
        <span
          aria-hidden="true"
          className={`mihrab-tile-shape pointer-events-none absolute inset-1 border ${
            completed ? 'border-current/25' : 'border-[var(--gold)]/30'
          }`}
        />

        {/* Prominent theme-specific geometric watermark */}
        <HeroCornerArabesque
          className={`absolute -bottom-6 -left-6 h-24 w-24 ${
            completed
              ? 'text-[var(--accent-ink)] opacity-[0.25]'
              : 'text-[var(--gold)] opacity-[0.28]'
          }`}
        />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
              completed
                ? 'text-[var(--accent-ink)]'
                : 'text-[color-mix(in_srgb,var(--accent)_65%,var(--text-primary))]'
            }`}
          >
            <ThemeEmblem className="h-4 w-4 shrink-0" />
            <span>{title}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
              completed
                ? 'border border-current/25 bg-black/10 text-[var(--accent-ink)]'
                : 'bg-[var(--gold-soft)] text-[color-mix(in_srgb,var(--gold)_55%,var(--text-primary))]'
            }`}
          >
            {completed && <CheckCircle2 className="h-3 w-3 shrink-0" />}
            <span>{completed ? 'تم الإنجاز' : sidebarPendingBadgeText}</span>
          </span>
        </div>

        <div className="relative z-10 mt-2.5 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span
              dir={main.includes('–') || main.includes('-') ? 'ltr' : 'rtl'}
              className={`font-display whitespace-nowrap font-bold leading-none tabular-nums ${
                main.length > 5 ? 'text-xl' : main.length > 3 ? 'text-2xl' : 'text-4xl'
              }`}
            >
              {main}
            </span>
            <span
              className={`text-xs font-medium ${
                completed ? 'text-[var(--accent-ink)]/90' : 'text-[var(--text-secondary)]'
              }`}
            >
              {sub}
            </span>
          </div>

          {focus.totalTaskCount > 0 && (
            <span
              className={`text-[11px] font-medium tabular-nums ${
                completed ? 'text-[var(--accent-ink)]/85' : 'text-[var(--text-muted)]'
              }`}
            >
              {focus.completedTaskCount}/{focus.totalTaskCount}
            </span>
          )}
        </div>
      </motion.button>
    );
  }

  // Hero prominent ornate Mihrab tile (used first in TodayScreen & MethodScreen)
  return (
    <motion.div
      layout
      data-testid={testId ?? 'hero-today-page-badge'}
      data-completed={completed ? 'true' : 'false'}
      className={`mihrab-tile-shape relative flex min-w-[170px] shrink-0 flex-col items-center justify-center overflow-hidden border-2 px-5 py-4 text-center transition-all duration-300 sm:min-w-[192px] ${
        completed
          ? 'btn-accent-glow border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
          : 'card-elevated border-[var(--gold)]/55 bg-[var(--bg-canvas)] text-[var(--text-primary)]'
      }`}
    >
      {/* Inner delicate ornamental double border frame */}
      <span
        aria-hidden="true"
        className={`mihrab-tile-shape pointer-events-none absolute inset-1.5 border ${
          completed ? 'border-current/35' : 'border-[var(--gold)]/45'
        }`}
      />

      {/* Corner rosette emblems framing the Mihrab arch */}
      <ThemeEmblem
        className={`pointer-events-none absolute top-2.5 right-2.5 h-4 w-4 ${
          completed ? 'text-[var(--accent-ink)] opacity-55' : 'text-[var(--gold)] opacity-65'
        }`}
      />
      <ThemeEmblem
        className={`pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 ${
          completed ? 'text-[var(--accent-ink)] opacity-55' : 'text-[var(--gold)] opacity-65'
        }`}
      />

      {/* Centered theme signature medallion behind the giant page number */}
      <HeroCornerArabesque
        className={`absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 ${
          completed
            ? 'text-[var(--accent-ink)] opacity-[0.11]'
            : 'text-[var(--gold)] opacity-[0.12]'
        }`}
      />

      {/* Top arch crown filigree */}
      <MihrabCrownOrnament
        className={`relative z-10 h-7 w-32 ${
          completed ? 'text-[var(--accent-ink)]/90' : 'text-[var(--gold)]'
        }`}
      />

      <div
        className={`relative z-10 mt-0.5 flex items-center gap-1.5 text-xs font-semibold ${
          completed
            ? 'text-[var(--accent-ink)]'
            : 'text-[color-mix(in_srgb,var(--accent)_65%,var(--text-primary))]'
        }`}
      >
        <ThemeEmblem className="h-4 w-4 shrink-0" />
        <span>{title}</span>
        <ThemeEmblem className="h-4 w-4 shrink-0" />
      </div>

      <p
        dir={main.includes('–') || main.includes('-') ? 'ltr' : 'rtl'}
        className={`font-display relative z-10 mt-1.5 whitespace-nowrap font-bold leading-none tabular-nums ${
          main.length > 5
            ? 'text-3xl sm:text-[2.1rem]'
            : main.length > 3
            ? 'text-4xl sm:text-[2.6rem]'
            : 'text-5xl sm:text-[3.5rem]'
        }`}
      >
        {main}
      </p>

      <p
        className={`relative z-10 mt-1.5 max-w-[190px] text-xs font-medium leading-snug ${
          completed ? 'text-[var(--accent-ink)]/90' : 'text-[var(--text-secondary)]'
        }`}
      >
        {sub}
      </p>

      <div
        className={`relative z-10 mt-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold ${
          completed
            ? 'border border-current/30 bg-black/12 text-[var(--accent-ink)]'
            : 'border border-[var(--gold)]/35 bg-[var(--gold-soft)] text-[color-mix(in_srgb,var(--gold)_55%,var(--text-primary))]'
        }`}
      >
        {completed && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
        <span>
          {completed
            ? focus.areAllTasksDone
              ? 'تمت مهام اليوم'
              : 'تم إنهاء الصفحة'
            : pendingBadgeText}
        </span>
      </div>
    </motion.div>
  );
}
