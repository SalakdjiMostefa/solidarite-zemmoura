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
