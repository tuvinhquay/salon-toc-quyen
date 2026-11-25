import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const isTermux = Boolean(process.env.TERMUX_VERSION);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Salon TÓC QUYỀN',
        short_name: 'TÓC QUYỀN',
        description: 'Ứng dụng quản lý salon dành cho chủ tiệm',
        lang: 'vi',
        theme_color: '#06352d',
        background_color: '#041f1b',
        display: 'standalone',
        start_url: '/',
        icons: [\n          { src: '/icons/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },\n          { src: '/icons/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },\n          { src: '/icons/pwa-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },\n        ],
      },
      workbox: {
        // Android ARM64 Termux has a known Rollup/Terser worker early-exit issue.
        // Termux uses an unminified SW; CI and production environments stay optimized.
        mode: isTermux ? 'development' : 'production',
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
