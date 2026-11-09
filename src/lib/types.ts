/** Types partagés (Firestore ↔ interface) */

export const EVENT_TYPES = ['ramadan', 'aid-fitr', 'aid-kebir', 'fin-annee', 'action-zemoura', 'sport', 'autre'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const LOCATIONS = ['zemoura', 'saint-chamond', 'autre'] as const;
export type EventLocation = (typeof LOCATIONS)[number];

export interface EventReport {
  text: string;
  /** Bilan en arabe (facultatif) */
  textAr?: string;
  photos: string[];
}

export interface AssoEvent {
  id: string;
  slug: string;
  title: string;
  titleAr?: string;
  type: EventType;
  /** Dates en millisecondes (converties depuis Timestamp Firestore) */
  startAt: number;
  endAt: number;
  location: EventLocation;
  address?: string;
  description: string;
  /** Description en arabe (facultatif, sinon le texte français est affiché) */
  descriptionAr?: string;
  coverImage?: string;
  /** Crédit de la photo de couverture (obligatoire pour les licences Creative Commons) */
  coverCredit?: string;
  gallery: string[];
  goalAmount?: number;
  raisedAmount?: number;
  donationRef?: string;
  volunteersNeeded?: boolean;
  volunteersCount?: number;
  report?: EventReport;
  /** Résultat obtenu, affiché en grand sur la page Réalisations (ex. « 180 couffins distribués ») */
  result?: string;
  resultAr?: string;
  /** Nombre de familles aidées (additionné dans le bilan de l'année) */
  families?: number;
  /** Photo de couverture choisie comme grande photo de son année (page Réalisations) */
  yearCover?: boolean;
  status: 'draft' | 'published';
  hidden?: boolean;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
}

export interface GlobalStats {
  raised: number;
  families: number;
  couffins: number;
  volunteers: number;
}

export interface DonationSettings {
  holder: string;
  iban: string;
  bic: string;
  amounts: { value: number; impact: string; impactAr?: string }[];
  taxReceipt: boolean;
  /** Lien vers la campagne ou le formulaire de don HelloAsso (carte bancaire) */
  helloAssoUrl?: string;
}

export interface ContactSettings {
  email: string;
  phone: string;
  phone2?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp: string;
  facebook: string;
}

export type ThemeMode = 'auto' | 'off' | 'ramadan' | 'aid' | 'fin-annee';

export interface ThemeSettings {
  /** auto = calcul par la date ; off = jamais ; sinon thème forcé */
  mode: ThemeMode;
}

export type AdminRole = 'editor' | 'superadmin';

export interface AdminProfile {
  uid: string;
  email: string;
  name?: string;
  role: AdminRole;
}

/** Un responsable affiché sur la page « L'association » */
export interface TeamMember {
  name: string;
  role: string;
  /** Rôle en arabe (facultatif) */
  roleAr?: string;
  /** Photo (facultative) — sinon l'initiale est affichée */
  photo?: string;
}

/** Une section de l'équipe, ex. « Responsables en France » */
export interface TeamSection {
  title: string;
  titleAr?: string;
  members: TeamMember[];
}

export interface TeamSettings {
  sections: TeamSection[];
}

/** Textes et informations légales de l'association, modifiables dans Admin → Réglages */
export interface AssociationSettings {
  /** « Notre histoire » : deux paragraphes */
  histoire1: string;
  histoire2: string;
  /** Version arabe (facultative ; sinon la traduction d'origine du site s'affiche) */
  histoire1Ar?: string;
  histoire2Ar?: string;
  rna: string;
  siret: string;
  /** Président(e), affiché comme directeur de la publication dans les mentions légales */
  president: string;
  /** Adresse du siège */
  address: string;
  /** Nom de la banque */
  bankName: string;
}
