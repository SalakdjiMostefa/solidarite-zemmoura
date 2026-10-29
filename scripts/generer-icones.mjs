/**
 * Génère favicon, icônes PWA et image Open Graph à partir du logo officiel
 * (public/images/logo.png, rond sur fond transparent).
 * Lancement : node scripts/generer-icones.mjs
 * Relancer après avoir remplacé le logo par une version en meilleure définition.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/icons', { recursive: true });
const LOGO = 'public/images/logo.png';
const CREME = '#FBF8F3';

/** Logo redimensionné, posé au centre d'un carré de fond */
async function icone(taille, marge, fond, sortie) {
  const interieur = Math.round(taille * (1 - 2 * marge));
  const logo = await sharp(LOGO).resize(interieur, interieur, { kernel: 'lanczos3' }).png().toBuffer();
  const base = sharp({ create: { width: taille, height: taille, channels: 4, background: fond } });
  await base.composite([{ input: logo, gravity: 'center' }]).png().toFile(sortie);
}

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
await icone(48, 0, transparent, 'public/favicon.png');
await icone(192, 0.02, transparent, 'public/icons/icon-192.png');
await icone(512, 0.02, transparent, 'public/icons/icon-512.png');
await icone(180, 0.08, CREME, 'public/icons/apple-touch-icon.png');
await icone(512, 0.18, CREME, 'public/icons/icon-512-maskable.png'); // zone de sécurité Android

// Image de partage (WhatsApp, Facebook) : sobre, logo + nom
const logoOg = await sharp(LOGO).resize(220, 220, { kernel: 'lanczos3' }).png().toBuffer();
const texte = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${CREME}"/>
  <text x="600" y="420" text-anchor="middle" font-family="Georgia, serif" font-size="68" fill="#1F1B18">Solidarité Zemmoura</text>
  <text x="600" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#9C4319">D'une rive à l'autre · Saint-Chamond ⇄ Zemmoura</text>
  <path d="M0 600 C300 570 600 610 1200 585 V630 H0 Z" fill="#0B8F4D" opacity="0.55"/>
</svg>`);
await sharp(texte)
  .composite([{ input: logoOg, top: 110, left: 490 }])
  .png()
  .toFile('public/og-image.png');

console.log('✓ Favicon, icônes et image Open Graph générées depuis le logo officiel');
