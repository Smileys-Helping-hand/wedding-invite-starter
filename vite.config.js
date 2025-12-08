import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/storage', 'firebase/firestore'],
          'qr-vendor': ['html5-qrcode', 'qrcode'],
          'ui-vendor': ['framer-motion', 'chart.js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
