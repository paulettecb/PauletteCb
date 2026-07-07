// Motor de maniobras de manejo: convierte la pose del guía en métricas con
// historia (rotación de hombros, desplazamiento lateral, rodillas, brazos) y
// ejecuta máquinas de fases y detectores de timing contra el perro virtual.
// Sin dependencias de Vue: todo es testeable en Node con streams sintéticos.
//
// Convenciones de dirección (cámara selfie, landmarks SIN espejear):
// - x de imagen creciente = el guía se desplaza hacia SU izquierda.
// - yaw > 0 = el guía rotó hacia SU izquierda (muestra su perfil derecho).
// El texto de UI habla siempre de izquierda/derecha DEL GUÍA.

// La extensión explícita mantiene el módulo importable también desde Node
// (para probar el motor con streams sintéticos sin navegador).
import { POSE, analyzeArm, kneeFlexion, shoulderYaw } from './agilityHandlingRules.js'

const HISTORY_MS = 4000
const VELOCITY_WINDOW_MS = 240

const isUsable = (landmark) => Boolean(landmark && (landmark.visibility ?? 1) >= 0.5)

export const DIRECTION = {
  izquierda: 1,
  derecha: -1,
}

export const directionLabel = (sign) => (sign >= 0 ? 'izquierda' : 'derecha')

// Ajuste lineal simple sobre la ventana reciente para una velocidad estable.
const linearVelocity = (samples, key, now, windowMs = VELOCITY_WINDOW_MS) => {
  const recent = samples.filter((s) => now - s.t <= windowMs && s[key] !== null)
  if (recent.length < 3) return null
  const n = recent.length
  let sumT = 0
  let sumV = 0
  let sumTT = 0
  let sumTV = 0
  for (const s of recent) {
    const t = (s.t - recent[0].t) / 1000
    sumT += t
    sumV += s[key]
    sumTT += t * t
    sumTV += t * s[key]
  }
  const denom = n * sumTT - sumT * sumT
  if (Math.abs(denom) < 1e-9) return null
  return (n * sumTV - sumT * sumV) / denom
}

export const createMetricsTracker = () => {
  const history = []
  let latest = null

  return {
    push(landmarks, t) {
      const leftHip = landmarks?.[POSE.leftHip]
      const rightHip = landmarks?.[POSE.rightHip]
      const hipX = isUsable(leftHip) && isUsable(rightHip) ? (leftHip.x + rightHip.x) / 2 : null
      const yaw = landmarks ? shoulderYaw(landmarks) : null
      const kneeLeft = landmarks ? kneeFlexion(landmarks, 'left') : null
      const kneeRight = landmarks ? kneeFlexion(landmarks, 'right') : null

      latest = {
        t,
        yaw,
        hipX,
        kneeMin: kneeLeft !== null && kneeRight !== null
          ? Math.min(kneeLeft, kneeRight)
          : (kneeLeft ?? kneeRight),
        leftArm: landmarks ? analyzeArm(landmarks, 'left') : { visible: false, extended: false, raised: false },
        rightArm: landmarks ? analyzeArm(landmarks, 'right') : { visible: false, extended: false, raised: false },
        visible: yaw !== null && hipX !== null,
      }

      history.push({ t, yaw, hipX })
      while (history.length && t - history[0].t > HISTORY_MS) history.shift()
      return latest
    },
    get latest() { return latest },
    // Velocidad lateral en unidades de imagen/segundo. Positiva = hacia la
    // izquierda del guía.
    hipVelocity() {
      if (!latest) return null
      return linearVelocity(history, 'hipX', latest.t)
    },
    yawVelocity() {
      if (!latest) return null
      return linearVelocity(history, 'yaw', latest.t)
    },
    reset() {
      history.length = 0
      latest = null
    },
  }
}

// --- Máquina de fases para el modo aprender -------------------------------
// Cada fase: { id, holdMs, check(metrics, tracker) -> boolean }. La fase se
// completa cuando el check se sostiene holdMs; si falla, el hold se reinicia.

export const createPhaseMachine = (phases) => {
  let index = 0
  let holdStart = null
  let completed = false

  return {
    update(tracker, now) {
      if (completed || !phases.length) {
        return { index, holdProgress: completed ? 1 : 0, completed, justAdvanced: false }
      }
      const phase = phases[index]
      const metrics = tracker.latest
      const pass = Boolean(metrics && phase.check(metrics, tracker))
      let justAdvanced = false

      if (pass) {
        if (holdStart === null) holdStart = now
        const holdMs = phase.holdMs ?? 900
        if (now - holdStart >= holdMs) {
          holdStart = null
          if (index === phases.length - 1) {
            completed = true
          } else {
            index += 1
          }
          justAdvanced = true
        }
      } else {
        holdStart = null
      }

      const holdMs = phases[Math.min(index, phases.length - 1)].holdMs ?? 900
      return {
        index,
        holdProgress: completed ? 1 : (holdStart === null ? 0 : Math.min(1, (now - holdStart) / holdMs)),
        completed,
        justAdvanced,
        pass,
      }
    },
    reset() {
      index = 0
      holdStart = null
      completed = false
    },
    get completed() { return completed },
    get index() { return index },
  }
}

// --- Giro direccional (front cross / blind cross) --------------------------
// Sigue un giro completo (frente → espaldas → frente) y reporta hacia qué
// lado del guía inició la rotación, que es lo que distingue un cruce frontal
// (giras HACIA el perro) de un ciego accidental (giras alejándote).

export const createDirectionalTurnTracker = () => {
  let stage = 'front'
  let direction = null
  let startT = null
  let finishT = null

  return {
    update(yaw, t) {
      if (yaw === null) return this.state
      const abs = Math.abs(yaw)
      if (stage === 'front' && abs > 55) {
        stage = 'turning'
        direction = yaw > 0 ? 1 : -1
        startT = t
      } else if (stage === 'turning' && abs > 140) {
        stage = 'back'
      } else if (stage === 'turning' && abs < 25) {
        // Abortó el giro sin pasar por la espalda: se reinicia.
        stage = 'front'
        direction = null
        startT = null
      } else if (stage === 'back' && abs < 40) {
        stage = 'done'
        finishT = t
      }
      return this.state
    },
    get state() {
      return { stage, direction, directionLabel: direction === null ? null : directionLabel(direction), startT, finishT }
    },
    reset() {
      stage = 'front'
      direction = null
      startT = null
      finishT = null
    },
  }
}

// --- Detector de reversa (false turn) --------------------------------------
// Espera desplazamiento sostenido hacia la dirección de aproximación y marca
// el instante en que el guía invierte su movimiento.

export const createReversalDetector = ({ directionSign = 1, minVelocity = 0.1, sustainMs = 140 } = {}) => {
  let stage = 'waiting'
  let stableSince = null
  let reversalT = null

  return {
    update(tracker) {
      const metrics = tracker.latest
      if (!metrics) return this.state
      const vel = tracker.hipVelocity()
      if (vel === null) return this.state
      const toward = vel * directionSign

      if (stage === 'waiting') {
        if (toward > minVelocity) {
          if (stableSince === null) stableSince = metrics.t
          if (metrics.t - stableSince >= sustainMs) {
            stage = 'moving'
            stableSince = null
          }
        } else {
          stableSince = null
        }
      } else if (stage === 'moving') {
        if (toward < -minVelocity) {
          if (stableSince === null) stableSince = metrics.t
          if (metrics.t - stableSince >= sustainMs) {
            stage = 'reversed'
            reversalT = stableSince
            stableSince = null
          }
        } else {
          stableSince = null
        }
      }
      return this.state
    },
    get state() {
      return { stage, reversalT }
    },
    reset() {
      stage = 'waiting'
      stableSince = null
      reversalT = null
    },
  }
}

// --- Perro virtual ----------------------------------------------------------
// Línea de tiempo de una aproximación al salto. El guía debe ejecutar su
// acción dentro de la ventana previa al despegue.

export const createDogRun = ({ approachMs = 3200, windowMs = 750, flightMs = 480 } = {}) => {
  const takeoffT = approachMs
  const windowStart = approachMs - windowMs

  return {
    approachMs,
    takeoffT,
    windowStart,
    flightMs,
    // Progreso 0..1 de la carrera de aproximación.
    progress(elapsed) {
      return Math.min(1, Math.max(0, elapsed / approachMs))
    },
    phaseAt(elapsed) {
      if (elapsed < takeoffT) return 'aproximacion'
      if (elapsed < takeoffT + flightMs) return 'vuelo'
      return 'aterrizaje'
    },
    evaluateAction(actionElapsed) {
      if (actionElapsed === null) return { result: 'sin_accion', offsetMs: null }
      const offsetMs = Math.round(actionElapsed - takeoffT)
      if (actionElapsed < windowStart) return { result: 'pronto', offsetMs }
      if (actionElapsed <= takeoffT) return { result: 'perfecto', offsetMs }
      return { result: 'tarde', offsetMs }
    },
  }
}
