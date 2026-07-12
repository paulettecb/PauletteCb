// Motor de comparación de postura para Exercise.
//
// Convierte los 33 landmarks de MediaPipe Pose en ángulos articulares con
// nombre, los compara contra la referencia de un ejercicio (ángulos objetivo
// + tolerancia) y devuelve: match %, semáforo por articulación y correcciones
// en lenguaje humano ("baja un poco más la cadera"). Además cuenta reps con una
// máquina de fases sobre un ángulo primario.
//
// Sin dependencias de Vue ni del DOM: todo es probable en Node con landmarks
// sintéticos, igual que el motor de maniobras de Agility.
//
// Los ángulos se calculan en 2D (plano de la imagen). Es una señal geométrica
// aproximada para cuidar la forma, no una medición clínica.

import { POSE, jointAngle } from './agilityHandlingRules.js'

const VIS_MIN = 0.5
const isUsable = (lm) => Boolean(lm && (lm.visibility ?? 1) >= VIS_MIN)

// Colores del semáforo (idénticos a los del diseño hi-fi).
export const STATUS_COLOR = {
  bien: '#4FA47A',
  casi: '#D9A441',
  corrige: '#D9534F',
  espera: '#A8A6B0',
}
const STATUS_HALO = {
  bien: 'rgba(79,164,122,0.16)',
  casi: 'rgba(217,164,65,0.16)',
  corrige: 'rgba(217,83,79,0.16)',
  espera: 'rgba(168,166,176,0.16)',
}

// Ángulo del tronco respecto a la vertical, en grados: 0 = erguido, 90 = tumbado.
const backAngle = (landmarks) => {
  const ls = landmarks[POSE.leftShoulder]
  const rs = landmarks[POSE.rightShoulder]
  const lh = landmarks[POSE.leftHip]
  const rh = landmarks[POSE.rightHip]
  if (![ls, rs, lh, rh].every(isUsable)) return null
  const sx = (ls.x + rs.x) / 2
  const sy = (ls.y + rs.y) / 2
  const hx = (lh.x + rh.x) / 2
  const hy = (lh.y + rh.y) / 2
  const dx = sx - hx
  const dy = sy - hy
  if (!dx && !dy) return null
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI
}

const angleAt = (landmarks, a, b, c) => {
  const pa = landmarks[a]
  const pb = landmarks[b]
  const pc = landmarks[c]
  if (![pa, pb, pc].every(isUsable)) return null
  return jointAngle(pa, pb, pc)
}

const avg = (a, b) => (a === null ? b : b === null ? a : (a + b) / 2)
const minOf = (a, b) => (a === null ? b : b === null ? a : Math.min(a, b))
const maxOf = (a, b) => (a === null ? b : b === null ? a : Math.max(a, b))

// Todas las métricas con nombre que puede pedir la referencia de un ejercicio.
export const computeMetrics = (landmarks) => {
  if (!landmarks) return null
  const rodillaIzq = angleAt(landmarks, POSE.leftHip, POSE.leftKnee, POSE.leftAnkle)
  const rodillaDer = angleAt(landmarks, POSE.rightHip, POSE.rightKnee, POSE.rightAnkle)
  const caderaIzq = angleAt(landmarks, POSE.leftShoulder, POSE.leftHip, POSE.leftKnee)
  const caderaDer = angleAt(landmarks, POSE.rightShoulder, POSE.rightHip, POSE.rightKnee)
  const codoIzq = angleAt(landmarks, POSE.leftShoulder, POSE.leftElbow, POSE.leftWrist)
  const codoDer = angleAt(landmarks, POSE.rightShoulder, POSE.rightElbow, POSE.rightWrist)
  const hombroIzq = angleAt(landmarks, POSE.leftElbow, POSE.leftShoulder, POSE.leftHip)
  const hombroDer = angleAt(landmarks, POSE.rightElbow, POSE.rightShoulder, POSE.rightHip)

  return {
    rodillaIzq,
    rodillaDer,
    rodillaProm: avg(rodillaIzq, rodillaDer),
    rodillaMin: minOf(rodillaIzq, rodillaDer),
    rodillaMax: maxOf(rodillaIzq, rodillaDer),
    caderaIzq,
    caderaDer,
    caderaProm: avg(caderaIzq, caderaDer),
    caderaMin: minOf(caderaIzq, caderaDer),
    codoIzq,
    codoDer,
    codoProm: avg(codoIzq, codoDer),
    hombroIzq,
    hombroDer,
    hombroProm: avg(hombroIzq, hombroDer),
    espalda: backAngle(landmarks),
  }
}

// Índices por región para las comprobaciones de visibilidad ("¿te veo?").
const REGIONS = {
  cabeza: [POSE.nose],
  hombros: [POSE.leftShoulder, POSE.rightShoulder],
  caderas: [POSE.leftHip, POSE.rightHip],
  rodillas: [POSE.leftKnee, POSE.rightKnee],
  tobillos: [POSE.leftAnkle, POSE.rightAnkle],
}
export const REGION_LANDMARKS = REGIONS

// Landmark (vértice) donde vive cada métrica angular, para pintar el punto de
// color del semáforo sobre la articulación correcta en el canvas.
export const METRIC_LANDMARKS = {
  rodillaIzq: [POSE.leftKnee],
  rodillaDer: [POSE.rightKnee],
  rodillaProm: [POSE.leftKnee, POSE.rightKnee],
  rodillaMin: [POSE.leftKnee, POSE.rightKnee],
  rodillaMax: [POSE.leftKnee, POSE.rightKnee],
  caderaIzq: [POSE.leftHip],
  caderaDer: [POSE.rightHip],
  caderaProm: [POSE.leftHip, POSE.rightHip],
  caderaMin: [POSE.leftHip, POSE.rightHip],
  codoIzq: [POSE.leftElbow],
  codoDer: [POSE.rightElbow],
  codoProm: [POSE.leftElbow, POSE.rightElbow],
  hombroIzq: [POSE.leftShoulder],
  hombroDer: [POSE.rightShoulder],
  hombroProm: [POSE.leftShoulder, POSE.rightShoulder],
  espalda: [POSE.leftShoulder, POSE.rightShoulder],
}

// Índices de landmark asociados a una articulación del resultado de comparePose.
export const landmarksForJoint = (joint) => {
  if (!joint) return []
  if (joint.tipo === 'vis') return REGIONS[joint.region] || []
  return METRIC_LANDMARKS[joint.metric] || []
}

const regionVisible = (landmarks, region) => {
  const ids = REGIONS[region] || []
  return ids.length > 0 && ids.every((i) => isUsable(landmarks[i]))
}

// ¿El cuerpo entra completo en el cuadro? (para el estado "aléjate un poco").
export const frameCoverage = (landmarks) => {
  if (!landmarks) return { ok: false, faltan: ['cuerpo'], detected: false }
  const faltan = []
  const etiquetas = { cabeza: 'la cabeza', hombros: 'los hombros', caderas: 'la cadera', rodillas: 'las rodillas', tobillos: 'los tobillos' }
  for (const region of ['cabeza', 'hombros', 'caderas', 'rodillas', 'tobillos']) {
    if (!regionVisible(landmarks, region)) faltan.push(etiquetas[region])
  }
  return { ok: faltan.length === 0, faltan, detected: true }
}

// Estado de una articulación angular contra su objetivo y tolerancia.
const angleStatus = (delta, tol) => {
  const abs = Math.abs(delta)
  if (abs <= tol) return 'bien'
  if (abs <= tol * 1.8) return 'casi'
  return 'corrige'
}

const cueFor = (joint, value, target) => {
  const cue = joint.cue || {}
  if (value < target) return cue.menos || `Ajusta ${joint.label.toLowerCase()}`
  return cue.mas || `Ajusta ${joint.label.toLowerCase()}`
}

// Compara la pose viva contra la referencia del ejercicio.
//   opts.rigor         → { factor, grados } (ver RIGOR en exerciseLibrary)
//   opts.capturedAngles→ { metric: valor } que sobreescribe los objetivos semilla
export const comparePose = (landmarks, exercise, opts = {}) => {
  const rigor = opts.rigor || { factor: 1, grados: 15 }
  const captured = opts.capturedAngles || null
  const metrics = computeMetrics(landmarks)
  const detected = Boolean(metrics)
  const coverage = frameCoverage(landmarks)
  const jointsDef = exercise?.ref?.joints || []

  const joints = []
  let sumClose = 0
  let angleCount = 0
  const corrige = []
  const casi = []
  const bien = []

  for (const jd of jointsDef) {
    if (jd.tipo === 'vis') {
      const visible = detected && regionVisible(landmarks, jd.region)
      const status = visible ? 'bien' : 'corrige'
      joints.push({
        label: jd.label,
        tipo: 'vis',
        region: jd.region,
        status,
        estado: visible ? 'bien' : 'no te veo',
        color: STATUS_COLOR[status],
        halo: STATUS_HALO[status],
      })
      if (!visible && detected) corrige.push({ texto: `Muéstrame ${jd.label.toLowerCase()}`, tono: 'corrige' })
      continue
    }

    const value = metrics ? metrics[jd.metric] : null
    if (value === null || value === undefined) {
      joints.push({
        label: jd.label,
        metric: jd.metric,
        status: 'espera',
        estado: 'sin lectura',
        color: STATUS_COLOR.espera,
        halo: STATUS_HALO.espera,
      })
      continue
    }

    const target = (captured && captured[jd.metric] != null) ? captured[jd.metric] : jd.target
    const tol = Math.max(4, (jd.tol || rigor.grados) * rigor.factor)
    const delta = value - target
    const status = angleStatus(delta, tol)
    const close = Math.max(0, Math.min(1, 1 - Math.abs(delta) / (tol * 2.2)))
    sumClose += close
    angleCount += 1

    const estado = status === 'bien' ? 'bien' : status === 'casi' ? 'casi' : 'corrige'
    joints.push({
      label: jd.label,
      metric: jd.metric,
      value: Math.round(value),
      target: Math.round(target),
      delta: Math.round(delta),
      status,
      estado,
      color: STATUS_COLOR[status],
      halo: STATUS_HALO[status],
    })

    if (status === 'corrige') corrige.push({ texto: cueFor(jd, value, target), tono: 'corrige' })
    else if (status === 'casi') casi.push({ texto: cueFor(jd, value, target), tono: 'casi' })
    else bien.push({ texto: `✓ ${jd.label}`, tono: 'bien' })
  }

  const matchPct = angleCount > 0 ? Math.round((sumClose / angleCount) * 100) : 0

  // Correcciones: primero lo urgente (rojo), luego lo casi (ámbar) y, si sobra
  // espacio, un refuerzo positivo. Máximo 3 chips para no saturar (TDAH-friendly).
  const cues = [...corrige, ...casi].slice(0, 3)
  if (cues.length < 3 && bien.length) cues.push(bien[0])

  return { detected, coverage, matchPct, joints, cues, metrics }
}

// Snapshot de ángulos capturables (para guardar una pose de referencia propia).
export const snapshotAngles = (landmarks) => computeMetrics(landmarks)

// Contador de repeticiones por cruce de umbrales sobre un ángulo primario:
// baja del umbral `abajo` y vuelve por encima de `arriba` = 1 repetición.
export const createRepCounter = ({ abajo, arriba } = {}) => {
  let stage = 'arriba'
  let reps = 0
  return {
    update(value) {
      if (value === null || value === undefined) return reps
      if (stage === 'arriba' && value < abajo) stage = 'abajo'
      else if (stage === 'abajo' && value > arriba) {
        stage = 'arriba'
        reps += 1
      }
      return reps
    },
    get reps() { return reps },
    get stage() { return stage },
    reset() { stage = 'arriba'; reps = 0 },
  }
}
