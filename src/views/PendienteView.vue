<script setup>
// Pantalla temporal para las secciones que aún no se migran a Vue.
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcono from '@/components/AppIcono.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

async function salir() {
  await auth.cerrarSesion()
  router.replace({ name: 'login' })
}
</script>

<template>
  <section class="pantalla">
    <header class="barra">
      <h1><AppIcono :nombre="route.meta.icono" /> {{ route.meta.titulo }}</h1>
      <button type="button" class="boton-icono" title="Cerrar sesión" @click="salir">
        <AppIcono nombre="salir" />
      </button>
    </header>

    <p class="saludo">Hola, <strong>{{ auth.usuario?.nombre }}</strong></p>
    <div class="mensaje">Esta pantalla todavía se está migrando a Vue.</div>
  </section>
</template>
