import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { createFaceLandmarker } from '../services/mediapipeFace'
import { startCamera, stopCamera } from '../utils/camera'
import { averageVerticalGaze, buildGazeMapping, eyeOpenness, isBlink, mapOffsetToY, median, updateOpenBaseline } from '../services/gazeReader'

// Lee la mirada vertical con FaceLandmarker y la traduce a una Y de pantalla
// usando una calibración de 3 puntos. Solo prende la cámara y descarga el
// modelo cuando se activa; al apagar libera todo (privacidad + FPS).
export const useGazeReader = () => {
  const faceLandmarker = shallowRef(null)
  const stream = shallowRef(null)
  const active = ref(false)
  const facePresent = ref(false)
  const blinking = ref(false)
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

  // Nivel "abierto" aprendido en vivo para detectar parpadeos (ver gazeReader).
  let openBaseline = null

  // Búfer de captura de calibración: se llena de offsets buenos (sin
  // parpadeo) mientras collectResolve esté armado. Se junta por CONTEO de
  // muestras (con tope de tiempo) para funcionar igual en máquinas lentas
  // —pocos fps— que rápidas.
  const CAPTURE_TARGET = 12 // muestras buenas ideales
  const CAPTURE_MIN = 4 // mínimo aceptable
  let collectBuf = null
  let collectResolve = null
  let collectDeadline = 0

  const readFrame = () => {
    if (!video || video.readyState < 2 || !faceLandmarker.value) return null
    const result = faceLandmarker.value.detectForVideo(video, performance.now())
    const landmarks = result?.faceLandmarks?.[0]
    if (!landmarks) return null
    return { offset: averageVerticalGaze(landmarks), openness: eyeOpenness(landmarks) }
  }

  const finishCollect = () => {
    const enough = collectBuf.length >= CAPTURE_MIN
    const value = median(collectBuf)
    collectBuf = null
    const resolve = collectResolve
    collectResolve = null
    resolve(enough ? value : null)
  }

  const loop = () => {
    if (!active.value) return

    let frame = null
    try {
      frame = readFrame()
    } catch (error) {
      stop()
      status.value = `El seguimiento de mirada se detuvo${error?.message ? ` (${error.message})` : ''}.`
      return
    }

    if (!frame) {
      facePresent.value = false
    } else {
      facePresent.value = true
      openBaseline = updateOpenBaseline(openBaseline, frame.openness)
      blinking.value = isBlink(frame.openness, openBaseline)

      // Con el ojo cerrado la mirada no es fiable: se congela (no se toca
      // gazeY ni el suavizado), así la regla no se cae al parpadear.
      if (!blinking.value && frame.offset !== null) {
        smoothedOffset = smoothedOffset === null
          ? frame.offset
          : smoothedOffset + (frame.offset - smoothedOffset) * SMOOTH_OFFSET

        if (collectBuf) collectBuf.push(frame.offset)

        if (mapping) {
          const y = mapOffsetToY(smoothedOffset, mapping)
          if (y !== null) {
            smoothedY = smoothedY === null ? y : smoothedY + (y - smoothedY) * SMOOTH_Y
            gazeY.value = smoothedY
          }
        }
      }
    }

    // Cierra la captura al juntar suficientes muestras, o por tope de tiempo
    // aunque falten (p. ej. si parpadeó mucho): finishCollect decide si
    // alcanzó el mínimo.
    if (collectResolve && (collectBuf.length >= CAPTURE_TARGET || performance.now() >= collectDeadline)) {
      finishCollect()
    }

    raf = requestAnimationFrame(loop)
  }

  // Calibración: junta offsets buenos (sin parpadeo) y devuelve la mediana
  // —robusta a cuadros sueltos malos—; null si no juntó el mínimo. Termina al
  // llegar a CAPTURE_TARGET muestras o al vencer el tope de tiempo.
  const capturePoint = (maxMs = 2500) => new Promise((resolve) => {
    if (!active.value) { resolve(null); return }
    collectBuf = []
    collectResolve = resolve
    collectDeadline = performance.now() + maxMs
  })

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
      openBaseline = null
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
    if (collectResolve) {
      collectResolve(null)
      collectResolve = null
      collectBuf = null
    }
    if (stream.value) {
      stopCamera(stream.value)
      stream.value = null
    }
    facePresent.value = false
    blinking.value = false
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
    blinking,
    calibrated,
    facePresent,
    gazeY,
    status,
    start,
    stop,
    capturePoint,
    setCalibration,
    clearCalibration,
  }
}
