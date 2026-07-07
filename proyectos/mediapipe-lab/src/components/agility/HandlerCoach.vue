<template>
  <section class="coach">
    <p class="coach-intro">
      En agility el perro lee tu cuerpo: hombros, brazos y velocidad. Estos drills usan la cámara
      para verificar tus señales de guía — sin perro, frente a la cámara, a 2–3 metros para que se
      vea el cuerpo completo.
    </p>

    <div class="drill-grid">
      <button
        v-for="drill in DRILLS"
        :key="drill.id"
        type="button"
        class="drill-card"
        :class="{ active: drill.id === activeDrillId }"
        @click="selectDrill(drill.id)"
      >
        <span class="drill-icon">{{ drill.icono }}</span>
        <span class="drill-body">
          <strong>{{ drill.titulo }}</strong>
          <span>{{ drill.resumen }}</span>
        </span>
      </button>
    </div>

    <div class="coach-stage-layout">
      <div class="coach-stage-col">
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
          <div
            v-if="cameraActive"
            class="rep-counter"
            aria-live="polite"
          >
            <span class="rep-number">{{ reps }}</span>
            <span class="rep-label">reps</span>
          </div>
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
            @click="resetDrill"
          >
            ↻ Reiniciar drill
          </button>
        </div>
        <p
          v-if="cameraStatus"
          class="status"
        >
          {{ cameraStatus }}
        </p>
      </div>

      <aside class="coach-panel">
        <div class="panel-card">
          <h3>{{ activeDrill.icono }} {{ activeDrill.titulo }}</h3>
          <p class="drill-instructions">
            {{ activeDrill.instrucciones }}
          </p>

          <label
            v-if="activeDrill.usaLado"
            class="control side-toggle"
          >
            <span>¿De qué lado va el perro?</span>
            <div class="side-buttons">
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
            </div>
          </label>

          <ul
            class="criteria-list"
            aria-live="polite"
          >
            <li
              v-for="criterion in liveCriteria"
              :key="criterion.id"
              :class="{ pass: criterion.pass, idle: !cameraActive }"
            >
              <span class="criterion-mark">{{ cameraActive ? (criterion.pass ? '✓' : '✗') : '·' }}</span>
              {{ criterion.label }}
            </li>
          </ul>

          <div
            v-if="cameraActive && holdProgress > 0 && holdProgress < 1"
            class="hold-track"
          >
            <div
              class="hold-fill"
              :style="{ width: `${holdProgress * 100}%` }"
            />
          </div>

          <p
            v-if="cameraActive"
            class="live-reading"
          >
            {{ liveReading }}
          </p>
        </div>

        <div class="panel-card tips">
          <h3>Tips</h3>
          <ul>
            <li
              v-for="(tip, i) in activeDrill.tips"
              :key="i"
            >
              {{ tip }}
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../../composables/useMediaPipeTrackingCamera'
import {
  analyzeArm,
  createDecelCounter,
  createTurnCounter,
  facingLabel,
  kneeFlexion,
  shoulderYaw,
} from '../../services/agilityHandlingRules'

const HOLD_MS = 1500

const DRILLS = [
  {
    id: 'brazo',
    icono: '💪',
    titulo: 'Brazo de señal',
    resumen: 'Señala la línea con el brazo del lado del perro.',
    usaLado: true,
    instrucciones: 'Extiende lateralmente el brazo del lado donde va tu perro, a la altura del hombro, con el otro brazo relajado. Mantén la señal estable para sumar una repetición.',
    tips: [
      'El brazo señala la LÍNEA que quieres que tome el perro, no al obstáculo.',
      'Señalar con el brazo contrario confunde al perro y provoca rehúses.',
      'Practica cambiando de lado: el perro debe trabajar por tu izquierda y por tu derecha.',
      'Menos es más: mover los brazos de más (aspavientos) distrae; la señal debe ser quieta y clara.',
    ],
  },
  {
    id: 'slalom',
    icono: '〰️',
    titulo: 'Entrada al slalom',
    resumen: 'Postura de guía para una entrada correcta.',
    usaLado: true,
    instrucciones: 'El perro SIEMPRE entra con el primer poste a su hombro izquierdo. Colócate de frente a la línea de entrada, con el brazo del lado del perro marcando la entrada y los hombros al frente. Mantén la postura estable.',
    tips: [
      'Si el perro va a tu izquierda, la entrada natural queda a tu lado izquierdo: marca con brazo izquierdo.',
      'Entrena la entrada llegando desde todos los ángulos; la regla del poste al hombro izquierdo no cambia.',
      'No gires los hombros hacia el perro: míralos hacia la línea de progresión.',
    ],
  },
  {
    id: 'giro',
    icono: '🔄',
    titulo: 'Cruce frontal',
    resumen: 'Giro completo controlado (front cross).',
    usaLado: false,
    instrucciones: 'Simula el cruce frontal: gira 360° sobre tu eje — de frente, pasando por de espaldas, y de vuelta al frente. Cada giro completo cuenta una repetición. Hazlo fluido y sin perder el equilibrio.',
    tips: [
      'En pista, el cruce frontal exige llegar ANTES que el perro al punto de cruce.',
      'Gira hacia el lado del perro para no perderlo de vista.',
      'Un cruce tardío tira barras: el perro responde a tu rotación, no a tu intención.',
    ],
  },
  {
    id: 'decel',
    icono: '🛑',
    titulo: 'Deceleración',
    resumen: 'Flexión de rodillas para pedir colección.',
    usaLado: false,
    instrucciones: 'La deceleración avisa al perro que viene un giro cerrado. De pie, flexiona las rodillas (media sentadilla) y vuelve a extender. Cada flexión-extensión completa cuenta una repetición.',
    tips: [
      'Frenar de golpe sin aviso hace que el perro salte largo y se pase del giro.',
      'Combínalo con bajar el brazo de señal: colección = señales "pequeñas".',
      'En carrera real, la deceleración empieza 2–3 zancadas antes del salto.',
    ],
  },
]

const activeDrillId = ref('brazo')
const dogSide = ref('left')
const reps = ref(0)
const holdProgress = ref(0)
const liveReading = ref('')
const criteriaState = ref({})

const turnCounter = createTurnCounter()
const decelCounter = createDecelCounter()
let holdStart = null
let holdReady = true

const {
  cameraActive,
  cameraStatus,
  poseResults,
  start,
  stop,
  canvasRef,
  videoRef,
} = useMediaPipeTrackingCamera({ hands: false, pose: true })

const activeDrill = computed(() => DRILLS.find((drill) => drill.id === activeDrillId.value) || DRILLS[0])

const CRITERIA = {
  brazo: () => [
    { id: 'visible', label: 'Cuerpo completo visible' },
    { id: 'extendido', label: `Brazo ${dogSide.value === 'left' ? 'izquierdo' : 'derecho'} extendido a la altura del hombro` },
    { id: 'otro', label: 'El otro brazo relajado (sin señalar)' },
  ],
  slalom: () => [
    { id: 'visible', label: 'Cuerpo completo visible' },
    { id: 'frente', label: 'Hombros de frente a la línea de entrada' },
    { id: 'extendido', label: `Brazo ${dogSide.value === 'left' ? 'izquierdo' : 'derecho'} marcando la entrada` },
  ],
  giro: () => [
    { id: 'visible', label: 'Cuerpo completo visible' },
    { id: 'giro', label: 'Giro completo: frente → espaldas → frente' },
  ],
  decel: () => [
    { id: 'visible', label: 'Cuerpo y piernas visibles' },
    { id: 'flexion', label: 'Flexión de rodillas por debajo de 130°' },
  ],
}

const liveCriteria = computed(() => CRITERIA[activeDrillId.value]().map((criterion) => ({
  ...criterion,
  pass: Boolean(criteriaState.value[criterion.id]),
})))

const resetDrill = () => {
  reps.value = 0
  holdProgress.value = 0
  holdStart = null
  holdReady = true
  criteriaState.value = {}
  liveReading.value = ''
  turnCounter.reset()
  decelCounter.reset()
}

const selectDrill = (id) => {
  activeDrillId.value = id
  resetDrill()
}

watch(dogSide, () => resetDrill())

const updateHold = (allPass, now) => {
  if (allPass && holdReady) {
    if (holdStart === null) holdStart = now
    holdProgress.value = Math.min(1, (now - holdStart) / HOLD_MS)
    if (holdProgress.value >= 1) {
      reps.value += 1
      holdReady = false
      holdStart = null
      holdProgress.value = 0
    }
  } else {
    holdStart = null
    holdProgress.value = 0
    if (!allPass) holdReady = true
  }
}

watch(poseResults, (results) => {
  const landmarks = results?.landmarks?.[0]
  if (!landmarks) {
    criteriaState.value = {}
    liveReading.value = 'Sin lectura del cuerpo: aléjate un poco de la cámara.'
    holdStart = null
    holdProgress.value = 0
    return
  }

  const now = performance.now()
  const drill = activeDrillId.value
  const state = {}

  if (drill === 'brazo' || drill === 'slalom') {
    const signalSide = dogSide.value
    const otherSide = signalSide === 'left' ? 'right' : 'left'
    const signalArm = analyzeArm(landmarks, signalSide)
    const otherArm = analyzeArm(landmarks, otherSide)
    const yaw = shoulderYaw(landmarks)

    state.visible = signalArm.visible && otherArm.visible
    state.extendido = signalArm.extended && !signalArm.raised
    state.otro = !otherArm.extended

    let readings = [
      `Codo ${signalSide === 'left' ? 'izq' : 'der'}: ${signalArm.elbowAngle.toFixed(0)}°`,
      `Elevación: ${signalArm.elevation.toFixed(0)}°`,
    ]

    if (drill === 'slalom') {
      state.frente = yaw !== null && Math.abs(yaw) < 40
      readings = [`Orientación: ${facingLabel(yaw)}`, ...readings]
    }

    liveReading.value = readings.join(' · ')
    const required = drill === 'slalom' ? ['visible', 'frente', 'extendido'] : ['visible', 'extendido', 'otro']
    updateHold(required.every((key) => state[key]), now)
  } else if (drill === 'giro') {
    const yaw = shoulderYaw(landmarks)
    state.visible = yaw !== null
    const before = turnCounter.reps
    const after = turnCounter.update(yaw)
    state.giro = turnCounter.stage === 'back'
    if (after > before) reps.value = after
    liveReading.value = `Orientación: ${facingLabel(yaw)}${yaw !== null ? ` (${yaw.toFixed(0)}°)` : ''}`
  } else if (drill === 'decel') {
    const leftKnee = kneeFlexion(landmarks, 'left')
    const rightKnee = kneeFlexion(landmarks, 'right')
    const knee = leftKnee !== null && rightKnee !== null
      ? Math.min(leftKnee, rightKnee)
      : (leftKnee ?? rightKnee)
    state.visible = knee !== null
    state.flexion = knee !== null && knee < 130
    const before = decelCounter.reps
    const after = decelCounter.update(knee)
    if (after > before) reps.value = after
    liveReading.value = knee !== null ? `Ángulo de rodilla: ${knee.toFixed(0)}°` : 'Rodillas no visibles.'
  }

  criteriaState.value = state
})

const startSession = () => {
  resetDrill()
  start('Coach activo: landmarks del cuerpo en vivo.')
}

const stopSession = () => {
  stop()
  criteriaState.value = {}
  holdProgress.value = 0
}
</script>

<style scoped>
.coach { display: grid; gap: var(--space-4); }
.coach-intro { margin: 0; max-width: 760px; color: var(--text-secondary); line-height: var(--leading-relaxed); }

.drill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); gap: var(--space-3); }
.drill-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: var(--border-width-strong) solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.drill-card:hover { border-color: var(--periwinkle-400); }
.drill-card.active { border-color: var(--periwinkle-600); background: var(--surface-brand-soft); box-shadow: var(--shadow-sm); }
.drill-icon { font-size: var(--text-lg); }
.drill-body { display: grid; gap: 2px; }
.drill-body strong { color: var(--text-primary); font-size: var(--text-sm); }
.drill-body span:last-child { color: var(--text-muted); font-size: var(--text-xs); }

.coach-stage-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr); gap: var(--space-4); align-items: start; }

.coach-stage-col { display: grid; gap: var(--space-3); }
.rep-counter {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
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

.stage-controls { display: flex; flex-wrap: wrap; gap: var(--space-2); }

.coach-panel { display: grid; gap: var(--space-3); }
.panel-card {
  padding: var(--space-4);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.panel-card h3 { margin: 0 0 var(--space-2); font-size: var(--text-md); }
.drill-instructions { margin: 0 0 var(--space-3); color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-relaxed); }

.side-toggle { display: grid; gap: var(--space-2); margin-bottom: var(--space-3); font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text-secondary); }
.side-buttons { display: flex; gap: var(--space-2); }
.btn.mini { min-height: 34px; padding: 6px 14px; font-size: var(--text-xs); box-shadow: none; border-color: var(--border-subtle); }
.btn.mini.selected { border-color: var(--periwinkle-600); background: var(--surface-brand-soft); color: var(--periwinkle-800); font-weight: var(--weight-bold); }

.criteria-list { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--space-2); }
.criteria-list li {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: rgba(217, 83, 79, 0.07);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  transition: background var(--dur-fast) var(--ease-out);
}
.criteria-list li.pass { background: rgba(79, 164, 122, 0.12); }
.criteria-list li.idle { background: var(--surface-section); }
.criterion-mark { font-weight: var(--weight-bold); }
.criteria-list li.pass .criterion-mark { color: var(--success); }
.criteria-list li:not(.pass):not(.idle) .criterion-mark { color: var(--danger); }

.hold-track { margin-top: var(--space-3); height: 8px; border-radius: var(--radius-pill); background: var(--periwinkle-100); overflow: hidden; }
.hold-fill { height: 100%; background: var(--success); border-radius: var(--radius-pill); }

.live-reading { margin: var(--space-3) 0 0; color: var(--periwinkle-800); font-size: var(--text-sm); font-weight: var(--weight-semibold); }

.tips ul { margin: 0; padding-left: 18px; display: grid; gap: var(--space-2); color: var(--text-secondary); font-size: var(--text-sm); }

@media (max-width: 900px) {
  .coach-stage-layout { grid-template-columns: 1fr; }
}
</style>
