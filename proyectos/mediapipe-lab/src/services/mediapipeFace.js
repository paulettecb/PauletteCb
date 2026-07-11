import { FaceLandmarker } from '@mediapipe/tasks-vision'
import { createLandmarkerWithFallback } from './mediapipeVision'

const FACE_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_FACE_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

export const createFaceLandmarker = async () => {
  return createLandmarkerWithFallback(FaceLandmarker, {
    baseOptions: {
      modelAssetPath: FACE_LANDMARKER_MODEL_URL,
    },
    runningMode: 'VIDEO',
    numFaces: 1,
  })
}
