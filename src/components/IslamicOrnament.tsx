import { createContext, useContext } from 'react';
import type { AppColorPalette } from '../types/plan';

const ThemePaletteContext = createContext<AppColorPalette>('emerald');

export const ThemePaletteProvider = ThemePaletteContext.Provider;

export function useActivePalette(): AppColorPalette {
  return useContext(ThemePaletteContext);
}

interface OrnamentProps {
  className?: string;
  palette?: AppColorPalette;
}

/**
 * Renders the signature geometric emblem for each of the 10 themes.
 */
export function ThemeEmblem({ className = 'h-4 w-4', palette }: OrnamentProps) {
  const ctxPalette = useActivePalette();
  const active = palette ?? ctxPalette;

  switch (active) {
    case 'linen':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.8" />
          <path d="M24 5L28 15L38 11L33 21L43 24L33 27L38 37L28 33L24 43L20 33L10 37L15 27L5 24L15 21L10 11L20 15Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
        </svg>
      );

    case 'sapphire':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <path d="M12 40V23C12 15.8 17.4 10 24 10C30.6 10 36 15.8 36 23V40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 40V24C18 19.6 20.7 16 24 16C27.3 16 30 19.6 30 24V40" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M24 4L26.5 7.5L24 10L21.5 7.5Z" fill="currentColor" />
        </svg>
      );

    case 'teal':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.7" strokeDasharray="3 3" />
          <ellipse cx="24" cy="24" rx="5" ry="15" stroke="currentColor" strokeWidth="1.7" />
          <ellipse cx="24" cy="24" rx="5" ry="15" transform="rotate(60 24 24)" stroke="currentColor" strokeWidth="1.7" />
          <ellipse cx="24" cy="24" rx="5" ry="15" transform="rotate(120 24 24)" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="24" cy="24" r="2.8" fill="currentColor" />
        </svg>
      );

    case 'olive':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <path d="M24 38C15 36 10 28 11 17C16 19 20 24 22 30" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M24 38C33 36 38 28 37 17C32 19 28 24 26 30" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M24 9L28 16L24 23L20 16Z" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="24" cy="40" r="2.2" fill="currentColor" />
        </svg>
      );

    case 'amber':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <polygon points="24,5 28.5,17 41,17 31,25 35,38 24,30 13,38 17,25 7,17 19.5,17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );

    case 'sunset':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <path d="M29 10C20.5 11.2 14 18.5 14 27C14 35.5 21.5 41 30 39C23.5 37.8 19.5 32.5 19.5 25.5C19.5 18.5 23.5 12.8 29 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="34,15 35.8,19 40,20.5 35.8,22 34,26 32.2,22 28,20.5 32.2,19" fill="currentColor" />
        </svg>
      );

    case 'rose':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <path d="M24 8C28 14 28 20 24 24C20 20 20 14 24 8Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M24 40C28 34 28 28 24 24C20 28 20 34 24 40Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 24C14 20 20 20 24 24C20 28 14 28 8 24Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M40 24C34 20 28 20 24 24C28 28 34 28 40 24Z" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 3" />
          <circle cx="24" cy="24" r="2.8" fill="currentColor" />
        </svg>
      );

    case 'plum':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <path d="M24 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 15L24 10L31 15L34 28L24 38L14 28L17 15Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M24 19C26.5 22 26.5 26 24 29C21.5 26 21.5 22 24 19Z" fill="currentColor" />
          <path d="M19 42H29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'burgundy':
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <polygon points="24,6 42,24 24,42 6,24" stroke="currentColor" strokeWidth="1.9" />
          <polygon points="24,13 35,24 24,35 13,24" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
        </svg>
      );

    case 'emerald':
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" data-ornament={active} className={className}>
          <rect x="11" y="11" width="26" height="26" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <rect
            x="11"
            y="11"
            width="26"
            height="26"
            rx="2"
            transform="rotate(45 24 24)"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="24" cy="24" r="4.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="24" cy="24" r="1.8" fill="currentColor" />
        </svg>
      );
  }
}

export const RubElHizbMark = ThemeEmblem;

/**
 * Richer geometric motif tailored uniquely to each theme — used in Hero, TodayPageBadge, & Suggestion cards.
 */
export function HeroCornerArabesque({ className = '', palette }: OrnamentProps) {
  const ctxPalette = useActivePalette();
  const active = palette ?? ctxPalette;

  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden="true"
      data-ornament={active}
      className={`pointer-events-none select-none ${className}`}
    >
      {active === 'sapphire' && (
        <g stroke="currentColor" strokeWidth="1.7">
          <path d="M24 166V82C24 44 54 16 90 16C126 16 156 44 156 82V166" />
          <path d="M44 166V86C44 58 64 36 90 36C116 36 136 58 136 86V166" strokeDasharray="4 4" />
          <path d="M64 166V90C64 72 75 58 90 58C105 58 116 72 116 90V166" />
          <polygon points="90,22 98,34 90,46 82,34" />
        </g>
      )}
      {active === 'linen' && (
        <g stroke="currentColor" strokeWidth="1.6">
          <circle cx="90" cy="90" r="76" strokeDasharray="3 4" />
          <circle cx="90" cy="90" r="56" />
          <path d="M90 12L103 48L141 34L126 72L168 90L126 108L141 146L103 132L90 168L77 132L39 146L54 108L12 90L54 72L39 34L77 48Z" />
          <circle cx="90" cy="90" r="18" />
        </g>
      )}
      {active === 'teal' && (
        <g stroke="currentColor" strokeWidth="1.6">
          <circle cx="90" cy="90" r="72" strokeDasharray="2 4" />
          <ellipse cx="90" cy="90" rx="22" ry="68" />
          <ellipse cx="90" cy="90" rx="22" ry="68" transform="rotate(45 90 90)" />
          <ellipse cx="90" cy="90" rx="22" ry="68" transform="rotate(90 90 90)" />
          <ellipse cx="90" cy="90" rx="22" ry="68" transform="rotate(135 90 90)" />
          <circle cx="90" cy="90" r="14" />
        </g>
      )}
      {active === 'olive' && (
        <g stroke="currentColor" strokeWidth="1.7">
          <circle cx="90" cy="90" r="68" strokeDasharray="4 4" />
          <path d="M90 150C48 140 28 102 36 52C58 64 74 86 80 116" strokeLinecap="round" />
          <path d="M90 150C132 140 152 102 144 52C122 64 106 86 100 116" strokeLinecap="round" />
          <polygon points="90,26 108,58 90,90 72,58" />
          <circle cx="90" cy="90" r="44" />
        </g>
      )}
      {active === 'amber' && (
        <g stroke="currentColor" strokeWidth="1.65">
          <circle cx="90" cy="90" r="76" />
          <polygon points="90,14 108,62 160,62 118,94 134,146 90,114 46,146 62,94 20,62 72,62" />
          <circle cx="90" cy="90" r="24" />
        </g>
      )}
      {active === 'sunset' && (
        <g stroke="currentColor" strokeWidth="1.75">
          <circle cx="90" cy="90" r="74" strokeDasharray="3 5" />
          <path d="M114 28C76 34 48 66 48 102C48 136 78 160 116 150C88 144 72 122 72 92C72 62 88 40 114 28Z" />
          <polygon points="124,48 131,64 148,70 131,76 124,92 117,76 100,70 117,64" />
        </g>
      )}
      {active === 'rose' && (
        <g stroke="currentColor" strokeWidth="1.65">
          <circle cx="90" cy="90" r="72" />
          <path d="M90 22C108 50 108 74 90 90C72 74 72 50 90 22Z" />
          <path d="M90 158C108 130 108 106 90 90C72 106 72 130 90 158Z" />
          <path d="M22 90C50 72 74 72 90 90C74 108 50 108 22 90Z" />
          <path d="M158 90C130 72 106 72 90 90C106 108 130 108 158 90Z" />
          <circle cx="90" cy="90" r="14" />
        </g>
      )}
      {active === 'plum' && (
        <g stroke="currentColor" strokeWidth="1.7">
          <circle cx="90" cy="90" r="74" strokeDasharray="3 4" />
          <path d="M90 18V36M60 54L90 36L120 54L134 108L90 150L46 108L60 54Z" />
          <path d="M72 64L90 52L108 64L116 104L90 132L64 104L72 64Z" />
          <path d="M90 76C98 86 98 98 90 108C82 98 82 86 90 76Z" />
        </g>
      )}
      {active === 'burgundy' && (
        <g stroke="currentColor" strokeWidth="1.75">
          <polygon points="90,14 166,90 90,166 14,90" />
          <polygon points="90,34 146,90 90,146 34,90" />
          <polygon points="90,54 126,90 90,126 54,90" strokeDasharray="3 3" />
          <circle cx="90" cy="90" r="14" />
        </g>
      )}
      {active === 'emerald' && (
        <g stroke="currentColor" strokeWidth="1.6">
          <circle cx="90" cy="90" r="76" strokeDasharray="3 4" />
          <circle cx="90" cy="90" r="56" />
          <rect x="44" y="44" width="92" height="92" rx="4" />
          <rect x="44" y="44" width="92" height="92" rx="4" transform="rotate(45 90 90)" />
          <rect x="62" y="62" width="56" height="56" rx="3" transform="rotate(22.5 90 90)" />
          <circle cx="90" cy="90" r="16" />
        </g>
      )}
    </svg>
  );
}

/**
 * Ornate top crown & arched filigree border for the Hero Today's Page focal tile.
 */
export function MihrabCrownOrnament({ className = '', palette }: OrnamentProps) {
  const ctxPalette = useActivePalette();
  const active = palette ?? ctxPalette;

  return (
    <svg
      viewBox="0 0 160 28"
      fill="none"
      aria-hidden="true"
      data-ornament={active}
      className={`pointer-events-none select-none ${className}`}
    >
      <path
        d="M8 24C28 24 44 18 58 10C68 4 74 3 80 3C86 3 92 4 102 10C116 18 132 24 152 24"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M26 24C44 24 58 19 69 13C74 10 77 9 80 9C83 9 86 10 91 13C102 19 116 24 134 24"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeDasharray="2.5 2.5"
        strokeLinecap="round"
      />
      <polygon points="80,2 84,7 80,12 76,7" fill="currentColor" />
      <circle cx="34" cy="20" r="1.8" fill="currentColor" />
      <circle cx="126" cy="20" r="1.8" fill="currentColor" />
    </svg>
  );
}

/**
 * Delicate corner/band arabesque specifically for suggestion cards (Duas, Tips, Remaining days).
 */
export function CardSuggestionOrnament({ className = '', palette }: OrnamentProps) {
  const ctxPalette = useActivePalette();
  const active = palette ?? ctxPalette;

  return (
    <HeroCornerArabesque
      palette={active}
      className={`h-28 w-28 ${className}`}
    />
  );
}

/**
 * Delicate horizontal divider with a centered theme-specific emblem.
 */
export function ArabesqueDivider({ className = '', palette }: OrnamentProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-3 text-[var(--gold)]/85 ${className}`}
    >
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--accent)]/45 to-[var(--gold)]/65" />
      <ThemeEmblem palette={palette} className="h-5 w-5 shrink-0" />
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--accent)]/45 to-[var(--gold)]/65" />
    </div>
  );
}
