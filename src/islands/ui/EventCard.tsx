/** Carte événement (partagée par plusieurs îlots) */
import type { AssoEvent } from '../../lib/types';
import type { Lang } from '../../i18n';
import { tr } from '../../i18n';
import { TYPE_META, typeLabel, lieuLabel, formatDate, eventUrl, cld } from '../../lib/labels';
import { titreEv, descEv, bilanEv, attrs } from '../../lib/contenu';
import { Barre } from './Barre';
import { Illustration } from './Illustration';

interface Props {
  ev: AssoEvent;
  /** Affiche le bilan (page Réalisations) */
  bilan?: boolean;
  lang?: Lang;
}

export function EventCard({ ev, bilan = false, lang = 'fr' }: Props) {
  const meta = TYPE_META[ev.type];
  const titre = titreEv(ev, lang);
  const sous = lang === 'fr' ? ev.titleAr : titre.lang === 'ar' ? ev.title : undefined;
  const texte = bilan && ev.report?.text ? bilanEv(ev, lang) : descEv(ev, lang);
  return (
    <article class="carte carte-survol group relative flex h-full flex-col overflow-hidden">
      <div class="relative aspect-[16/10] overflow-hidden bg-pierre">
        {ev.coverImage ? (
          <img
            src={cld(ev.coverImage, 640)}
            alt={`${tr(lang).evenements.photo} : ${titre.texte}`}
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
            class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <Illustration type={ev.type} />
        )}
      </div>
      <div class="flex flex-1 flex-col gap-2 p-5">
        <p class="flex items-center gap-2 text-sm text-encre/60">
          <span class="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
          {typeLabel(ev.type, lang)} · {formatDate(ev.startAt, lang)} · {lieuLabel(ev.location, lang)}
        </p>
        <h3 class="text-xl font-medium" {...attrs(titre)}>
          <a href={eventUrl(ev.slug, lang)} class="after:absolute after:inset-0 focus-visible:outline-none">
            {titre.texte}
          </a>
        </h3>
        {sous && (
          <p class="text-sm text-encre/50" lang={lang === 'fr' ? 'ar' : 'fr'} dir={lang === 'fr' ? 'rtl' : 'ltr'}>
            {sous}
          </p>
        )}
        <p class={`text-[15px] text-encre/70 ${bilan ? 'line-clamp-3' : 'line-clamp-2'}`} {...attrs(texte)}>
          {texte.texte}
        </p>
        {ev.goalAmount ? (
          <div class="mt-auto pt-2">
            <Barre actuel={ev.raisedAmount ?? 0} objectif={ev.goalAmount} compact lang={lang} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Squelette de chargement */
export function EventCardSkeleton() {
  return (
    <div class="carte overflow-hidden" aria-hidden="true">
      <div class="squelette aspect-[16/10] rounded-none" />
      <div class="space-y-3 p-4">
        <div class="squelette h-4 w-1/2" />
        <div class="squelette h-6 w-3/4" />
        <div class="squelette h-4 w-full" />
      </div>
    </div>
  );
}

/** État vide soigné */
export function EtatVide({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div class="carte flex flex-col items-center gap-3 px-6 py-10 text-center">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <path d="M14 50 L30 30 L38 40 L46 28 L58 50 Z" fill="none" stroke="#9C4319" stroke-width="1.5" stroke-linejoin="round" />
        <circle cx="50" cy="18" r="5" fill="none" stroke="#F4A300" stroke-width="1.5" />
      </svg>
      <h3 class="text-xl font-medium">{titre}</h3>
      <p class="max-w-md text-encre/75">{texte}</p>
    </div>
  );
}
