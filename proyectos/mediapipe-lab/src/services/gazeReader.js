// Estimación de mirada vertical a partir de los landmarks de cara de
// MediaPipe (FaceLandmarker, 478 puntos con iris). No intenta adivinar
// coordenadas absolutas: mide qué tan arriba/abajo está el iris respecto a
// la línea de las comisuras del ojo, normalizado por el ancho del ojo (para
// que no dependa de la distancia a la cámara ni de qué tan abierto esté el
// ojo). La calibración (varios puntos) traduce ese offset a una Y de pantalla.

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

const eyeVerticalOffset = (landmarks, irisIndex, outerIndex, innerIndex) => {
  const iris = landmarks[irisIndex]
  const outer = landmarks[outerIndex]
  const inner = landmarks[innerIndex]
  if (!iris || !outer || !inner) return null

  // Línea de comisuras (referencia estable, no depende del párpado).
  const midY = (outer.y + inner.y) / 2
  const width = Math.hypot(inner.x - outer.x, inner.y - outer.y)
  if (width < 1e-4) return null

  // > 0 = iris por debajo de la línea (mirando hacia abajo).
  return (iris.y - midY) / width
}

// Promedio de ambos ojos; null si no hay señal usable.
export const averageVerticalGaze = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length < 478) return null

  const left = eyeVerticalOffset(landmarks, LEFT_IRIS, LEFT_EYE_OUTER, LEFT_EYE_INNER)
  const right = eyeVerticalOffset(landmarks, RIGHT_IRIS, RIGHT_EYE_OUTER, RIGHT_EYE_INNER)
  const values = [left, right].filter((value) => value !== null && Number.isFinite(value))
  if (!values.length) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

// Apertura del ojo = separación vertical de párpados / ancho del ojo (para
// que no dependa de la distancia). Sirve para detectar parpadeos: cuando cae
// muy por debajo de lo normal, el ojo está cerrado y la mirada no es fiable.
const eyeOpennessOne = (landmarks, topIndex, bottomIndex, outerIndex, innerIndex) => {
  const top = landmarks[topIndex]
  const bottom = landmarks[bottomIndex]
  const outer = landmarks[outerIndex]
  const inner = landmarks[innerIndex]
  if (!top || !bottom || !outer || !inner) return null
  const width = Math.hypot(inner.x - outer.x, inner.y - outer.y)
  if (width < 1e-4) return null
  return Math.abs(bottom.y - top.y) / width
}

export const eyeOpenness = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length < 478) return null

  const left = eyeOpennessOne(landmarks, LEFT_LID_TOP, LEFT_LID_BOTTOM, LEFT_EYE_OUTER, LEFT_EYE_INNER)
  const right = eyeOpennessOne(landmarks, RIGHT_LID_TOP, RIGHT_LID_BOTTOM, RIGHT_EYE_OUTER, RIGHT_EYE_INNER)
  const values = [left, right].filter((value) => value !== null && Number.isFinite(value))
  if (!values.length) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

// Mediana: captura de calibración robusta a cuadros sueltos malos.
export const median = (values) => {
  const sorted = (values || []).filter(Number.isFinite).slice().sort((a, b) => a - b)
  if (!sorted.length) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Nivel "abierto" de referencia, aprendido en vivo: sube rápido (upAlpha) y
// baja lento (downAlpha) para seguir el máximo de apertura sin dejar que un
// parpadeo lo arrastre hacia abajo.
export const updateOpenBaseline = (baseline, openness, upAlpha = 0.2, downAlpha = 0.02) => {
  if (openness === null || !Number.isFinite(openness)) return baseline
  if (baseline === null) return openness
  const alpha = openness > baseline ? upAlpha : downAlpha
  return baseline + (openness - baseline) * alpha
}

// Parpadeo: la apertura cae por debajo de una fracción del nivel abierto (o
// de un piso absoluto). Sin señal de apertura se trata como parpadeo (la
// mirada no es fiable).
export const isBlink = (openness, baseline, ratio = 0.6, floor = 0.12) => {
  if (openness === null || !Number.isFinite(openness)) return true
  const reference = baseline === null || !Number.isFinite(baseline) ? openness : baseline
  return openness < Math.max(floor, reference * ratio)
}

// Arma el mapa offset -> Y de pantalla a partir de las muestras de
// calibración. Ordena por offset (al mirar hacia abajo el offset crece) y
// exige al menos 2 anclas con offsets distintos.
export const buildGazeMapping = (samples) => {
  const points = (samples || [])
    .filter((s) => s && Number.isFinite(s.offset) && Number.isFinite(s.y))
    .sort((a, b) => a.offset - b.offset)

  const distinct = points.filter((point, i) => i === 0 || point.offset - points[i - 1].offset > 1e-4)
  return distinct.length >= 2 ? distinct : null
}

// Interpola (lineal por tramos) el offset actual a una Y de pantalla. Fuera
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
