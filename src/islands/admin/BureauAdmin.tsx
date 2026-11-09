/**
 * Admin — équipe de l'association (page « L'association »).
 * Des sections (ex. « Responsables en France ») contenant des responsables.
 * Tout est enregistré d'un coup dans settings/team.
 */
import { useEffect, useState } from 'preact/hooks';
import type { TeamMember, TeamSection, TeamSettings } from '../../lib/types';
import { toast } from '../../lib/toast';
import { readDoc, writeDoc } from './store';
import Photos from './Photos';

const SUGGESTIONS = ['Responsables en France', 'Responsables en Algérie'];

/** Échange deux éléments d'une liste (flèches haut / bas) */
function deplacer<T>(liste: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= liste.length) return liste;
  const n = [...liste];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

const btnPetit = 'min-h-11 min-w-11 rounded-full border border-sable bg-white px-3 text-sm disabled:opacity-30';

export default function BureauAdmin() {
  const [sections, setSections] = useState<TeamSection[] | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    readDoc('settings/team')
      .then((d) => setSections(d.sections ?? []))
      .catch(() => toast('Chargement impossible', 'error'));
  }, []);

  if (!sections) return <p class="py-10 text-center text-encre/60">Chargement…</p>;

  // Mises à jour « fonctionnelles » : toujours appliquées sur la dernière version (pas d'écrasement)
  const majSections = (f: (l: TeamSection[]) => TeamSection[]) => setSections((l) => (l ? f(l) : l));
  const majSection = (i: number, patch: Partial<TeamSection> | ((s: TeamSection) => Partial<TeamSection>)) =>
    majSections((l) => l.map((s, k) => (k === i ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s)));
  const majMembre = (i: number, j: number, patch: Partial<TeamMember>) =>
    majSection(i, (s) => ({ members: s.members.map((m, k) => (k === j ? { ...m, ...patch } : m)) }));

  async function enregistrer(e: Event) {
    e.preventDefault();
    // Nettoyage : on retire les espaces et les champs vides (Firestore refuse `undefined`)
    const propre: TeamSettings = {
      sections: sections!.map((s) => ({
        title: s.title.trim(),
        ...(s.titleAr?.trim() ? { titleAr: s.titleAr.trim() } : {}),
        members: s.members
          .filter((m) => m.name.trim() || m.role.trim())
          .map((m) => ({
            name: m.name.trim(),
            role: m.role.trim(),
            ...(m.roleAr?.trim() ? { roleAr: m.roleAr.trim() } : {}),
            ...(m.photo ? { photo: m.photo } : {}),
          })),
      })),
    };
    setEnvoi(true);
    try {
      await writeDoc('settings/team', propre);
      setSections(propre.sections);
      toast('Équipe enregistrée ✓');
    } catch (err) {
      console.error(err);
      toast("Échec de l'enregistrement", 'error');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={enregistrer} class="space-y-5">
      <div>
        <h1 class="text-2xl font-medium">Bureau & responsables</h1>
        <p class="mt-1 text-sm text-encre/70">
          Créez des sections (ex. « Responsables en France », « Responsables en Algérie »), puis ajoutez les responsables dans chacune.
          Elles s'affichent dans cet ordre sur la page « L'association ». Pensez à <strong>Enregistrer</strong> en bas.
        </p>
      </div>

      {sections.length === 0 && (
        <p class="rounded-xl bg-pierre p-4 text-sm text-encre/70">
          Aucune section pour l'instant : le site affiche le bureau « À compléter ». Commencez par ajouter une section.
        </p>
      )}

      {sections.map((s, i) => (
        <fieldset class="carte space-y-4 p-4 sm:p-5">
          <legend class="sr-only">Section {i + 1}</legend>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs font-semibold uppercase tracking-wider text-terracotta-fonce">Section {i + 1}</p>
            <div class="flex gap-2">
              <button type="button" class={btnPetit} disabled={i === 0} onClick={() => majSections((l) => deplacer(l, i, -1))} aria-label="Monter la section">
                ↑
              </button>
              <button
                type="button"
                class={btnPetit}
                disabled={i === sections.length - 1}
                onClick={() => majSections((l) => deplacer(l, i, 1))}
                aria-label="Descendre la section"
              >
                ↓
              </button>
              <button
                type="button"
                class={`${btnPetit} text-grenade-fonce`}
                onClick={() => confirm(`Supprimer la section « ${s.title || 'sans titre'} » et ses responsables ?`) && majSections((l) => l.filter((_, k) => k !== i))}
              >
                Supprimer
              </button>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="etiquette" for={`s-${i}-t`}>
                Titre de la section
              </label>
              <input
                id={`s-${i}-t`}
                class="champ"
                required
                maxLength={80}
                placeholder="Responsables en France"
                value={s.title}
                onInput={(e) => majSection(i, { title: (e.target as HTMLInputElement).value })}
              />
            </div>
            <div>
              <label class="etiquette" for={`s-${i}-ta`}>
                Titre en arabe (facultatif)
              </label>
              <input
                id={`s-${i}-ta`}
                class="champ"
                dir="rtl"
                maxLength={80}
                placeholder="المسؤولون في فرنسا"
                value={s.titleAr ?? ''}
                onInput={(e) => majSection(i, { titleAr: (e.target as HTMLInputElement).value })}
              />
            </div>
          </div>

          <ul class="space-y-3">
            {s.members.map((m, j) => (
              <li class="rounded-xl border border-sable bg-pierre/40 p-3 sm:p-4">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p class="font-semibold">{m.name || `Responsable ${j + 1}`}</p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class={btnPetit}
                      disabled={j === 0}
                      onClick={() => majSection(i, (x) => ({ members: deplacer(x.members, j, -1) }))}
                      aria-label="Monter ce responsable"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class={btnPetit}
                      disabled={j === s.members.length - 1}
                      onClick={() => majSection(i, (x) => ({ members: deplacer(x.members, j, 1) }))}
                      aria-label="Descendre ce responsable"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      class={`${btnPetit} text-grenade-fonce`}
                      onClick={() => confirm(`Retirer ${m.name || 'ce responsable'} ?`) && majSection(i, (x) => ({ members: x.members.filter((_, k) => k !== j) }))}
                      aria-label="Retirer ce responsable"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label class="etiquette" for={`m-${i}-${j}-n`}>
                      Nom
                    </label>
                    <input
                      id={`m-${i}-${j}-n`}
                      class="champ"
                      maxLength={80}
                      placeholder="Prénom Nom"
                      value={m.name}
                      onInput={(e) => majMembre(i, j, { name: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                  <div>
                    <label class="etiquette" for={`m-${i}-${j}-r`}>
                      Rôle
                    </label>
                    <input
                      id={`m-${i}-${j}-r`}
                      class="champ"
                      maxLength={80}
                      placeholder="Président, Trésorière…"
                      value={m.role}
                      onInput={(e) => majMembre(i, j, { role: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                  <div>
                    <label class="etiquette" for={`m-${i}-${j}-ra`}>
                      Rôle en arabe (facultatif)
                    </label>
                    <input
                      id={`m-${i}-${j}-ra`}
                      class="champ"
                      dir="rtl"
                      maxLength={80}
                      placeholder="الرئيس"
                      value={m.roleAr ?? ''}
                      onInput={(e) => majMembre(i, j, { roleAr: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                </div>
                <div class="mt-3">
                  <Photos
                    titre="Photo (facultative — sinon l'initiale du nom s'affiche)"
                    urls={m.photo ? [m.photo] : []}
                    max={1}
                    flouParDefaut={false}
                    onChange={(urls) => majMembre(i, j, { photo: urls[0] })}
                  />
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            class="btn btn-secondaire w-full sm:w-auto"
            onClick={() => majSection(i, (x) => ({ members: [...x.members, { name: '', role: '' }] }))}
          >
            + Ajouter un responsable
          </button>
        </fieldset>
      ))}

      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-secondaire" onClick={() => majSections((l) => [...l, { title: '', members: [{ name: '', role: '' }] }])}>
          + Ajouter une section
        </button>
        {SUGGESTIONS.filter((t) => !sections.some((s) => s.title === t)).map((t) => (
          <button
            type="button"
            class="min-h-11 rounded-full border border-dashed border-sable px-4 text-sm text-encre/70 hover:border-encre/40"
            onClick={() => majSections((l) => [...l, { title: t, members: [{ name: '', role: '' }] }])}
          >
            + {t}
          </button>
        ))}
      </div>

      <div class="sticky bottom-16 z-10 md:bottom-0">
        <button class="btn btn-primaire w-full shadow-lg" disabled={envoi}>
          {envoi ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
