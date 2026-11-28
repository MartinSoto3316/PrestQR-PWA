import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// meta.rol: quién puede entrar ('admin' o 'alumno'). meta.tab: pestaña marcada en la barra inferior.
// Las pantallas con PendienteView todavía no se migran desde la versión sin framework.
const Pendiente = () => import('@/views/PendienteView.vue')

const routes = [
  { path: '/', redirect: () => inicioDe(useAuthStore().rol) },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { publica: true } },

  // ---------- Administrador ----------
  { path: '/dashboard', name: 'dashboard', component: Pendiente, meta: { rol: 'admin', tab: 'dashboard', titulo: 'Dashboard', icono: 'dashboard' } },
  { path: '/escanear', name: 'escanear', component: Pendiente, meta: { rol: 'admin', tab: 'escanear', titulo: 'Escanear equipo', icono: 'qr' } },
  { path: '/equipos', name: 'equipos', component: () => import('@/views/admin/EquiposView.vue'), meta: { rol: 'admin', tab: 'equipos' } },
  { path: '/equipos/nuevo', name: 'equipo-nuevo', component: () => import('@/views/admin/EquipoFormularioView.vue'), meta: { rol: 'admin', tab: 'equipos' } },
  { path: '/equipos/:id/editar', name: 'equipo-editar', component: () => import('@/views/admin/EquipoFormularioView.vue'), props: true, meta: { rol: 'admin', tab: 'equipos' } },
  { path: '/equipos/:id', name: 'equipo-detalle', component: () => import('@/views/admin/EquipoDetalleView.vue'), props: true, meta: { rol: 'admin', tab: 'equipos' } },
  { path: '/prestamos', name: 'prestamos', component: Pendiente, meta: { rol: 'admin', tab: 'prestamos', titulo: 'Préstamos', icono: 'lista' } },
  { path: '/alumnos', name: 'alumnos', component: Pendiente, meta: { rol: 'admin', tab: 'alumnos', titulo: 'Alumnos', icono: 'alumnos' } },

  // ---------- Alumno ----------
  { path: '/mis-prestamos', name: 'mis-prestamos', component: Pendiente, meta: { rol: 'alumno', tab: 'mis-prestamos', titulo: 'Mis préstamos', icono: 'lista' } },
  { path: '/notificaciones', name: 'notificaciones', component: Pendiente, meta: { rol: 'alumno', tab: 'notificaciones', titulo: 'Notificaciones', icono: 'campana' } },
  { path: '/perfil', name: 'perfil', component: Pendiente, meta: { rol: 'alumno', tab: 'perfil', titulo: 'Perfil', icono: 'usuario' } },

  { path: '/:ruta(.*)*', redirect: '/' },
]

export function inicioDe(rol) {
  if (rol === 'admin') return { name: 'dashboard' }
  if (rol === 'alumno') return { name: 'mis-prestamos' }
  return { name: 'login' }
}

// Hash (/#/equipos) para que funcione en cualquier hosting estático sin configurar redirecciones.
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Protección por rol. Es solo para la interfaz: la API vuelve a validar el rol en cada petición.
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.publica) {
    return auth.autenticado ? inicioDe(auth.rol) : true
  }
  if (!auth.autenticado) {
    return { name: 'login' }
  }
  if (to.meta.rol && to.meta.rol !== auth.rol) {
    return inicioDe(auth.rol)
  }
  return true
})

export default router
