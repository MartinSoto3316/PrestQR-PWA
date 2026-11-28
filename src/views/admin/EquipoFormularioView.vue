<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useToast } from '@/composables/useToast'
import AppIcono from '@/components/AppIcono.vue'

// Sin id → alta de equipo. Con id → edición (solo nombre y modelo).
const props = defineProps({ id: { type: String, default: null } })
const router = useRouter()
const { mostrarToast } = useToast()

const esEdicion = computed(() => props.id !== null)

const codigoQr = ref('')
const nombre = ref('')
const modelo = ref('')
const cargando = ref(false)
const enviando = ref(false)
const error = ref('')

// Misma regla que la API: de 3 a 20 letras, números o guiones.
const codigoValido = computed(() => /^[A-Za-z0-9-]{3,20}$/.test(codigoQr.value.trim()))
const puedeGuardar = computed(() =>
  !enviando.value && nombre.value.trim() !== '' && (esEdicion.value || codigoValido.value))

watch(() => props.id, async (id) => {
  error.value = ''
  if (id === null) return
  cargando.value = true
  try {
    const equipo = await api(`/equipos/${id}`)
    codigoQr.value = equipo.codigoQr
    nombre.value = equipo.nombre
    modelo.value = equipo.modelo ?? ''
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}, { immediate: true })

async function guardar() {
  enviando.value = true
  const datos = { nombre: nombre.value.trim(), modelo: modelo.value.trim() || null }
  try {
    const equipo = esEdicion.value
      ? await api(`/equipos/${props.id}`, { method: 'PUT', body: datos })
      : await api('/equipos', { method: 'POST', body: { codigoQr: codigoQr.value.trim(), ...datos } })

    mostrarToast(esEdicion.value ? 'Equipo actualizado' : 'Equipo registrado')
    // Al detalle, donde ya aparece el QR listo para imprimir.
    router.replace({ name: 'equipo-detalle', params: { id: equipo.id } })
  } catch (e) {
    mostrarToast(e.message, true)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="pantalla">
    <header class="barra">
      <h1>
        <RouterLink
          :to="esEdicion ? { name: 'equipo-detalle', params: { id } } : { name: 'equipos' }"
          class="volver"
          aria-label="Volver"
        >
          <AppIcono nombre="atras" />
        </RouterLink>
        {{ esEdicion ? 'Editar equipo' : 'Nuevo equipo' }}
      </h1>
    </header>

    <div v-if="error" class="mensaje error">{{ error }}</div>
    <div v-else-if="cargando" class="mensaje">Cargando…</div>

    <form v-else class="formulario" @submit.prevent="guardar">
      <label class="campo">
        <span>Código QR</span>
        <input
          v-model="codigoQr"
          type="text"
          placeholder="LAP-002"
          maxlength="20"
          autocapitalize="characters"
          autocomplete="off"
          :readonly="esEdicion"
          required
        >
        <em v-if="esEdicion">El código no se puede cambiar porque ya está impreso en el equipo.</em>
        <em v-else>De 3 a 20 caracteres: letras, números o guiones. Es lo que contendrá el QR.</em>
      </label>

      <label class="campo">
        <span>Nombre</span>
        <input v-model="nombre" type="text" placeholder="Laptop #002" maxlength="100" required>
      </label>

      <label class="campo">
        <span>Modelo <em>(opcional)</em></span>
        <input v-model="modelo" type="text" placeholder="Dell Latitude 5440" maxlength="100">
      </label>

      <button type="submit" class="boton boton-principal" :disabled="!puedeGuardar">
        {{ enviando ? 'Guardando…' : (esEdicion ? 'Guardar cambios' : 'Registrar equipo') }}
      </button>
    </form>
  </section>
</template>
