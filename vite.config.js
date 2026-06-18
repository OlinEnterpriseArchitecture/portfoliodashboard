import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['react-grid-layout'],
    esbuildOptions: {
      mainFields: ['main'],
    },
  },
})
