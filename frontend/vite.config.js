import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 8080,
    // Dev proxy: forwards /api/* → localhost:5000/api/* so you don't need VITE_API_URL locally
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-')       ||
            id.includes('node_modules/victory')
          ) return 'charts';

          if (id.includes('node_modules/')) return 'vendor';

          if (id.includes('/pages/config/'))          return 'pg-config';
          if (id.includes('/pages/account-entries/')) return 'pg-account-entries';
          if (id.includes('/pages/account-reports/')) return 'pg-account-reports';
          if (id.includes('/pages/mis/'))             return 'pg-mis';
          if (id.includes('/pages/tracking/'))        return 'pg-tracking';
          if (id.includes('/pages/modify/'))          return 'pg-modify';
          if (id.includes('/pages/reports/'))         return 'pg-reports';
          if (id.includes('/pages/master/'))          return 'pg-master';
          if (id.includes('/pages/entries/'))         return 'pg-entries';
          if (id.includes('/pages/switch/'))          return 'pg-misc';
        },
      },
    },
  },
});
