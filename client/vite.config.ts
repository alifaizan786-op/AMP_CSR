import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api requests to the Express API on port 3001 to avoid CORS in development
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});