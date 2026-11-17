import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { JUZ_NAMES_AR, JUZ_RANGES, TOTAL_MUSHAF_PAGES } from '../engine/mushaf';
import { getExtraReviewPages, getMemorizedStats } from '../engine/planner';
import type { PageProgress, PageStatus } from '../types/plan';

interface MushafMapScreenProps {
  pageProgress: Record<number, PageProgress>;
  onSetPageStatus: (page: number, status: PageStatus) => void;
}

const STATUS_META: Record<
  PageStatus,
  { label: string; tileClass: string; badgeClass: string }
> = {
  not_started: {
    label: 'لم يبدأ',
    tileClass:
      'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:border-[var(--text-muted)]',
    badgeClass: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
  },
  memorized: {
    label: 'محفوظ',
    tileClass:
      'border-[var(--gold)]/50 bg-[var(--gold-soft)] text-[var(--gold)] font-medium',
    badgeClass: 'bg-[var(--gold-soft)] text-[var(--gold)]',
  },
  strong: {
    label: 'متقن',
    tileClass:
      'border-[var(--accent)]/60 bg-[var(--accent)] text-[var(--accent-ink)] font-semibold',
    badgeClass: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  },
  needs_review: {
    label: 'يحتاج مراجعة',
    tileClass:
      'border-[var(--danger)]/60 bg-[var(--danger-soft)] text-[var(--danger)] font-semibold',
    badgeClass: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  },
};

export function MushafMapScreen({ pageProgress, onSetPageStatus }: MushafMapScreenProps) {
  const [filter, setFilter] = useState<'all' | PageStatus>('all');
  const [selectedPage, setSelectedPage] = useState<number>(1);

  const stats = useMemo(() => getMemorizedStats(pageProgress), [pageProgress]);
  const extraReview = useMemo(() => getExtraReviewPages(pageProgress), [pageProgress]);

  const selectedProgress = pageProgress[selectedPage];
  const selectedStatus: PageStatus = selectedProgress?.status ?? 'not_started';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">
              مصحف المدينة المنورة · {TOTAL_MUSHAF_PAGES} صفحة
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              خريطة المصحف الشريف
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              متقن: <span className="tabular-nums font-medium">{stats.strongCount}</span> ·
              محفوظ: <span className="tabular-nums font-medium">{stats.memorizedCount - stats.strongCount - stats.needsReviewCount}</span> ·
              يحتاج مراجعة: <span className="tabular-nums font-medium">{stats.needsReviewCount}</span> ·
              متبقي: <span className="tabular-nums font-medium">{stats.notStartedCount}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-1">
            {(
              [
                { id: 'all', label: 'الكل (٦٠٤)' },
                { id: 'strong', label: 'متقن' },
                { id: 'memorized', label: 'محفوظ' },
                { id: 'needs_review', label: 'يحتاج مراجعة' },
                { id: 'not_started', label: 'لم يبدأ' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`h-9 rounded-lg px-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {extraReview.length > 0 && (
        <section className="rounded-2xl border border-[var(--danger)]/35 bg-[var(--danger-soft)]/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                قائمة المراجعة الإضافية ({extraReview.length} صفحة)
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                الصفحات التي سُجّلت بتقييم «أخطاء» تُضاف تلقائياً هنا للمراجعة وتصحيح التثبيت.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {extraReview.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPage(p)}
                    className="h-8 rounded-lg border border-[var(--danger)]/40 bg-[var(--bg-surface)] px-2.5 text-xs font-medium tabular-nums text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                  >
                    ص {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Selected Page Inspector */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">معاينة وتحديث الصفحة</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              صفحة {selectedPage}{' '}
              <span className="text-sm font-normal text-[var(--text-secondary)]">
                · الحالة الحالية: {STATUS_META[selectedStatus].label}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { status: 'strong', label: 'تحديد كمتقن' },
                { status: 'memorized', label: 'تحديد كمحفوظ' },
                { status: 'needs_review', label: 'إضافة للمراجعة الإضافية' },
                { status: 'not_started', label: 'لم يبدأ' },
              ] as const
            ).map((action) => (
              <button
                key={action.status}
                type="button"
                onClick={() => onSetPageStatus(selectedPage, action.status)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-medium transition-colors ${
                  selectedStatus === action.status
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {selectedStatus === action.status && <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 604 Tiles grouped by Juz */}
      <div className="space-y-4">
        {JUZ_RANGES.map((range) => {
          const pages: number[] = [];
          for (let p = range.startPage; p <= range.endPage; p++) {
            const st = pageProgress[p]?.status ?? 'not_started';
            if (filter === 'all' || st === filter) {
              pages.push(p);
            }
          }
          if (pages.length === 0) return null;

          return (
            <section
              key={range.juz}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
            >
              <div className="mb-3 flex items-center justify-between text-xs">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  {JUZ_NAMES_AR[range.juz]}
                </h3>
                <span className="tabular-nums text-[var(--text-muted)]">
                  صفحات {range.startPage}–{range.endPage}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 md:grid-cols-12">
                {pages.map((p) => {
                  const st = pageProgress[p]?.status ?? 'not_started';
                  const isSelected = selectedPage === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPage(p)}
                      aria-label={`صفحة ${p} - ${STATUS_META[st].label}`}
                      className={`flex h-9 items-center justify-center rounded-lg border text-xs tabular-nums transition-transform active:scale-95 ${
                        STATUS_META[st].tileClass
                      } ${isSelected ? 'ring-2 ring-[var(--text-primary)] ring-offset-1' : ''}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
