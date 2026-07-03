import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

const VISION_TASKS_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm'
const POSE_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_POSE_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(VISION_TASKS_WASM_URL)

  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_LANDMARKER_MODEL_URL,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
}
