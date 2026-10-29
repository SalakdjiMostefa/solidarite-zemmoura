/**
 * Configuration centrale du site.
 * Les valeurs viennent de `.env` (préfixe PUBLIC_) ; certaines sont
 * ensuite écrasées en direct par Firestore (settings/donation, settings/contact).
 */
// `process.env` sert de repli pour le script de seed (exécuté hors Vite)
const env = (import.meta.env ?? process.env) as ImportMetaEnv;

export const SITE = {
  name: 'Solidarité Zemmoura',
  nameAr: 'تضامن زمورة',
  tagline: "D'une rive à l'autre",
  description:
    "Association solidaire basée à Saint-Chamond (Loire) qui agit à Zemmoura (Bordj Bou Arréridj, Algérie) : Ramadan, Aïds, fin d'année et aide aux familles.",
  url: env.PUBLIC_SITE_URL || 'https://solidarite-zemoura.web.app',
  author: 'Salakdji M',
  // Placeholders à remplacer par les vraies informations légales
  legal: {
    rna: 'W000000000',
    siret: 'À compléter',
    address: 'Saint-Chamond (42400), France',
    president: 'À compléter',
  },
} as const;

export const FIREBASE_CONFIG = {
  apiKey: env.PUBLIC_FIREBASE_API_KEY,
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.PUBLIC_FIREBASE_APP_ID,
};

/** Vrai si les clés Firebase sont renseignées (sinon : mode démo avec données locales). */
export const FIREBASE_READY = Boolean(env.PUBLIC_FIREBASE_API_KEY && env.PUBLIC_FIREBASE_PROJECT_ID);

export const CLOUDINARY = {
  cloudName: env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: env.PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

export const DEFAULT_BANK = {
  holder: env.PUBLIC_BANK_HOLDER || 'Association Solidarité Zemmoura',
  iban: env.PUBLIC_BANK_IBAN || 'FR76 3000 4006 5700 0101 2528 482',
  bic: env.PUBLIC_BANK_BIC || 'BNPAFRPPXXX',
};

export const DEFAULT_CONTACT = {
  email: env.PUBLIC_CONTACT_EMAIL || 'solidarite.zemmourah@gmail.com',
  phone: env.PUBLIC_CONTACT_PHONE || '+33660419728',
  /** Second numéro (facultatif) */
  phone2: env.PUBLIC_CONTACT_PHONE2 || '+33679855431',
  whatsapp: env.PUBLIC_CONTACT_WHATSAPP || '33660419728',
  facebook: env.PUBLIC_CONTACT_FACEBOOK || 'https://www.facebook.com/Solidarite.Zemmoura',
  youtube: env.PUBLIC_CONTACT_YOUTUBE || 'https://www.youtube.com/watch?v=ZsBnF7q8NZA',
  tiktok: env.PUBLIC_CONTACT_TIKTOK || 'https://www.tiktok.com/@association.solid08',
};

/** Numéro au format français lisible : +33660419728 → 06 60 41 97 28 */
export const formatTel = (tel: string) =>
  tel
    .replace(/^\+33/, '0')
    .replace(/\D/g, '')
    .replace(/(\d{2})(?=\d)/g, '$1 ')
    .trim();

/** Navigation principale (libellés dans src/i18n, clé « nav ») */
export const NAV = [
  { href: '/', cle: 'accueil' },
  { href: '/association', cle: 'association' },
  { href: '/evenements', cle: 'evenements' },
  { href: '/realisations', cle: 'realisations' },
  { href: '/benevole', cle: 'benevole' },
  { href: '/aide', cle: 'aide' },
  { href: '/contact', cle: 'contact' },
] as const;
