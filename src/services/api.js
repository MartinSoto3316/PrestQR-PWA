import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// En desarrollo es "/api" (Vite la reenvía); en producción viene de .env.production.
const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje)
    this.status = status
  }
}

/**
 * Llama a la API agregando el token JWT y convierte los errores (ProblemDetails) en ApiError
 * con el mensaje en español que manda el backend.
 *   api('/equipos')
 *   api('/auth/login', { method: 'POST', body: { email, password } })
 */
export async function api(ruta, { method = 'GET', body } = {}) {
  const auth = useAuthStore()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con la API. Revisa tu conexión.', 0)
  }

  if (!respuesta.ok) {
    const mensaje = await mensajeDeError(respuesta)

    // Token vencido o inválido: se cierra la sesión y se vuelve al login.
    if (respuesta.status === 401 && auth.token) {
      await auth.cerrarSesion()
      router.replace({ name: 'login' })
    }
    throw new ApiError(mensaje, respuesta.status)
  }

  return respuesta.status === 204 ? null : respuesta.json()
}

async function mensajeDeError(respuesta) {
  try {
    const problema = await respuesta.json()
    // Errores de validación de ASP.NET: { errors: { Campo: ["mensaje"] } }
    const primerError = problema.errors && Object.values(problema.errors).flat()[0]
    return problema.detail ?? primerError ?? problema.title ?? `Error ${respuesta.status}`
  } catch {
    return `La API respondió ${respuesta.status}`
  }
}
