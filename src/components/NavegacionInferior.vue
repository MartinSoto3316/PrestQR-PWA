<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcono from './AppIcono.vue'

const auth = useAuthStore()
const route = useRoute()

const pestanasAdmin = [
  { ruta: 'dashboard', icono: 'dashboard', texto: 'Inicio' },
  { ruta: 'escanear', icono: 'qr', texto: 'Escanear' },
  { ruta: 'equipos', icono: 'equipo', texto: 'Equipos' },
  { ruta: 'prestamos', icono: 'lista', texto: 'Préstamos' },
  { ruta: 'alumnos', icono: 'alumnos', texto: 'Alumnos' },
]

const pestanasAlumno = [
  { ruta: 'mis-prestamos', icono: 'lista', texto: 'Mis préstamos' },
  { ruta: 'notificaciones', icono: 'campana', texto: 'Notificaciones' },
  { ruta: 'perfil', icono: 'usuario', texto: 'Perfil' },
]

const pestanas = computed(() => (auth.esAdmin ? pestanasAdmin : pestanasAlumno))
</script>

<template>
  <nav class="navegacion">
    <RouterLink
      v-for="p in pestanas"
      :key="p.ruta"
      :to="{ name: p.ruta }"
      :class="{ activo: route.meta.tab === p.ruta }"
    >
      <AppIcono :nombre="p.icono" />
      <span>{{ p.texto }}</span>
    </RouterLink>
  </nav>
</template>
