import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa: funciona en GitHub Pages bajo /<repo>/ gracias a HashRouter.
export default defineConfig({
  base: './',
  plugins: [react()],
})
