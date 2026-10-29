/**
 * Bandeau calendrier de l'accueil :
 * date du jour (grégorienne + hégirienne) et compte à rebours vers
 * le prochain événement de l'association, la prochaine fête musulmane et le prochain jour férié en France.
 * Rendu uniquement dans le navigateur (la date doit être celle du visiteur, pas celle du build).
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { tr, type Lang } from '../i18n';
import { getPublishedEvents } from '../lib/api';
import { dateCourte, dateHijri, dateLongue, fetesMusulmanes, joursEntre, joursFeries } from '../lib/calendrier';
import { eventUrl } from '../lib/labels';
import type { AssoEvent } from '../lib/types';

export default function Calendrier({ lang = 'fr' }: { lang?: Lang }) {
  const t = tr(lang).calendrier;
  const [maintenant, setMaintenant] = useState<Date | null>(null);
  const [evt, setEvt] = useState<AssoEvent | null | undefined>(undefined);

  useEffect(() => {
    setMaintenant(new Date());
    // Passage à minuit : on rafraîchit toutes les minutes
    const id = setInterval(() => setMaintenant(new Date()), 60_000);
    getPublishedEvents()
      .then((all) => setEvt(all.find((e) => e.endAt >= Date.now()) ?? null))
      .catch(() => setEvt(null));
    return () => clearInterval(id);
  }, []);

  const jour = maintenant?.toDateString();
  const musulmanes = useMemo(() => (maintenant ? fetesMusulmanes(maintenant) : []), [jour]);
  const feries = useMemo(() => (maintenant ? joursFeries(maintenant) : []), [jour]);

  // Squelette pendant le chargement (évite d'afficher la date du build)
  if (!maintenant) return <div class="squelette h-40 w-full" aria-hidden="true" />;

  const nomMusulman = (cle: string) => t.musulman[cle as keyof typeof t.musulman] ?? cle;
  const nomFerie = (cle: string) => t.feries[cle as keyof typeof t.feries] ?? cle;
  const fm = musulmanes[0];
  const jf = feries[0];
  const evtJours = evt ? joursEntre(maintenant, new Date(evt.startAt)) : 0;
  const evtTitre = evt ? (lang === 'ar' && evt.titleAr ? evt.titleAr : evt.title) : '';

  return (
    <div class="carte overflow-hidden">
      {/* Aujourd'hui */}
      <div class="flex flex-col gap-1 border-b border-sable/70 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:px-6">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta-fonce">{t.aujourdhui}</p>
        <p class="font-titre text-lg text-encre first-letter:uppercase sm:text-xl">
          {dateLongue(maintenant, lang)}
          <span class="mx-2 text-encre/30" aria-hidden="true">
            ·
          </span>
          <span class="text-encre/70">{dateHijri(maintenant, lang)}</span>
        </p>
      </div>

      {/* Les trois prochains rendez-vous */}
      <div class="grid grid-cols-1 divide-y divide-sable/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
        <Case
          titre={t.prochainAsso}
          nom={evt === undefined ? '…' : evt ? evtTitre : t.aucun}
          date={evt ? dateCourte(new Date(evt.startAt), lang) : ''}
          compte={evt ? (evtJours <= 0 ? t.enCours : t.dans(evtJours)) : ''}
          href={evt ? eventUrl(evt.slug, lang) : undefined}
        />
        {fm && <Case titre={t.prochaineFete} nom={nomMusulman(fm.cle)} date={`${dateCourte(fm.date, lang)} · ${dateHijri(fm.date, lang)}`} compte={t.dans(fm.jours)} />}
        {jf && <Case titre={t.prochainFerie} nom={nomFerie(jf.cle)} date={dateCourte(jf.date, lang)} compte={t.dans(jf.jours)} />}
      </div>

      {/* Toutes les dates à venir */}
      <details class="group border-t border-sable/70">
        <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-medium text-encre/75 hover:text-encre sm:px-6">
          {t.voirTout}
          <span aria-hidden="true" class="transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div class="grid grid-cols-1 gap-6 px-5 pb-5 sm:grid-cols-2 sm:px-6">
          <Liste titre={t.fetesMusulmanes} items={musulmanes.map((f) => [nomMusulman(f.cle), `${dateCourte(f.date, lang)} · ${dateHijri(f.date, lang)}`, t.dans(f.jours)])} />
          <Liste titre={t.joursFeries} items={feries.map((f) => [nomFerie(f.cle), dateCourte(f.date, lang), t.dans(f.jours)])} />
        </div>
        <p class="px-5 pb-4 text-xs text-encre/50 sm:px-6">{t.note}</p>
      </details>
    </div>
  );
}

function Case({ titre, nom, date, compte, href }: { titre: string; nom: string; date: string; compte: string; href?: string }) {
  const contenu = (
    <>
      <p class="text-xs text-encre/55">{titre}</p>
      <p class="mt-1 font-titre text-lg leading-snug text-encre">{nom}</p>
      {date && <p class="mt-0.5 text-sm text-encre/60">{date}</p>}
      {compte && <p class="mt-2 text-sm font-semibold text-terracotta-fonce">{compte}</p>}
    </>
  );
  return href ? (
    <a href={href} class="block px-5 py-4 transition hover:bg-pierre/60 sm:px-6">
      {contenu}
    </a>
  ) : (
    <div class="px-5 py-4 sm:px-6">{contenu}</div>
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
