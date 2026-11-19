import { ref } from 'vue'

// Estado compartido por toda la app: un solo aviso flotante a la vez.
const toast = ref(null)
let temporizador

export function useToast() {
  function mostrarToast(texto, esError = false) {
    toast.value = { texto, esError }
    clearTimeout(temporizador)
    temporizador = setTimeout(() => (toast.value = null), 2500)
  }

  return { toast, mostrarToast }
}
