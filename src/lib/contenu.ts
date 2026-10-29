/**
 * Choix du texte d'un événement selon la langue, avec repli sur le français
 * quand la version arabe n'a pas été saisie dans l'admin.
 */
import type { Lang } from '../i18n';
import type { AssoEvent } from './types';

export interface TexteLocalise {
  texte: string;
  /** Langue réelle du texte (pour l'attribut lang et la direction) */
  lang: Lang;
}

const choisir = (fr: string, ar: string | undefined, lang: Lang): TexteLocalise =>
  lang === 'ar' && ar?.trim() ? { texte: ar, lang: 'ar' } : { texte: fr, lang: 'fr' };

export const titreEv = (ev: AssoEvent, lang: Lang) => choisir(ev.title, ev.titleAr, lang);
export const descEv = (ev: AssoEvent, lang: Lang) => choisir(ev.description, ev.descriptionAr, lang);
export const bilanEv = (ev: AssoEvent, lang: Lang) => choisir(ev.report?.text ?? '', ev.report?.textAr, lang);

/** Attributs HTML à poser sur un texte localisé */
export const attrs = (t: TexteLocalise) => ({ lang: t.lang, dir: (t.lang === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr' });
