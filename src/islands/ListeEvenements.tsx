/**
 * Liste complète des événements : filtres par type et lieu (puces défilables),
 * onglets « À venir » / « Passés ». En mode `realisations`, n'affiche que les passés avec bilan.
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { getPublishedEvents } from '../lib/api';
import type { AssoEvent, EventLocation, EventType } from '../lib/types';
import { EVENT_TYPES, LOCATIONS } from '../lib/types';
import { TYPE_META, typeLabel, lieuLabel } from '../lib/labels';
import { tr, type Lang } from '../i18n';
import { EventCard, EventCardSkeleton, EtatVide } from './ui/EventCard';

type Onglet = 'avenir' | 'passes';

export default function ListeEvenements({ mode = 'liste', lang = 'fr' }: { mode?: 'liste' | 'realisations'; lang?: Lang }) {
  const t = tr(lang).evenements;
  const [events, setEvents] = useState<AssoEvent[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>(mode === 'realisations' ? 'passes' : 'avenir');
  const [type, setType] = useState<EventType | 'tous'>('tous');
  const [lieu, setLieu] = useState<EventLocation | 'tous'>('tous');

  useEffect(() => {
    // Filtres passés dans l'URL (?type=ramadan&lieu=zemoura&onglet=passes)
    const p = new URLSearchParams(location.search);
    const ty = p.get('type') as EventType | null;
    const l = p.get('lieu') as EventLocation | null;
    if (ty && EVENT_TYPES.includes(ty)) setType(ty);
    if (l && LOCATIONS.includes(l)) setLieu(l);
    if (p.get('onglet') === 'passes') setOnglet('passes');
    getPublishedEvents().then(setEvents).catch(() => setErreur(true));
  }, []);

  const filtres = useMemo(() => {
    if (!events) return [];
    const now = Date.now();
    return events
      .filter((e) => (onglet === 'avenir' ? e.endAt >= now : e.endAt < now))
      .filter((e) => type === 'tous' || e.type === type)
      .filter((e) => lieu === 'tous' || e.location === lieu)
      .sort((a, b) => (onglet === 'avenir' ? a.startAt - b.startAt : b.startAt - a.startAt));
  }, [events, onglet, type, lieu]);

  const puce = (actif: boolean) =>
    `puce ${actif ? 'border-encre bg-encre text-white' : 'border-sable bg-white text-encre hover:border-encre/40'}`;

  return (
    <div>
      {mode === 'liste' && (
        <div role="tablist" aria-label={t.periode} class="mb-6 inline-flex rounded-full border border-sable bg-white p-1">
          {(
            [
              ['avenir', t.avenir],
              ['passes', t.passes],
            ] as const
          ).map(([k, label]) => (
            <button
              type="button"
              role="tab"
              aria-selected={onglet === k}
              onClick={() => setOnglet(k)}
              class={`min-h-11 rounded-full px-5 font-medium transition ${onglet === k ? 'bg-encre text-white' : 'text-encre/70'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div class="mb-2 text-sm text-encre/60" id="filtre-type">
        {t.type}
      </div>
      <div class="defile-x -mx-4 mb-3 px-4" role="group" aria-labelledby="filtre-type">
        <button type="button" class={puce(type === 'tous')} aria-pressed={type === 'tous'} onClick={() => setType('tous')}>
          {t.tous}
        </button>
        {EVENT_TYPES.map((ty) => (
          <button type="button" class={puce(type === ty)} aria-pressed={type === ty} onClick={() => setType(ty)}>
            <span class="me-2 inline-block h-2 w-2 rounded-full" style={{ background: TYPE_META[ty].color }} aria-hidden="true" />
            {typeLabel(ty, lang)}
          </button>
        ))}
      </div>
      <div class="mb-2 text-sm text-encre/60" id="filtre-lieu">
        {t.lieu}
      </div>
      <div class="defile-x -mx-4 mb-8 px-4" role="group" aria-labelledby="filtre-lieu">
        <button type="button" class={puce(lieu === 'tous')} aria-pressed={lieu === 'tous'} onClick={() => setLieu('tous')}>
          {t.partout}
        </button>
        {LOCATIONS.map((l) => (
          <button type="button" class={puce(lieu === l)} aria-pressed={lieu === l} onClick={() => setLieu(l)}>
            {lieuLabel(l, lang)}
          </button>
        ))}
      </div>

      {erreur && <EtatVide titre={t.connexion} texte={t.connexionTexte} />}

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {events === null && [0, 1, 2].map(() => <EventCardSkeleton />)}
        {filtres.map((ev) => (
          <EventCard ev={ev} bilan={onglet === 'passes'} lang={lang} />
        ))}
      </div>
      {events && filtres.length === 0 && <EtatVide titre={onglet === 'avenir' ? t.aucunAvenir : t.aucunPasse} texte={t.aucunTexte} />}
    </div>
  );
}
