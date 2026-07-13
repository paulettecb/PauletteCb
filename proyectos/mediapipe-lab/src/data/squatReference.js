// Referencia VERIFICADA de la sentadilla para el coach v2 (piloto).
//
// Fuente de verdad de "lo correcto" = estándares generales de buena técnica de
// sentadilla (no la pose de nadie grabándose). Verificado contra guías comunes
// de entrenamiento de fuerza; NO es consejo médico.
//
// Decisión de vista: FRONTAL (de frente a la cámara). El error que Paulette
// notó —rodillas que se meten hacia adentro (valgo)— se ve desde el frente, no
// de lado. La profundidad se aproxima por la caída de la cadera respecto a la
// rodilla. (Una vista lateral daría mejor lectura de espalda/profundidad; queda
// para una fase siguiente.)
//
// Las poses TOP/BOTTOM están en el mismo formato que data/referencePoses.js
// ({ indice: [x, y] } normalizado 0..1, y hacia abajo), para que
// drawExercisePose las ancle a tu cadera y las escale a tu torso. Convención
// MediaPipe: de frente, el lado IZQUIERDO (11/23/25/27) cae a la derecha de la
// imagen (x mayor).

// Pose de pie (inicio): rodillas casi rectas, pies al ancho de hombros,
// rodillas y tobillos alineados bajo la cadera.
export const SQUAT_TOP = {
  0: [0.50, 0.16],
  12: [0.44, 0.30], 11: [0.56, 0.30],
  14: [0.42, 0.42], 13: [0.58, 0.42],
  16: [0.41, 0.53], 15: [0.59, 0.53],
  24: [0.455, 0.55], 23: [0.545, 0.55],
  26: [0.45, 0.72], 25: [0.55, 0.72],
  28: [0.45, 0.90], 27: [0.55, 0.90],
}

// Pose en el fondo (objetivo): cadera atrás y abajo (muslo ~paralelo), rodillas
// siguiendo la punta del pie (rodilla ~sobre el tobillo, NO hacia adentro),
// tronco erguido, brazos al frente para equilibrio.
export const SQUAT_BOTTOM = {
  0: [0.50, 0.22],
  12: [0.43, 0.36], 11: [0.57, 0.36],
  14: [0.40, 0.44], 13: [0.60, 0.44],
  16: [0.44, 0.40], 15: [0.56, 0.40],
  24: [0.455, 0.605], 23: [0.545, 0.605],
  26: [0.44, 0.70], 25: [0.56, 0.70],
  28: [0.44, 0.90], 27: [0.56, 0.90],
}

// Estándares numéricos verificados (proporciones). Comentados con su razón.
//
// OJO (vista frontal): la flexión de rodilla ocurre hacia la cámara (eje z), así
// que el ángulo de rodilla en 2D casi no cambia al bajar y NO sirve para medir
// profundidad de frente. Aquí la profundidad se mide por la CAÍDA DE LA CADERA
// hacia el nivel de la rodilla, normalizada por el torso (invariante al tamaño).
export const SQUAT_STANDARD = {
  vista: 'frontal',
  profundidad: {
    // gapRatio = (kneeMidY - hipMidY) / torso.  De pie la cadera está muy por
    // encima de la rodilla (gapRatio alto); en el paralelo la cadera baja al
    // nivel de la rodilla (gapRatio ~0). depthFrac = 1 - gapRatio/gapDePie.
    gapDePie: 0.62, // gapRatio típico de pie (referencia para escalar)
    objetivo: 0.8, // depthFrac ≥ esto = profundidad suficiente (muslo ~paralelo)
  },
  // Reps por oscilación de la profundidad (depthFrac): baja al fondo, vuelve
  // arriba = 1 rep.
  rep: { abajo: 0.55, arriba: 0.2 },
  // Valgo (rodillas hacia adentro): separación horizontal de rodillas vs. de
  // tobillos. Bien si las rodillas NO son más angostas que los tobillos.
  valgo: {
    ratioMin: 0.90, // kneeSepX / ankleSepX por debajo de esto = rodillas metidas
  },
  // Ancho de pies respecto a los hombros (para que la sentadilla sea estable).
  stance: {
    ratioMin: 0.75, // ankleSepX / shoulderSepX
    ratioMax: 1.7,
  },
}

// Textos de corrección (en lenguaje humano, cortos).
export const SQUAT_CUES = {
  profundidadPoca: 'Baja un poco más — busca el muslo paralelo',
  valgo: 'Abre las rodillas hacia la punta del pie',
  stanceAngosto: 'Separa un poco los pies (al ancho de hombros)',
  stanceAncho: 'Junta un poco los pies',
  bienProfundidad: '✓ Buena profundidad',
  bienRodillas: '✓ Rodillas alineadas',
}
