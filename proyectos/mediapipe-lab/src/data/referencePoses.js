// Poses de referencia canónicas para el esqueleto "fantasma" del coach.
//
// Cada plantilla es un puñado de landmarks del cuerpo (los 13 que forman el
// stick figure) en coordenadas NORMALIZADAS de imagen [0..1], y = hacia abajo.
// Al dibujar, el fantasma se re-ancla al punto medio de tu cadera y se escala a
// tu torso (ver drawExercisePose), así que no importa tu tamaño ni dónde estés
// en el cuadro: se te encima. Es la silueta "correcta"; cuando capturas tu
// propia pose (modo Capturar) se usa esa en su lugar.
//
// Convención de lados como MediaPipe: de frente a la cámara, el hombro/cadera
// IZQUIERDO (índices 11/23) cae a la derecha de la imagen (x mayor).

// Índices de los 13 puntos del cuerpo.
export const BODY_LANDMARKS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

// Conexiones del stick figure (limpio, sin malla de cara ni manos).
export const BODY_CONNECTIONS = [
  [11, 12], // hombros
  [11, 13], [13, 15], // brazo izq
  [12, 14], [14, 16], // brazo der
  [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], // pierna izq
  [24, 26], [26, 28], // pierna der
]

const P = (m) => m // helper de legibilidad

export const REFERENCE_POSES = {
  squat: P({
    0: [0.50, 0.16],
    12: [0.42, 0.34], 11: [0.58, 0.34],
    14: [0.37, 0.46], 13: [0.63, 0.46],
    16: [0.40, 0.40], 15: [0.60, 0.40],
    24: [0.44, 0.60], 23: [0.56, 0.60],
    26: [0.40, 0.70], 25: [0.60, 0.70],
    28: [0.43, 0.86], 27: [0.57, 0.86],
  }),
  plank: P({
    0: [0.15, 0.50],
    12: [0.26, 0.52], 11: [0.26, 0.56],
    14: [0.26, 0.66], 13: [0.26, 0.66],
    16: [0.31, 0.67], 15: [0.31, 0.67],
    24: [0.52, 0.56], 23: [0.52, 0.58],
    26: [0.70, 0.60], 25: [0.70, 0.62],
    28: [0.86, 0.64], 27: [0.86, 0.66],
  }),
  lunge: P({
    0: [0.42, 0.14],
    12: [0.40, 0.32], 11: [0.44, 0.32],
    14: [0.40, 0.46], 13: [0.44, 0.46],
    16: [0.40, 0.56], 15: [0.44, 0.56],
    24: [0.42, 0.56], 23: [0.46, 0.56],
    26: [0.34, 0.74], 25: [0.56, 0.70],
    28: [0.24, 0.86], 27: [0.56, 0.86],
  }),
  press: P({
    0: [0.50, 0.20],
    12: [0.42, 0.34], 11: [0.58, 0.34],
    14: [0.40, 0.24], 13: [0.60, 0.24],
    16: [0.42, 0.12], 15: [0.58, 0.12],
    24: [0.45, 0.58], 23: [0.55, 0.58],
    26: [0.45, 0.76], 25: [0.55, 0.76],
    28: [0.45, 0.92], 27: [0.55, 0.92],
  }),
  row: P({
    0: [0.50, 0.20],
    12: [0.42, 0.34], 11: [0.58, 0.34],
    14: [0.34, 0.44], 13: [0.66, 0.44],
    16: [0.44, 0.44], 15: [0.56, 0.44],
    24: [0.45, 0.58], 23: [0.55, 0.58],
    26: [0.45, 0.76], 25: [0.55, 0.76],
    28: [0.45, 0.92], 27: [0.55, 0.92],
  }),
  bridge: P({
    0: [0.15, 0.66],
    12: [0.24, 0.64], 11: [0.24, 0.68],
    14: [0.24, 0.72], 13: [0.24, 0.72],
    16: [0.29, 0.74], 15: [0.29, 0.74],
    24: [0.56, 0.47], 23: [0.56, 0.51],
    26: [0.72, 0.57], 25: [0.72, 0.61],
    28: [0.78, 0.72], 27: [0.78, 0.74],
  }),
}

export const getReferencePose = (poseKey) => REFERENCE_POSES[poseKey] || REFERENCE_POSES.squat

const midpoint = (pose, a, b) => {
  const pa = pose[a]
  const pb = pose[b]
  if (!pa || !pb) return null
  return [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]
}

// Punto medio de cadera y "largo de torso" (cadera→hombro) de una plantilla o
// de un set de landmarks vivos {x,y}. Sirven para anclar/escalar el fantasma.
export const poseAnchor = (pose) => {
  const hip = midpoint(pose, 23, 24)
  const sho = midpoint(pose, 11, 12)
  if (!hip || !sho) return null
  const torso = Math.hypot(sho[0] - hip[0], sho[1] - hip[1]) || 0.2
  return { hip, torso }
}

export const liveAnchor = (landmarks) => {
  if (!landmarks) return null
  const lh = landmarks[23]
  const rh = landmarks[24]
  const ls = landmarks[11]
  const rs = landmarks[12]
  if (![lh, rh, ls, rs].every((p) => p && (p.visibility ?? 1) >= 0.5)) return null
  const hip = [(lh.x + rh.x) / 2, (lh.y + rh.y) / 2]
  const sho = [(ls.x + rs.x) / 2, (ls.y + rs.y) / 2]
  const torso = Math.hypot(sho[0] - hip[0], sho[1] - hip[1]) || 0.2
  return { hip, torso }
}
