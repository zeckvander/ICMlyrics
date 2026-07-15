import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path' 

export default defineConfig({
  plugins: [
    react(),
    // REMOVA O BLOCO DO Sitemap AQUI
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: true,
  }
});