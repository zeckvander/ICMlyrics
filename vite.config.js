import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path' 
import Sitemap from 'vite-plugin-sitemap' // 1. Importe o plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    Sitemap({ // 2. Adicione-o aqui
      hostname: 'https://ic-mlyrics.vercel.app/',
    })
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