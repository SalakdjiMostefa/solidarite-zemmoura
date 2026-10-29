// Configuration Astro — Solidarité Zemmoura
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const SITE_URL = env.PUBLIC_SITE_URL || 'https://solidarite-zemoura.web.app';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    preact(),
    // L'espace admin n'a rien à faire dans le sitemap
    sitemap({ filter: (page) => !page.includes('/admin') }),
    AstroPWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'images/logo.png', 'icons/*.png', 'og-image.png'],
      manifest: {
        name: 'Solidarité Zemmoura — تضامن زمورة',
        short_name: 'Solidarité Zemmoura',
        description: "Association solidaire entre Saint-Chamond et Zemmoura : événements, actions et dons.",
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        background_color: '#FBF8F3',
        theme_color: '#0B8F4D',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Pas de navigateFallback : il renverrait l'accueil pour /don, /contact…
        // Les pages HTML passent par le cache NetworkFirst ci-dessous (dernière version consultée).
        navigateFallback: null,
        globPatterns: ['**/*.{css,js,svg,png,webp,woff2,ico}'],
        // Cache « dernière version consultée » : pages en NetworkFirst, images Cloudinary en CacheFirst
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages', networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photos',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'polices', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
