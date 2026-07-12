// Coach de sentadilla v2 (piloto). Vista FRONTAL.
//
// A diferencia del motor genérico (poseCompare), este es específico de la
// sentadilla y compara contra estándares VERIFICADOS (data/squatReference.js),
// no contra una pose dibujada a mano. Da feedback interpretable:
//   · profundidad (¿bajaste al paralelo?) — por caída de la cadera, NO por
//     ángulo de rodilla (de frente ese ángulo casi no cambia; ver squatReference)
//   · valgo (¿se te meten las rodillas hacia adentro?  ← lo que Paulette notó)
//   · ancho de pies
//   · conteo de reps y "reps limpias"
//
// Todo geométrico y normalizado (invariante a tu tamaño/posición). Sin Vue ni
// DOM: probable en Node con landmarks sintéticos.

import { POSE } from './agilityHandlingRules.js'
import { frameCoverage, STATUS_COLOR } from './poseCompare.js'
import { SQUAT_TOP, SQUAT_BOTTOM, SQUAT_STANDARD, SQUAT_CUES } from '../data/squatReference.js'

const HALO = {
  bien: 'rgba(79,164,122,0.16)',
  casi: 'rgba(217,164,65,0.16)',
  corrige: 'rgba(217,83,79,0.16)',
  espera: 'rgba(168,166,176,0.16)',
}

const usable = (lm) => Boolean(lm && (lm.visibility ?? 1) >= 0.5)
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const midY = (a, b) => (usable(a) && usable(b) ? (a.y + b.y) / 2 : null)
const sepX = (a, b) => (usable(a) && usable(b) ? Math.abs(a.x - b.x) : null)

const statusFromScore = (score) => (score >= 0.8 ? 'bien' : score >= 0.5 ? 'casi' : 'corrige')
const mkJoint = (label, status, estado) => ({
  label,
  status,
  estado,
  color: STATUS_COLOR[status],
  halo: HALO[status],
})

// Métricas frontales de la sentadilla a partir de los landmarks.
export const squatMetrics = (lm) => {
  if (!lm) return null
  const hipMidY = midY(lm[POSE.leftHip], lm[POSE.rightHip])
  const kneeMidY = midY(lm[POSE.leftKnee], lm[POSE.rightKnee])
  const shoulderMidY = midY(lm[POSE.leftShoulder], lm[POSE.rightShoulder])

  const torso = hipMidY !== null && shoulderMidY !== null ? Math.abs(hipMidY - shoulderMidY) : null
  const gapRatio = kneeMidY !== null && hipMidY !== null && torso ? (kneeMidY - hipMidY) / torso : null
  const depthFrac = gapRatio !== null ? clamp01(1 - gapRatio / SQUAT_STANDARD.profundidad.gapDePie) : null

  const kneeSepX = sepX(lm[POSE.leftKnee], lm[POSE.rightKnee])
  const ankleSepX = sepX(lm[POSE.leftAnkle], lm[POSE.rightAnkle])
  const shoulderSepX = sepX(lm[POSE.leftShoulder], lm[POSE.rightShoulder])
  const valgusRatio = kneeSepX !== null && ankleSepX ? kneeSepX / ankleSepX : null
  const stanceRatio = ankleSepX !== null && shoulderSepX ? ankleSepX / shoulderSepX : null

  return { depthFrac, gapRatio, kneeSepX, ankleSepX, shoulderSepX, valgusRatio, stanceRatio }
}

// Índices de landmark para colorear el semáforo sobre el cuerpo.
const IDX = {
  rodillas: [POSE.leftKnee, POSE.rightKnee],
  cadera: [POSE.leftHip, POSE.rightHip],
  pies: [POSE.leftAnkle, POSE.rightAnkle],
}

export const createSquatCoach = () => {
  const S = SQUAT_STANDARD
  let repState = 'arriba'
  let showBottom = false
  let reps = 0
  let cleanReps = 0
  let repHadValgo = false
  let repReachedDepth = false
  // acumuladores de sesión
  let frames = 0
  let sumMatch = 0
  let bestDepth = 0
  let repsWithValgo = 0
  let repsShallow = 0
  let started = 0

  const reset = () => {
    repState = 'arriba'; showBottom = false; reps = 0; cleanReps = 0
    repHadValgo = false; repReachedDepth = false
    frames = 0; sumMatch = 0; bestDepth = 0; repsWithValgo = 0; repsShallow = 0
    started = 0
  }

  const update = (lm, nowMs = 0, opts = {}) => {
    if (!started) started = nowMs
    const coverage = frameCoverage(lm)
    const m = squatMetrics(lm)
    if (!m || m.depthFrac === null) {
      return { detected: false, coverage, reps, matchPct: 0, joints: [], cues: [], targetPose: SQUAT_TOP, statusByIndex: {} }
    }
    const d = m.depthFrac

    // Histéresis para decidir qué pose objetivo mostrar (evita parpadeo).
    if (!showBottom && d > 0.4) showBottom = true
    else if (showBottom && d < 0.25) showBottom = false

    // Máquina de reps (por profundidad) + seguimiento de rep limpia.
    if (repState === 'arriba' && d > S.rep.abajo) {
      repState = 'abajo'; repHadValgo = false; repReachedDepth = false
    } else if (repState === 'abajo') {
      if (d >= S.profundidad.objetivo) repReachedDepth = true
      if (m.valgusRatio !== null && m.valgusRatio < S.valgo.ratioMin) repHadValgo = true
      if (d < S.rep.arriba) {
        repState = 'arriba'; reps += 1
        if (repReachedDepth && !repHadValgo) cleanReps += 1
        if (repHadValgo) repsWithValgo += 1
        if (!repReachedDepth) repsShallow += 1
      }
    }

    // Sub-scores.
    const depthScore = clamp01(d / S.profundidad.objetivo)
    const valgusScore = m.valgusRatio !== null ? clamp01(m.valgusRatio / S.valgo.ratioMin) : 1
    const stanceScore = m.stanceRatio !== null
      ? (m.stanceRatio >= S.stance.ratioMin && m.stanceRatio <= S.stance.ratioMax
          ? 1
          : clamp01(1 - Math.min(Math.abs(m.stanceRatio - S.stance.ratioMin), Math.abs(m.stanceRatio - S.stance.ratioMax))))
      : 1
    const standTall = clamp01(1 - d / 0.3)

    // match% según la fase (parada no penaliza la falta de profundidad).
    const matchPct = showBottom
      ? Math.round(100 * (0.45 * depthScore + 0.40 * valgusScore + 0.15 * stanceScore))
      : Math.round(100 * (0.70 * standTall + 0.30 * stanceScore))

    // Semáforo por articulación.
    const rodillaStatus = statusFromScore(valgusScore)
    const caderaStatus = showBottom ? statusFromScore(depthScore) : 'bien'
    const piesStatus = statusFromScore(stanceScore)
    const joints = [
      mkJoint('Rodillas', rodillaStatus, rodillaStatus === 'bien' ? 'alineadas' : 'hacia adentro'),
      mkJoint('Profundidad', caderaStatus, caderaStatus === 'bien' ? 'buena' : (showBottom ? 'baja más' : '—')),
      mkJoint('Pies', piesStatus, piesStatus === 'bien' ? 'al ancho' : 'ajusta'),
    ]

    // Correcciones (máx 3, lo urgente primero).
    const corrige = []; const bien = []
    if (m.valgusRatio !== null && m.valgusRatio < S.valgo.ratioMin) corrige.push({ texto: SQUAT_CUES.valgo, tono: 'corrige' })
    if (showBottom && depthScore < 0.8) corrige.push({ texto: SQUAT_CUES.profundidadPoca, tono: depthScore < 0.5 ? 'corrige' : 'casi' })
    if (m.stanceRatio !== null && m.stanceRatio < S.stance.ratioMin) corrige.push({ texto: SQUAT_CUES.stanceAngosto, tono: 'casi' })
    else if (m.stanceRatio !== null && m.stanceRatio > S.stance.ratioMax) corrige.push({ texto: SQUAT_CUES.stanceAncho, tono: 'casi' })
    if (rodillaStatus === 'bien') bien.push({ texto: SQUAT_CUES.bienRodillas, tono: 'bien' })
    if (showBottom && depthScore >= 0.8) bien.push({ texto: SQUAT_CUES.bienProfundidad, tono: 'bien' })
    const cues = corrige.slice(0, 3)
    if (cues.length < 3 && bien.length) cues.push(bien[0])

    // Puntos de color sobre el cuerpo.
    const statusByIndex = {}
    for (const i of IDX.rodillas) statusByIndex[i] = STATUS_COLOR[rodillaStatus]
    for (const i of IDX.cadera) statusByIndex[i] = STATUS_COLOR[caderaStatus]
    for (const i of IDX.pies) statusByIndex[i] = STATUS_COLOR[piesStatus]

    // Acumular sesión (si no está en pausa).
    if (!opts.paused) {
      frames += 1
      sumMatch += matchPct
      if (d > bestDepth) bestDepth = d
    }

    return {
      detected: true,
      coverage,
      reps,
      matchPct,
      joints,
      cues,
      targetPose: showBottom ? SQUAT_BOTTOM : SQUAT_TOP,
      statusByIndex,
      metrics: m,
    }
  }

  const summary = (nombre = 'Sentadilla', metaReps = null, nowMs = 0) => {
    const fallos = []
    if (repsWithValgo > 0) fallos.push({ label: 'Rodillas hacia adentro', veces: repsWithValgo, pct: reps ? Math.round((repsWithValgo / reps) * 100) : 0 })
    if (repsShallow > 0) fallos.push({ label: 'Poca profundidad', veces: repsShallow, pct: reps ? Math.round((repsShallow / reps) * 100) : 0 })
    return {
      exerciseId: 'sentadilla',
      nombre,
      reps,
      metaReps,
      cleanReps,
      calidad: frames ? Math.round(sumMatch / frames) : 0,
      bestHold: 0,
      bestDepthPct: Math.round(bestDepth * 100),
      fallos: fallos.sort((a, b) => b.pct - a.pct).slice(0, 4),
      durationSec: started ? Math.round((nowMs - started) / 1000) : 0,
    }
  }

  return { update, summary, reset, get reps() { return reps } }
}
