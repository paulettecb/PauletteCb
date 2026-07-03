import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const VISION_TASKS_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm'
const HAND_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_HAND_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

export const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(VISION_TASKS_WASM_URL)

  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_LANDMARKER_MODEL_URL,
    },
    runningMode: 'VIDEO',
    numHands: 2,
  })
}
