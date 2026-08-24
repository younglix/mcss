import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      // Mirrors nginx's production routing (see backend/README.md) so the
      // app can always call relative /api/v1 and /ws paths regardless of
      // environment. Point this at wherever `manage.py runserver` is
      // listening locally.
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true },
    },
  },
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mcss-logo.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
      manifest: {
        name: 'MCSS Portal',
        short_name: 'MCSS',
        description: 'Mount Carmel Secondary School portal platform',
        theme_color: '#4A0F6E',
        background_color: '#f9f9f9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/mcss-logo.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
    }),
  ],
});
