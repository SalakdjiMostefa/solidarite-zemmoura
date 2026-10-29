/** Admin — liste des événements : recherche, filtre, créer, modifier, dupliquer, masquer, supprimer */
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { AdminProfile, AssoEvent } from '../../lib/types';
import { TYPE_META, formatDate, eventUrl, whatsappShare } from '../../lib/labels';
import { toast } from '../../lib/toast';
import { deleteEvent, duplicateInput, listEvents, patchEvent, type EventInput } from './store';
import FormEvenement from './FormEvenement';

type Filtre = 'tous' | 'avenir' | 'passes' | 'brouillons';

export default function EvenementsAdmin({ profil }: { profil: AdminProfile }) {
  const [events, setEvents] = useState<AssoEvent[] | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');
  // null = liste ; { id?, initial } = formulaire ouvert
  const [edition, setEdition] = useState<{ id?: string; initial?: EventInput } | null>(null);

  const charger = () => listEvents().then(setEvents).catch(() => toast('Chargement impossible', 'error'));
  useEffect(() => {
    charger();
  }, []);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const now = Date.now();
    return (events ?? [])
      .filter((e) => !q || e.title.toLowerCase().includes(q) || (e.donationRef ?? '').toLowerCase().includes(q))
      .filter((e) =>
        filtre === 'avenir' ? e.endAt >= now : filtre === 'passes' ? e.endAt < now : filtre === 'brouillons' ? e.status === 'draft' : true,
      );
  }, [events, recherche, filtre]);

  if (edition)
    return (
      <FormEvenement
        id={edition.id}
        initial={edition.initial}
        profil={profil}
        onFermer={(modifie) => {
          setEdition(null);
          if (modifie) charger();
        }}
      />
    );

  return (
    <section>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-medium">Événements</h1>
        <button type="button" class="btn btn-don" onClick={() => setEdition({})}>
          + Nouvel événement
        </button>
      </div>

      <input
        type="search"
        class="champ mb-3"
        placeholder="Rechercher (titre, référence…)"
        aria-label="Rechercher un événement"
        value={recherche}
        onInput={(e) => setRecherche((e.target as HTMLInputElement).value)}
      />
      <div class="defile-x mb-4">
        {(
          [
            ['tous', 'Tous'],
            ['avenir', 'À venir'],
            ['passes', 'Passés'],
            ['brouillons', 'Brouillons'],
          ] as const
        ).map(([k, l]) => (
          <button
            type="button"
            aria-pressed={filtre === k}
            onClick={() => setFiltre(k)}
            class={`puce ${filtre === k ? 'border-emerald-fonce bg-emerald-fonce text-white' : 'border-sable bg-white'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {events === null && <p class="py-10 text-center text-encre/60">Chargement…</p>}
      {events && liste.length === 0 && <p class="carte p-6 text-center text-encre/70">Aucun événement.</p>}

      <ul class="space-y-3">
        {liste.map((ev) => {
          const meta = TYPE_META[ev.type];
          const lien = new URL(eventUrl(ev.slug), location.origin).href;
          return (
            <li class={`carte overflow-hidden ${ev.hidden ? 'opacity-60' : ''}`}>
              <div class="flex gap-3 p-4">
                <span class="mt-1 h-10 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-encre/60">
                    {meta.label} · {formatDate(ev.startAt)}
                  </p>
                  <p class="truncate text-lg font-bold">{ev.title}</p>
                  <p class="mt-1 flex flex-wrap gap-1.5 text-xs">
                    <span class={`rounded-full px-2 py-0.5 font-semibold ${ev.status === 'published' ? 'bg-emerald/15 text-emerald-fonce' : 'bg-sable'}`}>
                      {ev.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                    {ev.hidden && <span class="rounded-full bg-encre/10 px-2 py-0.5 font-semibold">Masqué</span>}
                    {ev.donationRef && <span class="rounded-full bg-creme px-2 py-0.5 font-mono">{ev.donationRef}</span>}
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-3 border-t border-sable text-sm font-semibold sm:grid-cols-5">
                <button type="button" class="min-h-12 hover:bg-creme" onClick={() => setEdition({ id: ev.id, initial: ev })}>
                  ✏️ Modifier
                </button>
                <button
                  type="button"
                  class="min-h-12 hover:bg-creme"
                  onClick={() => {
                    setEdition({ initial: duplicateInput(ev) });
                    toast('Copie créée : vérifiez les dates puis enregistrez');
                  }}
                >
                  📄 Dupliquer
                </button>
                <button
                  type="button"
                  class="min-h-12 hover:bg-creme"
                  onClick={async () => {
                    await patchEvent(ev.id, { hidden: !ev.hidden });
                    toast(ev.hidden ? 'Événement de nouveau visible' : 'Événement masqué');
                    charger();
                  }}
                >
                  {ev.hidden ? '👁️ Afficher' : '🙈 Masquer'}
                </button>
                {ev.status === 'published' && (
                  <a class="flex min-h-12 items-center justify-center hover:bg-creme" href={whatsappShare(`${ev.title}\n${lien}`)} target="_blank" rel="noopener">
                    💬 WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  class="min-h-12 text-grenade-fonce hover:bg-grenade/10"
                  onClick={async () => {
                    if (!confirm(`Supprimer définitivement « ${ev.title} » ?\nCette action est irréversible.`)) return;
                    await deleteEvent(ev.id);
                    toast('Événement supprimé');
                    charger();
                  }}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
