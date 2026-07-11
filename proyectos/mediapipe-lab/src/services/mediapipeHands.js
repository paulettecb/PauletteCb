import { HandLandmarker } from '@mediapipe/tasks-vision'
import { createLandmarkerWithFallback } from './mediapipeVision'

const HAND_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_HAND_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

export const createHandLandmarker = async () => {
  return createLandmarkerWithFallback(HandLandmarker, {
    baseOptions: {
      modelAssetPath: HAND_LANDMARKER_MODEL_URL,
    },
    runningMode: 'VIDEO',
    numHands: 2,
  })
}
