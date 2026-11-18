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
        theme_color: '#211b19',
        background_color: '#f7f4ef',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
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
