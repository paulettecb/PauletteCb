// Mate pura de la mirada (sin DOM ni MediaPipe) — testeable en Node.
//
// Estima la mirada a partir de los landmarks de cara de MediaPipe
// (FaceLandmarker, 478 puntos con iris). No adivina coordenadas absolutas:
// mide qué tan arriba/abajo (y ahora también izquierda/derecha) está el iris
// respecto a las comisuras del ojo, normalizado por el ancho del ojo (para que
// no dependa de la distancia a la cámara). La calibración traduce esos offsets
// a coordenadas de pantalla.
//
// Es la FUENTE ÚNICA de la mate: el package vanilla (gaze-reader.js) y el
// componente Vue de Motion Lab (services/gazeReader.js) importan de aquí, para
// no mantener dos motores que se desincronizan.

// Índices estándar del face mesh de MediaPipe.
const LEFT_IRIS = 468
const RIGHT_IRIS = 473
// Comisuras: externa e interna de cada ojo.
const LEFT_EYE_OUTER = 33
const LEFT_EYE_INNER = 133
const RIGHT_EYE_OUTER = 263
const RIGHT_EYE_INNER = 362
// Párpados superior e inferior (centro), para medir apertura del ojo.
const LEFT_LID_TOP = 159
const LEFT_LID_BOTTOM = 145
const RIGHT_LID_TOP = 386
const RIGHT_LID_BOTTOM = 374

const eyeWidth = (outer, inner) => Math.hypot(inner.x - outer.x, inner.y - outer.y)

const eyeVerticalOffset = (landmarks, irisIndex, outerIndex, innerIndex) => {
  const iris = landmarks[irisIndex]
  const outer = landmarks[outerIndex]
  const inner = landmarks[innerIndex]
  if (!iris || !outer || !inner) return null

  // Línea de comisuras (referencia estable, no depende del párpado).
  const midY = (outer.y + inner.y) / 2
  const width = eyeWidth(outer, inner)
  if (width < 1e-4) return null

  // > 0 = iris por debajo de la línea (mirando hacia abajo).
  return (iris.y - midY) / width
}

const eyeHorizontalOffset = (landmarks, irisIndex, outerIndex, innerIndex) => {
  const iris = landmarks[irisIndex]
  const outer = landmarks[outerIndex]
  const inner = landmarks[innerIndex]
  if (!iris || !outer || !inner) return null

  // Punto medio horizontal de las comisuras (independiente de cuál es interna
  // o externa): así no importa el etiquetado y no se cancela el signo cuando se
  // promedian ambos ojos — los dos iris se desplazan hacia el mismo lado de la
  // imagen al mirar a un costado.
  const midX = (outer.x + inner.x) / 2
  const width = eyeWidth(outer, inner)
  if (width < 1e-4) return null

  // > 0 = iris a la derecha de la imagen.
  return (iris.x - midX) / width
}

const averageEyes = (a, b) => {
  const values = [a, b].filter((v) => v !== null && Number.isFinite(v))
  if (!values.length) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// Promedio vertical de ambos ojos; null si no hay señal usable.
export const averageVerticalGaze = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length < 478) return null
  return averageEyes(
    eyeVerticalOffset(landmarks, LEFT_IRIS, LEFT_EYE_OUTER, LEFT_EYE_INNER),
    eyeVerticalOffset(landmarks, RIGHT_IRIS, RIGHT_EYE_OUTER, RIGHT_EYE_INNER),
  )
}

// Promedio horizontal de ambos ojos; null si no hay señal usable.
export const averageHorizontalGaze = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length < 478) return null
  return averageEyes(
    eyeHorizontalOffset(landmarks, LEFT_IRIS, LEFT_EYE_OUTER, LEFT_EYE_INNER),
    eyeHorizontalOffset(landmarks, RIGHT_IRIS, RIGHT_EYE_OUTER, RIGHT_EYE_INNER),
  )
}

// Apertura del ojo = separación vertical de párpados / ancho del ojo (para que
// no dependa de la distancia). Sirve para detectar parpadeos.
const eyeOpennessOne = (landmarks, topIndex, bottomIndex, outerIndex, innerIndex) => {
  const top = landmarks[topIndex]
  const bottom = landmarks[bottomIndex]
  const outer = landmarks[outerIndex]
  const inner = landmarks[innerIndex]
  if (!top || !bottom || !outer || !inner) return null
  const width = eyeWidth(outer, inner)
  if (width < 1e-4) return null
  return Math.abs(bottom.y - top.y) / width
}

export const eyeOpenness = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length < 478) return null
  return averageEyes(
    eyeOpennessOne(landmarks, LEFT_LID_TOP, LEFT_LID_BOTTOM, LEFT_EYE_OUTER, LEFT_EYE_INNER),
    eyeOpennessOne(landmarks, RIGHT_LID_TOP, RIGHT_LID_BOTTOM, RIGHT_EYE_OUTER, RIGHT_EYE_INNER),
  )
}

// Lee ambos offsets + apertura de un cuadro. null en cada campo si no hay señal.
export const readGaze = (landmarks) => ({
  oX: averageHorizontalGaze(landmarks),
  oY: averageVerticalGaze(landmarks),
  openness: eyeOpenness(landmarks),
})

// Mediana: captura de calibración robusta a cuadros sueltos malos.
export const median = (values) => {
  const sorted = (values || []).filter(Number.isFinite).slice().sort((a, b) => a - b)
  if (!sorted.length) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Nivel "abierto" de referencia, aprendido en vivo: sube rápido y baja lento
// para seguir el máximo de apertura sin que un parpadeo lo arrastre.
export const updateOpenBaseline = (baseline, openness, upAlpha = 0.2, downAlpha = 0.02) => {
  if (openness === null || !Number.isFinite(openness)) return baseline
  if (baseline === null) return openness
  const alpha = openness > baseline ? upAlpha : downAlpha
  return baseline + (openness - baseline) * alpha
}

// Parpadeo: la apertura cae por debajo de una fracción del nivel abierto (o de
// un piso absoluto). Sin señal de apertura se trata como parpadeo.
export const isBlink = (openness, baseline, ratio = 0.6, floor = 0.12) => {
  if (openness === null || !Number.isFinite(openness)) return true
  const reference = baseline === null || !Number.isFinite(baseline) ? openness : baseline
  return openness < Math.max(floor, reference * ratio)
}

// Arma el mapa offset -> valor de pantalla (1D, por tramos) a partir de las
// muestras de calibración. Ordena por offset y exige ≥2 anclas distintas.
export const buildGazeMapping = (samples) => {
  const points = (samples || [])
    .filter((s) => s && Number.isFinite(s.offset) && Number.isFinite(s.y))
    .sort((a, b) => a.offset - b.offset)

  const distinct = points.filter((point, i) => i === 0 || point.offset - points[i - 1].offset > 1e-4)
  return distinct.length >= 2 ? distinct : null
}

// Interpola (lineal por tramos) el offset actual a un valor de pantalla. Fuera
// del rango calibrado se satura al ancla más cercana.
export const mapOffsetToY = (offset, mapping) => {
  if (!mapping || !mapping.length || !Number.isFinite(offset)) return null
  if (offset <= mapping[0].offset) return mapping[0].y
  if (offset >= mapping[mapping.length - 1].offset) return mapping[mapping.length - 1].y

  for (let i = 0; i < mapping.length - 1; i += 1) {
    const a = mapping[i]
    const b = mapping[i + 1]
    if (offset >= a.offset && offset <= b.offset) {
      const t = (offset - a.offset) / (b.offset - a.offset)
      return a.y + t * (b.y - a.y)
    }
  }
  return null
}

// ===== Calibración 2D (máxima) =====
// Un grid de columnas × filas mide (oX, oY) en cada punto. La posición
// horizontal ladea el offset vertical (y viceversa): al mirar a un costado la
// geometría del ojo cambia y mete un sesgo en el eje contrario. Se estima una
// constante de acoplamiento por mínimos cuadrados DENTRO de cada grupo (fila
// para Y, columna para X), se "des-ladea" el offset (oY' = oY − k·oX) y sobre
// el offset corregido corre EXACTAMENTE el mapeo por tramos 1D ya probado.
//
// Degradación elegante: con una sola columna no hay variación horizontal dentro
// de las filas → k = 0 → oY' = oY → el sistema colapsa al vertical de siempre.

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length

// Pendiente de `dep` respecto de `indep` acumulada dentro de cada grupo (quita
// la media de cada grupo antes de regresar). 0 si no hay variación intra-grupo.
const withinGroupSlope = (samples, groupKey, depKey, indepKey) => {
  const groups = new Map()
  for (const s of samples) {
    const g = s[groupKey]
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(s)
  }
  let num = 0
  let den = 0
  for (const arr of groups.values()) {
    if (arr.length < 2) continue
    const mDep = mean(arr.map((s) => s[depKey]))
    const mInd = mean(arr.map((s) => s[indepKey]))
    for (const s of arr) {
      const di = s[indepKey] - mInd
      num += di * (s[depKey] - mDep)
      den += di * di
    }
  }
  return den > 1e-9 ? num / den : 0
}

// Anclas por grupo: para cada valor de pantalla distinto (fila o columna),
// mediana del offset corregido de sus muestras → {offset, y}.
const anchorsByGroup = (samples, screenKey, correctedFn) => {
  const groups = new Map()
  for (const s of samples) {
    const g = s[screenKey]
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(s)
  }
  const anchors = []
  for (const [screen, arr] of groups.entries()) {
    const offset = median(arr.map(correctedFn))
    if (offset !== null) anchors.push({ offset, y: screen })
  }
  return anchors
}

// Construye el mapeo 2D. `samples`: [{ sx, sy, oX, oY }] (sx/sy en px de
// pantalla; oX/oY offsets medidos). Devuelve { kY, vertical, kX, horizontal }
// donde vertical/horizontal son mapeos por tramos (o null si no calibró ese eje).
export const build2DMapping = (samples) => {
  const clean = (samples || []).filter(
    (s) => s && Number.isFinite(s.sx) && Number.isFinite(s.sy) && Number.isFinite(s.oX) && Number.isFinite(s.oY),
  )
  if (clean.length < 2) return null

  const kY = withinGroupSlope(clean, 'sy', 'oY', 'oX')
  const kX = withinGroupSlope(clean, 'sx', 'oX', 'oY')

  const vertical = buildGazeMapping(anchorsByGroup(clean, 'sy', (s) => s.oY - kY * s.oX))
  const horizontal = buildGazeMapping(anchorsByGroup(clean, 'sx', (s) => s.oX - kX * s.oY))

  if (!vertical && !horizontal) return null
  return { kY, vertical, kX, horizontal }
}

// Traduce (oX, oY) actuales a coordenadas de pantalla usando el mapeo 2D.
// Cada eje devuelve null si no se calibró.
export const mapGaze = (oX, oY, mapping) => {
  if (!mapping || !Number.isFinite(oX) || !Number.isFinite(oY)) return { x: null, y: null }
  return {
    x: mapping.horizontal ? mapOffsetToY(oX - mapping.kX * oY, mapping.horizontal) : null,
    y: mapping.vertical ? mapOffsetToY(oY - mapping.kY * oX, mapping.vertical) : null,
  }
}

// Rango vertical (span) que capturó la calibración; alimenta el suavizado
// adaptativo del reader (saber qué tan grande es "un renglón" en TUS ojos).
export const verticalSpan = (mapping) => {
  const v = mapping?.vertical
  if (!v || v.length < 2) return null
  return v[v.length - 1].offset - v[0].offset
}
