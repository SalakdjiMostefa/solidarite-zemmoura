/** Admin — formulaire de création / modification d'un événement */
import { useState } from 'preact/hooks';
import type { AdminProfile, EventLocation, EventType } from '../../lib/types';
import { EVENT_TYPES, LOCATIONS } from '../../lib/types';
import { TYPE_META, LOCATION_LABEL, autoDonationRef, eventUrl, whatsappShare } from '../../lib/labels';
import { toast } from '../../lib/toast';
import { saveEvent, type EventInput } from './store';
import Photos from './Photos';

/** ms → valeur d'un <input type="datetime-local"> (heure locale) */
const versInput = (ms: number) => {
  const d = new Date(ms);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const depuisInput = (v: string) => new Date(v).getTime();

function vide(): EventInput {
  const debut = new Date();
  debut.setDate(debut.getDate() + 7);
  debut.setHours(18, 0, 0, 0);
  return {
    title: '',
    titleAr: '',
    type: 'action-zemoura',
    startAt: debut.getTime(),
    endAt: debut.getTime() + 3 * 3600_000,
    location: 'zemoura',
    address: '',
    description: '',
    descriptionAr: '',
    coverImage: '',
    gallery: [],
    goalAmount: undefined,
    raisedAmount: undefined,
    donationRef: '',
    volunteersNeeded: false,
    volunteersCount: undefined,
    report: { text: '', photos: [] },
    status: 'draft',
    hidden: false,
  };
}

interface Props {
  id?: string;
  initial?: EventInput;
  profil: AdminProfile;
  onFermer: (modifie: boolean) => void;
}

export default function FormEvenement({ id, initial, profil, onFermer }: Props) {
  const [v, setV] = useState<EventInput>(() => ({ ...vide(), ...initial, report: initial?.report ?? { text: '', photos: [] } }));
  const [envoi, setEnvoi] = useState(false);
  const [publie, setPublie] = useState<{ slug: string; title: string } | null>(null);

  const maj = <K extends keyof EventInput>(k: K, val: EventInput[K]) => setV((x) => ({ ...x, [k]: val }));
  const nombre = (s: string) => (s.trim() === '' ? undefined : Math.max(0, Number(s.replace(',', '.')) || 0));
  const passe = v.endAt < Date.now();

  async function enregistrer(e: Event) {
    e.preventDefault();
    if (v.endAt < v.startAt) return toast('La date de fin doit être après la date de début.', 'error');
    setEnvoi(true);
    try {
      // Construction explicite (on n'envoie que les champs du formulaire)
      const input: EventInput = {
        title: v.title.trim(),
        titleAr: v.titleAr?.trim() || undefined,
        type: v.type,
        startAt: v.startAt,
        endAt: v.endAt,
        location: v.location,
        address: v.address?.trim() || undefined,
        description: v.description.trim(),
        descriptionAr: v.descriptionAr?.trim() || undefined,
        coverImage: v.coverImage || undefined,
        coverCredit: v.coverCredit?.trim() || undefined,
        gallery: v.gallery,
        goalAmount: v.goalAmount,
        raisedAmount: v.raisedAmount,
        donationRef: v.donationRef?.trim().toUpperCase() || undefined,
        volunteersNeeded: v.volunteersNeeded,
        volunteersCount: v.volunteersNeeded ? v.volunteersCount : undefined,
        report: v.report?.text || v.report?.photos.length ? v.report : undefined,
        status: v.status,
        hidden: v.hidden ?? false,
      };
      const ev = await saveEvent(input, profil.uid, id);
      toast(id ? 'Modifications enregistrées' : 'Événement créé');
      if (ev.status === 'published') setPublie({ slug: ev.slug, title: ev.title });
      else onFermer(true);
    } catch (err) {
      console.error(err);
      toast("Échec de l'enregistrement", 'error');
    } finally {
      setEnvoi(false);
    }
  }

  // Écran de succès après publication : partage WhatsApp
  if (publie) {
    const lien = new URL(eventUrl(publie.slug), location.origin).href;
    return (
      <div class="carte mx-auto max-w-md space-y-4 p-6 text-center">
        <p class="text-5xl" aria-hidden="true">
          🎉
        </p>
        <h2 class="text-2xl font-medium">C'est en ligne !</h2>
        <p class="break-all text-sm text-encre/70">{lien}</p>
        <a class="btn btn-whatsapp w-full text-lg" href={whatsappShare(`${publie.title} — Solidarité Zemmoura\n${lien}`)} target="_blank" rel="noopener">
          Partager sur WhatsApp
        </a>
        <a class="btn btn-secondaire w-full" href={lien} target="_blank" rel="noopener">
          Voir la page
        </a>
        <button type="button" class="min-h-11 w-full font-semibold text-emerald-fonce underline" onClick={() => onFermer(true)}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enregistrer} class="space-y-5">
      <div class="flex items-center justify-between gap-3">
        <button type="button" class="min-h-11 font-semibold text-emerald-fonce" onClick={() => onFermer(false)}>
          ← Retour
        </button>
        <h1 class="text-xl font-medium">{id ? "Modifier l'événement" : 'Nouvel événement'}</h1>
      </div>

      <fieldset class="carte space-y-4 p-4 sm:p-5">
        <legend class="sr-only">Informations principales</legend>
        <div>
          <label class="etiquette" for="f-titre">
            Titre (français) *
          </label>
          <input id="f-titre" class="champ" required maxLength={120} value={v.title} onInput={(e) => maj('title', (e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label class="etiquette" for="f-titre-ar">
            Titre en arabe (facultatif)
          </label>
          <input
            id="f-titre-ar"
            class="champ ar"
            dir="rtl"
            lang="ar"
            maxLength={120}
            value={v.titleAr}
            onInput={(e) => maj('titleAr', (e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <span class="etiquette">Type *</span>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {EVENT_TYPES.map((t) => (
              <label
                class={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-3 text-sm font-semibold ${
                  v.type === t ? 'border-emerald-fonce bg-emerald/5' : 'border-sable bg-white'
                }`}
              >
                <input type="radio" name="type" class="sr-only" checked={v.type === t} onChange={() => maj('type', t as EventType)} />
                <span class="h-3 w-3 shrink-0 rounded-full" style={{ background: TYPE_META[t].color }} aria-hidden="true" />
                {TYPE_META[t].label}
              </label>
            ))}
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="etiquette" for="f-debut">
              Début *
            </label>
            <input
              id="f-debut"
              type="datetime-local"
              class="champ"
              required
              value={versInput(v.startAt)}
              onInput={(e) => {
                const ms = depuisInput((e.target as HTMLInputElement).value);
                if (!isNaN(ms)) setV((x) => ({ ...x, startAt: ms, endAt: x.endAt < ms ? ms + 3 * 3600_000 : x.endAt }));
              }}
            />
          </div>
          <div>
            <label class="etiquette" for="f-fin">
              Fin *
            </label>
            <input
              id="f-fin"
              type="datetime-local"
              class="champ"
              required
              value={versInput(v.endAt)}
              onInput={(e) => {
                const ms = depuisInput((e.target as HTMLInputElement).value);
                if (!isNaN(ms)) maj('endAt', ms);
              }}
            />
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <label class="etiquette" for="f-lieu">
              Lieu *
            </label>
            <select id="f-lieu" class="champ" value={v.location} onChange={(e) => maj('location', (e.target as HTMLSelectElement).value as EventLocation)}>
              {LOCATIONS.map((l) => (
                <option value={l}>{LOCATION_LABEL[l]}</option>
              ))}
            </select>
          </div>
          <div>
            <label class="etiquette" for="f-adresse">
              Adresse précise
            </label>
            <input id="f-adresse" class="champ" maxLength={160} value={v.address} onInput={(e) => maj('address', (e.target as HTMLInputElement).value)} />
          </div>
        </div>
        <div>
          <label class="etiquette" for="f-desc">
            Description *
          </label>
          <textarea
            id="f-desc"
            class="champ min-h-40"
            required
            maxLength={5000}
            value={v.description}
            onInput={(e) => maj('description', (e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <label class="etiquette" for="f-desc-ar">
            Description en arabe (facultatif — sinon le texte français s'affiche sur la version arabe)
          </label>
          <textarea
            id="f-desc-ar"
            class="champ min-h-32"
            dir="rtl"
            lang="ar"
            maxLength={5000}
            value={v.descriptionAr}
            onInput={(e) => maj('descriptionAr', (e.target as HTMLTextAreaElement).value)}
          />
        </div>
      </fieldset>

      <fieldset class="carte space-y-4 p-4 sm:p-5">
        <legend class="px-1 text-lg font-bold">Photos</legend>
        <Photos
          titre="Photo de couverture"
          max={1}
          urls={v.coverImage ? [v.coverImage] : []}
          onChange={(u) => maj('coverImage', u[0] ?? '')}
        />
        <div>
          <label class="etiquette" for="f-credit">
            Crédit de la photo de couverture (si elle ne vient pas de l'association)
          </label>
          <input
            id="f-credit"
            class="champ"
            maxLength={120}
            placeholder="ex. Prénom Nom — Wikimedia Commons, CC BY-SA 4.0"
            value={v.coverCredit ?? ''}
            onInput={(e) => maj('coverCredit', (e.target as HTMLInputElement).value)}
          />
        </div>
        <Photos titre="Galerie" max={20} urls={v.gallery} onChange={(u) => maj('gallery', u)} />
      </fieldset>

      <fieldset class="carte space-y-4 p-4 sm:p-5">
        <legend class="px-1 text-lg font-bold">Collecte & bénévoles</legend>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="etiquette" for="f-objectif">
              Objectif (€)
            </label>
            <input id="f-objectif" class="champ" inputMode="decimal" value={v.goalAmount ?? ''} onInput={(e) => maj('goalAmount', nombre((e.target as HTMLInputElement).value))} />
          </div>
          <div>
            <label class="etiquette" for="f-collecte">
              Déjà collecté (€)
            </label>
            <input id="f-collecte" class="champ" inputMode="decimal" value={v.raisedAmount ?? ''} onInput={(e) => maj('raisedAmount', nombre((e.target as HTMLInputElement).value))} />
          </div>
        </div>
        <div>
          <label class="etiquette" for="f-ref">
            Référence de virement
          </label>
          <input
            id="f-ref"
            class="champ font-mono uppercase"
            maxLength={35}
            placeholder={autoDonationRef(v.type, v.startAt)}
            value={v.donationRef}
            onInput={(e) => maj('donationRef', (e.target as HTMLInputElement).value)}
          />
          <p class="mt-1 text-xs text-encre/60">Laissez vide pour la référence automatique : {autoDonationRef(v.type, v.startAt)}</p>
        </div>
        <label class="flex min-h-11 items-center gap-3">
          <input type="checkbox" class="h-6 w-6 accent-emerald-fonce" checked={v.volunteersNeeded} onChange={(e) => maj('volunteersNeeded', (e.target as HTMLInputElement).checked)} />
          On cherche des bénévoles
        </label>
        {v.volunteersNeeded && (
          <div>
            <label class="etiquette" for="f-nb-benevoles">
              Combien ?
            </label>
            <input
              id="f-nb-benevoles"
              class="champ max-w-32"
              inputMode="numeric"
              value={v.volunteersCount ?? ''}
              onInput={(e) => maj('volunteersCount', nombre((e.target as HTMLInputElement).value))}
            />
          </div>
        )}
      </fieldset>

      {(passe || v.report?.text) && (
        <fieldset class="carte space-y-4 p-4 sm:p-5">
          <legend class="px-1 text-lg font-bold">Bilan (après l'événement)</legend>
          <textarea
            class="champ min-h-28"
            aria-label="Texte du bilan"
            placeholder="Ex. : 150 couffins distribués, 4 200 € collectés. Merci à tous !"
            value={v.report?.text}
            onInput={(e) => maj('report', { ...(v.report ?? { photos: [] }), text: (e.target as HTMLTextAreaElement).value })}
          />
          <textarea
            class="champ min-h-24"
            dir="rtl"
            lang="ar"
            aria-label="Bilan en arabe (facultatif)"
            placeholder="الحصيلة بالعربية (اختياري)"
            value={v.report?.textAr}
            onInput={(e) => maj('report', { text: v.report?.text ?? '', photos: v.report?.photos ?? [], textAr: (e.target as HTMLTextAreaElement).value })}
          />
          <Photos titre="Photos du bilan" max={20} urls={v.report?.photos ?? []} onChange={(u) => maj('report', { ...(v.report ?? { text: '' }), photos: u })} />
        </fieldset>
      )}

      <fieldset class="carte space-y-3 p-4 sm:p-5">
        <legend class="px-1 text-lg font-bold">Publication</legend>
        <div class="grid grid-cols-2 gap-2">
          {(
            [
              ['draft', 'Brouillon', 'Invisible du public'],
              ['published', 'Publié', 'Visible sur le site'],
            ] as const
          ).map(([k, l, d]) => (
            <label
              class={`flex cursor-pointer flex-col rounded-xl border-2 p-3 ${v.status === k ? 'border-emerald-fonce bg-emerald/5' : 'border-sable bg-white'}`}
            >
              <input type="radio" name="status" class="sr-only" checked={v.status === k} onChange={() => maj('status', k)} />
              <span class="font-bold">{l}</span>
              <span class="text-xs text-encre/60">{d}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div class="pb-safe sticky bottom-16 z-30 -mx-4 bg-creme/95 px-4 py-3 backdrop-blur md:bottom-0">
        <button class="btn btn-primaire w-full text-lg" disabled={envoi}>
          {envoi ? 'Enregistrement…' : v.status === 'published' ? 'Enregistrer et publier' : 'Enregistrer le brouillon'}
        </button>
      </div>
    </form>
  );
}
