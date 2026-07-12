<template>
  <div class="capturar">
    <div class="cap-head">
      <h1 class="titulo">
        Capturar pose
      </h1>
      <UiBadge tone="brand">
        Modo autor
      </UiBadge>
      <span class="sub">ponte en la postura correcta y guárdala como referencia</span>
    </div>

    <div class="cap-grid">
      <!-- captura -->
      <div class="col-cap">
        <div class="stage">
          <video
            ref="videoRef"
            class="stage-video"
            autoplay
            playsinline
            muted
          />
          <canvas
            ref="overlayRef"
            class="stage-canvas"
            aria-label="Tu esqueleto en vivo"
          />

          <template v-if="corriendo">
            <div
              class="det-pill"
              :class="{ off: !listo }"
            >
              <span
                class="det-dot"
                :style="{ background: listo ? 'var(--success)' : 'var(--warning)' }"
              />
              {{ listo ? 'Pose detectada · 33 puntos' : encuadreMsg }}
            </div>
            <div
              v-if="listo && !capturado"
              class="count-pill"
            >
              {{ count }}
            </div>
            <div
              v-if="capturado"
              class="ok-pill"
            >
              ✓ Pose capturada
            </div>
            <div class="cap-hint">
              {{ capturado ? 'Revisa y guarda, o vuelve a capturar' : 'quédate quieto — capturaré el frame automáticamente' }}
            </div>
          </template>

          <!-- permiso / error -->
          <div
            v-else
            class="overlay-centro"
          >
            <div
              class="ov-icon"
              :class="{ error: fail }"
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                :stroke="fail ? '#F09A97' : 'rgba(255,255,255,0.85)'"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><path d="M2 7.5A2.5 2.5 0 0 1 4.5 5h2L8 3h5l1.5 2h2A2.5 2.5 0 0 1 19 7.5V17a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 2 17z" /><circle
                cx="10.5"
                cy="12"
                r="3.2"
              /></svg>
            </div>
            <strong>{{ fail ? 'No pudimos abrir la cámara' : 'Necesitamos tu cámara' }}</strong>
            <p>{{ fail ? (cameraStatus || 'Revisa que ninguna otra app la esté usando.') : 'El video se queda en tu dispositivo — nada se graba ni se envía.' }}</p>
            <UiButton
              variant="primary"
              size="md"
              @click="iniciar"
            >
              {{ fail ? 'Reintentar' : 'Permitir cámara' }}
            </UiButton>
          </div>
        </div>

        <div class="cap-controles">
          <button
            type="button"
            class="obturador"
            :disabled="!listo || capturado"
            aria-label="Capturar ahora"
            @click="capturarAhora"
          >
            <span class="obturador-punto" />
          </button>
          <span class="cap-atajo">o presiona <strong>espacio</strong> para capturar</span>
        </div>
      </div>

      <!-- ajustes -->
      <div class="col-ajustes">
        <div class="ajustes-card">
          <div class="campo">
            <span class="campo-label">NOMBRE DEL EJERCICIO</span>
            <input
              v-model="nombre"
              type="text"
              class="campo-input"
              placeholder="Nombre del ejercicio"
            >
          </div>

          <div class="campo">
            <span class="campo-label">ZONA</span>
            <div class="opciones">
              <button
                v-for="z in ZONAS"
                :key="z"
                type="button"
                class="op"
                :class="{ on: zona === z }"
                @click="zona = z"
              >
                {{ z }}
              </button>
            </div>
          </div>

          <div class="campo">
            <span class="campo-label">APARATO</span>
            <div class="opciones">
              <button
                v-for="a in APARATOS"
                :key="a"
                type="button"
                class="op"
                :class="{ on: aparato === a }"
                @click="aparato = a"
              >
                {{ a }}
              </button>
            </div>
          </div>

          <div class="campo">
            <div class="rigor-head">
              <span class="campo-label">QUÉ TAN ESTRICTA ES LA CORRECCIÓN</span>
              <span class="rigor-val">{{ RIGOR[rigorKey].label }}</span>
            </div>
            <input
              v-model.number="rigorIdx"
              type="range"
              min="0"
              max="2"
              step="1"
              class="rigor-range"
              aria-label="Rigor de la corrección"
            >
            <div class="rigor-ends">
              <span>Tolerante</span><span>Exigente</span>
            </div>
            <p class="rigor-desc">
              {{ RIGOR[rigorKey].label }}: avisa cuando un ángulo se sale ±{{ RIGOR[rigorKey].grados }}° de la referencia.
            </p>
          </div>
        </div>

        <UiButton
          variant="primary"
          size="lg"
          block
          :disabled="!capturado"
          @click="guardar"
        >
          Guardar como referencia
        </UiButton>
        <UiButton
          variant="ghost"
          size="md"
          block
          @click="volverACapturar"
        >
          Volver a capturar
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../../composables/useMediaPipeTrackingCamera'
import { snapshotAngles, frameCoverage } from '../../services/poseCompare'
import { drawExercisePose } from '../../utils/drawExercisePose'
import { BODY_LANDMARKS } from '../../data/referencePoses'
import { RIGOR } from '../../data/exerciseLibrary'
import { saveReference } from '../../services/exerciseStore'
import UiButton from './UiButton.vue'
import UiBadge from './UiBadge.vue'

const props = defineProps({
  exercise: { type: Object, required: true },
})
const emit = defineEmits(['saved', 'back'])

const { videoRef, poseResults, cameraActive, cameraStatus, start, stop } =
  useMediaPipeTrackingCamera({ pose: true, hands: false })

const ZONAS = ['Piernas', 'Core', 'Glúteos', 'Hombros', 'Espalda']
const APARATOS = ['Sin aparato', 'Mancuerna', 'Banda', 'Silla']
const RIGOR_KEYS = ['tolerante', 'media', 'exigente']

const overlayRef = ref(null)
const started = ref(false)
const fail = ref(false)
const capturado = ref(false)
const listo = ref(false)
const count = ref(3)
const nombre = ref(props.exercise.nombre)
const zona = ref(props.exercise.zona)
const aparato = ref(props.exercise.aparato)
const rigorIdx = ref(1)
const rigorKey = computed(() => RIGOR_KEYS[rigorIdx.value] || 'media')
const corriendo = computed(() => started.value && cameraActive.value && !fail.value)
const encuadreMsg = ref('Acomódate dentro del cuadro')

let latest = null // últimos landmarks (no reactivo)
let captured = null // { angles, pose }
let stableSince = 0

const extractPose = (landmarks) => {
  const pose = {}
  for (const i of BODY_LANDMARKS) {
    const lm = landmarks[i]
    if (lm && (lm.visibility ?? 1) >= 0.5) pose[i] = [lm.x, lm.y]
  }
  return pose
}

const doCapture = () => {
  if (!latest) return
  captured = { angles: snapshotAngles(latest), pose: extractPose(latest) }
  capturado.value = true
}

const onFrame = (landmarks) => {
  if (capturado.value) return // congelado hasta guardar o recapturar
  latest = landmarks
  const cov = frameCoverage(landmarks)
  listo.value = cov.detected && cov.ok
  if (cov.detected && !cov.ok) encuadreMsg.value = `No te veo completo — falta ${cov.faltan[0] || 'el cuerpo'}`

  drawExercisePose(overlayRef.value, videoRef.value, landmarks, {
    showReference: false,
    liveColor: '#8FE0B4',
  })

  // Cuenta regresiva automática mientras la pose se mantiene estable.
  if (listo.value) {
    if (!stableSince) stableSince = performance.now()
    const elapsed = (performance.now() - stableSince) / 1000
    count.value = Math.max(1, Math.ceil(3 - elapsed))
    if (elapsed >= 3) doCapture()
  } else {
    stableSince = 0
    count.value = 3
  }
}

watch(poseResults, (r) => {
  const lm = r?.landmarks?.[0] || null
  if (corriendo.value && lm) onFrame(lm)
})

const iniciar = async () => {
  fail.value = false
  started.value = true
  capturado.value = false
  captured = null
  stableSince = 0
  await start('Captura de pose activa.')
  if (!cameraActive.value) fail.value = true
}

const capturarAhora = () => { if (listo.value && !capturado.value) doCapture() }

const volverACapturar = () => {
  capturado.value = false
  captured = null
  stableSince = 0
  count.value = 3
  if (!corriendo.value) iniciar()
}

const guardar = () => {
  if (!captured) return
  saveReference(props.exercise.id, {
    nombre: nombre.value,
    zona: zona.value,
    aparato: aparato.value,
    rigor: rigorKey.value,
    angles: captured.angles,
    pose: captured.pose,
  })
  stop()
  emit('saved', props.exercise.id)
}

const onKey = (e) => {
  if (e.code === 'Space') { e.preventDefault(); capturarAhora() }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  stop()
})
</script>

<style scoped>
.capturar { display: grid; gap: 16px; max-width: 1080px; }
.cap-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.titulo { margin: 0; font-family: var(--font-display); font-size: 30px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.sub { font-size: 12.5px; color: var(--ink-500); }

.cap-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 14px; align-items: start; }
.col-cap { display: grid; gap: 12px; min-width: 0; }
.stage { position: relative; width: 100%; box-sizing: border-box; aspect-ratio: 16 / 10; background: var(--ink-900); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-md); }
.stage-video, .stage-canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }

.det-pill { position: absolute; top: 14px; left: 14px; display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.94); font-size: 13px; font-weight: 700; }
.det-pill.off { background: rgba(255, 255, 255, 0.82); }
.det-dot { width: 8px; height: 8px; border-radius: 999px; }
.count-pill { position: absolute; top: 14px; right: 14px; min-width: 34px; text-align: center; padding: 7px 13px; border-radius: 999px; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(6px); color: #fff; font-size: 15px; font-weight: 800; }
.ok-pill { position: absolute; top: 14px; right: 14px; padding: 7px 13px; border-radius: 999px; background: rgba(79, 164, 122, 0.95); color: #fff; font-size: 12.5px; font-weight: 700; }
.cap-hint { position: absolute; left: 0; right: 0; bottom: 22px; text-align: center; font-size: 12.5px; color: rgba(255, 255, 255, 0.72); }

.overlay-centro { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 14px; padding: 30px; text-align: center; }
.ov-icon { width: 60px; height: 60px; border-radius: 17px; background: rgba(255, 255, 255, 0.08); display: grid; place-items: center; }
.ov-icon.error { background: rgba(217, 83, 79, 0.16); }
.overlay-centro strong { font-size: 20px; color: #fff; }
.overlay-centro p { margin: 0; max-width: 340px; font-size: 14px; line-height: 1.55; color: rgba(255, 255, 255, 0.72); }

.cap-controles { display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; }
.obturador { width: 66px; height: 66px; border: 4px solid var(--periwinkle-200); border-radius: 999px; background: #fff; cursor: pointer; display: grid; place-items: center; }
.obturador:disabled { opacity: 0.5; cursor: default; }
.obturador-punto { width: 24px; height: 24px; border-radius: 999px; background: var(--pop-magenta); }
.cap-atajo { font-size: 12.5px; color: var(--ink-500); }

.col-ajustes { display: grid; gap: 12px; }
.ajustes-card { display: grid; gap: 14px; padding: 18px 20px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 16px; box-shadow: var(--shadow-sm); }
.campo { display: grid; gap: 8px; }
.campo-label { font-size: 11px; font-weight: 700; color: var(--ink-500); }
.campo-input { padding: 11px 14px; border-radius: 12px; border: 1px solid var(--periwinkle-300); background: var(--paper); font: inherit; font-size: 15px; font-weight: 600; color: var(--ink-900); outline: none; }
.campo-input:focus { box-shadow: var(--shadow-focus); }
.opciones { display: flex; gap: 6px; flex-wrap: wrap; }
.op { font-family: inherit; font-size: 12.5px; font-weight: 600; padding: 6px 12px; border-radius: 999px; background: var(--oat); color: var(--ink-700); border: none; cursor: pointer; }
.op.on { background: var(--periwinkle-500); color: #fff; font-weight: 700; }

.rigor-head { display: flex; align-items: baseline; }
.rigor-val { margin-left: auto; font-size: 12px; font-weight: 700; color: var(--periwinkle-700); }
.rigor-range { width: 100%; accent-color: var(--periwinkle-500); }
.rigor-ends { display: flex; font-size: 11px; color: var(--ink-500); }
.rigor-ends span:last-child { margin-left: auto; }
.rigor-desc { margin: 0; font-size: 12px; line-height: 1.5; color: var(--ink-500); }

@media (max-width: 880px) {
  .cap-grid { grid-template-columns: 1fr; }
}
</style>
