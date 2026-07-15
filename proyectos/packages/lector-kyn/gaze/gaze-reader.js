// Lee la mirada con FaceLandmarker y la traduce a coordenadas de pantalla con
// una calibración 2D. Versión vanilla (sin Vue) del composable useGazeReader de
// Motion Lab: mismo loop, misma captura por mediana/anti-parpadeo y suavizado
// adaptativo, pero con callbacks en vez de refs reactivas.
//
// Solo prende la cámara y descarga el modelo al activar; al apagar libera todo
// (privacidad + FPS).
import { createFaceLandmarker } from './mediapipe-face.js'
import {
  readGaze,
  median,
  isBlink,
  updateOpenBaseline,
  build2DMapping,
  mapGaze,
  verticalSpan,
} from './gaze-math.js'

// Cámara (portado de utils/camera.js). Pide 720p ideal sin fallar en cámaras
// que no lo soportan; sin facingMode (en compus con varias cámaras cambiaría
// cuál elige el navegador).
const startCamera = async (videoEl) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  })
  videoEl.srcObject = stream
  await videoEl.play()
  return stream
}
const stopCamera = (stream) => stream?.getTracks().forEach((t) => t.stop())

export const createGazeReader = ({ onGaze, onStatus } = {}) => {
  const state = {
    active: false,
    facePresent: false,
    blinking: false,
    calibrated: false,
    status: '',
    gazeX: null,
    gazeY: null,
  }

  let faceLandmarker = null
  let stream = null
  let video = null
  let raf = null
  let mapping = null

  let smoothedOX = null
  let smoothedOY = null
  let smoothedX = null
  let smoothedY = null
  let openBaseline = null

  // Suavizado adaptativo (estilo 1€): quieto suaviza fuerte para matar el
  // jitter del iris; al cambiar de renglón sube la respuesta para que la regla
  // siga y no se quede pegada.
  const SMOOTH_MIN = 0.12
  const SMOOTH_MAX = 0.6
  const SMOOTH_XY = 0.5
  let offsetSpan = null
  const adaptiveAlpha = (delta) => {
    const span = offsetSpan && offsetSpan > 1e-4 ? offsetSpan : 0.08
    const speed = Math.abs(delta) / (span * 0.12)
    return SMOOTH_MIN + (SMOOTH_MAX - SMOOTH_MIN) * Math.min(1, speed)
  }

  // Captura de calibración: junta offsets buenos (sin parpadeo) por CONTEO de
  // muestras (con tope de tiempo) para funcionar igual en máquinas lentas.
  const CAPTURE_TARGET = 12
  const CAPTURE_MIN = 4
  let collectBuf = null
  let collectResolve = null
  let collectDeadline = 0

  const emitStatus = () => onStatus && onStatus({ ...state })
  const setStatus = (s) => { if (state.status !== s) { state.status = s; emitStatus() } }

  const readFrame = () => {
    if (!video || video.readyState < 2 || !faceLandmarker) return null
    const result = faceLandmarker.detectForVideo(video, performance.now())
    const landmarks = result?.faceLandmarks?.[0]
    if (!landmarks) return null
    return readGaze(landmarks)
  }

  const finishCollect = () => {
    const enough = collectBuf.length >= CAPTURE_MIN
    const value = enough
      ? { oX: median(collectBuf.map((s) => s.oX)), oY: median(collectBuf.map((s) => s.oY)) }
      : null
    collectBuf = null
    const resolve = collectResolve
    collectResolve = null
    resolve(value && Number.isFinite(value.oY) ? value : null)
  }

  const loop = () => {
    if (!state.active) return
    let frame = null
    let changed = false
    try {
      frame = readFrame()
    } catch (error) {
      stop()
      setStatus(`El seguimiento de mirada se detuvo${error?.message ? ` (${error.message})` : ''}.`)
      return
    }

    if (!frame) {
      if (state.facePresent) { state.facePresent = false; changed = true }
    } else {
      if (!state.facePresent) { state.facePresent = true; changed = true }
      openBaseline = updateOpenBaseline(openBaseline, frame.openness)
      const blink = isBlink(frame.openness, openBaseline)
      if (blink !== state.blinking) { state.blinking = blink; changed = true }

      // Con el ojo cerrado la mirada no es fiable: se congela (no se toca gazeY
      // ni el suavizado), así la regla no se cae al parpadear.
      if (!blink && frame.oY !== null && Number.isFinite(frame.oX)) {
        const alpha = smoothedOY === null ? 1 : adaptiveAlpha(frame.oY - smoothedOY)
        smoothedOY = smoothedOY === null ? frame.oY : smoothedOY + (frame.oY - smoothedOY) * alpha
        smoothedOX = smoothedOX === null ? frame.oX : smoothedOX + (frame.oX - smoothedOX) * alpha

        if (collectBuf) collectBuf.push({ oX: frame.oX, oY: frame.oY })

        if (mapping) {
          const { x, y } = mapGaze(smoothedOX, smoothedOY, mapping)
          if (y !== null) {
            smoothedY = smoothedY === null ? y : smoothedY + (y - smoothedY) * SMOOTH_XY
            state.gazeY = smoothedY
          }
          if (x !== null) {
            smoothedX = smoothedX === null ? x : smoothedX + (x - smoothedX) * SMOOTH_XY
            state.gazeX = smoothedX
          }
          if ((x !== null || y !== null) && onGaze) onGaze(state.gazeX, state.gazeY)
        }
      }
    }

    if (collectResolve && (collectBuf.length >= CAPTURE_TARGET || performance.now() >= collectDeadline)) {
      finishCollect()
    }
    if (changed) emitStatus()
    raf = requestAnimationFrame(loop)
  }

  // Junta muestras buenas de mirada y devuelve las medianas {oX, oY} —robusto a
  // cuadros sueltos malos—; null si no juntó el mínimo.
  const capturePoint = (maxMs = 2500) => new Promise((resolve) => {
    if (!state.active) { resolve(null); return }
    collectBuf = []
    collectResolve = resolve
    collectDeadline = performance.now() + maxMs
  })

  const setCalibration = (samples) => {
    mapping = build2DMapping(samples)
    state.calibrated = Boolean(mapping)
    offsetSpan = verticalSpan(mapping)
    smoothedX = null
    smoothedY = null
    emitStatus()
    return state.calibrated
  }

  const clearCalibration = () => {
    mapping = null
    offsetSpan = null
    state.calibrated = false
    state.gazeX = null
    state.gazeY = null
    smoothedX = null
    smoothedY = null
    emitStatus()
  }

  const start = async (videoEl, modelUrl) => {
    video = videoEl
    setStatus('Cargando modelo de cara… (la primera vez tarda unos segundos)')
    try {
      if (!faceLandmarker) faceLandmarker = await createFaceLandmarker(modelUrl)
      stream = await startCamera(video)
      state.active = true
      setStatus('')
      smoothedOX = null
      smoothedOY = null
      openBaseline = null
      loop()
    } catch (error) {
      stop()
      setStatus(
        error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
          ? 'Permiso denegado para acceder a la cámara.'
          : `No se pudo iniciar la cámara${error?.message ? `: ${error.message}` : '.'}`,
      )
    }
  }

  const stop = () => {
    state.active = false
    if (raf) { cancelAnimationFrame(raf); raf = null }
    if (collectResolve) { collectResolve(null); collectResolve = null; collectBuf = null }
    if (stream) { stopCamera(stream); stream = null }
    state.facePresent = false
    state.blinking = false
    state.gazeX = null
    state.gazeY = null
    smoothedOX = null
    smoothedOY = null
    smoothedX = null
    smoothedY = null
    emitStatus()
  }

  const dispose = () => {
    stop()
    try { faceLandmarker?.close() } catch { /* ya inválido */ }
    faceLandmarker = null
  }

  return { state, start, stop, dispose, capturePoint, setCalibration, clearCalibration }
}
