# PrestQR — App móvil (PWA)

Aplicación móvil para **prestar y devolver equipos escolares escaneando su código QR**.
El encargado del laboratorio la usa desde su celular; los alumnos consultan sus préstamos y reciben avisos.

Es una **Progressive Web App**: se instala en Android y iPhone desde el navegador, funciona en pantalla completa y guarda en caché lo ya consultado.
Los datos vienen de la API REST **ya desplegada** en `https://prestqr.onrender.com` (código en [PrestQR-API](https://github.com/MartinSoto3316/PrestQR-API)).

## Inicio rápido

Solo necesitas **Git** y **Node.js 22.18 o superior** (recomendado 24 LTS). No hace falta instalar ni configurar la API: la app usa la que está desplegada.

```bash
git clone https://github.com/MartinSoto3316/PrestQR-PWA.git
cd PrestQR-PWA
npm install
npm run dev
```

1. Abre **http://localhost:5173**.
2. Inicia sesión con el **usuario de demostración** que viene en el documento de entrega del proyecto (las credenciales no se publican en este repositorio porque es público).
3. Como administrador verás la barra inferior con Dashboard, Escanear, Equipos, Préstamos y Alumnos.

> ⏱️ **La primera petición puede tardar hasta 1 minuto.** La API está en el plan gratuito de Render, que la apaga tras 15 minutos sin uso. Si el login tarda, espera y vuelve a intentar; las siguientes peticiones son inmediatas.

## Probar como celular

| Dónde | Cómo |
|---|---|
| **Computadora** | DevTools (F12) → modo dispositivo (Ctrl + Shift + M) → elige un celular. Desde la pestaña *Network* puedes simular **Offline** o **Slow 4G**. |
| **Celular real** | La cámara, la instalación y el Service Worker **solo funcionan con HTTPS** (o en `localhost`). Usa la versión publicada de la app. |

## Instalar la app

| Dispositivo | Cómo |
|---|---|
| Android (Chrome) | Menú ⋮ → **Instalar app** (o el aviso que aparece en la barra) |
| iPhone (Safari, iOS 16.4+) | Botón **Compartir** → **Agregar a inicio** |
| Computadora (Chrome/Edge) | Ícono de instalar en la barra de direcciones |

## Documentación del proyecto

| Archivo | Contenido |
|---|---|
| [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | Contexto, reglas de negocio, restricciones, alcance y decisiones |
| [`docs/CURRENT_TASK.md`](docs/CURRENT_TASK.md) | Incremento en curso y criterios de aceptación |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Ruta de incrementos y pasos de implementación |

## Tecnologías

| Herramienta | Versión | Uso |
|---|---|---|
| Node.js | 22.18 o superior / 24.12 o superior | Ejecutar Vite y el build |
| npm | 10 o superior | Dependencias (`package-lock.json` versionado) |
| Vue | 3.5 | Framework de la interfaz (Composition API) |
| Vue Router | 5.5 | Rutas por rol, modo hash (`/#/ruta`) |
| Pinia | 4.1 | Estado de la sesión (token, rol) |
| Vite | 8.3 | Servidor de desarrollo y build |
| vite-plugin-pwa | 2.0 | Manifest y Service Worker (estrategia `injectManifest`) |
| Workbox | 7.4 | Precache del *app shell* y caché `NetworkFirst` de la API |

## Configuración (opcional)

Para usar la app **no hay que configurar nada**. Estas variables solo se cambian para desarrollar contra otra API:

| Variable | Cuándo se usa | Valor por defecto |
|---|---|---|
| `VITE_API_PROXY` | `npm run dev`: Vite reenvía `/api` a esta URL (evita problemas de CORS) | `https://prestqr.onrender.com` |
| `VITE_API_URL` | `npm run build`: URL de la API en producción | `https://prestqr.onrender.com/api` (en `.env.production`) |

**Usar la API en tu computadora** (solo para desarrollar la API): levántala siguiendo el [README de PrestQR-API](https://github.com/MartinSoto3316/PrestQR-API#ejecución-local-para-desarrollar-la-api) y crea el archivo `.env.development.local` (basado en `.env.example`) con:

```
VITE_API_PROXY=http://localhost:5279
```

## Build de producción

```bash
npm run build
npm run preview
```

- `npm run build` genera la carpeta `dist/` con la app y el Service Worker.
- `npm run preview` sirve ese build en http://localhost:4173 para probar el Service Worker y la instalación.

## Despliegue

La app es un sitio estático: se publica el contenido de `dist/` en cualquier hosting con HTTPS (Render Static Site, Netlify, Vercel).

| Ajuste | Valor |
|---|---|
| Comando de build | `npm ci && npm run build` |
| Carpeta publicada | `dist` |
| Requisito en la API | Agregar la URL publicada a `Cors__OrigenesPermitidos` |

## Estructura

```
src/
  views/          Pantallas (login, admin/, pendientes de migrar)
  components/     Componentes reutilizables (barra inferior, íconos, avisos)
  router/         Rutas y protección por rol
  stores/         Sesión con Pinia (token JWT en localStorage)
  services/       Cliente de la API (agrega el token y traduce errores)
  composables/    Lógica reutilizable (avisos)
  sw.js           Service Worker: caché y notificaciones push
public/           Íconos de la app
docs/             Documentación del proyecto
vite.config.js    Configuración de Vite, proxy de la API y manifest de la PWA
```

## Flujo de trabajo con Git

- `main`: versión estable.
- Ramas de trabajo (`feature/...`, ramas personales): se fusionan a `main` mediante pull request revisado por otro integrante.
- Mensajes de commit con *Conventional Commits*: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`.

## Equipo

Martín Ricardo Soto Gastelo · Rodrigo Gutiérrez Morquecho · Norberto Carrillo Leyva
Universidad Tecnológica del Sur de Sonora · Desarrollo móvil integral
