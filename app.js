const API_URL = "https://prestqr.onrender.com/api";

const lista = document.querySelector("#lista");
const avisoSinConexion = document.querySelector("#sin-conexion");
const navegacion = document.querySelector("#navegacion");
const navegacionAlumno = document.querySelector("#navegacion-alumno");
const toast = document.querySelector("#toast");

// Cuentas de demostración del diseño (no son cuentas reales de la API)
const cuentasDemo = [
  { correo: "admin@gmail.com", password: "123", rol: "admin", inicio: "#dashboard" },
  { correo: "alumno@gmail.com", password: "123", rol: "alumno", inicio: "#mis-prestamos" }
];

// ======================================================================
// Datos de ejemplo (diseño). Solo la lista de equipos viene de la API.
// ======================================================================
const alumnosMock = [
  { matricula: "A0001", nombre: "Martín Soto", carrera: "Ingeniería en Software", correo: "martin.soto@uts.edu.mx" },
  { matricula: "A0002", nombre: "Ana Pérez", carrera: "Mecatrónica", correo: "ana.perez@uts.edu.mx" },
  { matricula: "A0003", nombre: "Luis Ramos", carrera: "Ingeniería en Software", correo: "luis.ramos@uts.edu.mx" },
  { matricula: "A0004", nombre: "Rosa Díaz", carrera: "Diseño Digital", correo: "rosa.diaz@uts.edu.mx" },
  { matricula: "A0005", nombre: "Rodrigo Gutiérrez", carrera: "Redes y Telecomunicaciones", correo: "rodrigo.gutierrez@uts.edu.mx" },
  { matricula: "A0006", nombre: "Norberto Carrillo", carrera: "Ingeniería en Software", correo: "norberto.carrillo@uts.edu.mx" }
];

const prestamosMock = [
  { equipo: "Cámara #002", codigo: "CAM-002", alumno: "Martín Soto", prestado: "05/11/2026", limite: "08/11/2026", estado: "activo" },
  { equipo: "Proyector #004", codigo: "PRO-004", alumno: "Ana Pérez", prestado: "03/11/2026", limite: "05/11/2026", estado: "vencido" },
  { equipo: "Kit Arduino #003", codigo: "ARD-003", alumno: "Luis Ramos", prestado: "06/11/2026", limite: "09/11/2026", estado: "activo" },
  { equipo: "Laptop #001", codigo: "LAP-001", alumno: "Rosa Díaz", prestado: "12/10/2026", limite: "14/10/2026", devuelto: "14/10/2026", estado: "completado" },
  { equipo: "Micrófono #008", codigo: "MIC-008", alumno: "Rodrigo Gutiérrez", prestado: "01/11/2026", limite: "04/11/2026", estado: "vencido" },
  { equipo: "Laptop #005", codigo: "LAP-005", alumno: "Martín Soto", prestado: "20/10/2026", limite: "22/10/2026", devuelto: "21/10/2026", estado: "completado" },
  { equipo: "Tablet #012", codigo: "TAB-012", alumno: "Norberto Carrillo", prestado: "07/11/2026", limite: "10/11/2026", estado: "activo" }
];

const textoEstadoPrestamo = { activo: "Activo", vencido: "Vencido", completado: "Completado" };

// Préstamos y notificaciones del alumno de ejemplo. Las fechas se calculan
// desde hoy para que "Vence en 2 días" siempre sea coherente en la demo.
const misPrestamosMock = [
  { equipo: "Laptop #015", codigo: "LAP-015 · Dell Latitude 3420", prestado: diasDesdeHoy(-1), limite: diasDesdeHoy(2), observaciones: "Incluye cargador" },
  { equipo: "Kit Arduino #010", codigo: "ARD-010 · Arduino Mega 2560", prestado: diasDesdeHoy(-4), limite: diasDesdeHoy(-1), observaciones: "Sin observaciones" },
  { equipo: "Cámara #002", codigo: "CAM-002 · Canon EOS Rebel T7", prestado: diasDesdeHoy(-30), limite: diasDesdeHoy(-28), devuelto: diasDesdeHoy(-28), observaciones: "Con tarjeta SD" },
  { equipo: "Proyector #004", codigo: "PRO-004 · Epson PowerLite E20", prestado: diasDesdeHoy(-45), limite: diasDesdeHoy(-44), devuelto: diasDesdeHoy(-44), observaciones: "Sin observaciones" }
];

const notificacionesMock = [
  { tipo: "recordatorio", titulo: "Recordatorio de devolución", texto: `Tu préstamo de la Laptop #015 vence el ${textoFecha(diasDesdeHoy(2))}.`, hace: "Hace 1 hora", nueva: true },
  { tipo: "vencido", titulo: "Préstamo vencido", texto: "Tu préstamo del Kit Arduino #010 está vencido. Devuélvelo lo antes posible.", hace: "Hoy", nueva: true },
  { tipo: "registrado", titulo: "Préstamo registrado", texto: `Tu préstamo de la Laptop #015 fue registrado. Debes devolverla el ${textoFecha(diasDesdeHoy(2))}.`, hace: "Ayer", nueva: false },
  { tipo: "devuelto", titulo: "Devolución registrada", texto: "La devolución de la Cámara #002 fue registrada correctamente.", hace: "Hace 4 semanas", nueva: false }
];

// Lista real de equipos (se llena con la API) y filtros de la pantalla Equipos
let equiposCargados = [];
let filtroEstadoEquipo = "";

window.addEventListener('load',()=>{
    registerWS();
})

// Aviso de conexión: aparece al perder internet y desaparece al recuperarlo.
window.addEventListener('offline', actualizarEstadoConexion);
window.addEventListener('online', ()=>{
    actualizarEstadoConexion();
    cargarEquipos(); // al volver la conexión, trae la lista actualizada
});

window.addEventListener('hashchange', mostrarPantalla);

function actualizarEstadoConexion(){
  avisoSinConexion.hidden = navigator.onLine;
}

// ======================================================================
// Navegación: cada pantalla es un <section id="..."> y se elige con el #
// ======================================================================
// Pantallas internas → pestaña de la barra inferior que queda marcada
const pestanaDePantalla = {
  prestamo: "escanear",
  devolucion: "escanear",
  "equipo-detalle": "equipos",
  "equipo-nuevo": "equipos",
  "alumno-detalle": "alumnos",
  "mi-prestamo": "mis-prestamos"
};

// Pantallas que pertenecen a la vista del alumno (las demás son del administrador)
const pantallasAlumno = ["mis-prestamos", "mi-prestamo", "notificaciones", "perfil"];

function mostrarPantalla(){
  const id = location.hash.slice(1) || "login";
  const pantalla = document.getElementById(id);
  const destino = pantalla && pantalla.classList.contains("pantalla") ? pantalla : document.getElementById("login");

  document.querySelectorAll(".pantalla").forEach(p => p.classList.toggle("activa", p === destino));

  // Cada rol tiene su propia barra inferior; el login no muestra ninguna
  const esLogin = destino.id === "login";
  const esAlumno = pantallasAlumno.includes(destino.id);
  navegacion.hidden = esLogin || esAlumno;
  navegacionAlumno.hidden = esLogin || !esAlumno;

  const pestana = pestanaDePantalla[destino.id] ?? destino.id;
  document.querySelectorAll(".navegacion a").forEach(a => a.classList.toggle("activo", a.dataset.tab === pestana));

  window.scrollTo(0, 0);
}

function ir(hash){
  location.hash = hash;
}

function mostrarToast(texto, esError = false){
  toast.textContent = texto;
  toast.classList.toggle("error", esError);
  toast.hidden = false;
  clearTimeout(mostrarToast.temporizador);
  mostrarToast.temporizador = setTimeout(() => toast.hidden = true, 2500);
}

// ======================================================================
// Preparación de las pantallas de diseño (datos de ejemplo)
// ======================================================================
function prepararPantallas(){
  // Login: según la cuenta abre la vista del administrador o la del alumno
  document.querySelector("#form-login").addEventListener("submit", e => {
    e.preventDefault();
    const correo = document.querySelector("#login-correo").value.trim().toLowerCase();
    const password = document.querySelector("#login-password").value;
    const cuenta = cuentasDemo.find(c => c.correo === correo && c.password === password);
    if(!cuenta){
      mostrarToast("Correo o contraseña incorrectos", true);
      return;
    }
    e.target.reset();
    ir(cuenta.inicio);
  });

  prepararVistaAlumno();

  // Dashboard: préstamos recientes
  document.querySelector("#lista-recientes").innerHTML = prestamosMock.slice(0, 4).map(filaPrestamo).join("");

  // Escanear: el código manual simula un equipo disponible
  document.querySelector("#form-codigo").addEventListener("submit", e => {
    e.preventDefault();
    ir("#prestamo");
  });

  // Registrar préstamo: fecha de hoy, fecha límite sugerida y alumnos
  const hoy = new Date();
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() + 3);
  document.querySelector("#fecha-prestamo").value = hoy.toLocaleDateString("es-MX");
  const fechaLimite = document.querySelector("#fecha-limite");
  fechaLimite.min = fechaISO(hoy);
  fechaLimite.value = fechaISO(limite);
  document.querySelector("#alumnos-opciones").innerHTML = alumnosMock
    .map(a => `<option value="${escapeHtml(a.nombre)} · ${a.matricula}">`).join("");

  document.querySelector("#form-prestamo").addEventListener("submit", e => {
    e.preventDefault();
    mostrarToast("Préstamo registrado (simulado)");
    e.target.reset();
    fechaLimite.value = fechaISO(limite);
    ir("#dashboard");
  });

  // Devolución
  document.querySelector("#confirmar-devolucion").addEventListener("click", () => {
    mostrarToast("Devolución registrada (simulada)");
    ir("#dashboard");
  });

  // Formulario de alta de equipo: solo muestra el aviso
  document.querySelectorAll("form[data-guardar]").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      mostrarToast(form.dataset.guardar);
      form.reset();
      ir(form.dataset.destino);
    });
  });

  // Botones de acciones simuladas del equipo (editar, descargar QR)
  document.querySelectorAll("[data-toast]").forEach(boton => {
    boton.addEventListener("click", () => mostrarToast(boton.dataset.toast));
  });

  // Préstamos: pestañas Activos / Vencidos / Historial
  const filtrosPrestamos = document.querySelector("#filtros-prestamos");
  filtrosPrestamos.addEventListener("click", e => {
    const boton = e.target.closest(".filtro");
    if(!boton) return;
    filtrosPrestamos.querySelectorAll(".filtro").forEach(f => f.classList.toggle("activo", f === boton));
    pintarPrestamos(boton.dataset.tipo);
  });
  pintarPrestamos("activo");

  // Alumnos: lista con búsqueda y detalle
  pintarAlumnos("");
  document.querySelector("#buscar-alumno").addEventListener("input", e => pintarAlumnos(e.target.value));
  document.querySelector("#lista-alumnos").addEventListener("click", e => {
    const fila = e.target.closest("[data-matricula]");
    if(fila) mostrarAlumno(fila.dataset.matricula);
  });

  // Equipos: búsqueda, filtros y detalle (sobre los datos reales)
  document.querySelector("#buscar-equipo").addEventListener("input", pintarEquipos);
  const filtrosEquipos = document.querySelector("#filtros-equipos");
  filtrosEquipos.addEventListener("click", e => {
    const boton = e.target.closest(".filtro");
    if(!boton) return;
    filtrosEquipos.querySelectorAll(".filtro").forEach(f => f.classList.toggle("activo", f === boton));
    filtroEstadoEquipo = boton.dataset.estado;
    pintarEquipos();
  });
  lista.addEventListener("click", e => {
    const fila = e.target.closest("[data-id]");
    if(fila) mostrarEquipo(Number(fila.dataset.id));
  });
}

function filaPrestamo(p){
  const detalle = p.estado === "completado"
    ? `${p.alumno} · ${p.prestado} al ${p.devuelto}`
    : `${p.alumno} · límite ${p.limite}`;
  return `<div class="fila">
    <div class="fila-texto">
      <strong>${escapeHtml(p.equipo)}</strong>
      <span>${escapeHtml(detalle)}</span>
    </div>
    <span class="etiqueta ${p.estado}">${textoEstadoPrestamo[p.estado]}</span>
  </div>`;
}

function pintarPrestamos(tipo){
  const prestamos = prestamosMock.filter(p => p.estado === tipo);
  document.querySelector("#lista-prestamos").innerHTML = prestamos.length
    ? prestamos.map(filaPrestamo).join("")
    : `<div class="mensaje">No hay préstamos en esta sección.</div>`;
}

function iniciales(nombre){
  return nombre.split(" ").slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
}

function pintarAlumnos(texto){
  const busqueda = texto.trim().toLowerCase();
  const alumnos = alumnosMock.filter(a =>
    a.nombre.toLowerCase().includes(busqueda) || a.matricula.toLowerCase().includes(busqueda));

  document.querySelector("#lista-alumnos").innerHTML = alumnos.length
    ? alumnos.map(a => {
        const activos = prestamosMock.filter(p => p.alumno === a.nombre && p.estado !== "completado").length;
        return `<a href="#alumno-detalle" class="fila" data-matricula="${a.matricula}">
          <div class="fila-con-avatar">
            <div class="avatar">${iniciales(a.nombre)}</div>
            <div class="fila-texto">
              <strong>${escapeHtml(a.nombre)}</strong>
              <span>${a.matricula} · ${escapeHtml(a.carrera)}</span>
            </div>
          </div>
          ${activos ? `<span class="etiqueta activo">${activos} activo${activos > 1 ? "s" : ""}</span>` : ""}
        </a>`;
      }).join("")
    : `<div class="mensaje">No se encontraron alumnos.</div>`;
}

function mostrarAlumno(matricula){
  const alumno = alumnosMock.find(a => a.matricula === matricula);
  if(!alumno) return;
  document.querySelector("#alumno-iniciales").textContent = iniciales(alumno.nombre);
  document.querySelector("#alumno-nombre").textContent = alumno.nombre;
  document.querySelector("#alumno-matricula").textContent = alumno.matricula;
  document.querySelector("#alumno-carrera").textContent = alumno.carrera;
  document.querySelector("#alumno-correo").textContent = alumno.correo;

  const historial = prestamosMock.filter(p => p.alumno === alumno.nombre);
  document.querySelector("#alumno-historial").innerHTML = historial.length
    ? historial.map(filaPrestamo).join("")
    : `<div class="mensaje">Sin préstamos registrados.</div>`;
}

// ======================================================================
// Vista del alumno (datos de ejemplo)
// ======================================================================
function diasDesdeHoy(dias){
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

function textoFecha(fecha){
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Estado del préstamo visto por el alumno: completado, vencido o cuántos días le quedan
function estadoMiPrestamo(p){
  if(p.devuelto) return { clase: "completado", texto: "Completado" };
  const dias = Math.round((p.limite - diasDesdeHoy(0)) / 86400000);
  if(dias < 0) return { clase: "vencido", texto: `Vencido hace ${-dias} día${dias < -1 ? "s" : ""}` };
  if(dias === 0) return { clase: "activo", texto: "Vence hoy" };
  return { clase: "activo", texto: `Vence en ${dias} día${dias > 1 ? "s" : ""}` };
}

function filaMiPrestamo(p, indice){
  const estado = estadoMiPrestamo(p);
  const detalle = p.devuelto
    ? `${textoFecha(p.prestado)} al ${textoFecha(p.devuelto)}`
    : `Devolver el ${textoFecha(p.limite)}`;
  return `<a href="#mi-prestamo" class="fila" data-indice="${indice}">
    <div class="fila-texto">
      <strong>${escapeHtml(p.equipo)}</strong>
      <span>${detalle}</span>
    </div>
    <span class="etiqueta ${estado.clase}">${estado.texto}</span>
  </a>`;
}

function prepararVistaAlumno(){
  const activos = misPrestamosMock.filter(p => !p.devuelto);
  document.querySelector("#total-activos").textContent = activos.length;
  document.querySelector("#total-vencidos").textContent = activos.filter(p => estadoMiPrestamo(p).clase === "vencido").length;

  const conIndice = misPrestamosMock.map((p, i) => ({ p, i }));
  document.querySelector("#lista-mis-activos").innerHTML = conIndice
    .filter(x => !x.p.devuelto).map(x => filaMiPrestamo(x.p, x.i)).join("");
  document.querySelector("#lista-mi-historial").innerHTML = conIndice
    .filter(x => x.p.devuelto).map(x => filaMiPrestamo(x.p, x.i)).join("");

  document.querySelector("#mis-prestamos").addEventListener("click", e => {
    const fila = e.target.closest("[data-indice]");
    if(fila) mostrarMiPrestamo(misPrestamosMock[Number(fila.dataset.indice)]);
  });

  // Notificaciones
  document.querySelector("#lista-notificaciones").innerHTML = notificacionesMock.map(n => `
    <div class="fila notificacion ${n.nueva ? "nueva" : ""}">
      <span class="notificacion-tipo ${n.tipo}"></span>
      <div class="fila-texto">
        <strong>${n.titulo}</strong>
        <p>${escapeHtml(n.texto)}</p>
        <span>${n.hace}</span>
      </div>
    </div>`).join("");
  const nuevas = notificacionesMock.filter(n => n.nueva).length;
  const globo = document.querySelector("#globo-notificaciones");
  globo.textContent = nuevas;
  globo.hidden = nuevas === 0;

  // Perfil: el interruptor de notificaciones push (simulado)
  document.querySelector("#interruptor-push").addEventListener("change", e => {
    mostrarToast(e.target.checked ? "Notificaciones activadas (simulado)" : "Notificaciones desactivadas (simulado)");
  });
}

function mostrarMiPrestamo(p){
  const estado = estadoMiPrestamo(p);
  document.querySelector("#mi-equipo").textContent = p.equipo;
  document.querySelector("#mi-codigo").textContent = p.codigo;
  const etiqueta = document.querySelector("#mi-estado");
  etiqueta.className = `etiqueta ${estado.clase}`;
  etiqueta.textContent = estado.texto;
  document.querySelector("#mi-fecha-prestamo").textContent = textoFecha(p.prestado);
  document.querySelector("#mi-fecha-limite").textContent = textoFecha(p.limite);
  document.querySelector("#mi-dato-devolucion").hidden = !p.devuelto;
  document.querySelector("#mi-fecha-devolucion").textContent = p.devuelto ? textoFecha(p.devuelto) : "";
  document.querySelector("#mi-observaciones").textContent = p.observaciones;
  document.querySelector("#mi-aviso").hidden = Boolean(p.devuelto);
}

function fechaISO(fecha){
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

// ======================================================================
// Equipos: datos REALES desde la API (GET /api/equipos)
// ======================================================================
async function cargarEquipos(){
  try{
    const response = await fetch(`${API_URL}/equipos`);
    if(!response.ok){
      throw new Error(`La API respondió ${response.status}`);
    }

    equiposCargados = await response.json();
    console.log(equiposCargados);
    pintarEquipos();
  }
  catch(e){
    console.log("Error al cargar los equipos", e);
    lista.innerHTML = `<div class="mensaje error">No se pudo conectar con la API. Revisa que esté en ejecución.</div>`;
  }
}

function pintarEquipos(){
  const busqueda = document.querySelector("#buscar-equipo").value.trim().toLowerCase();
  const equipos = equiposCargados.filter(equipo =>
    (filtroEstadoEquipo === "" || equipo.estado === filtroEstadoEquipo) &&
    (equipo.nombre.toLowerCase().includes(busqueda) || equipo.codigoQr.toLowerCase().includes(busqueda)));

  if(equipos.length === 0){
    lista.innerHTML = `<div class="mensaje">No hay equipos registrados.</div>`;
    return;
  }

  let html = "";
  equipos.forEach(equipo => {
    html += `<a href="#equipo-detalle" class="fila" data-id="${equipo.id}">
      <div class="fila-texto">
        <strong>${escapeHtml(equipo.nombre)}</strong>
        <span>${escapeHtml(equipo.codigoQr)} · ${escapeHtml(equipo.modelo ?? "Sin modelo")}</span>
      </div>
      <span class="etiqueta ${equipo.estado}">${equipo.estado === "disponible" ? "Disponible" : "Prestado"}</span>
    </a>`
  });
  lista.innerHTML = html;
}

function mostrarEquipo(id){
  const equipo = equiposCargados.find(e => e.id === id);
  if(!equipo) return;
  document.querySelector("#detalle-codigo").textContent = equipo.codigoQr;
  document.querySelector("#detalle-nombre").textContent = equipo.nombre;
  document.querySelector("#detalle-modelo").textContent = equipo.modelo ?? "Sin modelo";
  document.querySelector("#detalle-estado").textContent = equipo.estado === "disponible" ? "Disponible" : "Prestado";
}

// Evita que un texto guardado en la BD se interprete como HTML.
function escapeHtml(texto){
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

async function registerWS(){
  if('serviceWorker' in navigator){
    try{
        await navigator.serviceWorker.register('./SW.js');
    }
    catch(e){
      console.log("Fallo en el registro del service worker");
    }
  }
}

// Arranque: va al final para que todas las constantes ya estén declaradas.
actualizarEstadoConexion();
prepararPantallas();
mostrarPantalla();
cargarEquipos();
