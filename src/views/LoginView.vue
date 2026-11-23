<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { inicioDe } from '@/router'

const auth = useAuthStore()
const router = useRouter()
const { mostrarToast } = useToast()

const email = ref('')
const password = ref('')
const enviando = ref(false)

async function entrar() {
  enviando.value = true
  try {
    await auth.iniciarSesion(email.value.trim().toLowerCase(), password.value)
    router.replace(inicioDe(auth.rol))
  } catch (e) {
    mostrarToast(e.message, true)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="pantalla pantalla-login">
    <div class="login">
      <span class="logo login-logo" role="img" aria-label="Logo PrestQR"></span>
      <h1>PrestQR</h1>
      <p class="texto-suave">Préstamo de equipos con código QR</p>

      <form class="formulario" @submit.prevent="entrar">
        <label class="campo">
          <span>Correo</span>
          <input v-model="email" type="email" placeholder="correo@uts.edu.mx" autocomplete="username" required>
        </label>
        <label class="campo">
          <span>Contraseña</span>
          <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" required>
        </label>
        <button type="submit" class="boton boton-principal" :disabled="enviando">
          {{ enviando ? 'Entrando…' : 'Iniciar sesión' }}
        </button>
      </form>
      <p class="nota-demo">Administrador o alumno: la app abre la vista según la cuenta.</p>
    </div>
  </section>
</template>
