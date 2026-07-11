import { PoseLandmarker } from '@mediapipe/tasks-vision'
import { createLandmarkerWithFallback } from './mediapipeVision'

// Variante "full" y no "lite": lite es el modelo más chico y sus landmarks
// tiemblan y se deforman con movimiento; full es el punto medio calidad/
// velocidad. Para experimentar con "heavy" basta la env var.
const POSE_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_POSE_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'

// En CPU el modelo full es 2-3x más lento que lite; las máquinas que caen al
// fallback son justo las que no lo aguantan, así que ahí se queda lite.
const POSE_LANDMARKER_LITE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export const createPoseLandmarker = async () => {
  const baseOptions = { runningMode: 'VIDEO', numPoses: 1 }
  return createLandmarkerWithFallback(
    PoseLandmarker,
    { ...baseOptions, baseOptions: { modelAssetPath: POSE_LANDMARKER_MODEL_URL } },
    { ...baseOptions, baseOptions: { modelAssetPath: POSE_LANDMARKER_LITE_MODEL_URL } },
  )
}
