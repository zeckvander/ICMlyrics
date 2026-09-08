import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path' 

export default defineConfig({
  logLevel: 'warn',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: true,
    hmr: {
      overlay: false,
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});