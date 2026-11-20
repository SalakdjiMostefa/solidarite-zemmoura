/** Admin — sponsors du footer fixe : photo + nom (+ lien facultatif), ordre, masquer, supprimer */
import { useEffect, useState } from 'preact/hooks';
import type { Sponsor } from '../../lib/types';
import { cld } from '../../lib/labels';
import { toast } from '../../lib/toast';
import { deleteSponsor, listSponsors, patchSponsor, saveSponsor, type SponsorInput } from './store';
import Photos from './Photos';

export default function SponsorsAdmin() {
  const [liste, setListe] = useState<Sponsor[] | null>(null);
  const [edition, setEdition] = useState<{ id?: string; v: SponsorInput } | null>(null);

  const charger = () => listSponsors().then(setListe).catch(() => toast('Chargement impossible', 'error'));
  useEffect(() => {
    charger();
  }, []);

  if (edition)
    return (
      <FormSponsor
        id={edition.id}
        initial={edition.v}
        onFermer={(modifie) => {
          setEdition(null);
          if (modifie) charger();
        }}
      />
    );
  if (!liste) return <p class="py-10 text-center text-encre/60">Chargement…</p>;

  /** Déplace un sponsor puis renumérote 0, 1, 2… */
  async function deplacer(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= liste!.length) return;
    const l = [...liste!];
    [l[i], l[j]] = [l[j], l[i]];
    await Promise.all(l.map((s, k) => (s.order !== k ? patchSponsor(s.id, { order: k }) : null)));
    charger();
  }

  const btn = 'min-h-11 rounded-full border border-sable bg-white px-3 text-sm disabled:opacity-30';

  return (
    <section>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-medium">Sponsors</h1>
          <p class="text-sm text-encre/70">Ils défilent dans la barre fixe en bas du site, dans cet ordre.</p>
        </div>
        <button
          type="button"
          class="btn btn-don"
          onClick={() => setEdition({ v: { name: '', photo: '', order: liste.length ? Math.max(...liste.map((s) => s.order)) + 1 : 0 } })}
        >
          + Ajouter un sponsor
        </button>
      </div>

      {liste.length === 0 && <p class="rounded-xl bg-pierre p-4 text-sm text-encre/70">Aucun sponsor : la barre n'apparaît pas sur le site.</p>}

      <ul class="space-y-3">
        {liste.map((s, i) => (
          <li class={`carte flex flex-wrap items-center gap-3 p-3 ${s.hidden ? 'opacity-60' : ''}`}>
            <div class="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sable bg-white">
              {s.photo && <img src={cld(s.photo, 200)} alt="" class="h-full w-full object-contain" />}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold">{s.name}</p>
              <p class="truncate text-sm text-encre/60">
                {s.url ? s.url.replace(/^https?:\/\//, '') : 'Pas de site'}
                {s.hidden && ' · Masqué'}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class={btn} disabled={i === 0} onClick={() => deplacer(i, -1)} aria-label="Monter">
                ↑
              </button>
              <button type="button" class={btn} disabled={i === liste.length - 1} onClick={() => deplacer(i, 1)} aria-label="Descendre">
                ↓
              </button>
              <button type="button" class={btn} onClick={() => setEdition({ id: s.id, v: (({ id: _i, createdAt: _c, ...r }) => r)(s) })}>
                Modifier
              </button>
              <button
                type="button"
                class={btn}
                onClick={async () => {
                  await patchSponsor(s.id, { hidden: !s.hidden });
                  charger();
                }}
              >
                {s.hidden ? 'Afficher' : 'Masquer'}
              </button>
              <button
                type="button"
                class={`${btn} text-grenade-fonce`}
                onClick={async () => {
                  if (!confirm(`Supprimer « ${s.name} » ?`)) return;
                  await deleteSponsor(s.id);
                  toast('Sponsor supprimé');
                  charger();
                }}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FormSponsor({ id, initial, onFermer }: { id?: string; initial: SponsorInput; onFermer: (modifie: boolean) => void }) {
  const [v, setV] = useState<SponsorInput>(initial);
  const [envoi, setEnvoi] = useState(false);
  const maj = (patch: Partial<SponsorInput>) => setV((x) => ({ ...x, ...patch }));

  return (
    <form
      class="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!v.photo) return toast('Ajoutez une photo du sponsor.', 'error');
        const url = v.url?.trim();
        setEnvoi(true);
        try {
          await saveSponsor(
            {
              name: v.name.trim(),
              photo: v.photo,
              url: url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : undefined,
              hidden: v.hidden || undefined,
              order: v.order,
            },
            id,
          );
          toast(id ? 'Sponsor modifié' : 'Sponsor ajouté');
          onFermer(true);
        } catch (err) {
          console.error(err);
          toast("Échec de l'enregistrement", 'error');
        } finally {
          setEnvoi(false);
        }
      }}
    >
      <div class="flex items-center justify-between gap-3">
        <button type="button" class="min-h-11 font-semibold text-emerald-fonce" onClick={() => onFermer(false)}>
          ← Retour
        </button>
        <h1 class="text-xl font-medium">{id ? 'Modifier le sponsor' : 'Nouveau sponsor'}</h1>
      </div>
      <fieldset class="carte space-y-4 p-4 sm:p-5">
        <legend class="sr-only">Sponsor</legend>
        <div>
          <label class="etiquette" for="s-nom">
            Nom *
          </label>
          <input id="s-nom" class="champ" required maxLength={80} placeholder="Boulangerie du centre" value={v.name} onInput={(e) => maj({ name: (e.target as HTMLInputElement).value })} />
        </div>
        <Photos titre="Photo ou logo *" max={1} urls={v.photo ? [v.photo] : []} flouParDefaut={false} onChange={(u) => maj({ photo: u[0] ?? '' })} />
        <div>
          <label class="etiquette" for="s-url">
            Site internet (facultatif)
          </label>
          <input
            id="s-url"
            class="champ"
            inputMode="url"
            maxLength={200}
            placeholder="www.exemple.fr"
            value={v.url ?? ''}
            onInput={(e) => maj({ url: (e.target as HTMLInputElement).value })}
          />
          <p class="mt-1 text-xs text-encre/60">Si rempli, un clic sur le sponsor ouvre son site.</p>
        </div>
      </fieldset>
      <button class="btn btn-primaire w-full" disabled={envoi}>
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
