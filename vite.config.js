import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import Inspect from 'vite-plugin-inspect';
import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins: [
    react(),
    Inspect(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'assets/marble-envelope.png',
        'assets/wax-seal-gold.png',
        'assets/floral-panel.png',
        'assets/golden-hour-piano.mp3',
      ],
      manifest: {
        name: 'Razia & Abduraziq Engagement',
        short_name: 'Razia & Raaziq',
        description: 'Luxury Islamic engagement invitation experience.',
        theme_color: '#f5e6b2',
        background_color: '#fdfaf3',
        display: 'standalone',
        icons: [
          {
            src: '/assets/emblem-gold.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/$/, /^\/invite/, /^\/admin/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => ['/', '/invite', '/admin'].some((path) =>
              url.pathname.startsWith(path)
            ),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 12 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
    ...(analyze
      ? [
          visualizer({
            filename: 'dist/stats.html',
            template: 'sunburst',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
  optimizeDeps: {
    include: [
      'canvas-confetti',
      'howler',
      'firebase/app',
      'firebase/firestore',
      'firebase/storage',
      'firebase/auth',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/constants.js'],
    },
  },
});
