/**
 * Carrousel de photos : balayage au doigt (scroll-snap), flèches précédent/suivant,
 * points cliquables, compteur et flèches du clavier. Fonctionne aussi en arabe (RTL).
 */
import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  photos: { src: string; alt: string }[];
  label: string;
  /** Classe de ratio des images (ex. aspect-[16/10]) */
  ratio?: string;
}

export function Carrousel({ photos, label, ratio = 'aspect-[16/10]' }: Props) {
  const piste = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const n = photos.length;

  // Met à jour l'index pendant le défilement (photo la plus visible)
  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entrees) => entrees.forEach((e) => e.isIntersecting && setIndex(Number((e.target as HTMLElement).dataset.i))),
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll('[data-i]').forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [n]);

  const aller = (i: number) => {
    const el = piste.current;
    if (!el) return;
    const cible = (i + n) % n;
    setIndex(cible);
    // Largeur réelle d'une photo ; en RTL, scrollLeft est négatif
    const largeur = el.scrollWidth / n;
    const sens = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: sens * cible * largeur, behavior: reduit ? 'auto' : 'smooth' });
  };

  const fleche = 'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-encre shadow-carte transition hover:bg-white';

  return (
    <div
      class="relative"
      role="region"
      aria-roledescription="carrousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        const rtl = document.documentElement.dir === 'rtl';
        if (e.key === 'ArrowRight') aller(index + (rtl ? -1 : 1));
        if (e.key === 'ArrowLeft') aller(index + (rtl ? 1 : -1));
      }}
    >
      <div ref={piste} class="defile-x snap-x snap-mandatory gap-0 pb-0 sm:rounded-xl2">
        {photos.map((p, i) => (
          <img
            data-i={i}
            src={p.src}
            alt={p.alt}
            class={`${ratio} w-full shrink-0 snap-start object-cover`}
            loading={i === 0 ? 'eager' : 'lazy'}
            width={1200}
            height={750}
          />
        ))}
      </div>

      {n > 1 && (
        <>
          {/* Flèches : précédent à gauche en français, à droite en arabe (propriétés logiques) */}
          <button type="button" class={`${fleche} start-3`} onClick={() => aller(index - 1)} aria-label="‹">
            <span aria-hidden="true" class="rtl:rotate-180">
              ‹
            </span>
          </button>
          <button type="button" class={`${fleche} end-3`} onClick={() => aller(index + 1)} aria-label="›">
            <span aria-hidden="true" class="rtl:rotate-180">
              ›
            </span>
          </button>

          {/* Compteur + points */}
          <span class="absolute end-3 top-3 rounded-full bg-encre/70 px-2.5 py-0.5 text-sm tabular-nums text-white" dir="ltr">
            {index + 1} / {n}
          </span>
          <div class="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                type="button"
                onClick={() => aller(i)}
                aria-label={`${i + 1} / ${n}`}
                aria-current={i === index}
                class="flex h-6 w-6 items-center justify-center"
              >
                <span class={`block h-2 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-2 bg-white/60'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
