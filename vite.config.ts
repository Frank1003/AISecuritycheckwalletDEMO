import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/AISecuritycheckwalletDEMO/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@repo/ui': path.resolve(__dirname, 'packages/ui/src')
    }
  }
})
