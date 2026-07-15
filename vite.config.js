import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path' 
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react(),
    Sitemap({
      hostname: 'https://ic-mlyrics.vercel.app/',
      generateRobots: false, // ADICIONE ESTA LINHA
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