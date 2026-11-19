<script setup>
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useToast } from '@/composables/useToast'
import AppIcono from '@/components/AppIcono.vue'

const props = defineProps({ id: { type: String, required: true } })
const { mostrarToast } = useToast()

const equipo = ref(null)
const error = ref('')

// Se consulta por id para que la pantalla funcione aunque se abra directo (recarga o enlace).
watch(() => props.id, async (id) => {
  equipo.value = null
  error.value = ''
  try {
    equipo.value = await api(`/equipos/${id}`)
  } catch (e) {
    error.value = e.message
  }
}, { immediate: true })
</script>

<template>
  <section class="pantalla">
    <header class="barra">
      <h1>
        <RouterLink :to="{ name: 'equipos' }" class="volver"><AppIcono nombre="atras" /></RouterLink>
        Detalle del equipo
      </h1>
    </header>

    <div v-if="error" class="mensaje error">{{ error }}</div>
    <div v-else-if="!equipo" class="mensaje">Cargando…</div>
    <template v-else>
      <div class="tarjeta qr-tarjeta">
        <svg class="icono qr-imagen"><use href="#i-qr" /></svg>
        <strong>{{ equipo.codigoQr }}</strong>
        <span class="texto-suave">Código para imprimir y pegar en el equipo</span>
      </div>

      <div class="datos">
        <div class="dato"><span>Nombre</span><strong>{{ equipo.nombre }}</strong></div>
        <div class="dato"><span>Modelo</span><strong>{{ equipo.modelo ?? 'Sin modelo' }}</strong></div>
        <div class="dato"><span>Estado</span><strong>{{ equipo.estado === 'disponible' ? 'Disponible' : 'Prestado' }}</strong></div>
      </div>

      <div class="acciones">
        <button type="button" class="boton boton-secundario" @click="mostrarToast('Descarga de QR: pendiente')">Descargar QR</button>
        <button type="button" class="boton boton-secundario" @click="mostrarToast('Edición de equipo: pendiente')">Editar</button>
      </div>
    </template>
  </section>
</template>
