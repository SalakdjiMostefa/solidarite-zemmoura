/**
 * Thème saisonnier automatique.
 * Le calendrier hégirien est obtenu via Intl (calendrier umm al-qura), sans dépendance.
 *  - Ramadan          : mois 9
 *  - Aïd el-Fitr      : 1er au 3 Chawwal (mois 10)
 *  - Aïd el-Kebir     : 9 au 13 Dhou al-hijja (mois 12)
 *  - Fin d'année      : 15 décembre → 5 janvier
 */
import type { ThemeMode } from './types';

export type Season = 'ramadan' | 'aid' | 'fin-annee' | null;

const hijriFmt = new Intl.DateTimeFormat('fr-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric' });

export function hijriParts(date: Date): { day: number; month: number } | null {
  try {
    const parts = hijriFmt.formatToParts(date);
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    if (!day || !month) return null;
    return { day, month };
  } catch {
    return null;
  }
}

export function seasonFor(date = new Date()): Season {
  const h = hijriParts(date);
  if (h) {
    if (h.month === 9) return 'ramadan';
    if (h.month === 10 && h.day <= 3) return 'aid';
    if (h.month === 12 && h.day >= 9 && h.day <= 13) return 'aid';
  }
  const m = date.getMonth(); // 0 = janvier
  const d = date.getDate();
  if ((m === 11 && d >= 15) || (m === 0 && d <= 5)) return 'fin-annee';
  return null;
}

/** Applique le réglage admin (auto / off / forcé) */
export function resolveSeason(mode: ThemeMode, date = new Date()): Season {
  if (mode === 'off') return null;
  if (mode === 'auto') return seasonFor(date);
  return mode;
}
