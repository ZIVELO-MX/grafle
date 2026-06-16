import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // loadEnv reads the correct .env.[mode] file so VITE_APP_URL is available here
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // Canonical URL resolution order:
  // 1. VITE_APP_URL in .env files — explicit, highest priority
  // 2. VERCEL_PROJECT_PRODUCTION_URL — stable alias injected by Vercel (prod only)
  // 3. VERCEL_URL — per-deployment URL injected by Vercel (preview builds)
  // 4. localhost fallback for local dev with no .env.development
  // See docs/urls-and-opengraph.md for full reference.
  const appUrl =
    env.VITE_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:5173')

  const escapedAppUrl = appUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return {
    plugins: [
      react(),
      {
        // Replaces %VITE_APP_URL% in index.html at build/serve time
        name: 'html-env-inject',
        transformIndexHtml(html) {
          return html.replace(/%VITE_APP_URL%/g, appUrl)
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-192.svg', 'icon-512.svg', 'robots.txt'],
        manifest: {
          name: 'Grafle',
          short_name: 'Grafle',
          description: "Connect every edge. Or prove it can't be done.",
          theme_color: '#1e293b',
          background_color: '#f8f7f5',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^${escapedAppUrl}/`),
              handler: 'NetworkFirst',
              options: { cacheName: 'grafle-cache', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } },
            },
          ],
        },
      }),
    ],
    define: {
      // Makes import.meta.env.VITE_APP_URL available in TS/TSX with the resolved value
      'import.meta.env.VITE_APP_URL': JSON.stringify(appUrl),
    },
  }
})
