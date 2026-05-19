import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        // No rewrite — backend routes are now mounted under /api/
      },
      '/uploads': 'http://localhost:5000',
    },
  },

  build: {
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Third-party vendors ──────────────────────────────────────
          // Recharts + its D3 dependencies are huge — isolate them
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-')       ||
              id.includes('node_modules/victory'))   return 'charts';

          // Everything else from node_modules goes in one vendor chunk
          // (keeps React, Router, axios, etc. together → no circular refs)
          if (id.includes('node_modules/')) return 'vendor';

          // ── App pages ────────────────────────────────────────────────
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
