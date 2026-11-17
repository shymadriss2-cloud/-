import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  getDailyTip,
  MEMORIZATION_TIPS,
  TIP_CATEGORY_LABELS,
  type TipCategory,
} from '../data/tips';

interface TipsScreenProps {
  dayIndex: number;
}

export function TipsScreen({ dayIndex }: TipsScreenProps) {
  const [category, setCategory] = useState<'all' | TipCategory>('all');
  const [query, setQuery] = useState<string>('');

  const dailyTip = getDailyTip(dayIndex);

  const filteredTips = useMemo(() => {
    const q = query.trim();
    return MEMORIZATION_TIPS.filter((tip) => {
      if (category !== 'all' && tip.category !== category) return false;
      if (!q) return true;
      return tip.title.includes(q) || tip.body.includes(q);
    });
  }, [category, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <p className="text-xs text-[var(--text-muted)]">
          تتجدد يومياً · {MEMORIZATION_TIPS.length} نصيحة عملية
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
          نصائح الحفظ والمراجعة
        </h1>
      </section>

      {/* Daily Highlight */}
      <section className="rounded-2xl border border-[var(--accent)]/35 bg-[var(--accent-soft)]/50 p-6">
        <div className="flex items-center justify-between text-xs text-[var(--accent)]">
          <span className="font-semibold">نصيحة اليوم المختارة</span>
          <span>{dailyTip.categoryLabel}</span>
        </div>
        <h2 className="mt-2 text-lg font-bold text-[var(--text-primary)]">{dailyTip.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {dailyTip.body}
        </p>
      </section>

      {/* Filter & Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`h-9 rounded-lg px-3 text-xs font-medium whitespace-nowrap ${
              category === 'all'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            الكل ({MEMORIZATION_TIPS.length})
          </button>
          {(Object.keys(TIP_CATEGORY_LABELS) as TipCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`h-9 rounded-lg px-3 text-xs font-medium whitespace-nowrap ${
                category === cat
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {TIP_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في النصائح..."
            aria-label="ابحث في النصائح"
            className="h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] pr-9 pl-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Tips Grid */}
      {filteredTips.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--text-muted)]">
          لا توجد نصائح مطابقة للبحث.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTips.map((tip) => (
            <article
              key={tip.id}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="tabular-nums">
                  {String(tip.id).padStart(2, '0')}
                </span>
                <span>{tip.categoryLabel}</span>
              </div>
              <h3 className="mt-1.5 text-base font-semibold text-[var(--text-primary)]">
                {tip.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                {tip.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
