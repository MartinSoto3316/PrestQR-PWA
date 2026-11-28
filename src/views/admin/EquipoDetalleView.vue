<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { api } from '@/services/api'
import { useToast } from '@/composables/useToast'
import AppIcono from '@/components/AppIcono.vue'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const { mostrarToast } = useToast()

const equipo = ref(null)
const prestamos = ref([])
const qrUrl = ref('')
const error = ref('')
const eliminando = ref(false)

// Se consulta por id para que la pantalla funcione aunque se abra directo (recarga o enlace).
watch(() => props.id, async (id) => {
  equipo.value = null
  prestamos.value = []
  qrUrl.value = ''
  error.value = ''
  try {
    equipo.value = await api(`/equipos/${id}`)
    // El QR contiene SOLO el código del equipo (por ejemplo "LAP-001"); los datos se piden a la API al escanear.
    qrUrl.value = await QRCode.toDataURL(equipo.value.codigoQr, {
      width: 512, // resolución suficiente para imprimir
      margin: 2, // borde blanco para que la cámara lo distinga
      errorCorrectionLevel: 'M', // tolera rayones leves
    })
  } catch (e) {
    error.value = e.message
    return
  }
  // Si falla el historial, la pantalla y el QR siguen disponibles.
  try {
    prestamos.value = await api(`/prestamos?equipoId=${id}`)
  } catch (e) {
    mostrarToast(`No se pudo cargar el historial: ${e.message}`, true)
  }
}, { immediate: true })

function descargarQr() {
  const enlace = document.createElement('a')
  enlace.href = qrUrl.value
  enlace.download = `QR-${equipo.value.codigoQr}.png`
  enlace.click()
}

// Los estilos @media print de app.css dejan visible solo la etiqueta del QR.
function imprimirQr() {
  window.print()
}

async function eliminar() {
  if (!window.confirm(`¿Eliminar el equipo ${equipo.value.codigoQr}? Esta acción no se puede deshacer.`)) return

  eliminando.value = true
  try {
    await api(`/equipos/${props.id}`, { method: 'DELETE' })
    mostrarToast('Equipo eliminado')
    router.replace({ name: 'equipos' })
  } catch (e) {
    // Por ejemplo, si el equipo tiene préstamos registrados (la API responde 409).
    mostrarToast(e.message, true)
  } finally {
    eliminando.value = false
  }
}

const formatoFecha = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Hermosillo' })
// fechaLimite llega como "YYYY-MM-DD" (sin hora); se lee como fecha local para no correr un día.
function fecha(valor) {
  if (!valor) return ''
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor)
  return soloFecha ? valor.split('-').reverse().join('/') : formatoFecha.format(new Date(valor))
}
</script>

<template>
  <section class="pantalla">
    <header class="barra">
      <h1>
        <RouterLink :to="{ name: 'equipos' }" class="volver" aria-label="Volver"><AppIcono nombre="atras" /></RouterLink>
        Detalle del equipo
      </h1>
    </header>

    <div v-if="error" class="mensaje error">{{ error }}</div>
    <div v-else-if="!equipo" class="mensaje">Cargando…</div>
    <template v-else>
      <div class="tarjeta qr-tarjeta">
        <img v-if="qrUrl" :src="qrUrl" :alt="`Código QR de ${equipo.codigoQr}`" class="qr-imagen">
        <strong>{{ equipo.codigoQr }}</strong>
        <span class="qr-nombre">{{ equipo.nombre }}</span>
        <span class="texto-suave qr-ayuda">Código para imprimir y pegar en el equipo</span>
      </div>

      <div class="acciones">
        <button type="button" class="boton boton-secundario" :disabled="!qrUrl" @click="descargarQr">Descargar QR</button>
        <button type="button" class="boton boton-secundario" :disabled="!qrUrl" @click="imprimirQr">Imprimir QR</button>
      </div>

      <div class="datos">
        <div class="dato"><span>Nombre</span><strong>{{ equipo.nombre }}</strong></div>
        <div class="dato"><span>Modelo</span><strong>{{ equipo.modelo ?? 'Sin modelo' }}</strong></div>
        <div class="dato">
          <span>Estado</span>
          <span class="etiqueta" :class="equipo.estado">{{ equipo.estado === 'disponible' ? 'Disponible' : 'Prestado' }}</span>
        </div>
      </div>

      <div class="acciones">
        <RouterLink :to="{ name: 'equipo-editar', params: { id } }" class="boton boton-secundario">Editar</RouterLink>
        <button type="button" class="boton boton-peligro" :disabled="eliminando" @click="eliminar">
          {{ eliminando ? 'Eliminando…' : 'Eliminar' }}
        </button>
      </div>

      <div class="titulo-seccion"><h2>Historial de préstamos</h2></div>
      <div class="lista">
        <div v-if="prestamos.length === 0" class="mensaje">Este equipo todavía no se ha prestado.</div>
        <div v-for="p in prestamos" :key="p.id" class="fila">
          <div class="fila-texto">
            <strong>{{ p.alumnoNombre }}</strong>
            <span>
              Prestado {{ fecha(p.fechaPrestamo) }} · Límite {{ fecha(p.fechaLimite) }}
              <template v-if="p.fechaDevolucion"> · Devuelto {{ fecha(p.fechaDevolucion) }}</template>
            </span>
          </div>
          <span v-if="p.vencido" class="etiqueta vencido">Vencido</span>
          <span v-else class="etiqueta" :class="p.estado">{{ p.estado === 'activo' ? 'Activo' : 'Devuelto' }}</span>
        </div>
      </div>
    </template>
  </section>
</template>
