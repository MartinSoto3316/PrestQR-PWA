# PrestQR — Contexto del proyecto

> Fuente de verdad del proyecto. Si una tarea contradice este documento, primero se actualiza este documento (con su justificación) y después el código.
> Tarea en curso: [`CURRENT_TASK.md`](CURRENT_TASK.md) · Pasos: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)

## 1. Problema

En el laboratorio, el préstamo de equipo escolar (laptops, cámaras, kits Arduino, etc.) se registra a mano. No se sabe con certeza quién tiene cada equipo ni cuándo debe devolverlo, y los retrasos no se detectan a tiempo.

## 2. Solución: una app móvil

**PrestQR** es una **aplicación móvil (PWA)** que el encargado del laboratorio usa en su celular para registrar préstamos y devoluciones **escaneando con la cámara el código QR pegado en cada equipo**. Los alumnos usan la misma app para consultar sus préstamos y recibir avisos.

- El QR contiene **solo el código del equipo** (por ejemplo, `LAP-001`). La app consulta el resto a la API.
- Al escanear, la app muestra la única acción válida:
  - Equipo **disponible** → formulario para **registrar el préstamo**.
  - Equipo **prestado** → datos del préstamo activo y botón para **confirmar la devolución**.

### Contexto de uso móvil
| Usuario | Dónde y cómo usa la app |
|---|---|
| **Administrador** | De pie en el mostrador del laboratorio, con el celular en una mano y el equipo en la otra. Necesita escanear y confirmar en pocos toques. |
| **Alumno** | En cualquier lugar, desde su propio celular (Android o iPhone), con datos móviles o Wi-Fi escolar. Consulta fechas y recibe recordatorios. |

## 3. Plataforma objetivo

| Aspecto | Definición |
|---|---|
| Dispositivo principal | **Celular** (desde 360 px de ancho). El escritorio es secundario. |
| Sistemas | **Android** con Chrome y **iOS 16.4+** con Safari. |
| Forma de uso | **Instalada en la pantalla de inicio** (modo `standalone`, sin barra del navegador). También funciona en el navegador. |
| Capacidades del dispositivo | Cámara trasera (escaneo QR), notificaciones push, almacenamiento local (sesión y caché), detección de conexión. |
| Conectividad | Red móvil lenta o intermitente: la app debe avisar sin conexión y mostrar los datos ya consultados. |

## 4. Usuarios y roles

| Rol | Puede hacer en la app |
|---|---|
| **Administrador** | Escanear, registrar préstamos y devoluciones, gestionar equipos y alumnos, generar QR, consultar activos, vencidos e historial. |
| **Alumno** | Consultar sus préstamos, fechas límite e historial; recibir notificaciones. No puede registrar préstamos ni devoluciones. |

## 5. Reglas de negocio

La app **muestra** las reglas, pero **quien las garantiza es la API**. Una regla implementada solo en la app no cuenta como cumplida.

| # | Regla | La app… | La API lo garantiza con… |
|---|---|---|---|
| R1 | Un equipo solo puede tener **un préstamo activo**. | Muestra el mensaje de error | `fn_registrar_prestamo` + índice único parcial → 409 |
| R2 | Un equipo prestado **no puede volver a prestarse**. | No ofrece "Prestar" | `fn_registrar_prestamo` → 409 |
| R3 | Prestado → Disponible **solo con devolución**. | Solo ofrece "Confirmar devolución" | `fn_registrar_devolucion` |
| R4 | **No hay devolución** sin préstamo activo. | Muestra el mensaje de error | `fn_registrar_devolucion` → 409 |
| R5 | Fecha límite **≥ fecha del préstamo**. | Selector de fecha sin días pasados | Restricción `ck_fecha_limite` → 400 |
| R6 | La fecha del préstamo la pone el sistema. | No la pide | La asigna la base de datos |
| R7 | Solo el administrador registra préstamos y devoluciones. | Oculta las pantallas al alumno | `[Authorize(Roles = "admin")]` → 403 |
| R8 | Las acciones dependen del estado del equipo. | Muestra solo `accionPermitida` | `GET /api/equipos/qr/{codigoQr}` |

**Estados:** equipo `disponible` | `prestado`; préstamo `activo` | `completado`. **Vencido no es un estado**: es un préstamo activo con la fecha límite pasada (hora de Hermosillo). Los préstamos nunca se borran: los completados son el historial.

## 6. Arquitectura y stack

La app (PWA) consume una API REST, y solo la API accede a la base de datos.

| Parte | Tecnología | Repositorio |
|---|---|---|
| **App móvil (PWA)** | Vue 3.5 + Vite 8 + Vue Router 5 (hash) + Pinia 4 + vite-plugin-pwa 2 (`injectManifest`) + Workbox 7 | `PrestQR-PWA` |
| API REST | ASP.NET Core Web API (.NET 10), capas Controller → Service → Repository, Dapper + Npgsql | `PrestQR` |
| Base de datos | PostgreSQL en Neon; reglas de préstamo en funciones SQL transaccionales (`fn_*`) | — |
| Autenticación | JWT Bearer (480 min, rol en el token) + BCrypt | — |
| Despliegue de la API | CircleCI → Docker → Render (`https://prestqr.onrender.com`) | — |

### Endpoints que usa la app
| Pantalla | Endpoint |
|---|---|
| Login | `POST /api/auth/login` |
| Equipos | `GET /api/equipos`, `GET /api/equipos/{id}` |
| Escanear | `GET /api/equipos/qr/{codigoQr}` → `{ equipo, prestamoActivo, accionPermitida }` |
| Préstamo | `GET /api/alumnos?buscar=`, `POST /api/prestamos` |
| Devolución | `POST /api/prestamos/{id}/devolucion` |

## 7. Restricciones

### Del dispositivo móvil
- **HTTPS obligatorio** para la cámara, el Service Worker y las notificaciones (en desarrollo solo funciona en `localhost`).
- **Permisos:** el usuario puede negar la cámara o las notificaciones; la app debe seguir siendo usable (captura manual del código).
- **iPhone:** no muestra aviso de instalación (se instala con "Compartir → Agregar a inicio") y el push solo funciona con la app instalada (iOS 16.4+).
- **Batería:** la cámara debe apagarse al salir de la pantalla de escaneo.
- **Pantalla pequeña y uso con una mano:** acciones principales al alcance del pulgar y áreas táctiles de al menos 44 × 44 px.

### Del proyecto
- **Sin escrituras offline:** préstamos y devoluciones requieren conexión. Sin red solo se consultan datos ya vistos.
- **Render gratis:** la API se apaga tras 15 min sin tráfico; la primera petición tarda cerca de un minuto.
- **Equipo de tres personas y tiempo limitado:** se prioriza el flujo central (escanear → prestar → devolver).

## 8. Alcance

### Dentro del alcance (MVP)
- Login con roles e interfaz distinta para administrador y alumno.
- Escaneo con la cámara y captura manual del código.
- Registro de préstamo y devolución desde el celular.
- Gestión de equipos y alumnos; QR imprimible de cada equipo.
- Consultas: activos, vencidos e historial; "Mis préstamos" del alumno.
- Notificaciones push: préstamo registrado, recordatorio un día antes, vencido, devolución registrada.
- App instalable, responsive, con caché offline de solo lectura.
- Dashboard con estadísticas (opcional).

### Fuera del alcance
- App nativa (Kotlin/Swift) o híbrida (Flutter/React Native) y publicación en tiendas.
- Registro de préstamos sin conexión y sincronización posterior.
- Estado de mantenimiento, GPS, pagos o multas, reconocimiento de imágenes.
- Integraciones con sistemas escolares externos.
- Autorregistro de alumnos y recuperación de contraseña.

## 9. Decisiones

### Aprobadas

| ID | Decisión | Razón |
|---|---|---|
| D-A1 | **PWA en lugar de app nativa o híbrida.** | Una sola base de código para Android e iOS, sin tiendas ni instalación pesada, se actualiza sola y tiene acceso a todo lo que el proyecto necesita (cámara, push, almacenamiento, instalación). Viable para tres personas. |
| D-A2 | Vue 3 + Vite + vite-plugin-pwa (`injectManifest`), reemplazando la versión sin framework. | Router y estado oficiales; Service Worker propio para manejar el push. |
| D-A3 | Diseño **mobile-first** con barra de navegación inferior por rol. | Uso con una mano; las secciones principales quedan al alcance del pulgar. |
| D-A4 | Enrutamiento por hash (`/#/ruta`). | Funciona en cualquier hosting estático y al abrir la app instalada. |
| D-A5 | Sesión (JWT) guardada en `localStorage`. | La sesión sobrevive al cerrar la app; el token vence a las 480 min. |
| D-A6 | Caché `NetworkFirst` solo para GET; se borra al cerrar sesión. Sin escrituras offline. | Consultar con mala señal sin arriesgar la regla R1 ni mostrar datos de otro usuario. |
| D-A7 | Las reglas viven en la API; la app solo muestra `accionPermitida`. | Nadie puede saltarse las reglas manipulando la app. |
| D-A8 | El QR contiene solo el código del equipo. | Los datos se mantienen actualizados en la API. |
| D-A9 | API en ASP.NET Core (.NET 10) + Dapper + funciones SQL transaccionales. | Operación atómica que resiste peticiones simultáneas desde dos celulares. |
| D-A10 | Zona horaria de negocio: `America/Hermosillo`. | Las fechas límite son locales; la BD trabaja en UTC. |

### Pendientes

| ID | Decisión pendiente | Opciones | Recomendación | Se decide en |
|---|---|---|---|---|
| D-P1 | Librería de escaneo QR | `vue-qrcode-reader`, `html5-qrcode` | `vue-qrcode-reader` | **Incremento 1** |
| D-P2 | Hosting de la PWA (HTTPS) | Render Static Site, Netlify, Vercel | Render Static Site | **Incremento 1** (para probar en celular) |
| D-P3 | Generación del QR imprimible | QRCoder en la API, librería en la app | Por definir | Incremento 2 |
| D-P4 | Endpoint "Mis préstamos" del alumno | `GET /api/me/prestamos`, otro | `GET /api/me/prestamos` | Incremento 3 |
| D-P5 | Disparador de recordatorios diarios | cron-job.org, pipeline programado de CircleCI | Por definir | Incremento 4 |
| D-P6 | Alta de alumnos | Solo el administrador, autorregistro | Solo el administrador | Confirmar con el docente |

## 10. Estado actual (22/11/2026)

| Elemento | Estado |
|---|---|
| API: auth, equipos, alumnos, préstamos, escaneo, errores en español | ✅ Implementado y desplegado |
| App: proyecto Vue + PWA, manifest, Service Worker (precache + `NetworkFirst`) | ✅ Implementado |
| App: login, sesión, guardas por rol, barra inferior, aviso sin conexión | ✅ Implementado |
| App: lista y detalle de equipos (solo lectura) | ✅ Implementado |
| App: escanear, préstamo y devolución | 🔶 **Incremento 1, en curso** |
| App: íconos completos para instalar en Android e iPhone | 🔶 Incremento 1 |
| App: gestión de equipos y alumnos, lista de préstamos | ⏳ Incremento 2 |
| App: vistas del alumno | ⏳ Incremento 3 |
| Notificaciones push y recordatorios | ⏳ Incremento 4 |
