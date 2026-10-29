/**
 * Calendrier : date du jour (grégorien + hégire), fêtes musulmanes et jours fériés français.
 * Les dates de l'hégire viennent de Intl (calendrier Umm al-Qura) : indicatives,
 * elles peuvent différer d'un jour de l'observation locale du croissant.
 */
import { LOCALE, type Lang } from '../i18n';

export interface DateFete {
  cle: string;
  date: Date;
  jours: number;
}

const JOUR_MS = 86_400_000;

export const minuit = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Nombre de jours calendaires entre deux dates (heure ignorée) */
export const joursEntre = (de: Date, a: Date) => Math.round((minuit(a).getTime() - minuit(de).getTime()) / JOUR_MS);

const hijriNum = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });

export function hijri(d: Date): { jour: number; mois: number; annee: number } {
  const p = hijriNum.formatToParts(d);
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { jour: v('day'), mois: v('month'), annee: v('year') };
}

/** Fêtes musulmanes : (mois, jour) de l'hégire */
const FETES_MUSULMANES: { cle: string; mois: number; jour: number }[] = [
  { cle: 'ras-el-am', mois: 1, jour: 1 },
  { cle: 'achoura', mois: 1, jour: 10 },
  { cle: 'mawlid', mois: 3, jour: 12 },
  { cle: 'isra', mois: 7, jour: 27 },
  { cle: 'ramadan', mois: 9, jour: 1 },
  { cle: 'qadr', mois: 9, jour: 27 },
  { cle: 'fitr', mois: 10, jour: 1 },
  { cle: 'arafat', mois: 12, jour: 9 },
  { cle: 'adha', mois: 12, jour: 10 },
];

/** Prochaine occurrence de chaque fête musulmane (dans les 400 jours), triées par date */
export function fetesMusulmanes(aujourdhui = new Date()): DateFete[] {
  const debut = minuit(aujourdhui);
  const trouvees = new Map<string, DateFete>();
  for (let i = 0; i <= 400 && trouvees.size < FETES_MUSULMANES.length; i++) {
    const d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
    const h = hijri(d);
    for (const f of FETES_MUSULMANES) {
      if (!trouvees.has(f.cle) && h.mois === f.mois && h.jour === f.jour) trouvees.set(f.cle, { cle: f.cle, date: d, jours: i });
    }
  }
  return [...trouvees.values()].sort((a, b) => a.jours - b.jours);
}

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher, calendrier grégorien) */
export function paques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois - 1, jour);
}

function feriesAnnee(annee: number): { cle: string; date: Date }[] {
  const p = paques(annee);
  const plus = (n: number) => new Date(p.getFullYear(), p.getMonth(), p.getDate() + n);
  return [
    { cle: 'jour-an', date: new Date(annee, 0, 1) },
    { cle: 'paques', date: plus(1) },
    { cle: 'travail', date: new Date(annee, 4, 1) },
    { cle: 'victoire', date: new Date(annee, 4, 8) },
    { cle: 'ascension', date: plus(39) },
    { cle: 'pentecote', date: plus(50) },
    { cle: 'nationale', date: new Date(annee, 6, 14) },
    { cle: 'assomption', date: new Date(annee, 7, 15) },
    { cle: 'toussaint', date: new Date(annee, 10, 1) },
    { cle: 'armistice', date: new Date(annee, 10, 11) },
    { cle: 'noel', date: new Date(annee, 11, 25) },
  ];
}

/** Jours fériés français des 12 prochains mois, triés par date */
export function joursFeries(aujourdhui = new Date()): DateFete[] {
  const debut = minuit(aujourdhui);
  const y = debut.getFullYear();
  return [...feriesAnnee(y), ...feriesAnnee(y + 1)]
    .map((f) => ({ ...f, jours: joursEntre(debut, f.date) }))
    .filter((f) => f.jours >= 0 && f.jours <= 366)
    .sort((a, b) => a.jours - b.jours);
}

/** Formats d'affichage */
export const dateLongue = (d: Date, lang: Lang) =>
  new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

export const dateCourte = (d: Date, lang: Lang) =>
  new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'long' }).format(d);

export const dateHijri = (d: Date, lang: Lang) =>
  new Intl.DateTimeFormat(`${LOCALE[lang]}-u-ca-islamic-umalqura-nu-latn`, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(d)
    .replace(/\s?AH$/, lang === 'fr' ? ' H' : '');
