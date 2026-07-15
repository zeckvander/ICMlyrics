import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path' 

export default defineConfig({
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
  },
  build: {
    // Aumenta o limite para parar de dar o aviso (opcional)
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Divide o bundle em partes menores
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Separa todas as dependências em um arquivo chamado 'vendor'
            return 'vendor';
          }
        }
      }
    }
  }
});