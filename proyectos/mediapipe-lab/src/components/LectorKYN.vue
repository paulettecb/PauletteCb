<template>
  <div class="lector-kyn">
    <div
      v-show="state.regla || gazeRuling"
      ref="reglaRef"
      class="regla"
      :class="{ 'regla-mirada': gazeRuling }"
      :style="{ top: `${reglaTop}px` }"
      aria-hidden="true"
    />

    <!-- Panel de auto-vista + estado, visible solo con la mirada activa -->
    <div
      v-show="gazeOn"
      class="gaze-panel"
    >
      <video
        ref="gazeVideo"
        class="gaze-video"
        autoplay
        playsinline
        muted
      />
      <div class="gaze-panel-info">
        <span
          class="gaze-dot"
          :class="{ on: gaze.facePresent.value }"
        />
        <span class="gaze-panel-text">{{ gazePanelText }}</span>
        <button
          v-if="gaze.calibrated.value && !calibrating"
          type="button"
          class="gaze-mini-btn"
          @click="startCalibration"
        >Recalibrar</button>
      </div>
    </div>

    <!-- Overlay de calibración -->
    <div
      v-if="calibrating"
      class="gaze-cal"
      role="dialog"
      aria-label="Calibración de mirada"
    >
      <div
        class="gaze-cal-dot"
        :style="{ top: `${CAL_POINTS[calStep].frac * 100}%` }"
      />
      <div class="gaze-cal-card">
        <strong>Calibrando la mirada · paso {{ calStep + 1 }} de {{ CAL_POINTS.length }}</strong>
        <p>Sin mover la cabeza, <b>mira el punto {{ CAL_POINTS[calStep].label }}</b> y presiona Espacio (o el botón).</p>
        <p
          v-if="!gaze.facePresent.value"
          class="gaze-cal-warn"
        >No te veo bien: acomódate frente a la cámara con buena luz.</p>
        <div class="gaze-cal-actions">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!gaze.facePresent.value"
            @click="captureCalibration"
          >Capturar punto</button>
          <button
            type="button"
            class="btn mini"
            @click="cancelCalibration"
          >Cancelar</button>
        </div>
      </div>
    </div>

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
        class="gaze-toggle"
        :aria-pressed="String(gazeOn)"
        title="Regla con la mirada: la banda sigue tus ojos (usa la cámara, todo local)"
        @click="toggleMirada"
      >👁️ Mirada</button>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useGazeReader } from '../composables/useGazeReader'

// Lector KYN: lectura biónica (negritas de fijación), regla que sigue al
// cursor —o a la mirada— y tamaño de letra. Mismo mecanismo que
// libro-agility.html, portado a componente Vue para usarse dentro de la app.
// Comparte el localStorage `lector-kyn` con el mini libro: es la misma
// persona leyendo, la preferencia debe viajar entre los dos.
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
// Puntos de calibración de mirada, de arriba a abajo del área de lectura.
const CAL_POINTS = [
  { label: 'de arriba', frac: 0.22 },
  { label: 'del centro', frac: 0.5 },
  { label: 'de abajo', frac: 0.78 },
]

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

// La mirada NO se persiste: encender la cámara debe ser un gesto explícito
// cada sesión, no algo que revive solo al abrir una lección.
const gaze = useGazeReader()
const gazeVideo = ref(null)
const gazeOn = ref(false)
const calibrating = ref(false)
const calStep = ref(0)
let calSamples = []

const gazeRuling = computed(() => gazeOn.value && gaze.calibrated.value)
const gazePanelText = computed(() => {
  if (gaze.status.value) return gaze.status.value
  if (calibrating.value) return 'Calibrando…'
  if (!gaze.facePresent.value) return 'No te veo — acomódate frente a la cámara.'
  if (gaze.calibrated.value) return 'Siguiendo tu mirada.'
  return 'Listo para calibrar.'
})

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

const setReglaAt = (clientY) => {
  const alto = reglaRef.value?.offsetHeight || 0
  reglaTop.value = clientY - alto / 2
}

const onPointerMove = (event) => {
  if (gazeRuling.value || !state.regla || raf) return
  raf = requestAnimationFrame(() => {
    setReglaAt(event.clientY)
    raf = null
  })
}

// La regla sigue la mirada cuando está calibrada.
watch(() => gaze.gazeY.value, (y) => {
  if (gazeRuling.value && y !== null) setReglaAt(y)
})

const toggleMirada = async () => {
  if (gazeOn.value) {
    gazeOn.value = false
    calibrating.value = false
    gaze.stop()
    gaze.clearCalibration()
    return
  }
  gazeOn.value = true
  await gaze.start(gazeVideo.value)
  if (gaze.active.value) startCalibration()
  else gazeOn.value = false
}

const startCalibration = () => {
  calSamples = []
  calStep.value = 0
  calibrating.value = true
}

const captureCalibration = () => {
  const offset = gaze.currentOffset()
  if (offset === null || !gaze.facePresent.value) return
  calSamples.push({ offset, y: CAL_POINTS[calStep.value].frac * window.innerHeight })

  if (calStep.value < CAL_POINTS.length - 1) {
    calStep.value += 1
    return
  }
  calibrating.value = false
  if (!gaze.setCalibration(calSamples)) startCalibration() // calibración inválida, reintentar
}

const cancelCalibration = () => {
  calibrating.value = false
  if (!gaze.calibrated.value) {
    gazeOn.value = false
    gaze.stop()
  }
}

const onKeydown = (event) => {
  if (calibrating.value && (event.code === 'Space' || event.key === ' ')) {
    event.preventDefault()
    captureCalibration()
  }
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
  document.addEventListener('keydown', onKeydown)
  aplicar()
  armarMini()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('keydown', onKeydown)
  clearTimeout(miniTimer)
  if (raf) cancelAnimationFrame(raf)
  gaze.stop()
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
/* La regla de mirada glisa por transición para tapar el jitter residual. */
.regla-mirada {
  background: rgba(232, 93, 160, 0.13);
  border-top-color: rgba(232, 93, 160, 0.4);
  border-bottom-color: rgba(232, 93, 160, 0.4);
  transition: top 0.12s linear;
}

/* Auto-vista de mirada */
.gaze-panel {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  z-index: 50;
  display: grid;
  gap: 0.3rem;
  padding: 0.4rem;
  background: var(--white);
  border: 1.5px solid var(--periwinkle-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
.gaze-video {
  width: 132px;
  height: 74px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--ink-900);
  transform: scaleX(-1);
}
.gaze-panel-info { display: flex; align-items: center; gap: 0.35rem; max-width: 132px; }
.gaze-dot { width: 9px; height: 9px; flex: none; border-radius: 50%; background: var(--ink-300); }
.gaze-dot.on { background: var(--success); }
.gaze-panel-text { font-size: 0.68rem; line-height: 1.15; color: var(--ink-700); }
.gaze-mini-btn {
  margin-left: auto;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-pill);
  background: var(--paper);
  font: inherit;
  font-size: 0.64rem;
  font-weight: 600;
  cursor: pointer;
}

/* Overlay de calibración */
.gaze-cal {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(38, 42, 74, 0.55);
  backdrop-filter: blur(1px);
}
.gaze-cal-dot {
  position: absolute;
  left: 30%;
  width: 26px;
  height: 26px;
  margin: -13px 0 0 -13px;
  border-radius: 50%;
  background: var(--pop-magenta);
  box-shadow: 0 0 0 8px rgba(232, 93, 160, 0.28), 0 0 0 16px rgba(232, 93, 160, 0.14);
  transition: top 0.35s var(--ease-out);
}
.gaze-cal-card {
  position: absolute;
  right: 1.5rem;
  bottom: 1.5rem;
  max-width: 320px;
  display: grid;
  gap: 0.5rem;
  padding: 1rem 1.2rem;
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}
.gaze-cal-card strong { font-size: 0.9rem; color: var(--periwinkle-700); }
.gaze-cal-card p { margin: 0; font-size: 0.85rem; line-height: 1.4; color: var(--ink-700); }
.gaze-cal-warn { color: var(--danger); font-weight: 600; }
.gaze-cal-actions { display: flex; gap: 0.5rem; margin-top: 0.2rem; }
.gaze-cal-actions .btn { min-height: 34px; }
.btn.mini { padding: 0.28rem 0.7rem; font-size: 0.78rem; }

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
  .gaze-panel { bottom: 76px; }
}

@media print {
  .lector-bar, .regla, .gaze-panel, .gaze-cal { display: none; }
}
</style>

<style>
/* Sin scoped a propósito: estas negritas se inyectan con manipulación
   directa del DOM sobre el contenido leído, que vive en el árbol de otro
   componente — el atributo data-v de este archivo no llega ahí. */
b.bio { font-weight: 700; color: var(--ink-900); }
.dato b.bio { color: inherit; }
</style>
