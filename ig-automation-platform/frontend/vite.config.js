import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development the dashboard (5173) proxies /api to the backend (4000), so the
// browser sees a single origin — the same as production behind Nginx. That keeps the
// SameSite=Strict session cookie working and means no API URL lives in frontend code.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: false },
    },
  },
});
