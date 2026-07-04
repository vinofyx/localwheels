import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // base: '/' ensures all asset URLs start with '/' (absolute paths).
  // Required for:
  //   • React Router — sub-route navigation (e.g. /dashboard/settings)
  //   • Hostinger — assets must be addressable from any depth of the URL tree
  //   • Nginx / Apache reverse-proxies serving from document root
  base: '/',

  server: {
    port: 8081,
    host: '0.0.0.0',   // Listen on all interfaces (IPv4 + IPv6) — fixes ::1 vs 127.0.0.1 issue
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
    // Output to frontend/dist — required for Hostinger (Root Directory: frontend, Output: dist)
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
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
