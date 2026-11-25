import { useEffect, useState } from 'react';
import { Check, Heart, Share2 } from 'lucide-react';

interface ShareCharityCardProps {
  variant?: 'setup' | 'drawer';
}

const SHARE_MESSAGE = 'تطبيق وِرد مُذكِّر لحفظ القرآن الكريم، شاركه صدقةً جارية';

export function ShareCharityCard({ variant = 'setup' }: ShareCharityCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'وِرْد مُدَّكِر',
          text: SHARE_MESSAGE,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    const fullText = shareUrl ? `${SHARE_MESSAGE}\n${shareUrl}` : SHARE_MESSAGE;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = fullText;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
    } catch {
      setCopied(true);
    }
  };

  const isDrawer = variant === 'drawer';

  return (
    <section
      data-testid={`share-charity-card-${variant}`}
      className={`rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] ${
        isDrawer ? 'p-4' : 'mt-6 p-5 md:p-6'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <Heart className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">شارك الأجر</h2>
        </div>

        <button
          type="button"
          data-testid={`share-app-btn-${variant}`}
          onClick={handleShare}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          <span>{copied ? 'تم النسخ' : 'شارك التطبيق'}</span>
        </button>
      </div>

      <div
        className={`mt-3 space-y-2 text-right leading-relaxed ${
          isDrawer ? 'text-xs' : 'text-xs sm:text-sm'
        }`}
      >
        <p className="text-[var(--text-primary)]">
          هذا التطبيق وقفٌ لله تعالى. نسأل الله أن يجعله صدقةً جاريةً عن صاحبه، وعن المسلمين والمسلمات، الأحياء منهم والأموات، إلى يوم الدين.
        </p>
        <p className="font-medium text-[var(--accent)]">فإن نفعك فشاركه مع من تحب.</p>
        <div className="space-y-1.5 border-t border-[var(--border-hairline)] pt-2.5 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          <p className="font-display">
            «مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ» (رواه مسلم)
          </p>
          <p className="font-display">
            «رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ» (إبراهيم: 41)
          </p>
          <p className="font-display">«أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ»</p>
        </div>
      </div>
    </section>
  );
}
