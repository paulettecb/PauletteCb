import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { createFaceLandmarker } from '../services/mediapipeFace'
import { startCamera, stopCamera } from '../utils/camera'
import { averageVerticalGaze, buildGazeMapping, eyeOpenness, isBlink, mapOffsetToY, median, updateOpenBaseline } from '../services/gazeReader'

// Lee la mirada vertical con FaceLandmarker y la traduce a una Y de pantalla
// usando una calibración de varios puntos. Solo prende la cámara y descarga el
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

  // Suavizado adaptativo (estilo 1€): quieto suaviza fuerte para matar el
  // jitter del iris; cuando de verdad cambias de renglón sube la respuesta
  // para que la regla te siga y no se quede pegada. Antes era un factor fijo
  // pesado (0.16) y por eso los movimientos chicos "no movían nada".
  const SMOOTH_MIN = 0.12
  const SMOOTH_MAX = 0.6
  const SMOOTH_Y = 0.5

  // Rango de offset (arriba↔abajo) que capturó tu calibración; el alpha se
  // escala con él para saber qué tan grande es "un movimiento real" en TUS
  // ojos (span * 0.12 ≈ "un renglón").
  let offsetSpan = null
  const adaptiveAlpha = (delta) => {
    const span = offsetSpan && offsetSpan > 1e-4 ? offsetSpan : 0.08
    const speed = Math.abs(delta) / (span * 0.12)
    return SMOOTH_MIN + (SMOOTH_MAX - SMOOTH_MIN) * Math.min(1, speed)
  }

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
        const alpha = smoothedOffset === null ? 1 : adaptiveAlpha(frame.offset - smoothedOffset)
        smoothedOffset = smoothedOffset === null
          ? frame.offset
          : smoothedOffset + (frame.offset - smoothedOffset) * alpha

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
    // El rango calibrado alimenta el suavizado adaptativo (ver adaptiveAlpha).
    offsetSpan = mapping ? mapping[mapping.length - 1].offset - mapping[0].offset : null
    smoothedY = null
    return calibrated.value
  }

  const clearCalibration = () => {
    mapping = null
    offsetSpan = null
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
