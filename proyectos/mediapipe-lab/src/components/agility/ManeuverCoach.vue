<template>
  <section class="maneuvers">
    <p class="maneuvers-intro">
      Cada jugada de manejo tiene nombre propio y una mecánica exacta. Elige una, apréndela fase
      por fase con la cámara, y cuando la tengas, entrena tu <strong>timing</strong> contra el
      perro virtual. Colócate a 2–3 metros para que se vea tu cuerpo completo.
    </p>

    <div
      v-for="group in MANEUVER_GROUPS"
      :key="group.id"
      class="maneuver-group"
    >
      <h4 class="group-title">
        {{ group.titulo }} <small>{{ group.descripcion }}</small>
      </h4>
      <div class="maneuver-grid">
        <button
          v-for="m in maneuversIn(group.id)"
          :key="m.id"
          type="button"
          class="maneuver-card"
          :class="{ active: m.id === selectedId }"
          @click="selectManeuver(m.id)"
        >
          <span class="maneuver-icon">{{ m.icono }}</span>
          <span class="maneuver-names">
            <strong>{{ m.nombreEN }}</strong>
            <span>{{ m.nombreES }}</span>
          </span>
          <span class="maneuver-resumen">{{ m.resumen }}</span>
          <span
            v-if="m.virtualDog"
            class="virtual-badge"
          >🐕 perro virtual</span>
        </button>
      </div>
    </div>

    <div class="coach-layout">
      <div class="stage-col">
        <div class="stage-toolbar">
          <label class="side-toggle">
            <span>Perro a tu…</span>
            <span class="side-buttons">
              <button
                type="button"
                class="btn mini"
                :class="{ selected: dogSide === 'left' }"
                @click="dogSide = 'left'"
              >🐕 Izquierda</button>
              <button
                type="button"
                class="btn mini"
                :class="{ selected: dogSide === 'right' }"
                @click="dogSide = 'right'"
              >Derecha 🐕</button>
            </span>
          </label>
          <div class="mode-toggle">
            <button
              type="button"
              class="btn mini"
              :class="{ selected: mode === 'aprender' }"
              @click="setMode('aprender')"
            >
              📖 Aprender
            </button>
            <button
              type="button"
              class="btn mini"
              :class="{ selected: mode === 'virtual' }"
              :disabled="!maneuver.virtualDog"
              :title="maneuver.virtualDog ? '' : 'Esta maniobra aún no tiene modo de perro virtual'"
              @click="setMode('virtual')"
            >
              🐕 Perro virtual
            </button>
          </div>
          <button
            type="button"
            class="btn mini voice-toggle"
            :class="{ selected: voiceEnabled }"
            :disabled="!voice.supported"
            @click="toggleVoice"
          >
            {{ voiceEnabled ? '🔊 Voz' : '🔇 Voz' }}
          </button>
        </div>

        <div
          class="camera-stage"
          :class="{ 'is-active': cameraActive, 'is-inactive': !cameraActive }"
        >
          <video
            ref="videoRef"
            class="camera-preview"
            autoplay
            playsinline
            muted
          />
          <canvas
            ref="canvasRef"
            class="landmarks-canvas"
            aria-label="Landmarks del cuerpo del guía"
          />
          <canvas
            ref="metricsCanvasRef"
            class="metrics-canvas"
            aria-label="Métricas en vivo: rotación de hombros, brazos y cadera"
          />
          <div
            v-if="cameraActive"
            class="rep-counter"
            aria-live="polite"
          >
            <span class="rep-number">{{ reps }}</span>
            <span class="rep-label">reps</span>
          </div>
        </div>

        <div
          v-if="mode === 'virtual'"
          class="dog-panel"
        >
          <canvas
            ref="dogCanvasRef"
            class="dog-canvas"
            width="900"
            height="190"
            aria-label="Perro virtual aproximándose al salto"
          />
          <div class="dog-controls">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!cameraActive || runState === 'countdown' || runState === 'running'"
              @click="startDogRun"
            >
              🐾 Lanzar perro
            </button>
            <span
              v-if="runMessage"
              class="run-message"
            >{{ runMessage }}</span>
          </div>
          <ul
            v-if="attempts.length"
            class="attempts-log"
            aria-live="polite"
          >
            <li
              v-for="(intento, i) in attempts"
              :key="i"
              :class="intento.result"
            >
              <strong>{{ RESULT_LABELS[intento.result] }}</strong>
              <span v-if="intento.offsetMs !== null"> · {{ intento.offsetMs > 0 ? '+' : '' }}{{ intento.offsetMs }} ms del despegue</span>
            </li>
          </ul>
        </div>

        <div class="stage-controls">
          <button
            v-if="!cameraActive"
            class="btn btn-primary"
            type="button"
            @click="startSession"
          >
            🎥 Iniciar sesión
          </button>
          <button
            v-else
            class="btn"
            type="button"
            @click="stopSession"
          >
            ■ Detener
          </button>
          <button
            class="btn"
            type="button"
            :disabled="!cameraActive"
            @click="restartAttempt"
          >
            ↻ Reiniciar
          </button>
        </div>
        <p
          v-if="cameraStatus"
          class="status"
        >
          {{ cameraStatus }}
        </p>
      </div>

      <aside class="info-col">
        <div class="panel-card">
          <h3>{{ maneuver.icono }} {{ maneuver.nombreEN }} <small>· {{ maneuver.nombreES }}</small></h3>
          <p class="cuando-usar">
            {{ maneuver.cuandoUsar }}
          </p>

          <template v-if="mode === 'aprender'">
            <ol class="phase-list">
              <li
                v-for="(phase, i) in phaseView"
                :key="phase.id"
                :class="{ current: i === currentPhaseIndex && cameraActive && !attemptCompleted, done: i < currentPhaseIndex || attemptCompleted }"
              >
                <strong>{{ phase.titulo }}</strong>
                <span>{{ phase.instruccion }}</span>
                <span
                  v-if="i === currentPhaseIndex && holdProgress > 0 && !attemptCompleted"
                  class="hold-track"
                ><span
                  class="hold-fill"
                  :style="{ width: `${holdProgress * 100}%` }"
                /></span>
              </li>
            </ol>
            <p
              v-if="hintMessage"
              class="hint"
            >
              ⚠️ {{ hintMessage }}
            </p>
            <p
              v-if="attemptCompleted"
              class="completed-banner"
            >
              🎉 ¡Maniobra completa! Reiniciando…
            </p>
          </template>

          <template v-else>
            <p class="virtual-help">
              Presiona <strong>Lanzar perro</strong>: a la cuenta de tres, el perro corre hacia el
              salto — el mismo escenario exacto cada vez, para estudiar tu timing. {{ maneuver.virtualKind === 'reversal'
                ? 'Camina hacia el salto y ejecuta tu reversa JUSTO antes del despegue.'
                : 'Completa tu giro hacia el perro ANTES de que despegue.' }}
            </p>
            <div class="score-row">
              <div class="score-box">
                <span class="score-label">Perfectas</span>
                <strong>{{ perfectCount }}</strong>
              </div>
              <div class="score-box">
                <span class="score-label">Racha</span>
                <strong>{{ streak }}</strong>
              </div>
            </div>
          </template>
        </div>

        <div class="panel-card errores">
          <h3>Errores clásicos</h3>
          <ul>
            <li
              v-for="(error, i) in maneuver.erroresComunes"
              :key="i"
            >
              {{ error }}
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <details class="glossary">
      <summary>📖 Glosario de manejo — TODAS las maniobras, paso a paso</summary>
      <p class="glossary-intro">
        Las que traen 🎥 se practican con la cámara. Las demás vienen con la descripción completa
        (pasos, claves y errores) para que puedas ejecutarlas solo leyendo. Toca cualquier término
        para abrirlo.
      </p>
      <div class="glossary-grid">
        <details
          v-for="term in GLOSSARY"
          :key="term.en"
          class="glossary-term"
        >
          <summary>
            <span class="term-head">
              <strong>{{ term.en }}</strong>
              <em>{{ term.es }}</em>
              <span
                class="term-badge"
                :class="{ trainable: term.entrenable }"
              >{{ term.entrenable ? '🎥 entrenable' : '📖 lectura' }}</span>
            </span>
            <span class="term-desc">{{ term.desc }}</span>
          </summary>
          <div class="term-body">
            <p class="term-quees">
              {{ term.queEs }}
            </p>
            <h5>Cómo se hace</h5>
            <ol>
              <li
                v-for="(paso, i) in term.comoSeHace"
                :key="i"
              >
                {{ paso }}
              </li>
            </ol>
            <p class="term-cuando">
              <strong>Cuándo usarla:</strong> {{ term.cuandoUsar }}
            </p>
            <h5>Claves</h5>
            <ul>
              <li
                v-for="(clave, i) in term.claves"
                :key="i"
              >
                {{ clave }}
              </li>
            </ul>
            <h5>Errores comunes</h5>
            <ul class="term-errores">
              <li
                v-for="(error, i) in term.errores"
                :key="i"
              >
                {{ error }}
              </li>
            </ul>
            <button
              v-if="term.entrenable"
              type="button"
              class="btn mini term-practice"
              @click="practiceFromGlossary(term.entrenable)"
            >
              🎥 Practicar esta con la cámara
            </button>
          </div>
        </details>
      </div>
    </details>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../../composables/useMediaPipeTrackingCamera'
import { GLOSSARY, MANEUVER_GROUPS, MANEUVERS, MANEUVERS_BY_ID } from '../../data/agilityManeuvers'
import { POSE } from '../../services/agilityHandlingRules'
import {
  createDirectionalTurnTracker,
  createDogRun,
  createMetricsTracker,
  createPhaseMachine,
  createReversalDetector,
} from '../../services/maneuverEngine'
import { createVoiceCoach } from '../../services/voiceCoach'

const RESULT_LABELS = {
  perfecto: '💚 ¡Perfecta!',
  pronto: '🟡 Muy pronto — el perro rehusó',
  tarde: '🟠 Tarde — aterrizó largo',
  sin_accion: '⚪ Sin acción detectada',
  direccion: '🔴 Giraste al lado contrario',
}

const voice = createVoiceCoach()
const voiceEnabled = ref(voice.supported)

const selectedId = ref('front-cross')
const dogSide = ref('left')
const mode = ref('aprender')
const reps = ref(0)
const currentPhaseIndex = ref(0)
const holdProgress = ref(0)
const attemptCompleted = ref(false)
const hintMessage = ref('')

const runState = ref('idle')
const runMessage = ref('')
const attempts = ref([])
const streak = ref(0)

const dogCanvasRef = ref(null)
const metricsCanvasRef = ref(null)
const hipTrail = []

const maneuver = computed(() => MANEUVERS_BY_ID[selectedId.value])
const dogSign = computed(() => (dogSide.value === 'left' ? 1 : -1))
const perfectCount = computed(() => attempts.value.filter((a) => a.result === 'perfecto').length)
const maneuversIn = (groupId) => MANEUVERS.filter((m) => m.grupo === groupId)

const {
  cameraActive,
  cameraStatus,
  poseResults,
  start,
  stop,
  canvasRef,
  videoRef,
} = useMediaPipeTrackingCamera({ hands: false, pose: true })

// --- Estado del intento (no reactivo: son máquinas del motor) ---------------
const tracker = createMetricsTracker()
const attempt = shallowRef(null)
let restartTimer = null
let dogAnimationId = null
let dogRun = null
let runStartT = null
let actionT = null
let outcome = null

const phaseView = computed(() => attempt.value?.phases ?? [])

const buildAttempt = () => {
  const turnTracker = createDirectionalTurnTracker()
  const reversalDetector = createReversalDetector({ directionSign: dogSign.value })
  const phases = maneuver.value.buildPhases({
    dogSign: dogSign.value,
    turnTracker,
    reversalDetector,
  })
  attempt.value = {
    phases,
    machine: createPhaseMachine(phases),
    turnTracker,
    reversalDetector,
  }
  currentPhaseIndex.value = 0
  holdProgress.value = 0
  attemptCompleted.value = false
  hintMessage.value = ''
  tracker.reset()
}

const restartAttempt = () => {
  if (restartTimer) { clearTimeout(restartTimer); restartTimer = null }
  buildAttempt()
  stopDogRun()
  if (cameraActive.value && mode.value === 'aprender') {
    const phase = attempt.value.phases[0]
    voiceSpeak(`${maneuver.value.vozIntro} ${phase.voz}`, { interrupt: true })
  }
}

const selectManeuver = (id) => {
  selectedId.value = id
  if (!MANEUVERS_BY_ID[id].virtualDog && mode.value === 'virtual') mode.value = 'aprender'
  reps.value = 0
  attempts.value = []
  streak.value = 0
  restartAttempt()
}

const setMode = (value) => {
  mode.value = value
  restartAttempt()
}

const practiceFromGlossary = (id) => {
  selectManeuver(id)
  document.querySelector('.maneuvers')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(dogSide, () => restartAttempt())

const voiceSpeak = (text, opts) => {
  if (voiceEnabled.value) voice.speak(text, opts)
}

const toggleVoice = () => {
  voiceEnabled.value = !voiceEnabled.value
  voice.setEnabled(voiceEnabled.value)
}

// --- Loop principal: cada frame de pose alimenta el motor -------------------
watch(poseResults, (results) => {
  const landmarks = results?.landmarks?.[0]
  const now = performance.now()
  const current = attempt.value
  if (!current) return
  tracker.push(landmarks ?? null, now)
  const metrics = tracker.latest

  if (metrics?.yaw !== null && metrics?.yaw !== undefined) {
    current.turnTracker.update(metrics.yaw, now)
  }
  current.reversalDetector.update(tracker)

  drawMetricsOverlay(landmarks, current, now)

  if (mode.value === 'aprender') {
    updateLearnMode(current, now)
  } else if (runState.value === 'running') {
    updateVirtualMode(current, now)
  }
})

// --- Overlay de articulaciones en vivo ---------------------------------------
// Se dibuja sin espejear el canvas (las x se invierten en JS) para que los
// textos no salgan volteados sobre la vista selfie.
const usable = (lm) => Boolean(lm && (lm.visibility ?? 1) >= 0.5)

const drawMetricsOverlay = (landmarks, current, now) => {
  const canvas = metricsCanvasRef.value
  const video = videoRef.value
  if (!canvas || !video) return
  const width = video.videoWidth || 0
  const height = video.videoHeight || 0
  if (!width || !height) return
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height

  const context = canvas.getContext('2d')
  context.clearRect(0, 0, width, height)
  if (!landmarks) { hipTrail.length = 0; return }

  const px = (lm) => ({ x: width - lm.x * width, y: lm.y * height })
  const metrics = tracker.latest

  // Línea de hombros + rotación (yaw)
  const ls = landmarks[POSE.leftShoulder]
  const rs = landmarks[POSE.rightShoulder]
  if (usable(ls) && usable(rs)) {
    const a = px(ls)
    const b = px(rs)
    context.strokeStyle = '#5562A4'
    context.lineWidth = 5
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(a.x, a.y)
    context.lineTo(b.x, b.y)
    context.stroke()

    if (metrics?.yaw !== null && metrics?.yaw !== undefined) {
      const midX = (a.x + b.x) / 2
      const topY = Math.min(a.y, b.y) - 26
      const turning = current.turnTracker.state.stage === 'turning' || current.turnTracker.state.stage === 'back'
      context.font = 'bold 17px sans-serif'
      context.textAlign = 'center'
      context.fillStyle = turning ? '#E85DA0' : '#434D80'
      const dirLabel = current.turnTracker.state.directionLabel
      context.fillText(
        `hombros ${Math.round(metrics.yaw)}°${turning && dirLabel ? ` · girando a la ${dirLabel}` : ''}`,
        midX,
        topY,
      )
    }
  }

  // Brazos: hombro→codo→muñeca, verdes cuando la señal está extendida
  const drawArm = (side) => {
    const ids = side === 'left'
      ? [POSE.leftShoulder, POSE.leftElbow, POSE.leftWrist]
      : [POSE.rightShoulder, POSE.rightElbow, POSE.rightWrist]
    if (!ids.every((i) => usable(landmarks[i]))) return
    const arm = side === 'left' ? metrics?.leftArm : metrics?.rightArm
    const color = arm?.extended ? '#4FA47A' : 'rgba(117, 115, 127, 0.55)'
    context.strokeStyle = color
    context.lineWidth = arm?.extended ? 6 : 3
    context.beginPath()
    const points = ids.map((i) => px(landmarks[i]))
    context.moveTo(points[0].x, points[0].y)
    context.lineTo(points[1].x, points[1].y)
    context.lineTo(points[2].x, points[2].y)
    context.stroke()
    context.fillStyle = color
    context.beginPath()
    context.arc(points[2].x, points[2].y, arm?.extended ? 9 : 6, 0, Math.PI * 2)
    context.fill()
    if (arm?.raised) {
      context.font = '15px sans-serif'
      context.fillText('⬆', points[2].x + 14, points[2].y)
    }
  }
  drawArm('left')
  drawArm('right')

  // Cadera: rastro reciente + flecha de velocidad lateral
  const lh = landmarks[POSE.leftHip]
  const rh = landmarks[POSE.rightHip]
  if (usable(lh) && usable(rh)) {
    const hip = px({ x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 })
    hipTrail.push({ ...hip, t: now })
    while (hipTrail.length && now - hipTrail[0].t > 1400) hipTrail.shift()

    context.strokeStyle = 'rgba(232, 93, 160, 0.6)'
    context.lineWidth = 3
    context.beginPath()
    hipTrail.forEach((p, i) => (i === 0 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y)))
    context.stroke()

    const vel = tracker.hipVelocity()
    if (vel !== null && Math.abs(vel) > 0.05) {
      // vel > 0 = hacia la izquierda del guía = izquierda de la pantalla selfie.
      const arrow = Math.min(70, Math.abs(vel) * 220) * (vel > 0 ? -1 : 1)
      context.strokeStyle = '#E85DA0'
      context.lineWidth = 5
      context.beginPath()
      context.moveTo(hip.x, hip.y)
      context.lineTo(hip.x + arrow, hip.y)
      context.stroke()
      context.beginPath()
      context.moveTo(hip.x + arrow, hip.y)
      context.lineTo(hip.x + arrow - Math.sign(arrow) * 10, hip.y - 7)
      context.lineTo(hip.x + arrow - Math.sign(arrow) * 10, hip.y + 7)
      context.closePath()
      context.fillStyle = '#E85DA0'
      context.fill()
    }
  }
}

const updateLearnMode = (current, now) => {
  if (attemptCompleted.value) return
  const status = current.machine.update(tracker, now)
  currentPhaseIndex.value = status.index
  holdProgress.value = status.holdProgress

  updateHints(current)

  if (status.justAdvanced) {
    if (status.completed) {
      attemptCompleted.value = true
      reps.value += 1
      voiceSpeak('¡Maniobra completa! Otra vez.', { interrupt: true })
      restartTimer = setTimeout(() => {
        restartTimer = null
        buildAttempt()
        voiceSpeak(current.phases[0].voz)
      }, 1600)
    } else {
      hintMessage.value = ''
      voiceSpeak(current.phases[status.index].voz, { interrupt: true })
    }
  }
}

const updateHints = (current) => {
  const phase = current.phases[currentPhaseIndex.value]
  if (!phase) return
  const turnDirection = current.turnTracker.state.direction
  if (phase.id === 'giro' && turnDirection !== null && turnDirection !== dogSign.value) {
    hintMessage.value = 'Estás girando hacia el lado contrario: el front cross gira HACIA el perro.'
    voiceSpeak('Lado contrario. Gira hacia tu perro.', { dedupeMs: 3500 })
  } else if (phase.id === 'giro-ciego' && turnDirection !== null && turnDirection === dogSign.value) {
    hintMessage.value = 'Ese giro es hacia el perro (front cross): el ciego gira alejándote.'
    voiceSpeak('Ese es un front cross. El ciego gira alejándote del perro.', { dedupeMs: 3500 })
  } else if (hintMessage.value && ['giro', 'giro-ciego'].includes(phase.id) && turnDirection === null) {
    hintMessage.value = ''
  }
}

// --- Perro virtual ----------------------------------------------------------
const startDogRun = () => {
  if (!attempt.value || runState.value === 'running' || runState.value === 'countdown') return
  buildAttempt()
  dogRun = createDogRun()
  actionT = null
  outcome = null
  runState.value = 'countdown'
  runMessage.value = 'Prepárate…'
  voiceSpeak('Tres… dos… uno… ¡ya!', { interrupt: true })
  setTimeout(() => {
    runStartT = performance.now()
    runState.value = 'running'
    runMessage.value = maneuver.value.virtualKind === 'reversal'
      ? '¡Avanza hacia el salto y regresa justo antes del despegue!'
      : '¡Completa tu giro antes del despegue!'
    animateDog()
  }, 2200)
}

const updateVirtualMode = (current, now) => {
  if (actionT !== null || !dogRun || runStartT === null) return
  const elapsed = now - runStartT

  if (maneuver.value.virtualKind === 'reversal') {
    const state = current.reversalDetector.state
    if (state.stage === 'reversed' && state.reversalT !== null) {
      actionT = state.reversalT - runStartT
    }
  } else {
    const state = current.turnTracker.state
    if (state.stage === 'done' && state.finishT !== null) {
      if (state.direction !== dogSign.value) {
        outcome = { result: 'direccion', offsetMs: null }
        finishRun()
        return
      }
      actionT = state.finishT - runStartT
    }
  }

  if (actionT !== null && actionT < dogRun.windowStart) {
    // Reversa/giro demasiado pronto: el perro rehúsa en el acto.
    outcome = dogRun.evaluateAction(actionT)
    finishRun()
  } else if (elapsed > dogRun.takeoffT + dogRun.flightMs + 900) {
    outcome = dogRun.evaluateAction(actionT)
    finishRun()
  }
}

const finishRun = () => {
  if (runState.value !== 'running') return
  runState.value = 'result'
  const result = outcome ?? { result: 'sin_accion', offsetMs: null }
  attempts.value = [{ ...result }, ...attempts.value].slice(0, 8)
  streak.value = result.result === 'perfecto' ? streak.value + 1 : 0
  runMessage.value = RESULT_LABELS[result.result]

  const speech = {
    perfecto: `¡Perfecto! Reversa a ${Math.abs(result.offsetMs)} milisegundos del despegue.`,
    pronto: 'Muy pronto. El perro rehusó el salto.',
    tarde: 'Tarde. El perro aterrizó largo.',
    sin_accion: 'No detecté tu movimiento. Intenta de nuevo.',
    direccion: 'Giraste al lado contrario. Gira hacia tu perro.',
  }[result.result]
  voiceSpeak(speech, { interrupt: true })
}

const stopDogRun = () => {
  if (dogAnimationId) { cancelAnimationFrame(dogAnimationId); dogAnimationId = null }
  runState.value = 'idle'
  runMessage.value = ''
  drawDogScene(0, 'idle')
}

// Dibujo del perro virtual. El eje x respeta el espejo de la cámara: si el
// perro va a tu izquierda, en pantalla corre hacia la izquierda.
const drawDogScene = (elapsed, state) => {
  const canvas = dogCanvasRef.value
  if (!canvas) return
  const context = canvas.getContext('2d')
  const { width, height } = canvas
  context.clearRect(0, 0, width, height)

  const mirrored = dogSign.value === 1
  context.save()
  if (mirrored) {
    context.translate(width, 0)
    context.scale(-1, 1)
  }

  // Suelo y salto (el perro corre de izquierda a derecha en coords locales).
  const groundY = height - 34
  context.strokeStyle = '#4FA47A'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(0, groundY)
  context.lineTo(width, groundY)
  context.stroke()

  const jumpX = width * 0.74
  context.strokeStyle = '#5562A4'
  context.lineWidth = 5
  context.beginPath()
  context.moveTo(jumpX - 26, groundY)
  context.lineTo(jumpX - 26, groundY - 74)
  context.moveTo(jumpX + 26, groundY)
  context.lineTo(jumpX + 26, groundY - 74)
  context.stroke()
  context.strokeStyle = '#E85DA0'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(jumpX - 26, groundY - 58)
  context.lineTo(jumpX + 26, groundY - 58)
  context.stroke()

  // Posición del perro según fase de la carrera.
  const startX = width * 0.08
  let dogX = startX
  let dogY = groundY - 14
  let emoji = '🐕'

  if (dogRun && state !== 'idle') {
    const progress = dogRun.progress(elapsed)
    const phase = dogRun.phaseAt(elapsed)
    dogX = startX + (jumpX - 40 - startX) * progress

    if (outcome?.result === 'pronto') {
      dogX = Math.min(dogX, jumpX - 120)
      emoji = '🐕❓'
    } else if (phase === 'vuelo') {
      const flightProgress = (elapsed - dogRun.takeoffT) / dogRun.flightMs
      dogX = jumpX - 40 + 90 * flightProgress
      dogY = groundY - 14 - 62 * Math.sin(Math.PI * Math.min(1, flightProgress))
    } else if (phase === 'aterrizaje') {
      const after = elapsed - dogRun.takeoffT - dogRun.flightMs
      if (outcome?.result === 'perfecto' || (actionT !== null && actionT <= dogRun.takeoffT && actionT >= dogRun.windowStart)) {
        // Aterriza colectado y regresa hacia el guía.
        dogX = jumpX + 52 - Math.min(120, after * 0.16)
        emoji = after > 250 ? '🐕💚' : '🐕'
      } else {
        dogX = jumpX + 52 + after * 0.2
        emoji = '🐕💨'
      }
    } else {
      // Aproximación: trote con rebote.
      dogY = groundY - 14 - Math.abs(Math.sin(elapsed / 90)) * 7
    }
  }

  context.restore()

  // El emoji se dibuja sin espejear para que no salga volteado.
  const drawX = mirrored ? width - dogX : dogX
  context.font = '34px serif'
  context.textAlign = 'center'
  context.fillText(emoji, drawX, dogY)

  // Ventana de timing bajo el salto.
  if (dogRun && state === 'running') {
    const windowLabel = mirrored ? width - jumpX : jumpX
    context.font = '12px sans-serif'
    context.fillStyle = '#75737F'
    context.fillText('ventana de despegue', windowLabel, height - 10)
  }
}

const animateDog = () => {
  if (runState.value !== 'running' && runState.value !== 'result') return
  const elapsed = runStartT ? performance.now() - runStartT : 0
  drawDogScene(elapsed, runState.value)
  if (runState.value === 'result' && dogRun && elapsed > dogRun.takeoffT + dogRun.flightMs + 1600) {
    dogAnimationId = null
    return
  }
  dogAnimationId = requestAnimationFrame(animateDog)
}

// --- Sesión -----------------------------------------------------------------
const startSession = () => {
  restartAttempt()
  start('Coach de maniobras activo.')
  voiceSpeak(`${maneuver.value.vozIntro} ${attempt.value.phases[0].voz}`, { interrupt: true })
}

const stopSession = () => {
  stop()
  stopDogRun()
  voice.stop()
  hipTrail.length = 0
  const canvas = metricsCanvasRef.value
  canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
}

buildAttempt()

onBeforeUnmount(() => {
  if (restartTimer) clearTimeout(restartTimer)
  if (dogAnimationId) cancelAnimationFrame(dogAnimationId)
  voice.stop()
})
</script>

<style scoped>
.maneuvers { display: grid; gap: var(--space-4); }
.maneuvers-intro { margin: 0; max-width: 780px; color: var(--text-secondary); line-height: var(--leading-relaxed); }

.maneuver-group { display: grid; gap: var(--space-2); }
.group-title { margin: 0; font-size: var(--text-sm); text-transform: uppercase; letter-spacing: 0.08em; color: var(--periwinkle-800); }
.group-title small { text-transform: none; letter-spacing: 0; color: var(--text-muted); font-weight: var(--weight-regular); margin-left: var(--space-2); }
.maneuver-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr)); gap: var(--space-3); }
.virtual-badge { justify-self: start; padding: 2px 9px; border-radius: var(--radius-pill); background: var(--pastel-mint); color: var(--ink-900); font-size: var(--text-xs); font-weight: var(--weight-semibold); }
.maneuver-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  border: var(--border-width-strong) solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.maneuver-card:hover { border-color: var(--periwinkle-400); }
.maneuver-card.active { border-color: var(--periwinkle-600); background: var(--surface-brand-soft); box-shadow: var(--shadow-sm); }
.maneuver-icon { font-size: var(--text-xl); }
.maneuver-names { display: grid; }
.maneuver-names strong { color: var(--text-primary); }
.maneuver-names span { color: var(--text-accent); font-size: var(--text-sm); font-weight: var(--weight-semibold); }
.maneuver-resumen { color: var(--text-muted); font-size: var(--text-sm); }

.coach-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr); gap: var(--space-4); align-items: start; }
.stage-col { display: grid; gap: var(--space-3); }

.stage-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.side-toggle { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text-secondary); }
.side-buttons, .mode-toggle { display: flex; gap: var(--space-2); }
.btn.mini { min-height: 34px; padding: 6px 14px; font-size: var(--text-xs); box-shadow: none; border-color: var(--border-subtle); }
.btn.mini.selected { border-color: var(--periwinkle-600); background: var(--surface-brand-soft); color: var(--periwinkle-800); font-weight: var(--weight-bold); }
.btn.mini:disabled { opacity: 0.4; cursor: default; }
.voice-toggle { margin-left: auto; }

.metrics-canvas {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.rep-counter {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
  display: grid;
  justify-items: center;
  min-width: 72px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: rgba(42, 41, 51, 0.72);
  color: white;
  backdrop-filter: blur(4px);
}
.rep-number { font-size: var(--text-2xl); font-weight: var(--weight-bold); line-height: 1; }
.rep-label { font-size: var(--text-xs); letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.8; }

.dog-panel {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-card);
}
.dog-canvas { width: 100%; height: auto; border-radius: var(--radius-sm); background: linear-gradient(180deg, #f2f6fb 0%, #eaf3ec 100%); }
.dog-controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.run-message { color: var(--periwinkle-800); font-weight: var(--weight-semibold); font-size: var(--text-sm); }

.attempts-log { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--space-1); font-size: var(--text-sm); }
.attempts-log li { padding: 6px 10px; border-radius: var(--radius-sm); background: var(--surface-section); color: var(--text-secondary); }
.attempts-log li.perfecto { background: rgba(79, 164, 122, 0.14); }
.attempts-log li.pronto { background: rgba(217, 164, 65, 0.14); }
.attempts-log li.tarde { background: rgba(217, 164, 65, 0.2); }
.attempts-log li.direccion { background: rgba(217, 83, 79, 0.12); }

.stage-controls { display: flex; flex-wrap: wrap; gap: var(--space-2); }

.info-col { display: grid; gap: var(--space-3); }
.panel-card { padding: var(--space-4); background: var(--surface-card); border: var(--border-width) solid var(--border-subtle); border-radius: var(--radius-md); }
.panel-card h3 { margin: 0 0 var(--space-2); font-size: var(--text-md); }
.panel-card h3 small { color: var(--text-muted); font-weight: var(--weight-medium); }
.cuando-usar { margin: 0 0 var(--space-3); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-relaxed); }

.phase-list { margin: 0; padding: 0 0 0 20px; display: grid; gap: var(--space-2); }
.phase-list li { display: grid; gap: 2px; padding: 8px 10px; border-radius: var(--radius-sm); color: var(--text-muted); font-size: var(--text-sm); transition: background var(--dur-fast) var(--ease-out); }
.phase-list li strong { color: var(--text-secondary); }
.phase-list li.current { background: var(--surface-brand-soft); }
.phase-list li.current strong { color: var(--periwinkle-800); }
.phase-list li.done strong { color: var(--success); }
.phase-list li.done strong::after { content: ' ✓'; }

.hold-track { display: block; height: 6px; margin-top: 4px; border-radius: var(--radius-pill); background: var(--periwinkle-100); overflow: hidden; }
.hold-fill { display: block; height: 100%; background: var(--success); border-radius: var(--radius-pill); }

.hint { margin: var(--space-3) 0 0; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); background: rgba(217, 164, 65, 0.14); color: var(--ink-900); font-size: var(--text-sm); font-weight: var(--weight-medium); }
.completed-banner { margin: var(--space-3) 0 0; color: var(--success); font-weight: var(--weight-bold); }

.virtual-help { margin: 0 0 var(--space-3); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-relaxed); }
.score-row { display: flex; gap: var(--space-3); }
.score-box { display: grid; gap: 2px; min-width: 90px; padding: var(--space-2) var(--space-3); border: var(--border-width) solid var(--border-subtle); border-radius: var(--radius-sm); }
.score-label { color: var(--text-muted); font-size: var(--text-xs); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.05em; }
.score-box strong { color: var(--periwinkle-800); font-size: var(--text-lg); }

.errores ul { margin: 0; padding-left: 18px; display: grid; gap: var(--space-2); color: var(--text-secondary); font-size: var(--text-sm); }

.glossary { border: var(--border-width) solid var(--border-subtle); border-radius: var(--radius-md); background: var(--surface-card); padding: var(--space-3) var(--space-4); }
.glossary > summary { cursor: pointer; font-weight: var(--weight-semibold); color: var(--text-primary); }
.glossary-intro { margin: var(--space-3) 0 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-relaxed); }
.glossary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr)); gap: var(--space-3); margin-top: var(--space-3); }
.glossary-term { padding: var(--space-3); border: var(--border-width) solid var(--border-subtle); border-radius: var(--radius-sm); font-size: var(--text-sm); }
.glossary-term[open] { grid-column: 1 / -1; border-color: var(--border-strong); background: var(--surface-brand-soft); }
.glossary-term summary { display: grid; gap: 2px; cursor: pointer; list-style: none; }
.glossary-term summary::-webkit-details-marker { display: none; }
.term-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2); }
.glossary-term strong { color: var(--periwinkle-800); }
.glossary-term em { color: var(--text-accent); font-style: normal; font-size: var(--text-xs); font-weight: var(--weight-semibold); }
.term-badge { margin-left: auto; padding: 1px var(--space-2); border-radius: var(--radius-pill); background: var(--surface-section); color: var(--text-muted); font-size: var(--text-xs); font-weight: var(--weight-semibold); white-space: nowrap; }
.term-badge.trainable { background: var(--pop-magenta-soft); color: var(--periwinkle-900); }
.term-desc { color: var(--text-muted); }
.term-body { display: grid; gap: var(--space-2); margin-top: var(--space-3); padding-top: var(--space-3); border-top: var(--border-width) solid var(--border-strong); }
.term-body h5 { margin: var(--space-1) 0 0; color: var(--text-accent); font-size: var(--text-xs); font-weight: var(--weight-bold); text-transform: uppercase; letter-spacing: var(--tracking-eyebrow); }
.term-body p { margin: 0; color: var(--text-secondary); line-height: var(--leading-relaxed); }
.term-body ol, .term-body ul { margin: 0; padding-left: 20px; display: grid; gap: var(--space-1); color: var(--text-secondary); line-height: var(--leading-normal); }
.term-quees { font-size: var(--text-base); }
.term-errores li { color: var(--danger); }
.term-errores li::marker { content: '✗ '; }
.term-practice { justify-self: start; margin-top: var(--space-2); }

@media (max-width: 980px) {
  .coach-layout { grid-template-columns: 1fr; }
}
</style>
