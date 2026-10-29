/**
 * Le pont Saint-Chamond ↔ Zemmoura — version épurée.
 * Carte au trait (France à gauche, Algérie à droite, Méditerranée au milieu),
 * une ligne courbe et de petits colis qui la parcourent (GSAP MotionPath).
 * Les chiffres sont lus en temps réel depuis Firestore (stats/global) ;
 * à chaque nouvelle valeur, un colis supplémentaire traverse.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { watchStats } from '../lib/api';
import type { GlobalStats } from '../lib/types';
import { formatEuro } from '../lib/labels';
import { tr, type Lang } from '../i18n';

const CHEMIN = 'M92 112 C150 30 260 30 318 136';

export default function PontAnime({ lang = 'fr' }: { lang?: Lang }) {
  const T = tr(lang);
  const p = T.pont;
  const svgRef = useRef<SVGSVGElement>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const envoyer = useRef<(() => void) | null>(null);
  const premier = useRef(true);

  // Animation GSAP (chargée à la demande)
  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: { revert: () => void } | undefined;
    let annule = false;

    (async () => {
      const [{ gsap }, { MotionPathPlugin }] = await Promise.all([import('gsap'), import('gsap/MotionPathPlugin')]);
      if (annule || !svgRef.current) return;
      gsap.registerPlugin(MotionPathPlugin);
      const svg = svgRef.current;
      const ligne = svg.querySelector<SVGPathElement>('.ligne-pont')!;
      const trajet = { path: ligne, align: ligne, alignOrigin: [0.5, 0.5] as [number, number] };

      ctx = gsap.context(() => {
        // La ligne se dessine, puis deux colis la parcourent tranquillement
        const L = ligne.getTotalLength();
        gsap.fromTo(ligne, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: reduit ? 0 : 1.4, ease: 'power2.out' });
        if (reduit) return;
        svg.querySelectorAll<SVGGElement>('.colis-boucle').forEach((c, i) => {
          gsap.to(c, {
            motionPath: trajet,
            duration: 6,
            repeat: -1,
            delay: 1.4 + i * 3,
            ease: 'sine.inOut',
            onStart: () => gsap.set(c, { opacity: 1 }),
          });
        });
      }, svg);

      // Colis supplémentaire à chaque mise à jour des chiffres
      envoyer.current = () => {
        if (reduit || !svgRef.current) return;
        const modele = svgRef.current.querySelector<SVGGElement>('.colis-boucle');
        if (!modele) return;
        const c = modele.cloneNode(true) as SVGGElement;
        svgRef.current.appendChild(c);
        gsap.fromTo(c, { opacity: 1 }, { motionPath: trajet, duration: 3, ease: 'power1.inOut', onComplete: () => c.remove() });
      };
    })();

    return () => {
      annule = true;
      ctx?.revert();
    };
  }, []);

  // Chiffres en temps réel
  useEffect(
    () =>
      watchStats((s) => {
        setStats(s);
        if (premier.current) premier.current = false;
        else envoyer.current?.();
      }),
    [],
  );

  const chiffres: [string, string][] = stats
    ? [
        [formatEuro(stats.raised), T.stats.collectes],
        [String(stats.families), T.stats.familles],
        [String(stats.couffins), T.stats.couffins],
        [String(stats.volunteers), T.stats.benevoles],
      ]
    : [];

  return (
    <figure class="carte p-5 sm:p-7">
      <svg ref={svgRef} viewBox="0 0 410 210" class="w-full" role="img" aria-labelledby="pont-titre">
        <title id="pont-titre">{p.titre}</title>
        {/* Pays au trait */}
        <g fill="#F3EEE6" stroke="#1F1B18" stroke-opacity="0.25" stroke-width="1">
          <path d="M40 40 L78 28 L104 44 L132 56 L128 92 L134 118 L110 140 L78 134 L50 142 L34 116 L44 90 L22 64 Z" />
          <path d="M262 112 L330 104 L380 116 L392 150 L396 206 L300 206 L268 186 L252 150 Z" />
        </g>
        <text x="74" y="74" text-anchor="middle" font-size="10" fill="#1F1B18" fill-opacity="0.45" letter-spacing="1.5">
          {p.france}
        </text>
        <text x="335" y="182" text-anchor="middle" font-size="10" fill="#1F1B18" fill-opacity="0.45" letter-spacing="1.5">
          {p.algerie}
        </text>
        <text x="205" y="170" text-anchor="middle" font-size="10" font-style="italic" fill="#1D4E89" fill-opacity="0.6">
          {p.mer}
        </text>

        {/* Ligne */}
        <path d={CHEMIN} fill="none" stroke="#1F1B18" stroke-opacity="0.08" stroke-width="1" stroke-dasharray="3 4" />
        <path class="ligne-pont" d={CHEMIN} fill="none" stroke="#D9622B" stroke-width="1.6" stroke-linecap="round" />

        {/* Villes */}
        <circle cx="92" cy="112" r="4" fill="#1F1B18" />
        <text x="92" y="130" text-anchor="middle" font-size="11" fill="#1F1B18">
          {p.stChamond}
        </text>
        <circle cx="318" cy="136" r="4" fill="#D9622B" />
        <text x="318" y="154" text-anchor="middle" font-size="11" fill="#1F1B18">
          {p.zemmoura}
        </text>

        {/* Colis */}
        {[0, 1].map(() => (
          <g class="colis-boucle" opacity="0">
            <rect x="-5" y="-4" width="10" height="8" rx="1.5" fill="#F4A300" />
          </g>
        ))}
      </svg>

      <figcaption class="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-sable/70 pt-5 sm:grid-cols-4" aria-live="polite">
        {stats
          ? chiffres.map(([v, l]) => (
              <span class="block">
                <span class="block font-titre text-2xl tabular-nums text-encre sm:text-[1.7rem]">{v}</span>
                <span class="block text-sm text-encre/60">{l}</span>
              </span>
            ))
          : [0, 1, 2, 3].map(() => <span class="squelette block h-12" />)}
      </figcaption>
    </figure>
  );
}
