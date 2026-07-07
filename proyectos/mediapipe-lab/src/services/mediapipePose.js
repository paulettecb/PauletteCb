import { PoseLandmarker } from '@mediapipe/tasks-vision'
import { visionFileset } from './mediapipeVision'

const POSE_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_POSE_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export const createPoseLandmarker = async () => {
  return PoseLandmarker.createFromOptions(visionFileset, {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_MODEL_URL,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
}
