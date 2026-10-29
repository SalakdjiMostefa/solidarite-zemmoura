/**
 * Admin — gestion de photos : appareil photo ou galerie, compression, progression,
 * réordonnancement, suppression, floutage des visages (Cloudinary e_blur_faces).
 */
import { useState } from 'preact/hooks';
import { compresser, envoyer, avecFlou, estFloutee, CLOUDINARY_READY } from '../../lib/cloudinary';
import { cld } from '../../lib/labels';
import { toast } from '../../lib/toast';

interface Props {
  titre: string;
  urls: string[];
  max: number;
  onChange: (urls: string[]) => void;
}

export default function Photos({ titre, urls, max, onChange }: Props) {
  const [envois, setEnvois] = useState<{ nom: string; p: number }[]>([]);
  const [flouter, setFlouter] = useState(true);

  async function ajouter(files: FileList | null) {
    if (!files?.length) return;
    const liste = Array.from(files).slice(0, Math.max(0, max - urls.length));
    if (liste.length < files.length) toast(`Maximum ${max} photo(s)`, 'error');
    const nouvelles: string[] = [];
    for (const [i, f] of liste.entries()) {
      const nom = `${i + 1}/${liste.length}`;
      setEnvois((e) => [...e, { nom, p: 0 }]);
      try {
        const comp = await compresser(f);
        const url = await envoyer(comp, (p) => setEnvois((e) => e.map((x) => (x.nom === nom ? { ...x, p } : x))));
        nouvelles.push(avecFlou(url, flouter));
      } catch (err) {
        console.error(err);
        toast(`Échec de l'envoi de la photo ${nom}`, 'error');
      } finally {
        setEnvois((e) => e.filter((x) => x.nom !== nom));
      }
    }
    if (nouvelles.length) onChange([...urls, ...nouvelles].slice(0, max));
  }

  const deplacer = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= urls.length) return;
    const n = [...urls];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };

  return (
    <div>
      <p class="etiquette">{titre}</p>
      {max > 1 && (
        <p class="mb-2 rounded-xl bg-grenade/10 p-2.5 text-xs text-grenade-fonce">
          ⚠️ Dignité : pas de visage d'enfant ni de bénéficiaire reconnaissable. Gardez « Flouter les visages » activé en cas de doute.
        </p>
      )}
      {urls.length > 0 && (
        <ul class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {urls.map((u, i) => (
            <li class="relative overflow-hidden rounded-xl bg-sable">
              <img src={cld(u, 400)} alt={`Photo ${i + 1}`} class="aspect-square w-full object-cover" loading="lazy" />
              {estFloutee(u) && <span class="absolute start-1 top-1 rounded-full bg-encre/70 px-2 text-[11px] text-white">visages floutés</span>}
              <div class="absolute inset-x-0 bottom-0 flex justify-between bg-encre/60">
                <button type="button" class="h-11 w-11 text-white disabled:opacity-30" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Déplacer avant">
                  ◀
                </button>
                {u.includes('res.cloudinary.com') && (
                  <button
                    type="button"
                    class="h-11 px-1 text-xs text-white"
                    onClick={() => onChange(urls.map((x, k) => (k === i ? avecFlou(x, !estFloutee(x)) : x)))}
                    aria-label={estFloutee(u) ? 'Retirer le flou' : 'Flouter les visages'}
                  >
                    {estFloutee(u) ? 'Déflouter' : 'Flouter'}
                  </button>
                )}
                <button
                  type="button"
                  class="h-11 w-11 text-white"
                  onClick={() => confirm('Retirer cette photo ?') && onChange(urls.filter((_, k) => k !== i))}
                  aria-label="Supprimer la photo"
                >
                  ✕
                </button>
                <button
                  type="button"
                  class="h-11 w-11 text-white disabled:opacity-30"
                  onClick={() => deplacer(i, 1)}
                  disabled={i === urls.length - 1}
                  aria-label="Déplacer après"
                >
                  ▶
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {envois.map((e) => (
        <div class="mb-2" role="status">
          <p class="text-xs text-encre/70">Envoi de la photo {e.nom}…</p>
          <div class="h-2 overflow-hidden rounded-full bg-sable">
            <div class="h-full bg-emerald transition-all" style={{ width: `${Math.round(e.p * 100)}%` }} />
          </div>
        </div>
      ))}
      {urls.length < max && (
        <div class="flex flex-wrap gap-2">
          <label class="btn btn-secondaire cursor-pointer">
            📷 Prendre une photo
            <input type="file" accept="image/*" capture="environment" class="sr-only" onChange={(e) => ajouter((e.target as HTMLInputElement).files)} />
          </label>
          <label class="btn btn-secondaire cursor-pointer">
            🖼️ Galerie
            <input
              type="file"
              accept="image/*"
              multiple={max > 1}
              class="sr-only"
              onChange={(e) => {
                ajouter((e.target as HTMLInputElement).files);
                (e.target as HTMLInputElement).value = '';
              }}
            />
          </label>
        </div>
      )}
      <label class="mt-2 flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" class="h-5 w-5 accent-emerald-fonce" checked={flouter} onChange={(e) => setFlouter((e.target as HTMLInputElement).checked)} />
        Flouter les visages des nouvelles photos
      </label>
      {!CLOUDINARY_READY && <p class="text-xs text-encre/50">Cloudinary non configuré : les photos restent locales (démo).</p>}
    </div>
  );
}
