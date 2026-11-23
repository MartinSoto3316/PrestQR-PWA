# Plan de implementación

> Contexto y reglas: [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) · Criterios del incremento: [`CURRENT_TASK.md`](CURRENT_TASK.md)

## 1. Ruta del proyecto

Cada incremento termina con algo que se puede **demostrar en un celular**.

| # | Incremento | Qué se ve en el celular | Toca la API | Estado |
|---|---|---|---|---|
| 0 | Base | Login, navegación por rol, lista de equipos, app instalable | Ya existe | ✅ Terminado |
| **1** | **Escanear, prestar y devolver** | Escanear un QR y registrar préstamo o devolución | No | 🔶 **En curso** |
| 2 | Gestión del administrador | Alta y edición de equipos y alumnos, QR imprimible, préstamos activos y vencidos | Solo si D-P3 = QRCoder | ⏳ |
| 3 | Vistas del alumno | "Mis préstamos", fechas límite e historial en el celular del alumno | Sí (D-P4) | ⏳ |
| 4 | Notificaciones | Avisos push en el celular: préstamo, recordatorio, vencido, devolución | Sí (D-P5) | ⏳ |
| 5 | Cierre | Dashboard (opcional), pruebas finales en dispositivos y ensayo de la demo | No | ⏳ |

---

## 2. Incremento 1 — Pasos concretos

Todo el trabajo es en el repositorio `PrestQR-PWA`, en la rama `feature/escaneo` creada desde `vue`.

### Paso 1. Preparar la instalación en Android y iPhone
- Agregar a `public/` los íconos `icon-192.png`, `icon-512.png` y `icon-maskable-512.png` (con margen de seguridad) y `apple-touch-icon.png` (180 × 180).
- En `vite.config.js`, listar los tres íconos en `manifest.icons` (el *maskable* con `purpose: 'maskable'`).
- En `index.html`, agregar `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.
- **Verificación:** CA-24 y CA-25 (instalar en Android y en iPhone muestra el ícono correcto).

### Paso 2. Publicar la app por HTTPS (D-P2)
- Crear un **Static Site** en Render conectado a `PrestQR-PWA`: build `npm ci && npm run build`, carpeta `dist`.
- Agregar la URL publicada a `Cors__OrigenesPermitidos` de la API en Render.
- Registrar D-P2 como aprobada en `PROJECT_CONTEXT.md`.
- **Verificación:** CA-27; la app abre por HTTPS en el celular e inicia sesión.
- *Se hace al inicio para poder probar la cámara en celulares reales durante todo el incremento.*

### Paso 3. Instalar la librería de escaneo (D-P1)
```bash
npm install vue-qrcode-reader
```
- Registrar D-P1 como aprobada en `PROJECT_CONTEXT.md`.
- **Verificación:** `npm run dev` y `npm run build` sin errores.

### Paso 4. Utilidades compartidas
- `src/utils/fechas.js`
  - `hoyHermosillo()` → `'YYYY-MM-DD'` con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Hermosillo' })`.
  - `sumarDias(fecha, n)` y `formatearFecha(fecha)` (`dd/mm/aaaa`).
- `src/composables/useConexion.js`: mover a este composable la detección `online`/`offline` que hoy está en `App.vue`, y usarlo en ambos lugares.
- **Verificación:** `hoyHermosillo()` devuelve la fecha correcta aunque el celular tenga otra zona horaria.

### Paso 5. Componente `EscanerQr.vue`
`src/components/EscanerQr.vue`
- `QrcodeStream` con `constraints: { facingMode: 'environment' }` (cámara trasera).
- Al detectar: pausar el escáner y emitir `codigo` normalizado (`trim()` + `toUpperCase()`).
- Errores de cámara (`NotAllowedError`, `NotFoundError`, `NotReadableError`, `InsecureContextError`) → mensaje en español.
- Campo de **captura manual** siempre visible, con `enterkeyhint="search"`, `autocapitalize="characters"` y botón "Buscar".
- **Verificación:** CA-01, CA-03, CA-04, CA-05, CA-07.

### Paso 6. Pantalla `EscanearView.vue`
`src/views/admin/EscanearView.vue`
- En `src/router/index.js`, cambiar la ruta `/escanear` de `Pendiente` a esta vista (conserva `meta.rol: 'admin'`).
- Estados: `escaneando` → `cargando` → `resultado` | `error`.
- Al recibir un código: `GET /equipos/qr/{código}` (con `encodeURIComponent`).
- Tarjeta del equipo (código, nombre, modelo, estado) y, según `accionPermitida`, el componente del Paso 7 o del Paso 8.
- Botón **"Escanear otro"** en la parte baja de la pantalla (zona del pulgar).
- **Verificación:** CA-02, CA-06, CA-28.

### Paso 7. Componente `FormularioPrestamo.vue`
`src/components/FormularioPrestamo.vue` — props: `equipo`; emite `registrado`.
- **Alumno:** búsqueda con 2+ caracteres y 300 ms de espera → `GET /alumnos?buscar={texto}`. Lista con elementos de 44 px o más; los alumnos con cuenta desactivada aparecen deshabilitados.
- **Fecha límite:** `<input type="date" :min="hoyHermosillo()">`, sugerida en hoy + 7 días.
- **Observaciones:** opcional, máximo 500 caracteres.
- **Enviar:** `POST /prestamos` con `{ equipoId, alumnoId, fechaLimite, observaciones }`.
- Botón desactivado si falta alumno o fecha, mientras se envía o sin conexión.
- Éxito → *toast* "Préstamo registrado" y emitir `registrado`. Error → mostrar el mensaje de la API.
- **Verificación:** CA-08 a CA-13.

### Paso 8. Componente `ConfirmarDevolucion.vue`
`src/components/ConfirmarDevolucion.vue` — props: `prestamo`; emite `devuelto`.
- Muestra alumno (nombre y matrícula), fecha de préstamo, fecha límite, observaciones y la etiqueta **"Vencido"** si `prestamo.vencido`.
- **Confirmar:** `POST /prestamos/{prestamo.id}/devolucion`.
- Botón desactivado mientras se envía o sin conexión.
- **Verificación:** CA-14 a CA-16.

### Paso 9. Ajustes de experiencia móvil
- Reutilizar las clases de `src/assets/app.css`; agregar solo lo necesario para la vista de cámara y la lista de alumnos.
- Botones principales a todo lo ancho y en la parte inferior; áreas táctiles de 44 px o más.
- Al enfocar un campo, `scrollIntoView({ block: 'center' })` para que el teclado no lo tape.
- Indicador de carga en cada petición.
- **Verificación:** CA-17 a CA-23.

### Paso 10. Pruebas en dispositivos
1. **Datos:** un equipo disponible, un alumno activo y un préstamo vencido (fecha límite pasada, creado en la BD de desarrollo).
2. **QR de prueba:** generar e imprimir los QR de esos códigos.
3. **Matriz de pruebas** (marcar cada combinación):

| Prueba | Android · Chrome | iPhone · Safari | Escritorio · Chrome |
|---|---|---|---|
| Instalada (standalone) | ☐ | ☐ | — |
| En el navegador | ☐ | ☐ | ☐ |
| Sin conexión (modo avión) | ☐ | ☐ | ☐ (DevTools) |
| Red lenta ("Slow 4G") | — | — | ☐ (DevTools) |

4. **Lighthouse** en modo móvil sobre la app publicada (CA-26); guardar el reporte como evidencia.
5. Marcar CA-01 a CA-28 en `CURRENT_TASK.md` y guardar capturas de pantalla.

### Paso 11. Cierre
- Actualizar "Estado actual" en `PROJECT_CONTEXT.md`.
- Fusionar `feature/escaneo` → `vue` → `main` con commits descriptivos, por ejemplo:
  - `feat(pwa): íconos para instalar en Android e iOS`
  - `feat(pwa): escáner QR con cámara trasera y captura manual`
  - `feat(pwa): registrar préstamo desde el escaneo`
  - `feat(pwa): confirmar devolución desde el escaneo`
- Redactar el `CURRENT_TASK.md` del incremento 2.

---

## 3. Riesgos del incremento

| Riesgo | Mitigación |
|---|---|
| La cámara no funciona al probar en el celular durante el desarrollo (sin HTTPS). | Publicar la app desde el Paso 2; en la PC, probar en `localhost`. |
| El lector QR se comporta distinto en iPhone. | Probar en iPhone desde el Paso 5, no al final; la captura manual siempre está disponible. |
| La API tarda cerca de un minuto en despertar (Render gratis). | Indicador "Cargando…" sin límite corto; abrir la app unos minutos antes de la demo. |
| Lectura doble del mismo QR. | Pausar el escáner al primer código; reanudar con "Escanear otro". |
| La lista de alumnos es grande para una pantalla pequeña. | Búsqueda en la API (`?buscar=`), sin descargar la lista completa. |
| Poca luz o QR pequeño en el laboratorio. | Imprimir QR de al menos 3 × 3 cm; captura manual como respaldo. |
