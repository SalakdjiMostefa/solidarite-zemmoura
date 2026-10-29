/** Barre de progression d'une collecte */
import { formatEuro } from '../../lib/labels';
import { tr, type Lang } from '../../i18n';

export function Barre({ actuel, objectif, compact = false, lang = 'fr' }: { actuel: number; objectif: number; compact?: boolean; lang?: Lang }) {
  const t = tr(lang).evenements;
  const pct = objectif > 0 ? Math.min(100, Math.round((actuel / objectif) * 100)) : 0;
  return (
    <div>
      <div
        class={`overflow-hidden rounded-full bg-pierre ${compact ? 'h-1.5' : 'h-2'}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct} %`}
      >
        <div class="h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} />
      </div>
      <p class={`mt-1.5 flex justify-between gap-2 ${compact ? 'text-sm' : 'text-base'}`}>
        <span>
          <strong class="font-semibold text-encre">{formatEuro(actuel)}</strong> {t.collectes}
        </span>
        <span class="text-encre/70">
          {pct} % {t.de} {formatEuro(objectif)}
        </span>
      </p>
    </div>
  );
}
