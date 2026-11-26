/**
 * Footer fixe des sponsors : photo + nom de chaque partenaire, qui défilent en continu
 * de droite à gauche. Gérés dans Admin → Sponsors. Masqué tant qu'il n'y a aucun sponsor.
 * Sur téléphone, la barre se pose au-dessus du bouton fixe « Faire un don ».
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { getSponsors } from '../lib/api';
import { cld } from '../lib/labels';
import { tr, type Lang } from '../i18n';
import type { Sponsor } from '../lib/types';

function Carte({ s, copie }: { s: Sponsor; copie?: boolean }) {
  const contenu = (
    <>
      {/* Hauteur fixe, largeur selon la photo : affiche verticale, carré ou logo large restent entiers */}
      <img
        src={cld(s.photo, 400)}
        alt={copie ? '' : s.name}
        loading="lazy"
        decoding="async"
        class="h-14 w-auto max-w-[160px] rounded-md border border-sable bg-white object-contain sm:h-16"
      />
      <span class="max-w-[160px] truncate text-xs text-encre/70">{s.name}</span>
    </>
  );
  const cls = 'flex shrink-0 flex-col items-center gap-1';
  return s.url ? (
    <a href={s.url} target="_blank" rel="noopener sponsored" class={`${cls} hover:opacity-80`} tabIndex={copie ? -1 : undefined}>
      {contenu}
    </a>
  ) : (
    <div class={cls}>{contenu}</div>
  );
}

export default function Sponsors({ lang = 'fr' }: { lang?: Lang }) {
  const [liste, setListe] = useState<Sponsor[]>([]);
  const barre = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSponsors()
      .then(setListe)
      .catch(() => {});
  }, []);

  // Place la barre au-dessus du bouton « Faire un don » (téléphone) et réserve l'espace en bas de page
  useEffect(() => {
    if (!liste.length || !barre.current) return;
    const toasts = document.getElementById('toasts');
    const placer = () => {
      const don = document.querySelector<HTMLElement>('[data-barre-don]');
      const hDon = don && getComputedStyle(don).display !== 'none' ? don.offsetHeight : 0;
      const h = barre.current!.offsetHeight;
      barre.current!.style.bottom = `${hDon}px`;
      document.body.style.paddingBottom = `${h + hDon}px`;
      if (toasts) toasts.style.bottom = `${h + hDon + 12}px`;
    };
    placer();
    window.addEventListener('resize', placer);
    return () => {
      window.removeEventListener('resize', placer);
      document.body.style.paddingBottom = '';
      if (toasts) toasts.style.bottom = '';
    };
  }, [liste.length]);

  if (!liste.length) return null;

  // Assez d'éléments pour remplir un grand écran, puis la liste en double pour une boucle sans coupure
  const base = Array.from({ length: Math.max(1, Math.ceil(12 / liste.length)) }, () => liste).flat();
  const duree = Math.max(20, base.length * 3);

  return (
    <div ref={barre} class="fixed inset-x-0 z-30 border-t border-sable bg-creme/95 backdrop-blur" role="region" aria-label={tr(lang).sponsors.titre}>
      <p class="pt-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-encre/60">{tr(lang).sponsors.titre}</p>
      <div class="defile-sponsors relative overflow-hidden py-1.5" dir="ltr">
        <div class="piste-sponsors flex w-max gap-4" style={{ animationDuration: `${duree}s` }}>
          {base.map((s) => (
            <Carte s={s} />
          ))}
          {base.map((s) => (
            <span aria-hidden="true" class="contents">
              <Carte s={s} copie />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
