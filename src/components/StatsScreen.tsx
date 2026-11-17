import { useMemo } from 'react';
import { Award, Check, Flame, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getJuzForPage, JUZ_RANGES, TOTAL_MUSHAF_PAGES } from '../engine/mushaf';
import {
  getExtraReviewPages,
  getJuzCompletionStats,
  getMemorizedStats,
  getPagesPerMonthStats,
  getPagesPerWeekLast3Months,
  type WeeklyStatsPoint,
} from '../engine/planner';
import type { PageProgress } from '../types/plan';
import { ProgressRing } from './ProgressRing';

interface StatsScreenProps {
  pageProgress: Record<number, PageProgress>;
  streak: number;
  todayIso: string;
  onResolveWeakPage: (page: number) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeeklyStatsPoint; value: number }>;
}

function WeeklyChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div
      dir="rtl"
      className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs shadow-md"
    >
      <p className="font-medium text-[var(--text-secondary)]">{point.rangeLabel}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-[var(--accent)]">
        {point.count} {point.count === 1 ? 'صفحة' : 'صفحات'}
      </p>
    </div>
  );
}

export function StatsScreen({
  pageProgress,
  streak,
  todayIso,
  onResolveWeakPage,
}: StatsScreenProps) {
  const stats = useMemo(() => getMemorizedStats(pageProgress), [pageProgress]);
  const monthlyStats = useMemo(() => getPagesPerMonthStats(pageProgress), [pageProgress]);
  const weeklyStats = useMemo(
    () => getPagesPerWeekLast3Months(pageProgress, todayIso),
    [pageProgress, todayIso]
  );
  const weakestPages = useMemo(() => getExtraReviewPages(pageProgress), [pageProgress]);

  const totalLast3Months = useMemo(
    () => weeklyStats.reduce((sum, w) => sum + w.count, 0),
    [weeklyStats]
  );

  const maxMonthCount = Math.max(1, ...monthlyStats.map((m) => m.count));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <p className="text-xs text-[var(--text-muted)]">مؤشرات الإنجاز والثبات</p>
        <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
          الإحصائيات والتقدم
        </h1>
      </section>

      {/* Top 4 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
        >
          <div>
            <p className="text-xs text-[var(--text-muted)]">نسبة الحفظ</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {stats.percent}%
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-[var(--text-secondary)]">
              {stats.memorizedCount} من {TOTAL_MUSHAF_PAGES} صفحة
            </p>
          </div>
          <ProgressRing percent={stats.percent} size={64} strokeWidth={6} label={`${stats.percent}%`} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
        >
          <div>
            <p className="text-xs text-[var(--text-muted)]">سلسلة الاستمرار</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {streak} يوم
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">التزام متواصل</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <Flame className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
        >
          <div>
            <p className="text-xs text-[var(--text-muted)]">صفحات متقنة</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--accent)]">
              {stats.strongCount}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">بتقييم «ممتاز»</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Award className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.12 }}
          className="flex items-center justify-between rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5"
        >
          <div>
            <p className="text-xs text-[var(--text-muted)]">تحتاج مراجعة</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--danger)]">
              {weakestPages.length}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">مضافة للمراجعة الإضافية</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--danger-soft)] text-[var(--danger)]">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Recharts Weekly Consistency Bar Chart (Last 3 Months) */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              الصفحات المحفوظة أسبوعياً (آخر ٣ أشهر)
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              متابعة الانتظام الأسبوعي مقارنة بالهدف الثابت (٥ صفحات في الأسبوع)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="tabular-nums">
              الإجمالي في ٣ أشهر:{' '}
              <strong className="font-semibold text-[var(--text-primary)]">
                {totalLast3Months} صفحة
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[var(--gold)]" />
              <span>هدف الخطة (٥/أسبوع)</span>
            </span>
          </div>
        </div>

        <div className="mt-5 h-64 w-full" dir="ltr" data-testid="weekly-recharts-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyStats}
              margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border-hairline)"
              />
              <XAxis
                dataKey="shortLabel"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-hairline)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(6, dataMax)]}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                content={<WeeklyChartTooltip />}
                cursor={{ fill: 'var(--bg-subtle)', opacity: 0.6 }}
              />
              <ReferenceLine
                y={5}
                stroke="var(--gold)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar
                dataKey="count"
                name="الصفحات المحفوظة"
                fill="var(--accent)"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pages per Month Chart */}
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            الصفحات المحفوظة شهرياً
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            توزيع الصفحات التي تم إتمام حفظها حسب الشهر الميلادي
          </p>

          {monthlyStats.length === 0 ? (
            <div className="mt-6 rounded-xl bg-[var(--bg-canvas)] p-6 text-center text-sm text-[var(--text-muted)]">
              سيظهر الرسم البياني تلقائياً بمجرد تسجيل أول صفحة محفوظة في ورد اليوم.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {monthlyStats.map((m) => {
                const widthPercent = Math.max(8, Math.round((m.count / maxMonthCount) * 100));
                return (
                  <div key={m.monthKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-primary)]">{m.label}</span>
                      <span className="tabular-nums text-[var(--text-secondary)]">
                        {m.count} صفحة
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full origin-right rounded-full bg-[var(--accent)]"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Weakest Pages */}
        <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            أضعف الصفحات (الأولى بالمراجعة)
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            صفحات سُجّلت بها أخطاء أو تردد متكرر وتنتظر المراجعة المركزة
          </p>

          {weakestPages.length === 0 ? (
            <div className="mt-6 rounded-xl bg-[var(--accent-soft)]/50 p-6 text-center text-sm text-[var(--text-secondary)]">
              لا توجد صفحات مسجّلة بأخطاء حالياً. ثبتك الله ويسّر لك.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--border-hairline)] rounded-xl border border-[var(--border-hairline)]">
              {weakestPages.map((p) => (
                <li
                  key={p}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">صفحة {p}</span>
                    <span className="mr-2 text-xs text-[var(--text-muted)]">
                      · الجزء {getJuzForPage(p)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onResolveWeakPage(p)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 text-xs font-medium text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>أتقنتها</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 30 Juz Progress Rings */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          تقدم الأجزاء الثلاثين
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10">
          {JUZ_RANGES.map((r) => {
            const jStats = getJuzCompletionStats(pageProgress, r.juz);
            return (
              <div
                key={r.juz}
                className="flex flex-col items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5 text-center"
              >
                <ProgressRing
                  percent={jStats.percent}
                  size={52}
                  strokeWidth={5}
                  label={`${jStats.percent}%`}
                />
                <span className="mt-2 text-xs font-medium text-[var(--text-primary)]">
                  ج {r.juz}
                </span>
                <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                  {jStats.done}/{jStats.total}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
