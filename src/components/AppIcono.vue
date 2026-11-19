<script setup>
// Usa los íconos definidos como <symbol id="i-..."> en index.html.
defineProps({ nombre: { type: String, required: true } })
</script>

<template>
  <svg class="icono" aria-hidden="true"><use :href="`#i-${nombre}`" /></svg>
</template>
