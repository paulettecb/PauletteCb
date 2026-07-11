import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { createFaceLandmarker } from '../services/mediapipeFace'
import { startCamera, stopCamera } from '../utils/camera'
import { averageVerticalGaze, buildGazeMapping, mapOffsetToY } from '../services/gazeReader'

// Lee la mirada vertical con FaceLandmarker y la traduce a una Y de pantalla
// usando una calibración de 3 puntos. Solo prende la cámara y descarga el
// modelo cuando se activa; al apagar libera todo (privacidad + FPS).
export const useGazeReader = () => {
  const faceLandmarker = shallowRef(null)
  const stream = shallowRef(null)
  const active = ref(false)
  const facePresent = ref(false)
  const status = ref('')
  const gazeY = ref(null)
  const calibrated = ref(false)

  let video = null
  let raf = null
  let mapping = null
  let smoothedOffset = null
  let smoothedY = null

  // La mirada tiembla; se suaviza fuerte para que la regla planee, no salte.
  const SMOOTH_OFFSET = 0.3
  const SMOOTH_Y = 0.16

  const readOffset = () => {
    if (!video || video.readyState < 2 || !faceLandmarker.value) return null
    const result = faceLandmarker.value.detectForVideo(video, performance.now())
    const landmarks = result?.faceLandmarks?.[0]
    if (!landmarks) {
      facePresent.value = false
      return null
    }
    facePresent.value = true
    return averageVerticalGaze(landmarks)
  }

  const loop = () => {
    if (!active.value) return

    let offset = null
    try {
      offset = readOffset()
    } catch (error) {
      stop()
      status.value = `El seguimiento de mirada se detuvo${error?.message ? ` (${error.message})` : ''}.`
      return
    }

    if (offset !== null) {
      smoothedOffset = smoothedOffset === null
        ? offset
        : smoothedOffset + (offset - smoothedOffset) * SMOOTH_OFFSET

      if (mapping) {
        const y = mapOffsetToY(smoothedOffset, mapping)
        if (y !== null) {
          smoothedY = smoothedY === null ? y : smoothedY + (y - smoothedY) * SMOOTH_Y
          gazeY.value = smoothedY
        }
      }
    }

    raf = requestAnimationFrame(loop)
  }

  // La calibración captura el offset suavizado tras un momento mirando el
  // punto — devuelve null si aún no hay cara.
  const currentOffset = () => smoothedOffset

  const setCalibration = (samples) => {
    mapping = buildGazeMapping(samples)
    calibrated.value = Boolean(mapping)
    smoothedY = null
    return calibrated.value
  }

  const clearCalibration = () => {
    mapping = null
    calibrated.value = false
    gazeY.value = null
    smoothedY = null
  }

  const start = async (videoEl) => {
    video = videoEl
    status.value = 'Cargando modelo de cara... (la primera vez tarda unos segundos)'
    try {
      if (!faceLandmarker.value) faceLandmarker.value = await createFaceLandmarker()
      stream.value = await startCamera(video)
      active.value = true
      status.value = ''
      smoothedOffset = null
      loop()
    } catch (error) {
      stop()
      status.value = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
        ? 'Permiso denegado para acceder a la cámara.'
        : `No se pudo iniciar la cámara${error?.message ? `: ${error.message}` : '.'}`
    }
  }

  const stop = () => {
    active.value = false
    if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
    if (stream.value) {
      stopCamera(stream.value)
      stream.value = null
    }
    facePresent.value = false
    gazeY.value = null
    smoothedOffset = null
    smoothedY = null
  }

  onBeforeUnmount(() => {
    stop()
    faceLandmarker.value?.close()
  })

  return {
    active,
    calibrated,
    facePresent,
    gazeY,
    status,
    start,
    stop,
    currentOffset,
    setCalibration,
    clearCalibration,
  }
}
