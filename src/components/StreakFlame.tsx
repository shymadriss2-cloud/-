import { useId } from 'react';
import { motion } from 'motion/react';

interface StreakFlameProps {
  lit: boolean;
  size?: 'sm' | 'md';
  testId?: string;
}

export function StreakFlame({ lit, size = 'sm', testId }: StreakFlameProps) {
  const uid = useId().replace(/:/g, '');
  const outerGradId = `flame-outer-${uid}`;
  const innerGradId = `flame-inner-${uid}`;

  const boxSizeClass = size === 'md' ? 'h-13 w-13' : 'h-12 w-12';
  const svgSizeClass = size === 'md' ? 'h-8 w-8' : 'h-7 w-7';

  return (
    <motion.div
      data-testid={testId ?? 'streak-flame'}
      data-lit={lit ? 'true' : 'false'}
      aria-label={lit ? 'الشعلة مشتعلة ومضيئة بعد إتمام ورد اليوم' : 'الشعلة منطفئة قبل إتمام ورد اليوم'}
      title={lit ? 'شعلة الاستمرار مشتعلة اليوم' : 'أتمم مهام اليوم لإشعال الشعلة'}
      animate={lit ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${boxSizeClass} ${
        lit
          ? 'flame-badge-lit border border-amber-400/75 bg-gradient-to-br from-amber-500/20 via-orange-500/18 to-rose-500/15'
          : 'border border-[var(--border-hairline)] bg-[var(--bg-subtle)]/75'
      }`}
    >
      {lit && (
        <span
          aria-hidden="true"
          className="flame-aura pointer-events-none absolute -inset-2 rounded-2xl bg-[radial-gradient(circle,rgba(255,169,48,0.45)_0%,rgba(255,107,43,0.22)_50%,transparent_76%)]"
        />
      )}

      <svg
        viewBox="0 0 40 44"
        fill="none"
        aria-hidden="true"
        className={`relative z-10 overflow-visible ${svgSizeClass}`}
      >
        <defs>
          <linearGradient id={outerGradId} x1="20" y1="4" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="42%" stopColor="#FF922B" />
            <stop offset="100%" stopColor="#E03131" />
          </linearGradient>
          <linearGradient id={innerGradId} x1="20" y1="16" x2="20" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="55%" stopColor="#FFE066" />
            <stop offset="100%" stopColor="#FF922B" />
          </linearGradient>
        </defs>

        {lit ? (
          <g>
            {/* Floating ember sparks */}
            <circle cx="13" cy="10" r="1.4" fill="#FFD43B" className="flame-ember-1" />
            <circle cx="27" cy="13" r="1.15" fill="#FF922B" className="flame-ember-2" />
            <circle cx="20" cy="5.5" r="1.1" fill="#FFF3BF" className="flame-ember-3" />

            {/* Base glowing cradle */}
            <ellipse cx="20" cy="39" rx="9" ry="2.2" fill="#FF922B" opacity="0.32" />

            {/* Outer animated burning flame */}
            <path
              d="M20 4C20 4 29 12.2 31.2 21.6C32.4 26.8 30.7 32.1 26.8 35.6C24.8 37.4 22.5 38.5 20 38.5C14.1 38.5 9.2 33.8 9.2 27.6C9.2 22.1 12.6 18.2 14.3 15.8C14.7 18.5 16.3 20.1 17.3 20.5C15.9 14.6 18.4 8.2 20 4Z"
              fill={`url(#${outerGradId})`}
              className="flame-outer-dance"
            />

            {/* Inner incandescent core */}
            <path
              d="M20.2 16.5C20.2 16.5 25.3 21.4 25.9 26.8C26.3 30.7 23.8 35.2 20 35.2C16.6 35.2 14.2 32.3 14.2 28.6C14.2 25.3 16.3 23 17.5 21.5C17.8 23.1 18.8 24.1 19.5 24.4C18.9 21.2 19.5 18.5 20.2 16.5Z"
              fill={`url(#${innerGradId})`}
              className="flame-inner-pulse"
            />
          </g>
        ) : (
          <g className="text-[var(--text-muted)]">
            {/* Extinguished ember base */}
            <ellipse cx="20" cy="38.5" rx="7.5" ry="1.6" fill="currentColor" opacity="0.18" />
            {/* Unlit muted flame outline */}
            <path
              d="M20 7.5C20 7.5 27.5 14.3 29.2 22.2C30.2 26.8 28.7 31.3 25.5 34.2C23.8 35.7 22 36.6 20 36.6C15.1 36.6 11.1 32.6 11.1 27.4C11.1 22.7 13.8 19.3 15.2 17.2C15.6 19.4 16.8 20.7 17.6 21C16.5 16.2 18.6 10.9 20 7.5Z"
              fill="currentColor"
              fillOpacity="0.12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              opacity="0.65"
            />
            {/* Faint smoke curl indicating extinguished state */}
            <path
              d="M20 4.8C19.1 3.3 21.1 2.2 20.1 0.8"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.4"
            />
          </g>
        )}
      </svg>
    </motion.div>
  );
}
