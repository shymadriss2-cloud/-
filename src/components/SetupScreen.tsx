import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Calendar, Check, Lock, ShieldCheck } from 'lucide-react';
import { PLAN_CONFIG } from '../config/planConfig';
import { MUSHAF_SURAHS, getSurahEntryForPage } from '../data/surahs';
import { buildSequenceFromConfig, JUZ_BEGINNINGS, JUZ_RANGES } from '../engine/mushaf';
import { addDays, addMonths, formatShortArabicDate, getTodayLocalISO } from '../engine/planner';
import {
  computeCyclePlanDurationDays,
  formatApproximateYears,
  formatWeeksFromDays,
  isoToDDMMYYYY,
  parseDDMMYYYYToIso,
  PLAN_TRACK_LIST,
  PLAN_TRACKS,
  toLatinDigits,
  type PlanTrackDefinition,
} from '../engine/plans';
import type {
  MemorizationOrder,
  PlanDirection,
  PlanStartMode,
  PlanTrackId,
} from '../types/plan';
import { AppLogo } from './AppLogo';
import { ShareCharityCard } from './ShareCharityCard';

export interface SetupConfirmPayload {
  startDate: string;
  trackId: PlanTrackId;
  startMode: PlanStartMode;
  startPage: number;
  direction: PlanDirection;
  order: MemorizationOrder;
}

interface SetupScreenProps {
  onConfirmPlan: (payload: SetupConfirmPayload) => void;
}

type CustomStartKind = 'surah' | 'juz' | 'page';

function getSetupTrackTitle(track: PlanTrackDefinition): string {
  return track.id === 'three_years' ? 'ثلاث سنوات (الخطة الأساسية)' : track.title;
}

export function SetupScreen({ onConfirmPlan }: SetupScreenProps) {
  const initialToday = getTodayLocalISO();
  const [startDate, setStartDate] = useState<string>(initialToday);
  const [dateInputText, setDateInputText] = useState<string>(() => isoToDDMMYYYY(initialToday));
  const datePickerRef = useRef<HTMLInputElement | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<PlanTrackId | null>(null);
  const [startMode, setStartMode] = useState<PlanStartMode>('from_start');
  const [direction, setDirection] = useState<PlanDirection>('forward');

  const [customKind, setCustomKind] = useState<CustomStartKind>('surah');
  const [customSurah, setCustomSurah] = useState<number>(2); // البقرة
  const [customJuz, setCustomJuz] = useState<number>(1);
  const [customPage, setCustomPage] = useState<number>(1);

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmedLock, setConfirmedLock] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const resolvedStartPage = useMemo(() => {
    if (startMode === 'from_start') return 1;
    if (startMode === 'from_nas') return PLAN_CONFIG.TOTAL_MUSHAF_PAGES;
    if (startMode === 'juz_amma_first') {
      return direction === 'backward' ? PLAN_CONFIG.TOTAL_MUSHAF_PAGES : 582;
    }
    if (customKind === 'surah') {
      return MUSHAF_SURAHS.find((s) => s.number === customSurah)?.startPage ?? 1;
    }
    if (customKind === 'juz') {
      return JUZ_RANGES.find((j) => j.juz === customJuz)?.startPage ?? 1;
    }
    return Math.min(PLAN_CONFIG.TOTAL_MUSHAF_PAGES, Math.max(1, Math.trunc(customPage || 1)));
  }, [startMode, direction, customKind, customSurah, customJuz, customPage]);

  const previewSequence = useMemo(
    () => buildSequenceFromConfig(resolvedStartPage, direction),
    [resolvedStartPage, direction]
  );

  const directionSurahExamples = useMemo(() => {
    const startSurah = getSurahEntryForPage(resolvedStartPage);
    const idx = Math.max(
      0,
      MUSHAF_SURAHS.findIndex((s) => s.number === startSurah.number)
    );
    const total = MUSHAF_SURAHS.length;

    const fwdNames =
      resolvedStartPage === 1
        ? [1, 2, 3].map((off) => MUSHAF_SURAHS[(idx + off) % total].name)
        : [0, 1, 2].map((off) => MUSHAF_SURAHS[(idx + off) % total].name);

    const bwdNames =
      resolvedStartPage === PLAN_CONFIG.TOTAL_MUSHAF_PAGES
        ? ['الناس', 'الفلق', 'الإخلاص']
        : [0, 1, 2].map((off) => MUSHAF_SURAHS[(idx - off + total) % total].name);

    return {
      forward: `(مثال: ${fwdNames.join(' ثم ')}...)`,
      backward: `(مثال: ${bwdNames.join(' ثم ')}...)`,
    };
  }, [resolvedStartPage]);

  const wrapNotice = useMemo(() => {
    const totalPages = PLAN_CONFIG.TOTAL_MUSHAF_PAGES;
    if (direction === 'forward' && resolvedStartPage > 1) {
      return `بعد الصفحة ${totalPages} تنتقل الخطة إلى الصفحة 1`;
    }
    if (direction === 'backward' && resolvedStartPage < totalPages) {
      return `بعد الصفحة 1 تنتقل الخطة إلى الصفحة ${totalPages}`;
    }
    return null;
  }, [direction, resolvedStartPage]);

  const handleSelectStartMode = (mode: PlanStartMode) => {
    setStartMode(mode);
    if (mode === 'from_start' || mode === 'juz_amma_first') {
      setDirection('forward');
    } else if (mode === 'from_nas') {
      setDirection('backward');
    }
  };

  const activeTrackDef = selectedTrack ? PLAN_TRACKS[selectedTrack] : null;

  const cardDates = useMemo(() => {
    const safeStart = startDate || getTodayLocalISO();
    const map: Record<
      PlanTrackId,
      { days: number; weeks: number; years: string; memEndDate: string; fullEndDate?: string }
    > = {} as Record<
      PlanTrackId,
      { days: number; weeks: number; years: string; memEndDate: string; fullEndDate?: string }
    >;

    for (const track of PLAN_TRACK_LIST) {
      if (track.isLegacyThreeYear) {
        const days = track.legacyMemorizationDays;
        map[track.id] = {
          days,
          weeks: formatWeeksFromDays(days),
          years: formatApproximateYears(days),
          memEndDate: addDays(safeStart, days - 1),
          fullEndDate: addDays(addMonths(safeStart, 36), -1),
        };
      } else {
        const days = computeCyclePlanDurationDays(track.id, PLAN_CONFIG.TOTAL_MUSHAF_PAGES);
        map[track.id] = {
          days,
          weeks: formatWeeksFromDays(days),
          years: formatApproximateYears(days),
          memEndDate: addDays(safeStart, days - 1),
        };
      }
    }
    return map;
  }, [startDate]);

  const handleDateTextChange = (raw: string) => {
    const cleaned = toLatinDigits(raw).replace(/[^0-9/]/g, '').slice(0, 10);
    setDateInputText(cleaned);
    const parsed = parseDDMMYYYYToIso(cleaned);
    if (parsed) {
      setStartDate(parsed);
      setErrorMsg('');
    } else {
      setStartDate('');
    }
  };

  const handleNativeDatePick = (iso: string) => {
    setStartDate(iso);
    setDateInputText(isoToDDMMYYYY(iso));
    setErrorMsg('');
  };

  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack) {
      setErrorMsg('يرجى اختيار خطة الحفظ أولاً.');
      return;
    }
    if (!startDate || !parseDDMMYYYYToIso(dateInputText)) {
      setErrorMsg('يرجى إدخال تاريخ بداية صحيح بصيغة DD/MM/YYYY.');
      return;
    }
    setErrorMsg('');
    setConfirmedLock(false);
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    if (!confirmedLock || !startDate || !selectedTrack) return;
    const legacyOrder: MemorizationOrder =
      startMode === 'juz_amma_first' || startMode === 'from_nas' || direction === 'backward'
        ? 'B'
        : 'A';

    onConfirmPlan({
      startDate,
      trackId: selectedTrack,
      startMode,
      startPage: resolvedStartPage,
      direction,
      order: legacyOrder,
    });
  };

  const startModeSummaryLabel = useMemo(() => {
    if (startMode === 'from_start') return 'من أول المصحف (الفاتحة والبقرة)';
    if (startMode === 'from_nas') return 'من سورة الناس (آخر المصحف)';
    if (startMode === 'juz_amma_first') return 'جزء عمّ أولاً ثم البقرة وما بعدها';
    return `مخصص (بدءاً من صفحة ${resolvedStartPage})`;
  }, [startMode, resolvedStartPage]);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p
            data-testid="setup-basmala"
            className="font-display mb-4 text-xl font-semibold text-[var(--accent)] md:text-2xl"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/25 bg-[linear-gradient(145deg,var(--accent-soft)_0%,var(--bg-surface)_100%)] text-[var(--accent)] shadow-sm">
            <AppLogo variant="badge" className="h-11 w-11" />
          </div>
          <h1 className="font-display text-3xl font-bold leading-relaxed text-[var(--text-primary)] md:text-4xl">
            وِرْد مُدَّكِر
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-secondary)] md:text-base">
            اختر خطة الحفظ المناسبة لوَقْتك وقدرتك من الخطط الخمس المعتمدة (مصحف المدينة المنورة · {PLAN_CONFIG.TOTAL_MUSHAF_PAGES} صفحة)
          </p>
        </div>

        <form
          onSubmit={handleOpenConfirmModal}
          className="card-elevated rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 md:p-8"
        >
          <div className="border-b border-[var(--border-hairline)] pb-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              1. اختر خطة الحفظ (اختيار نهائي عند البدء)
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              تعرض كل بطاقة المعدل اليومي أو الأسبوعي وعدد الأسابيع والمدة التقريبية وتاريخ الختم المتوقع.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="الخطط الخمس">
            {PLAN_TRACK_LIST.map((track) => {
              const active = selectedTrack === track.id;
              const info = cardDates[track.id];
              const displayTitle = getSetupTrackTitle(track);
              return (
                <button
                  key={track.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-testid={`plan-card-${track.id}`}
                  onClick={() => {
                    setSelectedTrack(track.id);
                    setErrorMsg('');
                  }}
                  className={`flex flex-col items-start justify-between rounded-2xl border p-4 text-right transition-all ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]/55 ring-1 ring-[var(--accent)]/35'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--accent)]/50'
                  } ${track.id === 'five_years' ? 'md:col-span-2' : ''}`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div>
                      <span className="text-base font-bold text-[var(--text-primary)]">
                        {displayTitle}
                      </span>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{track.subtitle}</p>
                    </div>
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-medium text-[var(--accent)]">
                    {toLatinDigits(track.rateLabel)}
                  </p>

                  <div className="mt-3 w-full space-y-1.5 border-t border-[var(--border-hairline)] pt-2.5 text-xs">
                    {track.isLegacyThreeYear ? (
                      <>
                        <p className="text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)]">مدة الحفظ:</span>{' '}
                          <span className="tabular-nums">
                            {info.days} يوماً ({info.weeks} أسبوعاً ≈ {info.years} سنة)
                          </span>
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)]">
                            الختم الشامل بالمراجعة:
                          </span>{' '}
                          <span className="tabular-nums">36 شهراً ({track.legacyTotalDays} يوماً)</span>
                        </p>
                        <p className="text-[var(--text-muted)]">
                          ختم الحفظ:{' '}
                          <span className="font-medium text-[var(--text-secondary)]">
                            {toLatinDigits(formatShortArabicDate(info.memEndDate))}
                          </span>
                          {' · '}
                          الختم الشامل:{' '}
                          <span className="font-medium text-[var(--text-secondary)]">
                            {info.fullEndDate ? toLatinDigits(formatShortArabicDate(info.fullEndDate)) : ''}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)]">مدة الحفظ:</span>{' '}
                          <span className="tabular-nums">
                            {info.days} يوماً ({info.weeks} أسبوعاً ≈ {info.years} سنة)
                          </span>
                        </p>
                        <p className="text-[var(--text-muted)]">
                          تاريخ الختم المتوقع:{' '}
                          <span className="font-medium text-[var(--text-secondary)]">
                            {toLatinDigits(formatShortArabicDate(info.memEndDate))}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-6 border-t border-[var(--border-hairline)] pt-6">
            <div>
              <label
                htmlFor="plan-start-date"
                className="block text-sm font-medium text-[var(--text-primary)]"
              >
                2. تاريخ بداية الخطة (DD/MM/YYYY)
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="relative flex flex-1 items-center">
                  <input
                    id="plan-start-date"
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    placeholder="DD/MM/YYYY"
                    value={dateInputText}
                    onChange={(e) => handleDateTextChange(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] pr-3.5 pl-11 text-right text-sm tabular-nums text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    aria-label="اختيار التاريخ من التقويم"
                    onClick={() => {
                      const el = datePickerRef.current;
                      if (!el) return;
                      try {
                        el.showPicker?.();
                      } catch {
                        el.focus();
                        el.click();
                      }
                    }}
                    className="absolute left-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                  <input
                    ref={datePickerRef}
                    type="date"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={startDate}
                    onChange={(e) => handleNativeDatePick(e.target.value)}
                    className="pointer-events-none absolute left-2 h-8 w-8 opacity-0"
                  />
                </div>
                {activeTrackDef && startDate ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    الختم المتوقع لخطة «{getSetupTrackTitle(activeTrackDef)}»:{' '}
                    <span className="font-medium text-[var(--text-secondary)]">
                      {toLatinDigits(formatShortArabicDate(cardDates[activeTrackDef.id].memEndDate))}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    اختر إحدى الخطط الخمس أعلاه لعرض تاريخ الختم المتوقع.
                  </p>
                )}
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-[var(--text-primary)]">
                3. نقطة البداية في المصحف
              </span>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {(
                  [
                    {
                      id: 'from_start',
                      title: 'من أول المصحف (الفاتحة والبقرة)',
                      desc: 'البدء من الصفحة 1 متابعاً المصحف الشريف',
                    },
                    {
                      id: 'from_nas',
                      title: 'من سورة الناس (آخر المصحف)',
                      desc: 'البدء من الصفحة 604 في آخر المصحف',
                    },
                    {
                      id: 'juz_amma_first',
                      title: 'جزء عمّ أولاً ثم البقرة وما بعدها',
                      desc: 'تبدأ بجزء عمّ كاملاً ثم تستكمل من أول المصحف',
                    },
                    {
                      id: 'custom',
                      title: 'من سورة أو جزء أو صفحة محددة',
                      desc: 'تحديد نقطة البداية بدقة من قائمة السور أو الأجزاء أو الصفحات',
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`start-mode-${opt.id}`}
                    aria-pressed={startMode === opt.id}
                    onClick={() => handleSelectStartMode(opt.id)}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-right transition-colors ${
                      startMode === opt.id
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {opt.title}
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>

              {startMode !== 'custom' && (
                <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                  <p>
                    مسار الصفحات: تبدأ من{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      صفحة {previewSequence[0]}
                    </span>{' '}
                    وتختم عند{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      صفحة {previewSequence[previewSequence.length - 1]}
                    </span>{' '}
                    ({direction === 'forward' ? 'بترتيب المصحف' : 'عكس ترتيب المصحف'} ·{' '}
                    {previewSequence.length} صفحة دون تكرار).
                  </p>
                  {wrapNotice && (
                    <p data-testid="setup-wrap-notice" className="font-medium text-[var(--accent)]">
                      {wrapNotice}
                    </p>
                  )}
                </div>
              )}

              {startMode === 'custom' && (
                <div className="mt-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'surah', label: 'اختيار السورة' },
                        { id: 'juz', label: 'اختيار الجزء' },
                        { id: 'page', label: 'رقم الصفحة' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCustomKind(tab.id)}
                        className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                          customKind === tab.id
                            ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                            : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3">
                    {customKind === 'surah' && (
                      <label className="block text-xs text-[var(--text-secondary)]">
                        اختر السورة:
                        <select
                          value={customSurah}
                          onChange={(e) => setCustomSurah(Number(e.target.value))}
                          aria-label="اختيار السورة للبدء"
                          className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                        >
                          {MUSHAF_SURAHS.map((s) => (
                            <option key={s.number} value={s.number}>
                              {s.number}. سورة {s.name} (تبدأ صفحة {s.startPage})
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {customKind === 'juz' && (
                      <label className="block text-xs text-[var(--text-secondary)]">
                        اختر الجزء:
                        <select
                          value={customJuz}
                          onChange={(e) => setCustomJuz(Number(e.target.value))}
                          aria-label="اختيار الجزء للبدء"
                          className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
                        >
                          {JUZ_RANGES.map((j) => {
                            const info = JUZ_BEGINNINGS[j.juz];
                            return (
                              <option key={j.juz} value={j.juz}>
                                الجزء {j.juz} — {info?.surah} ({j.startPage}–{j.endPage})
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    )}

                    {customKind === 'page' && (
                      <label className="block text-xs text-[var(--text-secondary)]">
                        أدخل رقم الصفحة (1–{PLAN_CONFIG.TOTAL_MUSHAF_PAGES}):
                        <input
                          type="number"
                          min={1}
                          max={PLAN_CONFIG.TOTAL_MUSHAF_PAGES}
                          value={customPage}
                          onChange={(e) => setCustomPage(Number(e.target.value))}
                          aria-label="رقم صفحة البداية"
                          className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 text-sm tabular-nums text-[var(--text-primary)]"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {startMode === 'custom' && (
              <div data-testid="setup-direction-section">
                <span className="block text-sm font-medium text-[var(--text-primary)]">
                  4. اتجاه الحفظ
                </span>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    data-testid="direction-forward"
                    aria-pressed={direction === 'forward'}
                    onClick={() => setDirection('forward')}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-right transition-colors ${
                      direction === 'forward'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      بترتيب المصحف
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                      بترتيب المصحف من نقطة البداية حتى ختام المصحف دون تكرار{' '}
                      {directionSurahExamples.forward}.
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="direction-backward"
                    aria-pressed={direction === 'backward'}
                    onClick={() => setDirection('backward')}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-right transition-colors ${
                      direction === 'backward'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      عكس ترتيب المصحف
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                      عكس ترتيب المصحف من الصفحة المختارة {directionSurahExamples.backward} (ترتيب الآيات داخل الصفحة الواحدة يبقى طبيعياً).
                    </span>
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                  <p>
                    مسار الصفحات: تبدأ من{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      صفحة {previewSequence[0]}
                    </span>{' '}
                    وتختم عند{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      صفحة {previewSequence[previewSequence.length - 1]}
                    </span>{' '}
                    ({previewSequence.length} صفحة دون تكرار).
                  </p>
                  {wrapNotice && (
                    <p data-testid="setup-wrap-notice" className="font-medium text-[var(--accent)]">
                      {wrapNotice}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                <div className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  <p className="font-medium text-[var(--text-primary)]">
                    قفل نهائي للخطة المختارة
                  </p>
                  <p className="mt-1">
                    اختيار الخطة ونقطة البداية والاتجاه نهائي، ولا يمكن تغييره لاحقًا إلا بحذف كل البيانات والبدء من جديد.
                  </p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p role="alert" className="text-sm font-medium text-[var(--danger)]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              data-testid="setup-continue-btn"
              disabled={!selectedTrack}
              className="btn-accent-glow inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>مراجعة وتأكيد الخطة</span>
            </button>
          </div>
        </form>

        <ShareCharityCard variant="setup" />
      </div>

      {/* Explicit Final Confirmation Dialog */}
      {showConfirmModal && activeTrackDef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-lock-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="plan-lock-dialog-title"
                  className="text-lg font-bold text-[var(--text-primary)]"
                >
                  تأكيد اختيار الخطة النهائي
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  اختيار الخطة ونقطة البداية والاتجاه نهائي، ولا يمكن تغييره لاحقًا إلا بحذف كل البيانات والبدء من جديد.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5 text-xs text-[var(--text-secondary)]">
              <p>
                <span className="font-semibold text-[var(--text-primary)]">الخطة:</span>{' '}
                {getSetupTrackTitle(activeTrackDef)}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">نقطة البداية:</span>{' '}
                {startModeSummaryLabel}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">الاتجاه:</span>{' '}
                {direction === 'forward' ? 'بترتيب المصحف' : 'عكس ترتيب المصحف'} · ص{' '}
                {previewSequence[0]} ← ص {previewSequence[previewSequence.length - 1]}
              </p>
              <p>
                <span className="font-semibold text-[var(--text-primary)]">تاريخ البداية:</span>{' '}
                <span dir="ltr" className="tabular-nums">{isoToDDMMYYYY(startDate)}</span> ·{' '}
                <span className="font-semibold text-[var(--text-primary)]">تاريخ الختم المتوقع:</span>{' '}
                {toLatinDigits(formatShortArabicDate(cardDates[activeTrackDef.id].memEndDate))}
              </p>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                data-testid="setup-lock-checkbox"
                checked={confirmedLock}
                onChange={(e) => setConfirmedLock(e.target.checked)}
                className="h-5 w-5 rounded border-[var(--border-hairline)] accent-[var(--accent)]"
              />
              <span>أفهم أنني لن أستطيع تغيير الخطة</span>
            </label>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                data-testid="setup-final-confirm-btn"
                disabled={!confirmedLock}
                onClick={handleFinalConfirm}
                className="btn-accent-glow inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>تأكيد والبدء</span>
              </button>

              <button
                type="button"
                data-testid="setup-back-btn"
                onClick={() => setShowConfirmModal(false)}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              >
                <ArrowRight className="h-4 w-4" />
                <span>رجوع</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
