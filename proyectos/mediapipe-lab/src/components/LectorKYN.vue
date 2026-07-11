<template>
  <div class="lector-kyn">
    <div
      v-show="state.regla"
      ref="reglaRef"
      class="regla"
      :style="{ top: `${reglaTop}px` }"
      aria-hidden="true"
    />
    <div
      class="lector-bar"
      :class="{ mini: isMini }"
      role="toolbar"
      aria-label="Lector KYN: opciones de lectura"
      @click="wake"
    >
      <button
        type="button"
        class="lector-mini"
        aria-label="Abrir opciones de lectura"
        title="Lector KYN"
      >⚡</button>
      <span class="lector-titulo">lector</span>
      <button
        type="button"
        :aria-pressed="String(state.bio)"
        title="Lectura biónica: engrosa el inicio de cada palabra para anclar la vista"
        @click="toggleBio"
      >⚡ Biónica</button>
      <span
        v-show="state.bio"
        class="niveles"
        role="group"
        aria-label="Intensidad de fijación"
      >
        <button
          v-for="n in [1, 2, 3]"
          :key="n"
          type="button"
          :aria-pressed="String(state.nivel === n)"
          :title="NIVEL_TITULOS[n]"
          @click="setNivel(n)"
        >{{ NIVEL_MARCAS[n] }}</button>
      </span>
      <button
        type="button"
        :aria-pressed="String(state.regla)"
        title="Regla de lectura: una banda que sigue tu cursor para no perder el renglón"
        @click="toggleRegla"
      >📏 Regla</button>
      <button
        type="button"
        title="Letra más chica"
        @click="changeFuente(-1)"
      >A−</button>
      <button
        type="button"
        title="Letra más grande"
        @click="changeFuente(1)"
      >A+</button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

// Lector KYN: lectura biónica (negritas de fijación), regla que sigue al
// cursor y tamaño de letra. Mismo mecanismo que libro-agility.html, portado a
// componente Vue para usarse dentro de la app (no solo en el mini libro
// autocontenido). Comparte el localStorage `lector-kyn` con el mini libro:
// es la misma persona leyendo, la preferencia debe viajar entre los dos.
const props = defineProps({
  // Selector de los nodos de texto corrido a bionizar (títulos y nombres
  // quedan fuera a propósito: la fijación parcial en texto grande se ve rota).
  textSelector: { type: String, required: true },
  // Selector del contenedor al que se le ajusta el tamaño de letra.
  containerSelector: { type: String, required: true },
  // Cambia cuando el contenido bajo containerSelector se reemplaza (p. ej.
  // al abrir otra lección), para volver a bionizar el texto nuevo.
  contentKey: { type: [String, Number], default: '' },
})

const STORAGE_KEY = 'lector-kyn'
const RATIOS = { 1: 0.32, 2: 0.45, 3: 0.6 }
const TAMANOS = ['100%', '112%', '125%']
const NIVEL_MARCAS = { 1: '▁', 2: '▃', 3: '▅' }
const NIVEL_TITULOS = { 1: 'Fijación suave', 2: 'Fijación media', 3: 'Fijación fuerte' }

const readState = () => {
  try {
    return Object.assign({ bio: false, nivel: 2, regla: false, fuente: 0 }, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch {
    return { bio: false, nivel: 2, regla: false, fuente: 0 }
  }
}

const state = reactive(readState())
const isMini = ref(false)
const reglaRef = ref(null)
const reglaTop = ref(window.innerHeight * 0.4)

let originales = new Map()
let miniTimer = null
let raf = null

const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

const desbionizar = () => {
  originales.forEach((html, el) => { el.innerHTML = html })
  originales.clear()
}

const bionizar = () => {
  const ratio = RATIOS[state.nivel]
  document.querySelectorAll(props.textSelector).forEach((el) => {
    if (!originales.has(el)) originales.set(el, el.innerHTML)
    else el.innerHTML = originales.get(el)
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodos = []
    while (walker.nextNode()) nodos.push(walker.currentNode)
    nodos.forEach((nodo) => {
      if (!nodo.nodeValue.trim()) return
      const frag = document.createDocumentFragment()
      nodo.nodeValue.split(/(\s+)/).forEach((parte) => {
        if (!parte.trim() || !/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(parte)) {
          frag.appendChild(document.createTextNode(parte))
          return
        }
        const corte = Math.max(1, Math.round(parte.length * ratio))
        const b = document.createElement('b')
        b.className = 'bio'
        b.textContent = parte.slice(0, corte)
        frag.appendChild(b)
        frag.appendChild(document.createTextNode(parte.slice(corte)))
      })
      nodo.parentNode.replaceChild(frag, nodo)
    })
  })
}

const aplicarFuente = () => {
  const container = document.querySelector(props.containerSelector)
  if (container) container.style.fontSize = TAMANOS[state.fuente]
}

const aplicar = () => {
  aplicarFuente()
  if (state.bio) bionizar()
  else desbionizar()
}

const toggleBio = () => { state.bio = !state.bio; persist(); aplicar() }
const setNivel = (n) => { state.nivel = n; persist(); if (state.bio) aplicar() }
const toggleRegla = () => { state.regla = !state.regla; persist() }
const changeFuente = (delta) => {
  state.fuente = Math.min(TAMANOS.length - 1, Math.max(0, state.fuente + delta))
  persist()
  aplicarFuente()
}

const onPointerMove = (event) => {
  if (!state.regla || raf) return
  raf = requestAnimationFrame(() => {
    const alto = reglaRef.value?.offsetHeight || 0
    reglaTop.value = event.clientY - alto / 2
    raf = null
  })
}

const wake = () => {
  isMini.value = false
  armarMini()
}

const armarMini = () => {
  clearTimeout(miniTimer)
  miniTimer = setTimeout(() => { isMini.value = true }, 4000)
}

watch(() => props.contentKey, () => {
  originales = new Map()
  requestAnimationFrame(aplicar)
})

onMounted(() => {
  document.addEventListener('pointermove', onPointerMove)
  aplicar()
  armarMini()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', onPointerMove)
  clearTimeout(miniTimer)
  if (raf) cancelAnimationFrame(raf)
  desbionizar()
  const container = document.querySelector(props.containerSelector)
  if (container) container.style.fontSize = ''
})
</script>

<style scoped>
.lector-bar {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  max-width: calc(100vw - 2rem);
  padding: 0.4rem 0.7rem;
  background: var(--white);
  border: 1.5px solid var(--periwinkle-200);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-md);
  font-size: 0.82rem;
}
.lector-titulo { font-family: var(--font-display); font-size: 1rem; color: var(--periwinkle-700); padding-right: 0.2rem; }
.lector-bar button {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-pill);
  background: var(--paper);
  color: var(--ink-700);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.lector-bar button:hover { border-color: var(--periwinkle-300); }
.lector-bar button[aria-pressed='true'] { background: var(--periwinkle-600); border-color: var(--periwinkle-600); color: var(--white); }
.niveles { display: flex; gap: 0.2rem; }
.niveles button { padding: 0.28rem 0.5rem; font-size: 0.75rem; }

.regla {
  position: fixed;
  left: 0;
  right: 0;
  height: 3.2em;
  pointer-events: none;
  z-index: 40;
  background: rgba(135, 149, 210, 0.14);
  border-top: 1px solid rgba(135, 149, 210, 0.35);
  border-bottom: 1px solid rgba(135, 149, 210, 0.35);
}

.lector-bar.mini { padding: 0; gap: 0; }
.lector-bar.mini > :not(.lector-mini) { display: none; }
.lector-mini {
  display: none;
  width: 2.7rem;
  height: 2.7rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}
.lector-bar.mini .lector-mini { display: grid; place-items: center; }

@media (max-width: 880px) {
  .lector-bar { font-size: 0.75rem; bottom: 76px; }
  .lector-titulo { display: none; }
}

@media print {
  .lector-bar, .regla { display: none; }
}
</style>

<style>
/* Sin scoped a propósito: estas negritas se inyectan con manipulación
   directa del DOM sobre el contenido leído, que vive en el árbol de otro
   componente — el atributo data-v de este archivo no llega ahí. */
b.bio { font-weight: 700; color: var(--ink-900); }
.dato b.bio { color: inherit; }
</style>
