/**
 * Ligne « dates du jour » de l'accueil :
 * date grégorienne + hégirienne, prochaine fête musulmane et prochain jour férié en France,
 * avec « Toutes les dates » dépliable. (Le prochain événement de l'association est dans le hero.)
 * Rendu uniquement dans le navigateur (la date doit être celle du visiteur, pas celle du build).
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { tr, type Lang } from '../i18n';
import { dateCourte, dateHijri, fetesMusulmanes, joursFeries } from '../lib/calendrier';

const Sep = () => (
  <span class="hidden text-encre/25 sm:inline" aria-hidden="true">
    |
  </span>
);

export default function Calendrier({ lang = 'fr' }: { lang?: Lang }) {
  const t = tr(lang).calendrier;
  const [maintenant, setMaintenant] = useState<Date | null>(null);

  useEffect(() => {
    setMaintenant(new Date());
    // Passage à minuit : on rafraîchit toutes les minutes
    const id = setInterval(() => setMaintenant(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const jour = maintenant?.toDateString();
  const musulmanes = useMemo(() => (maintenant ? fetesMusulmanes(maintenant) : []), [jour]);
  const feries = useMemo(() => (maintenant ? joursFeries(maintenant) : []), [jour]);

  // Squelette d'une ligne pendant le chargement (évite d'afficher la date du build)
  if (!maintenant) return <div class="squelette h-12 w-full" aria-hidden="true" />;

  const nomMusulman = (cle: string) => t.musulman[cle as keyof typeof t.musulman] ?? cle;
  const nomFerie = (cle: string) => t.feries[cle as keyof typeof t.feries] ?? cle;
  const fm = musulmanes[0];
  const jf = feries[0];

  return (
    <details class="carte group overflow-hidden">
      <summary class="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 text-sm sm:px-5 [&::-webkit-details-marker]:hidden">
        <span class="flex items-baseline gap-2">
          <span aria-hidden="true">📅</span>
          <span class="font-semibold text-encre first-letter:uppercase">{dateCourte(maintenant, lang)}</span>
          <span class="text-encre/60">{dateHijri(maintenant, lang)}</span>
        </span>
        {fm && (
          <>
            <Sep />
            <span class="flex items-baseline gap-1.5" title={`${t.prochaineFete} · ${dateCourte(fm.date, lang)}`}>
              <span aria-hidden="true">🌙</span>
              <span class="text-encre">{nomMusulman(fm.cle)}</span>
              <span class="font-semibold text-terracotta-fonce">{t.dans(fm.jours)}</span>
            </span>
          </>
        )}
        {jf && (
          <>
            <Sep />
            <span class="flex items-baseline gap-1.5" title={`${t.prochainFerie} · ${dateCourte(jf.date, lang)}`}>
              <span aria-hidden="true">🇫🇷</span>
              <span class="text-encre">{nomFerie(jf.cle)}</span>
              <span class="font-semibold text-terracotta-fonce">{t.dans(jf.jours)}</span>
            </span>
          </>
        )}
        <span class="ms-auto flex min-h-8 items-center gap-1 font-medium text-encre/70 group-hover:text-encre">
          {t.voirTout}
          <span aria-hidden="true" class="transition group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>

      {/* Toutes les dates à venir */}
      <div class="border-t border-sable/70">
        <div class="grid grid-cols-1 gap-6 px-4 py-4 sm:grid-cols-2 sm:px-5">
          <Liste titre={t.fetesMusulmanes} items={musulmanes.map((f) => [nomMusulman(f.cle), `${dateCourte(f.date, lang)} · ${dateHijri(f.date, lang)}`, t.dans(f.jours)])} />
          <Liste titre={t.joursFeries} items={feries.map((f) => [nomFerie(f.cle), dateCourte(f.date, lang), t.dans(f.jours)])} />
        </div>
        <p class="px-4 pb-4 text-xs text-encre/50 sm:px-5">{t.note}</p>
      </div>
    </details>
  );
}

function Liste({ titre, items }: { titre: string; items: [string, string, string][] }) {
  return (
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-encre/55">{titre}</p>
      <ul class="divide-y divide-sable/60 text-sm">
        {items.map(([nom, date, compte]) => (
          <li class="flex items-baseline justify-between gap-3 py-2">
            <span class="min-w-0">
              <span class="block text-encre">{nom}</span>
              <span class="block text-xs text-encre/55">{date}</span>
            </span>
            <span class="shrink-0 text-xs font-medium text-terracotta-fonce">{compte}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
