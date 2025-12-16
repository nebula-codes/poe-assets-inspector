import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['pathofexile-dat', 'ooz-wasm'],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.GITHUB_SHA || 'dev'),
    'import.meta.env.APP_NAME': JSON.stringify('PoE DAT Studio'),
  },
})
