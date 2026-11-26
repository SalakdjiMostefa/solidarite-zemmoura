/**
 * Accueil — carte « Prochain rendez-vous » dans la bannière (hero) :
 * le prochain événement publié, mis en avant pour être vu en premier.
 * Rien d'affiché s'il n'y a aucun événement à venir.
 */
import { useEffect, useState } from 'preact/hooks';
import { getPublishedEvents } from '../lib/api';
import { joursEntre } from '../lib/calendrier';
import { attrs, titreEv } from '../lib/contenu';
import { cld, eventUrl, formatDate, lieuLabel } from '../lib/labels';
import type { AssoEvent } from '../lib/types';
import { tr, type Lang } from '../i18n';
import { Illustration } from './ui/Illustration';

export default function ProchainEvenementHero({ lang = 'fr' }: { lang?: Lang }) {
  const T = tr(lang);
  const [ev, setEv] = useState<AssoEvent | null | undefined>(undefined);

  useEffect(() => {
    getPublishedEvents()
      .then((all) => setEv(all.find((e) => e.endAt >= Date.now()) ?? null))
      .catch(() => setEv(null));
  }, []);

  if (ev === null) return null;

  // Squelette de même taille pendant le chargement (pas de saut de page)
  if (ev === undefined)
    return <div class="squelette mx-auto h-[150px] w-full max-w-xl sm:h-[148px] lg:h-[400px] lg:max-w-none" aria-hidden="true" />;

  const titre = titreEv(ev, lang);
  const jours = joursEntre(new Date(), new Date(ev.startAt));
  const compte = jours <= 0 ? (Date.now() >= ev.startAt ? T.accueil.enCours : T.calendrier.dans(0)) : T.calendrier.dans(jours);

  return (
    <a
      href={eventUrl(ev.slug, lang)}
      class="carte carte-survol group mx-auto flex max-w-xl overflow-hidden text-start lg:max-w-none lg:flex-col"
      aria-label={`${T.accueil.prochainRdv} : ${titre.texte}`}
    >
      <div class="w-28 shrink-0 overflow-hidden bg-pierre sm:w-48 lg:aspect-[16/10] lg:w-full">
        {ev.coverImage ? (
          <img src={cld(ev.coverImage, 500)} alt="" width={384} height={296} class="h-full w-full object-cover" />
        ) : (
          <Illustration type={ev.type} />
        )}
      </div>
      <div class="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:p-5 lg:p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta-fonce">{T.accueil.prochainRdv}</p>
        <p class="font-titre text-lg leading-snug sm:text-2xl" {...attrs(titre)}>
          {titre.texte}
        </p>
        <p class="text-sm text-encre/65 first-letter:uppercase">
          {formatDate(ev.startAt, lang)} · {lieuLabel(ev.location, lang)}
        </p>
        <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="rounded-full bg-terracotta/10 px-3 py-1 text-sm font-semibold text-terracotta-fonce">{compte}</span>
          <span class="text-sm font-medium text-encre/75 group-hover:text-encre group-hover:underline">
            {T.accueil.voirEvenement} {T.commun.fleche}
          </span>
        </div>
      </div>
    </a>
  );
}
