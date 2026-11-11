/**
 * Mise en avant de la boutique solidaire ailleurs sur le site.
 * - `accueil` : section avec 3 articles disponibles
 * - `bandeau` : encart sobre « Soutenir autrement » (pages Don, Réalisations)
 * N'affiche rien tant que la boutique n'a pas d'article disponible.
 */
import { lien, tr, type Lang } from '../i18n';
import { cld } from '../lib/labels';
import { CarteProduit, useBoutique } from './Boutique';

export default function BoutiqueApercu({ lang = 'fr', variante = 'accueil' }: { lang?: Lang; variante?: 'accueil' | 'bandeau' }) {
  const t = tr(lang).boutique;
  const fleche = tr(lang).commun.fleche;
  const { produits, whatsapp } = useBoutique();
  const dispo = (produits ?? []).filter((p) => !p.soldOut);
  if (!dispo.length) return null;
  const href = lien('/boutique', lang);

  if (variante === 'bandeau') {
    const vignettes = dispo.filter((p) => p.photos[0]).slice(0, 3);
    return (
      <aside class="carte flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        {vignettes.length > 0 && (
          <div class="flex shrink-0 -space-x-3 rtl:space-x-reverse" aria-hidden="true">
            {vignettes.map((p) => (
              <img src={cld(p.photos[0], 160)} alt="" width={56} height={56} loading="lazy" class="h-14 w-14 rounded-full border-2 border-white object-cover" />
            ))}
          </div>
        )}
        <div class="flex-1">
          <p class="font-titre text-xl">{t.autrementTitre}</p>
          <p class="text-encre/70">{t.autrementTexte(produits!.length)}</p>
        </div>
        <a href={href} class="btn btn-secondaire shrink-0">
          {t.autrementBouton} {fleche}
        </a>
      </aside>
    );
  }

  return (
    <section class="conteneur py-16 sm:py-20" aria-labelledby="t-boutique">
      <div class="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="surtitre">{t.apercuSurtitre}</p>
          <h2 id="t-boutique" class="titre-section">
            {t.apercuTitre}
          </h2>
          <p class="lead mt-3 max-w-2xl">{t.apercuTexte}</p>
        </div>
        <a href={href} class="text-sm font-medium text-encre/70 underline-offset-4 hover:text-encre hover:underline">
          {t.voirTout(produits!.length)} {fleche}
        </a>
      </div>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {dispo.slice(0, 3).map((p) => (
          <CarteProduit p={p} whatsapp={whatsapp} lang={lang} />
        ))}
      </div>
    </section>
  );
}
