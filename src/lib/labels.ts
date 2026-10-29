/** Libellés, couleurs et utilitaires d'affichage (français / arabe) */
import type { EventLocation, EventType } from './types';
import { lien, LOCALE, type Lang } from '../i18n';

export const TYPE_META: Record<EventType, { label: string; labelAr: string; color: string; chip: string }> = {
  ramadan: { label: 'Ramadan', labelAr: 'رمضان', color: '#16234A', chip: 'bg-nuit text-white' },
  'aid-fitr': { label: 'Aïd el-Fitr', labelAr: 'عيد الفطر', color: '#F4A300', chip: 'bg-safran text-encre' },
  'aid-kebir': { label: 'Aïd el-Kebir', labelAr: 'عيد الأضحى', color: '#0B8F4D', chip: 'bg-emerald text-white' },
  'fin-annee': { label: "Fin d'année", labelAr: 'نهاية السنة', color: '#E63946', chip: 'bg-grenade text-white' },
  'action-zemoura': { label: 'Action Zemmoura', labelAr: 'مبادرة زمورة', color: '#D9622B', chip: 'bg-terracotta text-white' },
  sport: { label: 'Sport', labelAr: 'رياضة', color: '#1D4E89', chip: 'bg-loire text-white' },
  autre: { label: 'Autre', labelAr: 'أخرى', color: '#6B625A', chip: 'bg-encre text-white' },
};

export const LOCATION_LABEL: Record<EventLocation, string> = {
  zemoura: 'Zemmoura',
  'saint-chamond': 'Saint-Chamond',
  autre: 'Autre lieu',
};

const LIEU_AR: Record<EventLocation, string> = { zemoura: 'زمورة', 'saint-chamond': 'سان شامون', autre: 'مكان آخر' };

export const typeLabel = (t: EventType, lang: Lang = 'fr') => (lang === 'ar' ? TYPE_META[t].labelAr : TYPE_META[t].label);
export const lieuLabel = (l: EventLocation, lang: Lang = 'fr') => (lang === 'ar' ? LIEU_AR[l] : LOCATION_LABEL[l]);

const fmt = (lang: Lang, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE[lang], o);
const euroFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const formatDate = (ms: number, lang: Lang = 'fr') =>
  fmt(lang, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms));
export const formatTime = (ms: number, lang: Lang = 'fr') => fmt(lang, { hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
export const formatEuro = (n: number) => euroFmt.format(n || 0);

export function formatRange(start: number, end: number, lang: Lang = 'fr'): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return `${formatDate(start, lang)} · ${formatTime(start, lang)}–${formatTime(end, lang)}`;
  return lang === 'ar'
    ? `من ${formatDate(start, lang)} إلى ${formatDate(end, lang)}`
    : `du ${formatDate(start, lang)} au ${formatDate(end, lang)}`;
}

/** Transforme un titre en slug d'URL */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Référence de virement automatique : type + année (ex. RAMADAN2027) */
export function autoDonationRef(type: EventType, startAt: number): string {
  const y = new Date(startAt).getFullYear();
  const map: Record<EventType, string> = {
    ramadan: `RAMADAN${y}`,
    'aid-fitr': `AIDFITR${y}`,
    'aid-kebir': `AIDKEBIR${y}`,
    'fin-annee': `FINANNEE${y}`,
    'action-zemoura': `ZEMMOURA${y}`,
    sport: `SPORT${y}`,
    autre: `DON${y}`,
  };
  return map[type];
}

/** URL publique et partageable d'une fiche événement */
export const eventUrl = (slug: string, lang: Lang = 'fr') => `${lien('/evenements/voir', lang)}?id=${encodeURIComponent(slug)}`;

/** Optimisation d'URL Cloudinary (format/qualité auto + largeur) */
export function cld(url: string | undefined, width = 800): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || url.includes('/f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

/** Lien WhatsApp de partage */
export const whatsappShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;
