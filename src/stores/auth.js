import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

const CLAVE = 'prestqr.sesion'

/**
 * Sesión del usuario: token JWT, fecha de expiración y datos (rol, nombre, alumnoId).
 * Se guarda en localStorage para que la sesión sobreviva al cerrar la app.
 */
export const useAuthStore = defineStore('auth', () => {
  const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? 'null')

  const token = ref(guardada?.token ?? null)
  const expiraEn = ref(guardada?.expiraEn ?? null)
  const usuario = ref(guardada?.usuario ?? null)

  const autenticado = computed(() => Boolean(token.value) && new Date(expiraEn.value) > new Date())
  const rol = computed(() => usuario.value?.rol ?? null)
  const esAdmin = computed(() => rol.value === 'admin')

  async function iniciarSesion(email, password) {
    const respuesta = await api('/auth/login', { method: 'POST', body: { email, password } })
    token.value = respuesta.token
    expiraEn.value = respuesta.expiraEn
    usuario.value = respuesta.usuario
    localStorage.setItem(CLAVE, JSON.stringify(respuesta))
  }

  async function cerrarSesion() {
    token.value = null
    expiraEn.value = null
    usuario.value = null
    localStorage.removeItem(CLAVE)
    // Borra las respuestas de la API guardadas para que el siguiente usuario no vea datos ajenos.
    if ('caches' in window) await caches.delete('api')
  }

  return { token, expiraEn, usuario, autenticado, rol, esAdmin, iniciarSesion, cerrarSesion }
})
