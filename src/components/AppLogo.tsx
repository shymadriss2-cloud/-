interface AppLogoProps {
  className?: string;
  /** 'badge' uses theme accent + warm gold inside a soft container; 'mono' inherits currentColor */
  variant?: 'badge' | 'mono';
}

/**
 * Refined brand emblem for وِرْد مُدَّكِر:
 * a soft scalloped octagonal halo cradling flowing Mushaf leaves
 * crowned by a slender crescent and four-point star.
 */
export function AppLogo({ className = 'h-6 w-6', variant = 'mono' }: AppLogoProps) {
  const isBadge = variant === 'badge';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-testid="app-logo-svg"
      className={className}
    >
      {/* Soft inner luminous halo */}
      <circle
        cx="32"
        cy="32"
        r="25"
        fill="currentColor"
        fillOpacity={isBadge ? 0.08 : 0.06}
      />

      {/* Delicate scalloped Rub el Hizb double curve */}
      <rect
        x="14"
        y="14"
        width="36"
        height="36"
        rx="8"
        stroke="currentColor"
        strokeOpacity="0.34"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="14"
        width="36"
        height="36"
        rx="8"
        transform="rotate(45 32 32)"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1.4"
      />

      {/* Slender crescent + star centered above the Mushaf */}
      <path
        d="M32.4 13.6a5.4 5.4 0 1 0 5.5 7.7 4.45 4.45 0 0 1-5.8-5.7 4.5 4.5 0 0 1 .3-2Z"
        fill={isBadge ? 'var(--gold)' : 'currentColor'}
        fillOpacity={isBadge ? 0.95 : 0.9}
      />
      <path
        d="M36.3 13.9l.6 1.35 1.35.6-1.35.6-.6 1.35-.6-1.35-1.35-.6 1.35-.6.6-1.35Z"
        fill={isBadge ? 'var(--gold)' : 'currentColor'}
      />

      {/* Flowing open Mushaf leaves */}
      <path
        d="M32 29.6c-4.2-3.3-9.8-4.1-15-2.2-.9.32-1.5 1.15-1.5 2.08v13.1c0 1.38 1.38 2.36 2.72 1.94 4.86-1.5 9.8-.82 13.78 2.18 3.98-3 8.92-3.68 13.78-2.18 1.34.42 2.72-.56 2.72-1.94V29.48c0-.93-.6-1.76-1.5-2.08-5.2-1.9-10.8-1.1-15 2.2Z"
        fill="currentColor"
        fillOpacity="0.14"
        stroke="currentColor"
        strokeWidth="2.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center binding spine */}
      <path
        d="M32 29.9v16.5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />

      {/* Soft calligraphy-inspired reading lines */}
      <path
        d="M20.5 32.8c2.7-.55 5.45-.25 7.9.72M20.5 37.6c2.7-.55 5.45-.25 7.9.72M43.5 32.8c-2.7-.55-5.45-.25-7.9.72M43.5 37.6c-2.7-.55-5.45-.25-7.9.72"
        stroke="currentColor"
        strokeOpacity="0.62"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}
