// Análisis de la pose del guía (manejador) para entrenamiento de agility.
// Trabaja sobre los 33 landmarks de MediaPipe Pose. Los lados son anatómicos
// del guía ('left'/'right' = izquierda/derecha del propio cuerpo).

export const POSE = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
}

const SIDES = {
  left: { shoulder: POSE.leftShoulder, elbow: POSE.leftElbow, wrist: POSE.leftWrist, hip: POSE.leftHip, knee: POSE.leftKnee, ankle: POSE.leftAnkle },
  right: { shoulder: POSE.rightShoulder, elbow: POSE.rightElbow, wrist: POSE.rightWrist, hip: POSE.rightHip, knee: POSE.rightKnee, ankle: POSE.rightAnkle },
}

const toDeg = (rad) => (rad * 180) / Math.PI

const isUsable = (landmark) => Boolean(landmark && (landmark.visibility ?? 1) >= 0.5)

// Ángulo interno en B del triángulo A-B-C, en grados (0-180).
export const jointAngle = (a, b, c) => {
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const magAB = Math.hypot(abx, aby)
  const magCB = Math.hypot(cbx, cby)
  if (!magAB || !magCB) return 0
  return toDeg(Math.acos(Math.min(1, Math.max(-1, dot / (magAB * magCB)))))
}

// Evalúa el brazo de señal: extendido lateralmente, más o menos horizontal.
// El brazo que señala es el del lado donde va el perro.
export const analyzeArm = (landmarks, side) => {
  const ids = SIDES[side]
  const shoulder = landmarks[ids.shoulder]
  const elbow = landmarks[ids.elbow]
  const wrist = landmarks[ids.wrist]

  if (![shoulder, elbow, wrist].every(isUsable)) {
    return { visible: false, extended: false, elbowAngle: 0, elevation: 0, raised: false }
  }

  const elbowAngle = jointAngle(shoulder, elbow, wrist)
  // Elevación del brazo respecto a la horizontal: 0° = brazo horizontal,
  // positivo = mano por encima del hombro (y crece hacia abajo en imagen).
  const elevation = toDeg(Math.atan2(shoulder.y - wrist.y, Math.abs(wrist.x - shoulder.x) || 1e-6))
  const reach = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y)
  const shoulderWidth = Math.hypot(
    landmarks[POSE.leftShoulder].x - landmarks[POSE.rightShoulder].x,
    landmarks[POSE.leftShoulder].y - landmarks[POSE.rightShoulder].y,
  ) || 1e-6

  return {
    visible: true,
    elbowAngle,
    elevation,
    // Brazo razonablemente recto y con alcance mayor al ancho de hombros.
    extended: elbowAngle >= 140 && reach > shoulderWidth * 1.1,
    raised: elevation > 55,
  }
}

// Rotación de hombros (yaw) respecto a la cámara usando la profundidad (z).
// ~0° = de frente a la cámara · ±90° = de perfil · ±180° = de espaldas.
export const shoulderYaw = (landmarks) => {
  const left = landmarks[POSE.leftShoulder]
  const right = landmarks[POSE.rightShoulder]
  if (!isUsable(left) || !isUsable(right)) return null

  // Vector del hombro derecho al izquierdo. De frente a la cámara, el hombro
  // izquierdo del guía queda a la derecha de la imagen (x mayor) y con z similar.
  const dx = left.x - right.x
  const dz = (left.z ?? 0) - (right.z ?? 0)
  return toDeg(Math.atan2(dz, dx))
}

export const facingLabel = (yaw) => {
  if (yaw === null) return 'sin lectura'
  const abs = Math.abs(yaw)
  if (abs < 40) return 'de frente'
  if (abs > 140) return 'de espaldas'
  return yaw > 0 ? 'perfil derecho' : 'perfil izquierdo'
}

// Inclinación del torso respecto a la vertical, en grados. Positivo = hacia
// la izquierda de la imagen.
export const torsoLean = (landmarks) => {
  const midShoulder = midpoint(landmarks[POSE.leftShoulder], landmarks[POSE.rightShoulder])
  const midHip = midpoint(landmarks[POSE.leftHip], landmarks[POSE.rightHip])
  if (!midShoulder || !midHip) return null
  return toDeg(Math.atan2(midHip.x - midShoulder.x, midHip.y - midShoulder.y))
}

export const kneeFlexion = (landmarks, side) => {
  const ids = SIDES[side]
  const hip = landmarks[ids.hip]
  const knee = landmarks[ids.knee]
  const ankle = landmarks[ids.ankle]
  if (![hip, knee, ankle].every(isUsable)) return null
  return jointAngle(hip, knee, ankle)
}

const midpoint = (a, b) => {
  if (!isUsable(a) || !isUsable(b)) return null
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

// Máquina de estados para contar giros completos (front cross en estático):
// de frente → de espaldas → de frente = 1 repetición.
export const createTurnCounter = () => {
  let stage = 'front'
  let reps = 0

  return {
    update(yaw) {
      if (yaw === null) return reps
      const abs = Math.abs(yaw)
      if (stage === 'front' && abs > 140) stage = 'back'
      else if (stage === 'back' && abs < 40) {
        stage = 'front'
        reps += 1
      }
      return reps
    },
    get reps() { return reps },
    get stage() { return stage },
    reset() { stage = 'front'; reps = 0 },
  }
}

// Contador de sentadillas parciales para el drill de deceleración:
// piernas extendidas (>160°) → flexión (<130°) → extensión = 1 repetición.
export const createDecelCounter = () => {
  let stage = 'up'
  let reps = 0

  return {
    update(kneeAngle) {
      if (kneeAngle === null) return reps
      if (stage === 'up' && kneeAngle < 130) stage = 'down'
      else if (stage === 'down' && kneeAngle > 160) {
        stage = 'up'
        reps += 1
      }
      return reps
    },
    get reps() { return reps },
    reset() { stage = 'up'; reps = 0 },
  }
}
