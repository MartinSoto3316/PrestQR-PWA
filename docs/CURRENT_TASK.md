# Tarea actual — Incremento 1: Escanear, prestar y devolver desde el celular

> Contexto y reglas: [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) · Pasos: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)

## 1. Objetivo

Que el **administrador**, desde la app instalada en su celular, pueda **escanear con la cámara el QR de un equipo** (o escribir su código) y, según el estado del equipo, **registrar el préstamo** o **confirmar la devolución** en pocos toques.

Es el flujo central de PrestQR y la razón de que sea una app móvil: usa la cámara, se opera con una mano en el mostrador y debe funcionar con la red del laboratorio.

## 2. Situación de partida

- **La API ya tiene todo lo necesario; este incremento no la modifica.** Endpoints que se usan:
  - `GET /api/equipos/qr/{codigoQr}` → `{ equipo, prestamoActivo, accionPermitida }`
  - `GET /api/alumnos?buscar=texto`
  - `POST /api/prestamos` con `{ equipoId, alumnoId, fechaLimite, observaciones }`
  - `POST /api/prestamos/{id}/devolucion`
- En la app, la ruta `/escanear` muestra la pantalla temporal `PendienteView`.
- Ya existen: cliente `services/api.js` (JWT y errores en español), store de sesión, guardas por rol, barra inferior, aviso global sin conexión (`App.vue`) y avisos tipo *toast*.
- El manifest tiene un solo ícono (512 px) y no hay ícono para iPhone (`apple-touch-icon`).

## 3. Alcance del incremento

### Se implementa
1. Pantalla **Escanear** con la **cámara trasera**.
2. **Captura manual** del código (cámara negada, sin cámara o QR dañado).
3. **Resultado del escaneo**: tarjeta del equipo con su estado.
4. **Formulario de préstamo** (`accionPermitida = "prestar"`): búsqueda de alumno, fecha límite y observaciones.
5. **Confirmación de devolución** (`accionPermitida = "devolver"`): datos del préstamo activo y botón para confirmar.
6. **Mensajes de error** en español (400, 403, 404, 409) y bloqueo de acciones sin conexión.
7. **Instalación completa**: íconos de 192 y 512 px (incluido *maskable*) y `apple-touch-icon` para iPhone.
8. **Publicación de la app por HTTPS** (D-P2) para probarla en celulares reales.

### No se implementa en este incremento
- Cambios en la API o en la base de datos.
- Notificaciones push (incremento 4).
- Gestión de equipos y alumnos, lista de préstamos, dashboard (incremento 2).
- Vistas del alumno (incremento 3).
- Escaneo de varios equipos en un solo préstamo.
- Registro de préstamos sin conexión.
- Vibración o sonido al escanear.

## 4. Reglas que la app debe respetar

- La app **no decide** si se puede prestar o devolver: muestra solo la acción que indica `accionPermitida`. La validación final la hace la API (R1–R8).
- La **fecha del préstamo no se pide**: la pone el servidor (R6).
- El selector de fecha límite **no permite días anteriores a hoy en Hermosillo** (R5). Si la API rechaza la fecha, se muestra su mensaje.
- **Sin conexión**, los botones de confirmar se desactivan (D-A6).
- La **cámara se apaga** al salir de la pantalla o al detectar un código.

## 5. Criterios de aceptación

Salvo que se indique otra cosa, se prueban con la sesión de un administrador y **en un celular real con la app instalada**.
Métodos: **📱 Celular**, **🖥️ DevTools** (Chrome, modo dispositivo), **🔍 Lighthouse**.

### A. Escaneo con la cámara
| ID | Criterio | Método |
|---|---|---|
| CA-01 | Al entrar a Escanear se pide permiso de cámara y, al concederlo, se ve la imagen de la **cámara trasera**. | 📱 |
| CA-02 | Al apuntar a un QR válido, la app lo lee **sin presionar ningún botón** y muestra el equipo en **menos de 3 s** (con la API despierta). | 📱 |
| CA-03 | Al detectar un código, el escáner se pausa: un mismo QR **no se procesa dos veces**. | 📱 |
| CA-04 | Si se niega la cámara o no hay cámara, aparece un mensaje en español y la **captura manual** sigue funcionando. | 📱 / 🖥️ |
| CA-05 | Escribir `lap-001 ` (minúsculas, con espacio) encuentra `LAP-001`; el teclado del celular muestra el botón "Ir" o "Buscar". | 📱 |
| CA-06 | Un código inexistente muestra "No hay ningún equipo con el código…" y el botón "Escanear otro". | 📱 |
| CA-07 | Al salir de Escanear (otra pestaña o atrás), **el indicador de cámara del celular se apaga**. | 📱 |

### B. Registrar préstamo
| ID | Criterio | Método |
|---|---|---|
| CA-08 | Con un equipo **disponible** se muestra el formulario de préstamo y **no** aparece "Confirmar devolución". | 📱 |
| CA-09 | Al escribir 2 o más letras del nombre o la matrícula, aparecen los alumnos que coinciden y se elige uno **con un toque**. | 📱 |
| CA-10 | La fecha límite usa el **selector de fecha nativo** del celular y no permite días anteriores a hoy (Hermosillo). | 📱 |
| CA-11 | "Registrar préstamo" está desactivado hasta elegir alumno y fecha. | 📱 |
| CA-12 | Al registrar aparece un aviso de éxito; al escanear de nuevo, el equipo aparece **prestado** a ese alumno. | 📱 |
| CA-13 | Si otro celular presta el mismo equipo antes de confirmar, se muestra el mensaje 409 y **no** se crea un segundo préstamo. | 📱 + 📱 |

### C. Confirmar devolución
| ID | Criterio | Método |
|---|---|---|
| CA-14 | Con un equipo **prestado** se muestran alumno, fecha de préstamo, fecha límite y la etiqueta **"Vencido"** si aplica; **no** aparece el formulario de préstamo. | 📱 |
| CA-15 | Al confirmar aparece un aviso de éxito; al escanear de nuevo, el equipo aparece **disponible**. | 📱 |
| CA-16 | Confirmar la misma devolución desde dos celulares: el segundo recibe el mensaje 409. | 📱 + 📱 |

### D. Experiencia móvil
| ID | Criterio | Método |
|---|---|---|
| CA-17 | El flujo completo (abrir Escanear → leer QR → confirmar) se hace **con una mano y en 4 toques o menos**, sin contar la escritura. | 📱 |
| CA-18 | Botones y elementos de la lista de alumnos miden **al menos 44 × 44 px**. | 🖥️ |
| CA-19 | Las pantallas se ven bien en **360 px** de ancho, sin desplazamiento horizontal, y también en escritorio. | 🖥️ |
| CA-20 | Al escribir, **el teclado no tapa** el campo activo ni el botón de confirmar. | 📱 |
| CA-21 | Mientras la API responde, se ve "Cargando…" y los botones no se pueden presionar dos veces. | 📱 |

### E. Conectividad
| ID | Criterio | Método |
|---|---|---|
| CA-22 | En modo avión, se ve el aviso "Sin conexión" y "Registrar préstamo" y "Confirmar devolución" están desactivados. | 📱 |
| CA-23 | Con red **"Slow 4G"** el flujo completo funciona y siempre hay indicador de carga. | 🖥️ |

### F. Instalación y compatibilidad
| ID | Criterio | Método |
|---|---|---|
| CA-24 | En **Android (Chrome)** la app se instala, abre en modo **standalone** (sin barra del navegador) y muestra su ícono. | 📱 |
| CA-25 | En **iPhone (Safari)** se instala con "Compartir → Agregar a inicio", con su ícono, y la cámara funciona dentro de la app instalada. | 📱 |
| CA-26 | **Lighthouse en modo móvil**: la app es instalable y obtiene **≥ 90** en Accesibilidad y Buenas prácticas. | 🔍 |
| CA-27 | La app publicada responde por **HTTPS** y `npm run build` termina sin errores. | 🖥️ |

### G. Seguridad
| ID | Criterio | Método |
|---|---|---|
| CA-28 | Con sesión de **alumno**, la barra inferior no muestra Escanear y abrir `/#/escanear` redirige a "Mis préstamos". | 📱 |

## 6. Definición de terminado

- CA-01 a CA-28 verificados, con capturas de pantalla del celular como evidencia (Android e iPhone).
- D-P1 y D-P2 registradas como **aprobadas** en `PROJECT_CONTEXT.md`.
- Sección "Estado actual" de `PROJECT_CONTEXT.md` actualizada.
- Cambios en el repositorio `PrestQR-PWA` con commits descriptivos y fusionados a `main`.
