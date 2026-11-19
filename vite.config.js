import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  // En desarrollo, las peticiones a /api se reenvían a la API (evita problemas de CORS).
  // Por defecto apunta a la API desplegada; para usar la API local define VITE_API_PROXY
  // en un archivo .env.development.local, por ejemplo: VITE_API_PROXY=http://localhost:5000
  const proxy = {
    '/api': {
      target: env.VITE_API_PROXY || 'https://prestqr.onrender.com',
      changeOrigin: true,
    },
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
      VitePWA({
        // injectManifest: nosotros escribimos el service worker (src/sw.js) y el plugin
        // solo le inyecta la lista de archivos a precachear. Así podemos manejar las notificaciones push.
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        },
        manifest: {
          name: 'PrestQR',
          short_name: 'PrestQR',
          description: 'Préstamo y devolución de equipos escolares con código QR',
          lang: 'es',
          start_url: '/',
          display: 'standalone',
          background_color: '#151619',
          theme_color: '#111214',
          icons: [
            { src: 'logo.png', sizes: '128x128', type: 'image/png' },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { proxy },
    preview: { proxy },
  }
})
