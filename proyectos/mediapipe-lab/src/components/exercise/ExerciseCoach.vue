<template>
  <div class="coach">
    <div class="coach-head">
      <h1 class="nombre">
        {{ exercise.nombre }}
      </h1>
      <UiBadge tone="brand">
        Coach en vivo
      </UiBadge>
      <span class="head-sub">correcciones contra tu pose de referencia</span>
      <div class="head-acciones">
        <UiButton
          variant="ghost"
          size="sm"
          @click="voz = !voz"
        >
          Voz: {{ voz ? 'activada' : 'silencio' }}
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          @click="terminar"
        >
          Terminar
        </UiButton>
      </div>
    </div>

    <div class="coach-grid">
      <!-- VIDEO -->
      <div class="col-video">
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
            aria-label="Doble esqueleto: referencia y tu pose"
          />

          <!-- ACTIVO -->
          <template v-if="estado === 'activo'">
            <div class="scanline" />
            <!-- Reps + en vivo -->
            <div class="hud-topleft">
              <div class="reps-pill">
                <strong>{{ reps }}</strong>
                <span>/ {{ metaReps }} {{ exercise.dosis.repsLabel }}</span>
              </div>
              <div class="envivo-pill">
                <span class="dot-rec" />EN VIVO
              </div>
            </div>
            <!-- Match ring -->
            <div class="match-ring">
              <svg
                width="78"
                height="78"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="rgba(0,0,0,0.32)"
                  stroke="rgba(255,255,255,0.18)"
                  stroke-width="9"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  :stroke="matchColor"
                  stroke-width="9"
                  stroke-linecap="round"
                  :stroke-dasharray="ringDash"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="match-val">
                <strong>{{ matchDisplay }}</strong>
                <span>MATCH</span>
              </div>
            </div>
            <!-- Aguante -->
            <div
              v-if="esAguante"
              class="hold-pill"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><circle
                cx="12"
                cy="13"
                r="8"
              /><path d="M12 9v4l2 2" /><path d="M9 2h6" /></svg>
              aguanta {{ holdText }}
            </div>
            <!-- Leyenda -->
            <div class="leyenda">
              <span><span class="ley-ref" />referencia</span>
              <span><span class="ley-tu" />tú</span>
            </div>
            <!-- Correcciones -->
            <div class="cues">
              <span
                v-for="(c, i) in cues"
                :key="i"
                class="cue"
                :class="c.tono"
              >{{ c.texto }}</span>
            </div>
            <!-- Pausa overlay -->
            <div
              v-if="paused"
              class="paused"
            >
              <strong>Pausado</strong>
              <span>Presiona <b>espacio</b> para seguir</span>
            </div>
          </template>

          <!-- PERMISO / CARGANDO -->
          <div
            v-else-if="estado === 'permiso' || estado === 'cargando'"
            class="overlay-centro"
          >
            <div class="ov-icon">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><path d="M2 7.5A2.5 2.5 0 0 1 4.5 5h2L8 3h5l1.5 2h2A2.5 2.5 0 0 1 19 7.5V17a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 2 17z" /><circle
                cx="10.5"
                cy="12"
                r="3.2"
              /></svg>
            </div>
            <strong>{{ estado === 'cargando' ? 'Encendiendo cámara…' : 'Necesitamos tu cámara' }}</strong>
            <p>{{ estado === 'cargando' ? (cameraStatus || 'Cargando el modelo de pose…') : 'Para comparar tu postura con la de referencia. El video se queda en tu dispositivo — nada se graba ni se envía.' }}</p>
            <UiButton
              v-if="estado === 'permiso'"
              variant="primary"
              size="md"
              @click="iniciar"
            >
              Permitir cámara
            </UiButton>
          </div>

          <!-- ENCUADRE -->
          <div
            v-else-if="estado === 'encuadre'"
            class="overlay-encuadre"
          >
            <span class="esq tl" />
            <span class="esq tr" />
            <span class="esq bl" />
            <span class="esq br" />
            <div class="encuadre-msg">
              <span class="encuadre-pill">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                {{ encuadreMsg }}
              </span>
              <span class="encuadre-sub">Necesito verte de la cabeza a los tobillos dentro del cuadro</span>
            </div>
          </div>

          <!-- ERROR -->
          <div
            v-else
            class="overlay-centro"
          >
            <div class="ov-icon error">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F09A97"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </div>
            <strong>Algo salió mal con la cámara</strong>
            <p>{{ cameraStatus || 'No pudimos iniciar el modelo de pose. Revisa que ninguna otra app esté usando la cámara y vuelve a intentar.' }}</p>
            <div class="ov-acciones">
              <UiButton
                variant="primary"
                size="md"
                @click="iniciar"
              >
                Reintentar
              </UiButton>
              <UiButton
                variant="ghost"
                size="md"
                @click="$emit('back')"
              >
                Volver
              </UiButton>
            </div>
          </div>
        </div>

        <div class="controles">
          <UiButton
            variant="primary"
            size="md"
            :disabled="estado !== 'activo'"
            @click="paused = !paused"
          >
            {{ paused ? 'Reanudar' : 'Pausar' }}
          </UiButton>
          <UiButton
            variant="ghost"
            size="md"
            @click="repetirInstruccion"
          >
            Repetir instrucción
          </UiButton>
          <span class="atajos">tecla <strong>espacio</strong> pausa · <strong>m</strong> silencia la voz</span>
        </div>
      </div>

      <!-- Panel lateral -->
      <div class="col-panel">
        <div class="panel-card">
          <span class="eyebrow">POSE OBJETIVO</span>
          <div
            class="panel-pose"
            :style="{ background: exercise.pastel }"
          >
            <div class="panel-glyph">
              <PoseGlyph :pose="exercise.pose" />
            </div>
          </div>
          <strong class="panel-instr">{{ exercise.instruccion }}</strong>
          <p class="panel-instr-sub">
            {{ exercise.instruccionSub }}
          </p>
        </div>

        <div class="panel-card">
          <strong class="panel-titulo">Articulaciones</strong>
          <div
            v-for="a in joints"
            :key="a.label"
            class="art"
          >
            <span
              class="art-dot"
              :style="{ background: a.color, boxShadow: `0 0 0 3px ${a.halo}` }"
            />
            <span class="art-nombre">{{ a.label }}</span>
            <span
              class="art-estado"
              :style="{ color: a.color }"
            >{{ a.estado }}</span>
          </div>
        </div>

        <div class="panel-serie">
          <span>Serie actual</span>
          <strong>{{ exercise.dosis.series }} series · {{ reps }}/{{ metaReps }} {{ exercise.dosis.repsLabel }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../../composables/useMediaPipeTrackingCamera'
import { comparePose, createRepCounter, landmarksForJoint } from '../../services/poseCompare'
import { drawExercisePose } from '../../utils/drawExercisePose'
import { getReferencePose } from '../../data/referencePoses'
import { RIGOR } from '../../data/exerciseLibrary'
import PoseGlyph from './PoseGlyph.vue'
import UiButton from './UiButton.vue'
import UiBadge from './UiBadge.vue'

const props = defineProps({
  exercise: { type: Object, required: true },
  reference: { type: Object, default: null },
})
const emit = defineEmits(['back', 'finish'])

const { videoRef, poseResults, poseDetected, cameraActive, cameraStatus, start, stop } =
  useMediaPipeTrackingCamera({ pose: true, hands: false })

const overlayRef = ref(null)
const started = ref(false)
const fail = ref(false)
const paused = ref(false)
const voz = ref(true)

// Estado del coach (dibujo/comparación viven en refs de display).
const matchDisplay = ref(0)
const reps = ref(0)
const joints = ref([])
const cues = ref([])
const coverageOk = ref(false)
const faltan = ref([])
const holdSeconds = ref(0)

const rigor = computed(() => RIGOR[props.reference?.rigor] || RIGOR.media)
const capturedAngles = computed(() => props.reference?.angles || null)
const referencePose = computed(() => props.reference?.pose || getReferencePose(props.exercise.pose))
const metaReps = computed(() => props.exercise.dosis?.reps ?? '—')
const esAguante = computed(() => props.exercise.ref?.tipo === 'aguante' || !props.exercise.ref?.rep)

const estado = computed(() => {
  if (!started.value) return 'permiso'
  if (fail.value) return 'error'
  if (!cameraActive.value) return 'cargando'
  if (poseDetected.value && coverageOk.value) return 'activo'
  return 'encuadre'
})

const matchColor = computed(() => (matchDisplay.value >= 80 ? '#4FA47A' : matchDisplay.value >= 55 ? '#D9A441' : '#D9534F'))
const RING_C = 2 * Math.PI * 52
const ringDash = computed(() => `${(matchDisplay.value / 100 * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`)
const holdText = computed(() => {
  const s = Math.floor(holdSeconds.value)
  return `0:${String(s).padStart(2, '0')}`
})
const encuadreMsg = computed(() => (poseDetected.value ? 'No te veo completo — aléjate un poco' : 'No te veo — ponte frente a la cámara'))

// ── Acumuladores de sesión (no reactivos) ──
let repCounter = createRepCounter(props.exercise.ref?.rep || {})
let frames = 0
let sumMatch = 0
let bestHold = 0
let cleanReps = 0
let lastReps = 0
let lastRepMatch = []
const jointFail = new Map()
let sessionStart = 0
let lastFrameT = 0
const lastCue = shallowRef('')

const resetSesion = () => {
  repCounter = createRepCounter(props.exercise.ref?.rep || {})
  frames = 0; sumMatch = 0; bestHold = 0; cleanReps = 0; lastReps = 0
  lastRepMatch = []; jointFail.clear(); holdSeconds.value = 0
  reps.value = 0; matchDisplay.value = 0
  sessionStart = performance.now()
  lastFrameT = sessionStart
}

const onFrame = (landmarks) => {
  const result = comparePose(landmarks, props.exercise, { rigor: rigor.value, capturedAngles: capturedAngles.value })
  coverageOk.value = result.coverage.ok
  faltan.value = result.coverage.faltan

  // Dibuja el doble esqueleto con los puntos del semáforo.
  const statusByIndex = {}
  for (const j of result.joints) {
    for (const idx of landmarksForJoint(j)) statusByIndex[idx] = j.color
  }
  drawExercisePose(overlayRef.value, videoRef.value, landmarks, {
    referencePose: referencePose.value,
    showReference: true,
    statusByIndex,
  })

  if (!result.detected) return
  joints.value = result.joints
  cues.value = result.cues
  matchDisplay.value = Math.round(matchDisplay.value * 0.7 + result.matchPct * 0.3)

  if (paused.value) { lastFrameT = performance.now(); return }

  // Acumula calidad y fallos por articulación.
  frames += 1
  sumMatch += result.matchPct
  for (const j of result.joints) {
    if (j.status === 'corrige') jointFail.set(j.label, (jointFail.get(j.label) || 0) + 1)
  }

  // Reps (o aguante).
  if (props.exercise.ref?.rep) {
    const val = result.metrics[props.exercise.ref.rep.metric]
    const n = repCounter.update(val)
    lastRepMatch.push(result.matchPct)
    if (n > lastReps) {
      // Rep recién completada: ¿fue limpia?
      const avgRep = lastRepMatch.reduce((a, b) => a + b, 0) / lastRepMatch.length
      if (avgRep >= 75) cleanReps += 1
      lastRepMatch = []
      lastReps = n
      reps.value = n
      if (voz.value && n === Number(metaReps.value)) speak('¡Serie completa!')
    }
  } else {
    // Aguante: acumula tiempo mientras el match es bueno.
    const now = performance.now()
    const dt = (now - lastFrameT) / 1000
    if (result.matchPct >= 70) {
      holdSeconds.value += dt
      if (holdSeconds.value > bestHold) bestHold = holdSeconds.value
    } else {
      holdSeconds.value = 0
    }
  }
  lastFrameT = performance.now()

  // Voz: dicta la corrección dominante cuando cambia.
  const top = result.cues.find((c) => c.tono === 'corrige')
  if (voz.value && top && top.texto !== lastCue.value) {
    lastCue.value = top.texto
    speak(top.texto)
  }
}

watch(poseResults, (r) => {
  const lm = r?.landmarks?.[0] || null
  if (started.value && !fail.value) onFrame(lm)
})

const iniciar = async () => {
  fail.value = false
  started.value = true
  resetSesion()
  await start('Coach de postura activo.')
  if (!cameraActive.value) fail.value = true
}

const terminar = () => {
  const calidad = frames ? Math.round(sumMatch / frames) : 0
  const fallos = [...jointFail.entries()]
    .map(([label, veces]) => ({ label, veces, pct: frames ? Math.round((veces / frames) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4)
  const resumen = {
    exerciseId: props.exercise.id,
    nombre: props.exercise.nombre,
    reps: reps.value,
    metaReps: Number(metaReps.value) || null,
    cleanReps,
    calidad,
    bestHold: Math.round(bestHold),
    fallos,
    durationSec: sessionStart ? Math.round((performance.now() - sessionStart) / 1000) : 0,
  }
  stop()
  emit('finish', resumen)
}

const repetirInstruccion = () => { if (voz.value) speak(props.exercise.instruccion) }

let synthAt = 0
const speak = (texto) => {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const now = performance.now()
    if (now - synthAt < 1400) return // no encimar frases
    synthAt = now
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = 'es-MX'
    u.rate = 1.05
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    // TTS no disponible: seguimos sin voz.
  }
}

const onKey = (e) => {
  if (e.code === 'Space') { e.preventDefault(); if (estado.value === 'activo') paused.value = !paused.value }
  else if (e.key === 'm' || e.key === 'M') voz.value = !voz.value
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  try { window.speechSynthesis?.cancel() } catch { /* noop */ }
  stop()
})
</script>

<style scoped>
.coach { display: grid; gap: 16px; max-width: 1120px; }
.coach-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.nombre { margin: 0; font-family: var(--font-display); font-size: 30px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.head-sub { font-size: 12.5px; color: var(--ink-500); }
.head-acciones { margin-left: auto; display: flex; gap: 8px; }

.coach-grid { display: grid; grid-template-columns: minmax(0, 1fr) 296px; gap: 14px; align-items: start; }
.col-video { display: grid; gap: 12px; min-width: 0; }

.stage { position: relative; width: 100%; box-sizing: border-box; aspect-ratio: 16 / 10; background: var(--ink-900); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-md); }
.stage-video, .stage-canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
.stage-video { object-fit: cover; }

.scanline { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(135, 149, 210, 0.9), transparent); animation: exscan 3.4s ease infinite; }
@keyframes exscan { 0% { transform: translateY(-8%); } 100% { transform: translateY(2600%); } }

.hud-topleft { position: absolute; top: 14px; left: 14px; display: flex; gap: 8px; }
.reps-pill { display: flex; align-items: baseline; gap: 6px; padding: 8px 15px; border-radius: 999px; background: rgba(255, 255, 255, 0.94); }
.reps-pill strong { font-size: 19px; line-height: 1; }
.reps-pill span { font-size: 13px; color: var(--ink-500); }
.envivo-pill { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 999px; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(6px); color: #fff; font-size: 13px; font-weight: 700; }
.dot-rec { width: 8px; height: 8px; border-radius: 999px; background: #D9534F; animation: exrec 1.4s infinite; }
@keyframes exrec { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

.match-ring { position: absolute; top: 14px; right: 14px; width: 78px; height: 78px; display: grid; place-items: center; }
.match-ring svg { position: absolute; inset: 0; }
.match-val { display: grid; justify-items: center; line-height: 1; z-index: 1; }
.match-val strong { font-size: 20px; color: #fff; }
.match-val span { font-size: 9px; font-weight: 700; color: rgba(255, 255, 255, 0.7); }

.hold-pill { position: absolute; top: 100px; right: 14px; padding: 6px 12px; border-radius: 999px; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(6px); color: #fff; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; }

.leyenda { position: absolute; left: 14px; bottom: 64px; display: flex; gap: 14px; font-size: 11px; font-weight: 700; color: #fff; }
.leyenda span { display: inline-flex; align-items: center; gap: 6px; }
.ley-ref { width: 16px; height: 0; border-top: 3px dashed #AEB8E2; }
.ley-tu { width: 16px; height: 3px; border-radius: 2px; background: #E85DA0; }

.cues { position: absolute; left: 14px; right: 14px; bottom: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
.cue { padding: 8px 13px; border-radius: 999px; color: #fff; font-size: 13.5px; font-weight: 700; }
.cue.corrige { background: rgba(217, 83, 79, 0.92); }
.cue.casi { background: rgba(217, 164, 65, 0.95); }
.cue.bien { background: rgba(79, 164, 122, 0.92); }

.paused { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 6px; background: rgba(20, 19, 27, 0.55); color: #fff; text-align: center; }
.paused strong { font-size: 24px; }
.paused span { font-size: 13px; color: rgba(255, 255, 255, 0.8); }

.overlay-centro { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 14px; padding: 34px; text-align: center; }
.ov-icon { width: 60px; height: 60px; border-radius: 17px; background: rgba(255, 255, 255, 0.08); display: grid; place-items: center; }
.ov-icon.error { background: rgba(217, 83, 79, 0.16); }
.overlay-centro strong { font-size: 20px; color: #fff; }
.overlay-centro p { margin: 0; max-width: 360px; font-size: 14px; line-height: 1.55; color: rgba(255, 255, 255, 0.72); }
.ov-acciones { display: flex; gap: 8px; }

.overlay-encuadre { position: absolute; inset: 0; }
.overlay-encuadre::before { content: ''; position: absolute; inset: 0; background: rgba(20, 19, 27, 0.5); }
.esq { position: absolute; width: 32px; height: 32px; animation: expulse 1.3s infinite; }
.esq.tl { top: 22px; left: 22px; border-top: 3px solid #D9A441; border-left: 3px solid #D9A441; border-radius: 8px 0 0 0; }
.esq.tr { top: 22px; right: 22px; border-top: 3px solid #D9A441; border-right: 3px solid #D9A441; border-radius: 0 8px 0 0; }
.esq.bl { bottom: 22px; left: 22px; border-bottom: 3px solid #D9A441; border-left: 3px solid #D9A441; border-radius: 0 0 0 8px; }
.esq.br { bottom: 22px; right: 22px; border-bottom: 3px solid #D9A441; border-right: 3px solid #D9A441; border-radius: 0 0 8px 0; }
@keyframes expulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.encuadre-msg { position: absolute; left: 0; right: 0; bottom: 34px; display: grid; justify-items: center; gap: 8px; padding: 0 24px; text-align: center; }
.encuadre-pill { display: inline-flex; align-items: center; gap: 9px; padding: 11px 20px; border-radius: 999px; background: rgba(217, 164, 65, 0.96); color: #fff; font-size: 16px; font-weight: 800; }
.encuadre-sub { font-size: 12.5px; color: rgba(255, 255, 255, 0.75); }

.controles { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.atajos { margin-left: auto; font-size: 12.5px; color: var(--ink-500); }
.atajos strong { font-family: monospace; }

.col-panel { display: grid; gap: 12px; }
.panel-card { display: grid; gap: 12px; padding: 18px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 16px; box-shadow: var(--shadow-sm); }
.eyebrow { font-size: 10.5px; letter-spacing: 0.14em; font-weight: 700; color: var(--periwinkle-700); }
.panel-pose { aspect-ratio: 4 / 3; border-radius: 13px; display: grid; place-items: center; overflow: hidden; }
.panel-glyph { width: 52%; height: 74%; opacity: 0.82; }
.panel-instr { font-size: 15px; }
.panel-instr-sub { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ink-500); }
.panel-titulo { font-size: 13px; }
.art { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-700); }
.art-dot { width: 11px; height: 11px; border-radius: 999px; flex: none; }
.art-nombre { flex: 1; }
.art-estado { font-size: 11.5px; font-weight: 700; }
.panel-serie { display: grid; gap: 6px; padding: 16px 18px; background: var(--oat); border-radius: 16px; }
.panel-serie span { font-size: 12px; font-weight: 600; color: var(--ink-500); }
.panel-serie strong { font-size: 16px; }

@media (max-width: 880px) {
  .coach-grid { grid-template-columns: 1fr; }
  .nombre { font-size: 24px; }
  .atajos { display: none; }
}
</style>
