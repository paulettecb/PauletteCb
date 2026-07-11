import { PoseLandmarker } from '@mediapipe/tasks-vision'
import { createLandmarkerWithFallback } from './mediapipeVision'

// Variante "full" y no "lite": lite es el modelo más chico y sus landmarks
// tiemblan y se deforman con movimiento; full es el punto medio calidad/
// velocidad. Para experimentar con "heavy" basta la env var.
const POSE_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_POSE_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'

export const createPoseLandmarker = async () => {
  return createLandmarkerWithFallback(PoseLandmarker, {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_MODEL_URL,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
}
