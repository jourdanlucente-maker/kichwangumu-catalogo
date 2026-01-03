import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Change from './' to '/' for proper BrowserRouter support
  build: {
    target: 'es2015', // Aumenta compatibilidad con Safari iOS
    outDir: 'dist',
    assetsDir: 'assets',
  }
});