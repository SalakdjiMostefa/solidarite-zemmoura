/**
 * Page Réalisations — « Ce que nous avons accompli ».
 * Une section par année (de la plus récente à la plus ancienne) :
 *   grande photo de l'année → bilan court (actions menées · familles aidées) → liste des réussites.
 * Chaque réussite affiche son résultat en grand (champ « Résultat obtenu »), sinon le titre.
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { getPublishedEvents } from '../lib/api';
import type { AssoEvent } from '../lib/types';
import { cld, eventUrl, lieuLabel, typeLabel } from '../lib/labels';
import { titreEv, attrs } from '../lib/contenu';
import { tr, LOCALE, type Lang } from '../i18n';
import { Illustration } from './ui/Illustration';

interface Annee {
  annee: number;
  actions: AssoEvent[];
  familles: number;
  photo?: string;
}

/** Grande photo de l'année : celle choisie dans l'admin, sinon la première couverture, sinon une photo de bilan */
function photoDeLAnnee(actions: AssoEvent[]): string | undefined {
  return (
    actions.find((e) => e.yearCover && e.coverImage)?.coverImage ??
    actions.find((e) => e.coverImage)?.coverImage ??
    actions.find((e) => e.report?.photos?.length)?.report?.photos[0]
  );
}

export default function Accomplissements({ lang = 'fr' }: { lang?: Lang }) {
  const t = tr(lang).realisations;
  const [events, setEvents] = useState<AssoEvent[] | null>(null);

  useEffect(() => {
    getPublishedEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const annees = useMemo<Annee[]>(() => {
    if (!events) return [];
    const now = Date.now();
    const groupes = new Map<number, AssoEvent[]>();
    events
      .filter((e) => e.endAt < now)
      .sort((a, b) => b.startAt - a.startAt)
      .forEach((e) => {
        const a = new Date(e.startAt).getFullYear();
        groupes.set(a, [...(groupes.get(a) ?? []), e]);
      });
    return [...groupes.entries()].map(([annee, actions]) => ({
      annee,
      actions,
      familles: actions.reduce((s, e) => s + (e.families ?? 0), 0),
      photo: photoDeLAnnee(actions),
    }));
  }, [events]);

  const mois = new Intl.DateTimeFormat(LOCALE[lang], { month: 'long' });

  if (events === null)
    return (
      <div class="space-y-4" aria-hidden="true">
        <div class="squelette aspect-[16/6] w-full" />
        <div class="squelette h-6 w-2/3" />
        <div class="squelette h-6 w-1/2" />
      </div>
    );

  if (annees.length === 0) return <p class="text-encre/60">{t.rien}</p>;

  return (
    <div class="space-y-16">
      {annees.map(({ annee, actions, familles, photo }) => (
        <section aria-labelledby={`annee-${annee}`}>
          {/* Grande photo de l'année, l'année posée dessus */}
          <div class="relative aspect-[16/9] overflow-hidden rounded-xl2 bg-pierre sm:aspect-[16/6]">
            {photo ? (
              <img
                src={cld(photo, 1400)}
                alt={t.photoAnnee(annee)}
                loading="lazy"
                decoding="async"
                width={1400}
                height={525}
                class="h-full w-full object-cover"
              />
            ) : (
              <Illustration type={actions[0].type} />
            )}
            <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-encre/55 to-transparent" aria-hidden="true" />
            <h3 id={`annee-${annee}`} class="absolute bottom-3 start-5 font-titre text-5xl text-white sm:bottom-5 sm:start-7 sm:text-6xl">
              {annee}
            </h3>
          </div>

          {/* Bilan de l'année, en une ligne sobre */}
          <p class="mt-4 text-encre/70">
            {t.actionsMenees(actions.length)}
            {familles > 0 && <> · {t.famillesAidees(familles)}</>}
          </p>

          {/* Les réussites de l'année */}
          <ul class="mt-3 divide-y divide-sable border-y border-sable">
            {actions.map((ev) => {
              const titre = titreEv(ev, lang);
              const resultat = lang === 'ar' && ev.resultAr?.trim() ? ev.resultAr : ev.result?.trim();
              const principal = resultat ? { texte: resultat, lang: lang === 'ar' && ev.resultAr?.trim() ? 'ar' : ('fr' as Lang) } : titre;
              const details = [resultat ? titre.texte : typeLabel(ev.type, lang), mois.format(ev.startAt), lieuLabel(ev.location, lang)];
              return (
                <li>
                  <a href={eventUrl(ev.slug, lang)} class="group flex items-start gap-3 py-4 sm:gap-4">
                    <svg viewBox="0 0 24 24" class="mt-1 h-6 w-6 shrink-0 text-emerald" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                      <circle cx="12" cy="12" r="9.5" />
                      <path d="M7.5 12.5l3 3 6-6.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span class="min-w-0 flex-1">
                      <span class="block font-titre text-xl leading-snug group-hover:underline sm:text-2xl" {...attrs(principal as { texte: string; lang: Lang })}>
                        {principal.texte}
                      </span>
                      <span class="mt-0.5 block text-sm text-encre/60">{details.join(' · ')}</span>
                    </span>
                    <span class="mt-1 text-encre/30 transition group-hover:text-encre/70 rtl:rotate-180" aria-hidden="true">
                      →
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
