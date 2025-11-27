import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 需要子路徑，Vercel 需要根路徑
  base: process.env.GITHUB_PAGES === 'true' ? '/mermaid-viewer/' : '/',
})
