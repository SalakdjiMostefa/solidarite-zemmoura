/** Accueil : les 3 prochains événements (le compte à rebours est dans le bandeau calendrier) */
import { useEffect, useState } from 'preact/hooks';
import { getPublishedEvents } from '../lib/api';
import type { AssoEvent } from '../lib/types';
import { tr, type Lang } from '../i18n';
import { EventCard, EventCardSkeleton, EtatVide } from './ui/EventCard';

export default function ProchainsEvenements({ lang = 'fr' }: { lang?: Lang }) {
  const t = tr(lang).evenements;
  const [events, setEvents] = useState<AssoEvent[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    getPublishedEvents()
      .then((all) => setEvents(all.filter((e) => e.endAt >= Date.now()).slice(0, 3)))
      .catch(() => setErreur(true));
  }, []);

  if (erreur) return <EtatVide titre={t.connexion} texte={t.connexionTexte} />;

  return (
    <div>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events === null &&
          [0, 1, 2].map((i) => (
            <div class={i === 2 ? 'hidden lg:block' : ''}>
              <EventCardSkeleton />
            </div>
          ))}
        {events?.map((ev) => <EventCard ev={ev} lang={lang} />)}
      </div>
      {events?.length === 0 && <EtatVide titre={t.rienAccueil} texte={t.rienAccueilTexte} />}
    </div>
  );
}
