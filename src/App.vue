<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NavegacionInferior from '@/components/NavegacionInferior.vue'
import AvisoToast from '@/components/AvisoToast.vue'

const route = useRoute()
const enLinea = ref(navigator.onLine)
const actualizarConexion = () => (enLinea.value = navigator.onLine)

onMounted(() => {
  window.addEventListener('online', actualizarConexion)
  window.addEventListener('offline', actualizarConexion)
})
onUnmounted(() => {
  window.removeEventListener('online', actualizarConexion)
  window.removeEventListener('offline', actualizarConexion)
})

// El login no lleva barra inferior; las demás pantallas sí (según el rol).
const conNavegacion = computed(() => !route.meta.publica && route.name !== undefined)
</script>

<template>
  <div class="app" :class="{ 'con-menu': conNavegacion }">
    <RouterView />
    <NavegacionInferior v-if="conNavegacion" />

    <div v-if="!enLinea" class="sin-conexion">
      Sin conexión a internet. Se muestra la última información guardada.
    </div>
    <AvisoToast />
  </div>
</template>
