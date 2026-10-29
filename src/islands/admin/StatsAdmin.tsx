/** Admin — chiffres globaux (stats/global) affichés sur l'accueil et le pont animé */
import { useEffect, useState } from 'preact/hooks';
import type { GlobalStats } from '../../lib/types';
import { toast } from '../../lib/toast';
import { readDoc, writeDoc } from './store';

const CHAMPS: { k: keyof GlobalStats; label: string; aide: string }[] = [
  { k: 'raised', label: 'Montant total collecté (€)', aide: 'Depuis la création de l’association' },
  { k: 'families', label: 'Familles aidées', aide: '' },
  { k: 'couffins', label: 'Couffins distribués', aide: '' },
  { k: 'volunteers', label: 'Bénévoles', aide: '' },
];

export default function StatsAdmin() {
  const [s, setS] = useState<GlobalStats | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    readDoc('stats/global').then(setS);
  }, []);

  if (!s) return <p class="py-10 text-center text-encre/60">Chargement…</p>;

  return (
    <form
      class="carte max-w-lg space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnvoi(true);
        try {
          await writeDoc('stats/global', s);
          toast('Chiffres mis à jour ✓ (un colis traverse le pont !)');
        } catch {
          toast('Échec de la mise à jour', 'error');
        } finally {
          setEnvoi(false);
        }
      }}
    >
      <h1 class="text-2xl font-medium">Chiffres clés</h1>
      <p class="text-sm text-encre/70">Ces chiffres s'affichent sur la page d'accueil. Mettez-les à jour après chaque action.</p>
      {CHAMPS.map((c) => (
        <div>
          <label class="etiquette" for={`s-${c.k}`}>
            {c.label}
          </label>
          <div class="flex gap-2">
            <input
              id={`s-${c.k}`}
              class="champ text-lg font-bold"
              inputMode="numeric"
              value={s[c.k]}
              onInput={(e) => setS({ ...s, [c.k]: Math.max(0, Number((e.target as HTMLInputElement).value.replace(/\D/g, '')) || 0) })}
            />
            <button type="button" class="btn btn-secondaire shrink-0 px-4" onClick={() => setS({ ...s, [c.k]: s[c.k] + 1 })} aria-label={`Ajouter 1 à ${c.label}`}>
              +1
            </button>
          </div>
          {c.aide && <p class="mt-1 text-xs text-encre/60">{c.aide}</p>}
        </div>
      ))}
      <button class="btn btn-primaire w-full" disabled={envoi}>
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
