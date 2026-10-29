/** Chiffres clés animés quand ils apparaissent à l'écran */
import { useEffect, useRef, useState } from 'preact/hooks';
import { getStats } from '../lib/api';
import type { GlobalStats } from '../lib/types';
import { tr, type Lang, type Dico } from '../i18n';

const ITEMS: { key: keyof GlobalStats; label: keyof Dico['stats']; suffixe?: string }[] = [
  { key: 'raised', label: 'collectes', suffixe: ' €' },
  { key: 'families', label: 'familles' },
  { key: 'couffins', label: 'couffinsDistribues' },
  { key: 'volunteers', label: 'benevoles' },
];

function Compteur({ cible, actif, suffixe = '' }: { cible: number; actif: boolean; suffixe?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!actif) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(cible);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1600);
      setV(Math.round(cible * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cible, actif]);
  return (
    <>
      {v.toLocaleString('fr-FR')}
      {suffixe}
    </>
  );
}

export default function ChiffresCles({ lang = 'fr' }: { lang?: Lang }) {
  const t = tr(lang).stats;
  const ref = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getStats().then(setStats);
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && (setVisible(true), obs.disconnect()), { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ITEMS.map((it) => (
        <div class="border-t border-sable pt-4">
          <p class={`font-titre text-3xl tabular-nums text-encre sm:text-4xl`}>
            {stats ? <Compteur cible={stats[it.key]} actif={visible} suffixe={it.suffixe} /> : '—'}
          </p>
          <p class="mt-1 text-sm text-encre/60">{t[it.label]}</p>
        </div>
      ))}
    </div>
  );
}
