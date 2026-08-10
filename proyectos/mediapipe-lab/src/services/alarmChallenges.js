// Retos físicos para apagar la alarma de Motion Lab.
//
// Motor puro: entran los 33 landmarks de MediaPipe Pose y el reloj, sale el
// estado del reto (qué condiciones se cumplen, cuánto llevas, si ya). Sin Vue
// ni DOM: se prueba en Node con landmarks sintéticos
// (tests/alarm-challenges.test.mjs), igual que el motor de maniobras.
//
// Regla de diseño: NADA es silencioso. Cada condición sale con su valor medido
// y su umbral, y la cobertura dice qué parte del cuerpo no se ve, para que la
// pantalla pueda mostrar POR QUÉ no está contando (ese era el punto del
// módulo: ver que detecta y que no).
//
// Todas las medidas están normalizadas por el torso, así que no dependen de
// qué tan lejos estés de la cámara ni de tu estatura.

import { POSE } from './agilityHandlingRules.js'
import { squatMetrics } from './squatCoach.js'
import { SQUAT_STANDARD } from '../data/squatReference.js'

const VIS_MIN = 0.5
const usable = (lm) => Boolean(lm && Number.isFinite(lm.x) && Number.isFinite(lm.y) && (lm.visibility ?? 1) >= VIS_MIN)
const clamp01 = (v) => Math.max(0, Math.min(1, v))

// Grupos de landmarks con nombre humano: sirven para decir "no te veo los
// tobillos" en vez de "falta el índice 27".
const GRUPOS = {
  cabeza: { label: 'la cabeza', idx: [POSE.nose] },
  hombros: { label: 'los hombros', idx: [POSE.leftShoulder, POSE.rightShoulder] },
  munecas: { label: 'las muñecas', idx: [POSE.leftWrist, POSE.rightWrist] },
  caderas: { label: 'la cadera', idx: [POSE.leftHip, POSE.rightHip] },
  rodillas: { label: 'las rodillas', idx: [POSE.leftKnee, POSE.rightKnee] },
  tobillos: { label: 'los tobillos', idx: [POSE.leftAnkle, POSE.rightAnkle] },
}

// Escala del cuerpo = alto del torso (hombros → cadera). Si no se ve la
// cadera, cae al ancho de hombros para no quedarse sin referencia.
const torsoScale = (lm) => {
  const ls = lm[POSE.leftShoulder]
  const rs = lm[POSE.rightShoulder]
  const lh = lm[POSE.leftHip]
  const rh = lm[POSE.rightHip]
  if (usable(ls) && usable(rs) && usable(lh) && usable(rh)) {
    const alto = Math.abs((lh.y + rh.y) / 2 - (ls.y + rs.y) / 2)
    if (alto > 0.02) return alto
  }
  if (usable(ls) && usable(rs)) {
    const ancho = Math.abs(ls.x - rs.x)
    if (ancho > 0.02) return ancho * 1.4
  }
  return null
}

const mkCheck = (id, label, valor, meta, { mayorEsMejor = true, pista = '' } = {}) => {
  const v = Number.isFinite(valor) ? valor : null
  const ok = v === null ? false : (mayorEsMejor ? v >= meta : v <= meta)
  // pct = qué tan cerca está del umbral, para pintar una barra honesta.
  const pct = v === null ? 0 : clamp01(mayorEsMejor ? v / meta : meta / Math.max(v, 1e-6))
  return { id, label, ok, valor: v, meta, pct, pista }
}

// ── Definición de los retos ────────────────────────────────────────────
//
// tipo:
//   'hold'   → hay que sostener la posición N segundos
//   'ciclo'  → una rep = pasar por la marca 'a' y volver a la 'b'
//   'alterna'→ una rep = cada cambio entre las marcas 'a' y 'b'
//
// evaluar(lm, escala) devuelve { checks, marca } donde marca es 'a', 'b' o
// null (posición intermedia, no cuenta nada).

const RETOS_DEF = {
  'manos-arriba': {
    nombre: 'Manos arriba',
    emoji: '🙌',
    tipo: 'hold',
    metaDefault: 4,
    unidad: 's',
    comoSeHace: 'Sube las dos manos por encima de la cabeza y sostenlas ahí.',
    grupos: ['cabeza', 'hombros', 'munecas'],
    evaluar: (lm, s) => {
      const nariz = lm[POSE.nose]
      const alturaSobreCabeza = (muneca) => (
        usable(muneca) && usable(nariz) ? (nariz.y - muneca.y) / s : null
      )
      const checks = [
        mkCheck('izq', 'Mano izquierda arriba', alturaSobreCabeza(lm[POSE.leftWrist]), 0.12, { pista: 'Súbela por encima de la coronilla' }),
        mkCheck('der', 'Mano derecha arriba', alturaSobreCabeza(lm[POSE.rightWrist]), 0.12, { pista: 'Súbela por encima de la coronilla' }),
      ]
      return { checks, marca: checks.every((c) => c.ok) ? 'a' : 'b' }
    },
  },

  sentadillas: {
    nombre: 'Sentadillas',
    emoji: '🦵',
    tipo: 'ciclo',
    metaDefault: 5,
    unidad: 'reps',
    comoSeHace: 'De frente a la cámara, baja hasta que el muslo quede paralelo y vuelve a subir.',
    grupos: ['hombros', 'caderas', 'rodillas'],
    evaluar: (lm) => {
      const m = squatMetrics(lm)
      const d = m?.depthFrac ?? null
      const checks = [
        mkCheck('profundidad', 'Bajaste lo suficiente', d, SQUAT_STANDARD.rep.abajo, { pista: 'Baja más: cadera hacia atrás y abajo' }),
      ]
      let marca = null
      if (d !== null && d > SQUAT_STANDARD.rep.abajo) marca = 'a'
      else if (d !== null && d < SQUAT_STANDARD.rep.arriba) marca = 'b'
      return { checks, marca }
    },
  },

  'jumping-jacks': {
    nombre: 'Jumping jacks',
    emoji: '⭐',
    tipo: 'ciclo',
    metaDefault: 6,
    unidad: 'reps',
    comoSeHace: 'Abre brazos y piernas a la vez y vuelve a cerrarlos. Necesita que la cámara te vea de cuerpo completo.',
    grupos: ['hombros', 'munecas', 'tobillos'],
    evaluar: (lm, s) => {
      const ls = lm[POSE.leftShoulder]
      const rs = lm[POSE.rightShoulder]
      const hombroY = usable(ls) && usable(rs) ? (ls.y + rs.y) / 2 : null
      const munecas = [lm[POSE.leftWrist], lm[POSE.rightWrist]]
      // La mano que va más abajo manda: las dos tienen que subir.
      const manoBajaY = munecas.every(usable) ? Math.max(munecas[0].y, munecas[1].y) : null
      const brazos = hombroY !== null && manoBajaY !== null ? (hombroY - manoBajaY) / s : null

      const anchoTobillos = usable(lm[POSE.leftAnkle]) && usable(lm[POSE.rightAnkle])
        ? Math.abs(lm[POSE.leftAnkle].x - lm[POSE.rightAnkle].x)
        : null
      const anchoHombros = usable(ls) && usable(rs) ? Math.abs(ls.x - rs.x) : null
      const piernas = anchoTobillos !== null && anchoHombros ? anchoTobillos / anchoHombros : null

      const checks = [
        mkCheck('brazos', 'Brazos arriba', brazos, 0.15, { pista: 'Sube las dos manos por encima de los hombros' }),
        mkCheck('piernas', 'Piernas abiertas', piernas, 1.5, { pista: 'Separa más los pies al saltar' }),
      ]
      const abierto = checks.every((c) => c.ok)
      const cerrado = brazos !== null && brazos < 0 && piernas !== null && piernas < 1.2
      return { checks, marca: abierto ? 'a' : (cerrado ? 'b' : null) }
    },
  },

  'toques-cruzados': {
    nombre: 'Toques cruzados',
    emoji: '🤞',
    tipo: 'alterna',
    metaDefault: 10,
    unidad: 'toques',
    comoSeHace: 'Toca tu hombro contrario con cada mano, alternando. Sirve si la cámara solo te ve de la cintura para arriba.',
    grupos: ['hombros', 'munecas'],
    evaluar: (lm, s) => {
      const dist = (a, b) => (usable(a) && usable(b) ? Math.hypot(a.x - b.x, a.y - b.y) / s : null)
      // Mano izquierda al hombro derecho y viceversa (cruzado de verdad).
      const izqAlDer = dist(lm[POSE.leftWrist], lm[POSE.rightShoulder])
      const derAlIzq = dist(lm[POSE.rightWrist], lm[POSE.leftShoulder])
      const checks = [
        mkCheck('izq', 'Mano izquierda al hombro derecho', izqAlDer, 0.45, { mayorEsMejor: false, pista: 'Cruza más: la palma sobre el hombro contrario' }),
        mkCheck('der', 'Mano derecha al hombro izquierdo', derAlIzq, 0.45, { mayorEsMejor: false, pista: 'Cruza más: la palma sobre el hombro contrario' }),
      ]
      const tocaDer = checks[0].ok
      const tocaIzq = checks[1].ok
      // Si tocas los dos a la vez no cuenta: el reto es alternar.
      if (tocaDer && !tocaIzq) return { checks, marca: 'a' }
      if (tocaIzq && !tocaDer) return { checks, marca: 'b' }
      return { checks, marca: null }
    },
  },
}

// Catálogo para la UI (sin la función evaluar).
export const CHALLENGES = Object.entries(RETOS_DEF).map(([id, def]) => ({
  id,
  nombre: def.nombre,
  emoji: def.emoji,
  tipo: def.tipo,
  metaDefault: def.metaDefault,
  unidad: def.unidad,
  comoSeHace: def.comoSeHace,
  necesita: def.grupos.map((g) => GRUPOS[g].label).join(', '),
}))

export const DEFAULT_CHALLENGE = 'manos-arriba'

// Cuánto tiempo puede fallar la condición antes de reiniciar el sostenido.
// Sin esta gracia, un solo frame en el que MediaPipe pierde la muñeca borra
// los 4 segundos que llevabas y la alarma se vuelve imposible.
const GRACIA_MS = 350
// Tope por frame: si la pestaña se congela, no regalar segundos de sostenido.
const DT_MAX_MS = 250

// Cobertura del cuerpo para este reto: qué grupos se ven y cuáles no.
const cobertura = (lm, grupos) => {
  if (!lm) return { detectado: false, ok: false, faltan: ['tu cuerpo'], pct: 0 }
  const faltan = []
  for (const g of grupos) {
    const visible = GRUPOS[g].idx.every((i) => usable(lm[i]))
    if (!visible) faltan.push(GRUPOS[g].label)
  }
  return {
    detectado: true,
    ok: faltan.length === 0,
    faltan,
    pct: grupos.length ? (grupos.length - faltan.length) / grupos.length : 1,
  }
}

/**
 * Crea el seguidor de un reto.
 *
 * @param {{ id?: string, meta?: number }} opciones
 * @returns {{ update: Function, reset: Function, def: object }}
 *
 * update(landmarks, nowMs) devuelve:
 *   { detectado, cobertura, checks, marca, progreso, holdMs, listo, evento, bloqueo }
 * donde evento ∈ null | 'rep' | 'listo' | 'reinicio' (para la bitácora).
 */
export const createAlarmChallenge = ({ id = DEFAULT_CHALLENGE, meta } = {}) => {
  const retoId = RETOS_DEF[id] ? id : DEFAULT_CHALLENGE
  const def = RETOS_DEF[retoId]
  const objetivo = Number.isFinite(meta) && meta > 0 ? meta : def.metaDefault

  let hechas = 0
  let holdMs = 0
  let sinCumplirMs = 0
  let armado = false // pasó por la marca 'a' (retos de ciclo)
  let ultimaContada = null // última marca que sumó (retos alternados)
  let ultimoMs = null
  let listo = false

  const reset = () => {
    hechas = 0
    holdMs = 0
    sinCumplirMs = 0
    armado = false
    ultimaContada = null
    ultimoMs = null
    listo = false
  }

  const progreso = () => {
    const hecho = def.tipo === 'hold' ? Math.round((holdMs / 1000) * 10) / 10 : hechas
    return { hecho, meta: objetivo, unidad: def.unidad, pct: clamp01(hecho / objetivo) }
  }

  const update = (landmarks, nowMs = 0) => {
    const dt = ultimoMs === null ? 0 : Math.max(0, Math.min(DT_MAX_MS, nowMs - ultimoMs))
    ultimoMs = nowMs

    const cob = cobertura(landmarks, def.grupos)
    const escala = landmarks ? torsoScale(landmarks) : null

    // Sin cuerpo (o sin escala) no se inventa nada: el reto se congela y la
    // pantalla dice qué falta. La alarma sigue sonando, claro.
    if (!cob.detectado || !cob.ok || !escala) {
      const antes = holdMs
      if (def.tipo === 'hold') {
        sinCumplirMs += dt
        if (sinCumplirMs > GRACIA_MS) holdMs = 0
      }
      return {
        detectado: cob.detectado,
        cobertura: cob,
        // Mientras falte cuerpo, las condiciones del reto no se pueden medir:
        // en su lugar va la lista de "qué parte te veo", que es justo lo que
        // hay que arreglar antes de que algo cuente.
        checks: def.grupos.map((g) => ({
          id: g,
          label: `Veo ${GRUPOS[g].label}`,
          ok: landmarks ? GRUPOS[g].idx.every((i) => usable(landmarks[i])) : false,
          valor: null,
          meta: null,
          pct: 0,
          pista: '',
        })),
        marca: null,
        progreso: progreso(),
        holdMs,
        listo,
        bloqueo: cob.detectado
          ? `No te veo ${cob.faltan.join(' ni ')}`
          : 'No te veo en cámara',
        evento: antes > 0 && holdMs === 0 ? 'reinicio' : null,
      }
    }

    const { checks, marca } = def.evaluar(landmarks, escala)
    const cumple = def.tipo === 'hold' ? marca === 'a' : checks.every((c) => c.ok)
    let evento = null

    if (def.tipo === 'hold') {
      if (cumple) {
        sinCumplirMs = 0
        holdMs += dt
      } else {
        sinCumplirMs += dt
        if (sinCumplirMs > GRACIA_MS && holdMs > 0) {
          holdMs = 0
          evento = 'reinicio'
        }
      }
      if (!listo && holdMs >= objetivo * 1000) {
        listo = true
        evento = 'listo'
      }
    } else if (def.tipo === 'ciclo') {
      if (marca === 'a') armado = true
      else if (marca === 'b' && armado) {
        armado = false
        hechas += 1
        evento = 'rep'
      }
      if (!listo && hechas >= objetivo) {
        listo = true
        evento = 'listo'
      }
    } else if (def.tipo === 'alterna') {
      if (marca && marca !== ultimaContada) {
        ultimaContada = marca
        hechas += 1
        evento = 'rep'
      }
      if (!listo && hechas >= objetivo) {
        listo = true
        evento = 'listo'
      }
    }

    return {
      detectado: true,
      cobertura: cob,
      checks,
      marca,
      progreso: progreso(),
      holdMs,
      listo,
      bloqueo: null,
      evento,
    }
  }

  return {
    update,
    reset,
    def: { id: retoId, ...def, meta: objetivo, evaluar: undefined },
  }
}
