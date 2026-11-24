import { BookOpenCheck } from 'lucide-react';
import { QURANIC_DUAS } from '../data/duas';
import { HeroCornerArabesque } from './IslamicOrnament';

interface DuasScreenProps {
  verifiedDuas: Record<string, boolean>;
  onToggleVerified: (duaId: string) => void;
}

export function DuasScreen({ verifiedDuas, onToggleVerified }: DuasScreenProps) {
  const verifiedCount = QURANIC_DUAS.filter((d) => verifiedDuas[d.id]).length;

  return (
    <div className="space-y-6">
      <section className="card-hero rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <HeroCornerArabesque className="absolute -left-6 -top-6 h-44 w-44 text-[var(--accent)] opacity-[0.20]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--text-muted)]">
              أدعية مأثورة من كتاب الله مع رقم السورة والآية
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
              أدعية من القرآن الكريم
            </h1>
          </div>
          <span className="text-sm font-medium tabular-nums text-[var(--accent)]">
            تم التحقق: {verifiedCount} / {QURANIC_DUAS.length}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[var(--gold-soft)]/70 p-3.5 text-xs text-[var(--text-primary)]">
          <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
          <p className="leading-relaxed">
            تنبيه منهجي: يُرجى مطابقة كل دعاء والتحقق من ضبطه وتشكيله مباشرة من مصحفك المعتمد
            (تحقق من المصحف) قبل الاعتماد عليه أو ترديده.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {QURANIC_DUAS.map((dua) => {
          const isVerified = Boolean(verifiedDuas[dua.id]);
          return (
            <article
              key={dua.id}
              className={`card-interactive flex flex-col justify-between rounded-2xl border p-5 ${
                isVerified
                  ? 'border-[var(--accent)]/45 bg-[var(--accent-soft)]/25'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <span>
                    {dua.surahName} · آية {dua.ayahRef}
                  </span>
                  <span className="tabular-nums">({dua.id})</span>
                </div>

                <p className="font-display mt-3 text-xl leading-loose text-[var(--text-primary)]">
                  «{dua.text}»
                </p>

                <p className="mt-2 text-xs text-[var(--text-secondary)]">{dua.occasion}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--border-hairline)] pt-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={() => onToggleVerified(dua.id)}
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <span>تحقق من المصحف</span>
                </label>

                <span className="text-[11px] text-[var(--text-muted)]">
                  {isVerified ? 'تمت المطابقة' : 'بانتظار المطابقة'}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
