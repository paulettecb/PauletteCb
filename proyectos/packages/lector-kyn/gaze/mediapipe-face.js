// Carga FaceLandmarker de MediaPipe en contexto ESM vanilla (sin bundler).
//
// El runtime WASM viaja VENDORIZADO junto al package (vendor/wasm/…), resuelto
// vía import.meta.url — nunca de un CDN. Motivo (documentado en Motion Lab): si
// el JS y el WASM son de versiones distintas, el runtime ignora runningMode y
// los detectores arrancan en modo imagen → la cámara truena con "Task is not
// initialized with video mode". El script scripts/vendor-lector-kyn.mjs copia
// ambos del MISMO node_modules para que no se desalineen.
//
// El MODELO .task sí se baja del CDN de Google en runtime (configurable), para
// no meter ~3.8 MB al repo. El bundle JS de MediaPipe se importa perezosamente:
// solo se descarga cuando de verdad se prende la mirada.

export const DEFAULT_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

// El fileset acepta {wasmLoaderPath, wasmBinaryPath} directo (mismo patrón que
// services/mediapipeVision.js del componente Vue).
const visionFileset = {
  wasmLoaderPath: new URL('../vendor/wasm/vision_wasm_internal.js', import.meta.url).href,
  wasmBinaryPath: new URL('../vendor/wasm/vision_wasm_internal.wasm', import.meta.url).href,
}

let FaceLandmarkerClass = null
const loadFaceLandmarker = async () => {
  if (!FaceLandmarkerClass) {
    const mod = await import(new URL('../vendor/vision_bundle.mjs', import.meta.url).href)
    FaceLandmarkerClass = mod.FaceLandmarker
  }
  return FaceLandmarkerClass
}

const GPU_INIT_TIMEOUT_MS = 10000

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} no respondió en ${ms} ms`)), ms)
  }),
])

// Algunas GPUs "crean" el detector pero truenan en la primera inferencia (o se
// cuelgan sin lanzar error). Se prueba con un frame sintético para que esas
// GPUs caigan a CPU aquí y no a media sesión.
const warmUp = (landmarker) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  canvas.getContext('2d').fillRect(0, 0, 64, 64)
  landmarker.detectForVideo(canvas, performance.now())
}

// Intenta GPU (WebGL, varias veces más rápido); si falla o se cuelga, recae a
// CPU. Mismo patrón que createLandmarkerWithFallback de Motion Lab.
const createWithFallback = async (FaceLandmarker, options) => {
  let gpu = null
  try {
    gpu = await withTimeout(
      FaceLandmarker.createFromOptions(visionFileset, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: 'GPU' },
      }),
      GPU_INIT_TIMEOUT_MS,
      'La inicialización GPU de MediaPipe',
    )
    warmUp(gpu)
    return gpu
  } catch (error) {
    console.warn('Lector KYN: GPU no disponible/estable para MediaPipe, usando CPU.', error)
    try { gpu?.close() } catch { /* ya inválido */ }
    return FaceLandmarker.createFromOptions(visionFileset, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: 'CPU' },
    })
  }
}

export const createFaceLandmarker = async (modelUrl = DEFAULT_MODEL_URL) => {
  const FaceLandmarker = await loadFaceLandmarker()
  return createWithFallback(FaceLandmarker, {
    baseOptions: { modelAssetPath: modelUrl },
    runningMode: 'VIDEO',
    numFaces: 1,
  })
}
