<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import AppIcono from '@/components/AppIcono.vue'

const equipos = ref([])
const cargando = ref(true)
const error = ref('')
const busqueda = ref('')
const filtroEstado = ref('')

const filtros = [
  { estado: '', texto: 'Todos' },
  { estado: 'disponible', texto: 'Disponibles' },
  { estado: 'prestado', texto: 'Prestados' },
]

async function cargarEquipos() {
  error.value = ''
  try {
    equipos.value = await api('/equipos')
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

const equiposFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return equipos.value.filter((e) =>
    (filtroEstado.value === '' || e.estado === filtroEstado.value) &&
    (e.nombre.toLowerCase().includes(texto) || e.codigoQr.toLowerCase().includes(texto)))
})

// Al recuperar la conexión, trae la lista actualizada.
onMounted(() => {
  cargarEquipos()
  window.addEventListener('online', cargarEquipos)
})
onUnmounted(() => window.removeEventListener('online', cargarEquipos))
</script>

<template>
  <section class="pantalla">
    <header class="barra">
      <h1><AppIcono nombre="equipo" /> Equipos</h1>
      <!-- Alta de equipo: pendiente de migrar -->
      <button type="button" class="boton-icono" title="Nuevo equipo" disabled>
        <AppIcono nombre="mas" />
      </button>
    </header>

    <input v-model="busqueda" type="search" class="buscador" placeholder="Buscar por nombre o código">
    <div class="filtros">
      <button
        v-for="f in filtros"
        :key="f.estado"
        type="button"
        class="filtro"
        :class="{ activo: filtroEstado === f.estado }"
        @click="filtroEstado = f.estado"
      >
        {{ f.texto }}
      </button>
    </div>

    <div class="lista">
      <div v-if="cargando" class="mensaje">Cargando equipos…</div>
      <div v-else-if="error" class="mensaje error">{{ error }}</div>
      <div v-else-if="equiposFiltrados.length === 0" class="mensaje">No hay equipos registrados.</div>
      <template v-else>
        <RouterLink
          v-for="e in equiposFiltrados"
          :key="e.id"
          :to="{ name: 'equipo-detalle', params: { id: e.id } }"
          class="fila"
        >
          <div class="fila-texto">
            <strong>{{ e.nombre }}</strong>
            <span>{{ e.codigoQr }} · {{ e.modelo ?? 'Sin modelo' }}</span>
          </div>
          <span class="etiqueta" :class="e.estado">{{ e.estado === 'disponible' ? 'Disponible' : 'Prestado' }}</span>
        </RouterLink>
      </template>
    </div>
  </section>
</template>
