import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // alias @ → src
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // .tsx/.ts раньше .jsx/.js: чтобы './App' резолвился в App.tsx, а не в legacy App.jsx
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    port: 5173,
    // Прокси на бэкенд опционален: основной путь — VITE_API_BASE_URL.
    // proxy: { '/api': 'http://127.0.0.1:8000' },
  },
});