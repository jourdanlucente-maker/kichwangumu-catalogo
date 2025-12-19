import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for drag-and-drop hosting
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});