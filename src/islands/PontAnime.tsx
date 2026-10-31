/**
 * Le pont Saint-Chamond ↔ Zemmoura — version épurée et performante en CSS natif.
 * Carte au trait (France à gauche, Algérie à droite, Méditerranée au milieu),
 * une ligne courbe et de petits colis qui la parcourent via CSS offset-path (0 dépendance externe).
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
  const [colisBonus, setColisBonus] = useState<number[]>([]);
  const premier = useRef(true);

  // Chiffres en temps réel + animation de nouveau colis à chaque don
  useEffect(
    () =>
      watchStats((s) => {
        setStats(s);
        if (premier.current) {
          premier.current = false;
        } else {
          // Ajoute un colis éphémère lors d'une mise à jour de stats
          const id = Date.now();
          setColisBonus((prev) => [...prev, id]);
        }
      }),
    [],
  );

  const retirerBonus = (id: number) => {
    setColisBonus((prev) => prev.filter((item) => item !== id));
  };

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
      <style>{`
        .pont-ligne-trace {
          stroke-dasharray: 260;
          stroke-dashoffset: 260;
          animation: animerTracePont 1.4s ease-out forwards;
        }
        @keyframes animerTracePont {
          to { stroke-dashoffset: 0; }
        }
        .pont-colis-base {
          offset-path: path('${CHEMIN}');
          offset-rotate: 0deg;
          transform-box: fill-box;
          transform-origin: center;
          animation: animerTrajetColis 6s ease-in-out infinite;
          opacity: 0;
        }
        .pont-colis-1 {
          animation-delay: 1.4s;
        }
        .pont-colis-2 {
          animation-delay: 4.4s;
        }
        .pont-colis-bonus {
          offset-path: path('${CHEMIN}');
          offset-rotate: 0deg;
          transform-box: fill-box;
          transform-origin: center;
          animation: animerTrajetBonus 3s ease-in-out forwards;
        }
        @keyframes animerTrajetColis {
          0% { offset-distance: 0%; opacity: 0; }
          6% { opacity: 1; }
          90% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes animerTrajetBonus {
          0% { offset-distance: 0%; opacity: 0; transform: scale(0.8); }
          10% { opacity: 1; transform: scale(1.3); }
          85% { opacity: 1; transform: scale(1.1); }
          100% { offset-distance: 100%; opacity: 0; transform: scale(0.8); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pont-ligne-trace {
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }
          .pont-colis-base, .pont-colis-bonus {
            display: none !important;
          }
        }
      `}</style>

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
        <path class="pont-ligne-trace" d={CHEMIN} fill="none" stroke="#D9622B" stroke-width="1.6" stroke-linecap="round" />

        {/* Villes */}
        <circle cx="92" cy="112" r="4" fill="#1F1B18" />
        <text x="92" y="130" text-anchor="middle" font-size="11" fill="#1F1B18">
          {p.stChamond}
        </text>
        <circle cx="318" cy="136" r="4" fill="#D9622B" />
        <text x="318" y="154" text-anchor="middle" font-size="11" fill="#1F1B18">
          {p.zemmoura}
        </text>

        {/* Colis animés en boucle en CSS natif */}
        <g class="pont-colis-base pont-colis-1">
          <rect x="-5" y="-4" width="10" height="8" rx="1.5" fill="#F4A300" />
        </g>
        <g class="pont-colis-base pont-colis-2">
          <rect x="-5" y="-4" width="10" height="8" rx="1.5" fill="#F4A300" />
        </g>

        {/* Colis éphémères déclenchés lors d'une mise à jour */}
        {colisBonus.map((id) => (
          <g key={id} class="pont-colis-bonus" onAnimationEnd={() => retirerBonus(id)}>
            <rect x="-6" y="-5" width="12" height="10" rx="2" fill="#E63946" />
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
