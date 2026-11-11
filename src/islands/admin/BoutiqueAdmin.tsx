/** Admin — boutique solidaire : ajouter, modifier, ordonner, marquer épuisé, masquer, supprimer */
import { useEffect, useState } from 'preact/hooks';
import type { BoutiqueSettings, Product } from '../../lib/types';
import { cld, formatEuro } from '../../lib/labels';
import { toast } from '../../lib/toast';
import { deleteProduct, listProducts, patchProduct, readDoc, saveProduct, writeDoc, type ProductInput } from './store';
import Photos from './Photos';

const vide = (order: number): ProductInput => ({ name: '', description: '', photos: [], order });

export default function BoutiqueAdmin() {
  const [produits, setProduits] = useState<Product[] | null>(null);
  const [edition, setEdition] = useState<{ id?: string; v: ProductInput } | null>(null);

  const charger = () => listProducts().then(setProduits).catch(() => toast('Chargement impossible', 'error'));
  useEffect(() => {
    charger();
  }, []);

  if (edition)
    return (
      <FormProduit
        id={edition.id}
        initial={edition.v}
        onFermer={(modifie) => {
          setEdition(null);
          if (modifie) charger();
        }}
      />
    );

  if (!produits) return <p class="py-10 text-center text-encre/60">Chargement…</p>;

  /** Déplace un article puis renumérote 0, 1, 2… (seuls les articles changés sont enregistrés) */
  async function deplacer(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= produits!.length) return;
    const liste = [...produits!];
    [liste[i], liste[j]] = [liste[j], liste[i]];
    const changes = liste.map((p, k) => ({ id: p.id, avant: p.order, apres: k })).filter((c) => c.avant !== c.apres);
    await Promise.all(changes.map((c) => patchProduct(c.id, { order: c.apres })));
    charger();
  }

  const btn = 'min-h-11 rounded-full border border-sable bg-white px-3 text-sm disabled:opacity-30';

  return (
    <section>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-medium">Boutique solidaire</h1>
          <p class="text-sm text-encre/70">Les visiteurs commandent par WhatsApp, au numéro des Réglages → Contacts.</p>
        </div>
        <button
          type="button"
          class="btn btn-don"
          onClick={() => setEdition({ v: vide(produits.length ? Math.max(...produits.map((p) => p.order)) + 1 : 0) })}
        >
          + Nouvel article
        </button>
      </div>

      {produits.length === 0 && <p class="rounded-xl bg-pierre p-4 text-sm text-encre/70">Aucun article. La page Boutique affiche « La boutique ouvre bientôt ».</p>}

      <ul class="space-y-3">
        {produits.map((p, i) => (
          <li class={`carte flex flex-wrap items-center gap-3 p-3 ${p.hidden ? 'opacity-60' : ''}`}>
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-pierre">
              {p.photos[0] && <img src={cld(p.photos[0], 160)} alt="" class="h-full w-full object-cover" />}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold">{p.name}</p>
              <p class="text-sm text-encre/60">
                {p.price ? formatEuro(p.price) : 'Prix libre'}
                {p.soldOut && ' · Épuisé'}
                {p.hidden && ' · Masqué'}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class={btn} disabled={i === 0} onClick={() => deplacer(i, -1)} aria-label="Monter">
                ↑
              </button>
              <button type="button" class={btn} disabled={i === produits.length - 1} onClick={() => deplacer(i, 1)} aria-label="Descendre">
                ↓
              </button>
              <button type="button" class={btn} onClick={() => setEdition({ id: p.id, v: (({ id: _i, createdAt: _c, ...r }) => r)(p) })}>
                Modifier
              </button>
              <button
                type="button"
                class={btn}
                onClick={async () => {
                  await patchProduct(p.id, { soldOut: !p.soldOut });
                  toast(p.soldOut ? 'De nouveau disponible' : 'Marqué épuisé');
                  charger();
                }}
              >
                {p.soldOut ? 'Disponible' : 'Épuisé'}
              </button>
              <button
                type="button"
                class={btn}
                onClick={async () => {
                  await patchProduct(p.id, { hidden: !p.hidden });
                  charger();
                }}
              >
                {p.hidden ? 'Afficher' : 'Masquer'}
              </button>
              <button
                type="button"
                class={`${btn} text-grenade-fonce`}
                onClick={async () => {
                  if (!confirm(`Supprimer « ${p.name} » ?`)) return;
                  await deleteProduct(p.id);
                  toast('Article supprimé');
                  charger();
                }}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

      <TexteComment />
    </section>
  );
}

/** Une étape par ligne ⇄ liste */
const SAUT = String.fromCharCode(10);
const versLignes = (l?: string[]) => (l ?? []).join(SAUT);
const depuisLignes = (t: string) =>
  t
    .split(SAUT)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);

/** Encadré « Comment ça marche ? » affiché sous les articles */
function TexteComment() {
  const [b, setB] = useState<BoutiqueSettings | null>(null);
  const [fr, setFr] = useState('');
  const [ar, setAr] = useState('');
  const [envoi, setEnvoi] = useState(false);
  useEffect(() => {
    readDoc('settings/boutique').then((d) => {
      setB(d);
      setFr(versLignes(d.steps));
      setAr(versLignes(d.stepsAr));
    });
  }, []);
  if (!b) return null;

  return (
    <form
      class="carte mt-8 space-y-4 p-4 sm:p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const valeur: BoutiqueSettings = { title: b.title.trim(), steps: depuisLignes(fr) };
        if (b.titleAr?.trim()) valeur.titleAr = b.titleAr.trim();
        const etapesAr = depuisLignes(ar);
        if (etapesAr.length) valeur.stepsAr = etapesAr;
        setEnvoi(true);
        try {
          await writeDoc('settings/boutique', valeur);
          toast('Texte enregistré ✓');
        } catch (err) {
          console.error(err);
          toast("Échec de l'enregistrement", 'error');
        } finally {
          setEnvoi(false);
        }
      }}
    >
      <div>
        <h2 class="text-xl font-medium">Encadré « Comment ça marche ? »</h2>
        <p class="text-sm text-encre/70">Affiché sous les articles, sur la page Boutique. Une étape par ligne ; elles sont numérotées automatiquement.</p>
      </div>
      <div>
        <label class="etiquette" for="bc-titre">
          Titre
        </label>
        <input id="bc-titre" class="champ" required maxLength={80} value={b.title} onInput={(e) => setB({ ...b, title: (e.target as HTMLInputElement).value })} />
      </div>
      <div>
        <label class="etiquette" for="bc-etapes">
          Étapes (une par ligne)
        </label>
        <textarea id="bc-etapes" class="champ min-h-36" required maxLength={1500} value={fr} onInput={(e) => setFr((e.target as HTMLTextAreaElement).value)} />
      </div>
      <details class="rounded-xl bg-creme p-3">
        <summary class="min-h-11 cursor-pointer content-center text-sm font-semibold">Version arabe (facultative)</summary>
        <p class="my-2 text-xs text-encre/60">Vide = le texte français s'affiche aussi sur la version arabe.</p>
        <div class="space-y-3">
          <input class="champ" dir="rtl" lang="ar" maxLength={80} aria-label="Titre en arabe" value={b.titleAr ?? ''} onInput={(e) => setB({ ...b, titleAr: (e.target as HTMLInputElement).value })} />
          <textarea class="champ min-h-32" dir="rtl" lang="ar" maxLength={1500} aria-label="Étapes en arabe" value={ar} onInput={(e) => setAr((e.target as HTMLTextAreaElement).value)} />
        </div>
      </details>
      <button class="btn btn-primaire w-full" disabled={envoi}>
        {envoi ? 'Enregistrement…' : 'Enregistrer le texte'}
      </button>
    </form>
  );
}

function FormProduit({ id, initial, onFermer }: { id?: string; initial: ProductInput; onFermer: (modifie: boolean) => void }) {
  const [v, setV] = useState<ProductInput>(initial);
  const [envoi, setEnvoi] = useState(false);
  const maj = (patch: Partial<ProductInput>) => setV((x) => ({ ...x, ...patch }));

  return (
    <form
      class="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnvoi(true);
        try {
          await saveProduct(
            {
              name: v.name.trim(),
              nameAr: v.nameAr?.trim() || undefined,
              description: v.description.trim(),
              descriptionAr: v.descriptionAr?.trim() || undefined,
              price: v.price || undefined,
              impact: v.impact?.trim() || undefined,
              impactAr: v.impactAr?.trim() || undefined,
              photos: v.photos,
              soldOut: v.soldOut || undefined,
              hidden: v.hidden || undefined,
              order: v.order,
            },
            id,
          );
          toast(id ? 'Article modifié' : 'Article ajouté');
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
        <h1 class="text-xl font-medium">{id ? "Modifier l'article" : 'Nouvel article'}</h1>
      </div>

      <fieldset class="carte space-y-4 p-4 sm:p-5">
        <legend class="sr-only">Article</legend>
        <div class="grid gap-3 sm:grid-cols-[1fr_160px]">
          <div>
            <label class="etiquette" for="p-nom">
              Nom de l'article *
            </label>
            <input id="p-nom" class="champ" required maxLength={80} placeholder="Miel de Zemmoura (500 g)" value={v.name} onInput={(e) => maj({ name: (e.target as HTMLInputElement).value })} />
          </div>
          <div>
            <label class="etiquette" for="p-prix">
              Prix (€)
            </label>
            <input
              id="p-prix"
              class="champ"
              inputMode="decimal"
              placeholder="Prix libre"
              value={v.price ?? ''}
              onInput={(e) => {
                const s = (e.target as HTMLInputElement).value.replace(',', '.').trim();
                maj({ price: s === '' ? undefined : Math.max(0, Number(s) || 0) });
              }}
            />
          </div>
        </div>
        <div>
          <label class="etiquette" for="p-impact">
            Ce que l'achat finance (conseillé)
          </label>
          <input
            id="p-impact"
            class="champ"
            maxLength={80}
            placeholder="1 couffin pour une famille"
            value={v.impact ?? ''}
            onInput={(e) => maj({ impact: (e.target as HTMLInputElement).value })}
          />
          <p class="mt-1 text-xs text-encre/60">S'affiche en vert : « Votre achat finance : … ». C'est ce qui donne envie d'acheter.</p>
        </div>
        <div>
          <label class="etiquette" for="p-desc">
            Description
          </label>
          <textarea
            id="p-desc"
            class="champ min-h-24"
            maxLength={600}
            placeholder="Origine, taille, ce que l'achat finance…"
            value={v.description}
            onInput={(e) => maj({ description: (e.target as HTMLTextAreaElement).value })}
          />
        </div>
        <details class="rounded-xl bg-creme p-3">
          <summary class="min-h-11 cursor-pointer content-center text-sm font-semibold">Version arabe (facultative)</summary>
          <div class="mt-2 space-y-3">
            <input class="champ" dir="rtl" lang="ar" maxLength={80} aria-label="Nom en arabe" placeholder="اسم المنتج" value={v.nameAr ?? ''} onInput={(e) => maj({ nameAr: (e.target as HTMLInputElement).value })} />
            <input class="champ" dir="rtl" lang="ar" maxLength={80} aria-label="Impact en arabe" placeholder="قفة لعائلة" value={v.impactAr ?? ''} onInput={(e) => maj({ impactAr: (e.target as HTMLInputElement).value })} />
            <textarea
              class="champ min-h-20"
              dir="rtl"
              lang="ar"
              maxLength={600}
              aria-label="Description en arabe"
              placeholder="الوصف"
              value={v.descriptionAr ?? ''}
              onInput={(e) => maj({ descriptionAr: (e.target as HTMLTextAreaElement).value })}
            />
          </div>
        </details>
        <Photos titre="Photos (6 maximum, la première est la principale)" max={6} urls={v.photos} flouParDefaut={false} onChange={(photos) => maj({ photos })} />
        <label class="flex min-h-11 items-center gap-3">
          <input type="checkbox" class="h-5 w-5 accent-emerald-fonce" checked={!!v.soldOut} onChange={(e) => maj({ soldOut: (e.target as HTMLInputElement).checked })} />
          Épuisé (reste visible, sans bouton de commande)
        </label>
        <label class="flex min-h-11 items-center gap-3">
          <input type="checkbox" class="h-5 w-5 accent-emerald-fonce" checked={!!v.hidden} onChange={(e) => maj({ hidden: (e.target as HTMLInputElement).checked })} />
          Masqué (n'apparaît pas sur le site)
        </label>
      </fieldset>

      <button class="btn btn-primaire w-full" disabled={envoi}>
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
