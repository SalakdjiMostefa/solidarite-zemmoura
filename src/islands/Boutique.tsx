/**
 * Boutique solidaire — grille d'articles (photos défilables, prix, impact, épuisé)
 * et commande par message WhatsApp pré-rempli vers le numéro de l'association.
 * `CarteProduit` et `useBoutique` sont réutilisés par l'aperçu (accueil, page Don…).
 */
import { useEffect, useState } from 'preact/hooks';
import { getBoutiqueSettings, getContactSettings, getProducts } from '../lib/api';
import { DEMO_BOUTIQUE, DEMO_CONTACT } from '../lib/demo-data';
import { cld, formatEuro } from '../lib/labels';
import { lien, tr, type Lang } from '../i18n';
import type { BoutiqueSettings, Product } from '../lib/types';

/** Articles visibles (disponibles d'abord) + numéro WhatsApp de l'association */
export function useBoutique() {
  const [produits, setProduits] = useState<Product[] | null>(null);
  const [whatsapp, setWhatsapp] = useState(DEMO_CONTACT.whatsapp);
  useEffect(() => {
    getProducts()
      .then((l) => setProduits([...l.filter((p) => !p.soldOut), ...l.filter((p) => p.soldOut)]))
      .catch(() => setProduits([]));
    getContactSettings()
      .then((c) => setWhatsapp(c.whatsapp))
      .catch(() => {});
  }, []);
  return { produits, whatsapp };
}

export function CarteProduit({ p, whatsapp, lang }: { p: Product; whatsapp: string; lang: Lang }) {
  const t = tr(lang).boutique;
  const nom = lang === 'ar' && p.nameAr?.trim() ? p.nameAr : p.name;
  const desc = lang === 'ar' && p.descriptionAr?.trim() ? p.descriptionAr : p.description;
  const impact = lang === 'ar' && p.impactAr?.trim() ? p.impactAr : p.impact;
  const prix = p.price ? formatEuro(p.price) : t.prixLibre;
  const lienWa = `https://wa.me/${whatsapp}?text=${encodeURIComponent(t.message(nom, prix))}`;
  return (
    <article class="carte flex h-full flex-col overflow-hidden">
      <div class="relative aspect-square bg-pierre">
        {p.photos.length > 0 ? (
          <div class="flex h-full snap-x snap-mandatory overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {p.photos.map((u, i) => (
              <img
                src={cld(u, 700)}
                alt={p.photos.length > 1 ? `${nom} (${i + 1}/${p.photos.length})` : nom}
                loading="lazy"
                decoding="async"
                width={700}
                height={700}
                class={`h-full w-full shrink-0 snap-center object-cover ${p.soldOut ? 'grayscale-[60%]' : ''}`}
              />
            ))}
          </div>
        ) : (
          <div class="flex h-full items-center justify-center font-titre text-6xl text-encre/20" aria-hidden="true">
            {nom[0]}
          </div>
        )}
        {p.photos.length > 1 && (
          <span class="absolute bottom-2 end-2 rounded-full bg-encre/60 px-2 py-0.5 text-xs text-white">{p.photos.length} photos ↔</span>
        )}
        {p.soldOut && <span class="absolute start-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-semibold text-encre">{t.epuise}</span>}
      </div>
      <div class="flex flex-1 flex-col gap-2 p-5">
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="text-xl font-medium">{nom}</h3>
          <p class="shrink-0 font-titre text-xl text-terracotta-fonce">{prix}</p>
        </div>
        {impact?.trim() && (
          <p class="flex items-start gap-2 text-[15px] text-emerald-fonce">
            <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" stroke-linejoin="round" />
            </svg>
            <span>
              {t.finance} : <strong class="font-semibold">{impact}</strong>
            </span>
          </p>
        )}
        {desc && <p class="line-clamp-4 whitespace-pre-line text-[15px] text-encre/70">{desc}</p>}
        <div class="mt-auto pt-3">
          {p.soldOut ? (
            <p class="btn w-full cursor-default border border-sable bg-pierre text-encre/50">{t.epuise}</p>
          ) : (
            <a href={lienWa} target="_blank" rel="noopener" class="btn btn-whatsapp w-full">
              {t.commander}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Boutique({ lang = 'fr' }: { lang?: Lang }) {
  const t = tr(lang).boutique;
  const { produits, whatsapp } = useBoutique();

  if (produits === null)
    return (
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map(() => (
          <div class="carte overflow-hidden">
            <div class="squelette aspect-square rounded-none" />
            <div class="space-y-3 p-4">
              <div class="squelette h-6 w-2/3" />
              <div class="squelette h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );

  if (produits.length === 0)
    return (
      <div class="carte p-8 text-center">
        <p class="font-titre text-2xl">{t.vide}</p>
        <p class="mt-2 text-encre/70">{t.videTexte}</p>
        <a href={lien('/don', lang)} class="btn btn-don mt-5">
          {tr(lang).nav.don}
        </a>
      </div>
    );

  return (
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {produits.map((p) => (
        <CarteProduit p={p} whatsapp={whatsapp} lang={lang} />
      ))}
    </div>
  );
}

/** Encadré « Comment ça marche ? » (texte modifiable dans Admin → Boutique) */
export function CommentCaMarche({ lang = 'fr' }: { lang?: Lang }) {
  const [b, setB] = useState<BoutiqueSettings>(DEMO_BOUTIQUE);
  useEffect(() => {
    getBoutiqueSettings().then(setB).catch(() => {});
  }, []);
  const arabe = lang === 'ar' && (b.stepsAr ?? []).some((x) => x.trim());
  const titre = lang === 'ar' && b.titleAr?.trim() ? b.titleAr : b.title;
  const etapes = (arabe ? b.stepsAr! : b.steps).filter((x) => x.trim());
  if (!etapes.length) return null;
  return (
    <div class="carte max-w-3xl p-6">
      <h2 class="text-2xl font-medium">{titre}</h2>
      <ol class="mt-3 list-decimal space-y-2 ps-6 text-encre/80" lang={arabe ? 'ar' : lang === 'ar' ? 'fr' : undefined}>
        {etapes.map((c) => (
          <li>{c}</li>
        ))}
      </ol>
    </div>
  );
}
