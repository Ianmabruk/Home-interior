import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { compression } from 'vite-plugin-compression2'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // IMPORTANT: do NOT precache the app shell (index.html) and do NOT use a
      // navigateFallback. Previously the SW precached index.html and served it
      // from cache on every repeat visit, so even after Netlify redeployed with
      // a new JS bundle the browser kept loading the OLD html -> OLD js. That is
      // why navbar/footer fixes "never appeared" in production. Now only static
      // assets (hashed js/css/svg/woff2) are precached; navigations are fetched
      // fresh from the network every time (NetworkFirst below), so a new deploy
      // is picked up on the very next page load. clientsClaim + skipWaiting still
      // swap the SW itself immediately on deploy.
      workbox: {
        globPatterns: ['**/*.{js,css,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: null,
        // Never let the SW cache/handle API calls as navigations.
        navigateFallbackDenylist: [/^\/api/, /\/api\//],
        runtimeCaching: [
          {
            // App shell navigations (index.html) — always fetch from the network
            // first so a redeploy is reflected immediately. Do NOT cache the HTML
            // to avoid hydration mismatches when a new SW serves cached HTML with
            // new JS. Falls back to cache only when offline (opaque responses).
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' && url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 10,
              // Do not cache HTML responses — prevents hydration mismatch when
              // a new SW serves stale HTML with new JS. Only opaque responses
              // (offline fallback) are cached.
              cacheableResponse: { statuses: [0] },
            },
          },
          {
            // Cloudinary images — cache-first, they are immutable per URL.
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\/image\/upload\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cloudinary videos — cache-first with range support for seeking.
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*\/video\/upload\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-videos',
              rangeRequests: true,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Read-only public content/product APIs — NetworkFirst so admin
            // uploads appear on the public site immediately. The cache is only
            // used as an offline fallback (clientsClaim + skipWaiting keep the
            // SW fresh on deploy). Without this, StaleWhileRevalidate served
            // cached API responses for up to 5 minutes, making admin content
            // "not appear" on the user site.
            urlPattern: /\/api\/(content|products)(\/.*)?$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-content',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'HOK Interior Designs',
        short_name: 'HOK',
        description: 'Luxury interior design, curated furniture, and premium virtual design services.',
        theme_color: '#f5f1ea',
        background_color: '#f5f1ea',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
    compression({
      algorithms: ['gzip', 'brotliCompress'],
      exclude: [/\.svg$/, /\.woff2$/, /\.webp$/],
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    historyApiFallback: true,
  },
  build: {
    // es2020 lets Vite/Rolldown emit modern syntax without legacy helpers
    // (optional chaining, nullish coalescing), shrinking the JS and cutting
    // main-thread parse/exec time (TBT) on mobile.
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        // Split heavy vendors into their own long-term-cacheable chunks so the
        // initial app chunk stays small and unchanged vendors are served from
        // cache on repeat visits. This directly cuts main-thread parse/exec
        // time on mobile.
        // Keep the default chunking strategy to avoid vendor bundle issues
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
