// Service worker de PrestQR (estrategia injectManifest de vite-plugin-pwa).
// En el build, el plugin reemplaza self.__WB_MANIFEST con la lista de archivos de la app
// (con su hash), así que ya no hace falta cambiar el nombre de la caché a mano en cada versión.
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

// La versión nueva se activa en cuanto se instala (registerType: 'autoUpdate').
self.skipWaiting()
clientsClaim()

// App shell: HTML, JS, CSS e íconos precacheados; borra las versiones anteriores.
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// Consultas a la API (solo GET): primero la red y, sin conexión, la última respuesta guardada.
// La caché "api" se borra al cerrar sesión (ver stores/auth.js).
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api', networkTimeoutSeconds: 5 }),
)

// Notificaciones push. La API todavía no las envía; se espera un JSON como:
// { "titulo": "Préstamo registrado", "cuerpo": "...", "url": "/#/mis-prestamos" }
self.addEventListener('push', (event) => {
  const datos = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(datos.titulo ?? 'PrestQR', {
      body: datos.cuerpo ?? '',
      icon: '/qr-code.png',
      data: { url: datos.url ?? '/' },
    }),
  )
})

// Al tocar la notificación: enfoca la app si ya está abierta o la abre en la URL indicada.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => 'focus' in v)
      if (abierta) {
        abierta.navigate(url)
        return abierta.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})
