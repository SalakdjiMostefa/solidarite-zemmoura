/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/vanillajs" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_FIREBASE_API_KEY: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  readonly PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly PUBLIC_FIREBASE_APP_ID: string;
  readonly PUBLIC_CLOUDINARY_CLOUD_NAME: string;
  readonly PUBLIC_CLOUDINARY_UPLOAD_PRESET: string;
  readonly PUBLIC_BANK_HOLDER: string;
  readonly PUBLIC_BANK_IBAN: string;
  readonly PUBLIC_BANK_BIC: string;
  readonly PUBLIC_CONTACT_EMAIL: string;
  readonly PUBLIC_CONTACT_PHONE: string;
  readonly PUBLIC_CONTACT_PHONE2: string;
  readonly PUBLIC_CONTACT_WHATSAPP: string;
  readonly PUBLIC_CONTACT_FACEBOOK: string;
  readonly PUBLIC_CONTACT_YOUTUBE: string;
  readonly PUBLIC_CONTACT_TIKTOK: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
