<script setup>
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
</script>

<template>
  <div v-if="toast" class="toast" :class="{ error: toast.esError }" role="status">
    {{ toast.texto }}
  </div>
</template>
