import { computed, onUnmounted, reactive, ref, shallowRef, watch } from 'vue'
import { createFaceLandmarker } from '../services/mediapipeFace'
import { createHandLandmarker } from '../services/mediapipeHands'
import { createPoseLandmarker } from '../services/mediapipePose'
import { startCamera, stopCamera } from '../utils/camera'
import { DEFAULT_DISPLAY, drawLandmarks } from '../utils/drawLandmarks'

export const useMediaPipeTrackingCamera = ({ hands = true, pose = true, face = false } = {}) => {
  const cameraActive = ref(false)
  const cameraStatus = ref('')
  const cameraStream = shallowRef(null)
  // shallowRef obligatorio: un ref() normal envuelve el landmarker en un Proxy
  // reactivo profundo que rompe el estado interno de MediaPipe — detectForVideo
  // falla con "Task is not initialized with video mode".
  const handLandmarker = shallowRef(null)
  const poseLandmarker = shallowRef(null)
  const faceLandmarker = shallowRef(null)
  const handResults = shallowRef(null)
  const poseResults = shallowRef(null)
  const faceResults = shallowRef(null)
  const approximateFps = ref(0)
  const videoRef = ref(null)
  const canvasRef = ref(null)
  let animationFrameId = null
  let lastFrameTime = 0

  // Capas en vivo: apagar una deja de correr su detector (recupera FPS) y su
  // modelo no se descarga hasta la primera vez que se prende. Solo tienen
  // efecto las capacidades que la página pidió (hands/pose/face).
  const layers = reactive({ hands, pose, face })
  // Sub-capas de dibujo (zonas del esqueleto, malla/rasgos/iris de la cara,
  // modo explicación) — ver DEFAULT_DISPLAY en drawLandmarks.js.
  const display = reactive({ ...DEFAULT_DISPLAY })

  const detectedHandsCount = computed(() => handResults.value?.landmarks?.length || 0)
  const poseDetected = computed(() => Boolean(poseResults.value?.landmarks?.length))
  const faceDetected = computed(() => Boolean(faceResults.value?.faceLandmarks?.length))
  const trackingStatus = computed(() => {
    if (!cameraActive.value) return ''

    const parts = []
    if (hands && layers.hands) {
      parts.push(detectedHandsCount.value === 0
        ? 'sin manos'
        : `${detectedHandsCount.value} ${detectedHandsCount.value === 1 ? 'mano' : 'manos'}`)
    }
    if (pose && layers.pose) {
      parts.push(poseDetected.value ? 'cuerpo detectado' : 'sin cuerpo')
    }
    if (face && layers.face) {
      parts.push(faceDetected.value ? 'cara detectada' : 'sin cara')
    }

    return parts.length ? `Landmarks: ${parts.join(' · ')}` : 'Cámara activa (todas las capas apagadas).'
  })

  // Una promesa en vuelo por modelo para que dos toggles rápidos no lo
  // descarguen doble.
  const modelLoads = { hands: null, pose: null, face: null }
  const ensureModel = (key, enabled, target, create) => {
    if (!enabled || target.value) return null
    if (!modelLoads[key]) {
      modelLoads[key] = create()
        .then((model) => { target.value = model })
        .finally(() => { modelLoads[key] = null })
    }
    return modelLoads[key]
  }
  const loadMissingModels = () => Promise.all([
    ensureModel('hands', hands && layers.hands, handLandmarker, createHandLandmarker),
    ensureModel('pose', pose && layers.pose, poseLandmarker, createPoseLandmarker),
    ensureModel('face', face && layers.face, faceLandmarker, createFaceLandmarker),
  ])

  watch(layers, async () => {
    if (!cameraActive.value) return
    const needsLoad = (hands && layers.hands && !handLandmarker.value)
      || (pose && layers.pose && !poseLandmarker.value)
      || (face && layers.face && !faceLandmarker.value)
    if (!needsLoad) return

    const previousStatus = cameraStatus.value
    cameraStatus.value = 'Cargando el modelo de la capa que prendiste...'
    try {
      await loadMissingModels()
      cameraStatus.value = previousStatus
    } catch (error) {
      cameraStatus.value = `No se pudo cargar el modelo${error?.message ? `: ${error.message}` : '.'}`
    }
  })

  const detect = () => {
    if (!cameraActive.value || !videoRef.value) return

    // detectForVideo truena si el video aún no tiene dimensiones (metadata
    // sin cargar justo después de play()).
    if (videoRef.value.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      animationFrameId = requestAnimationFrame(detect)
      return
    }

    const now = performance.now()
    if (lastFrameTime) {
      const instantFps = 1000 / (now - lastFrameTime)
      approximateFps.value = Math.round(approximateFps.value ? (approximateFps.value * 0.85) + (instantFps * 0.15) : instantFps)
    }
    lastFrameTime = now

    try {
      handResults.value = hands && layers.hands && handLandmarker.value
        ? handLandmarker.value.detectForVideo(videoRef.value, now)
        : null
      poseResults.value = pose && layers.pose && poseLandmarker.value
        ? poseLandmarker.value.detectForVideo(videoRef.value, now)
        : null
      faceResults.value = face && layers.face && faceLandmarker.value
        ? faceLandmarker.value.detectForVideo(videoRef.value, now)
        : null
    } catch (error) {
      // Sin esto, un error de MediaPipe a media sesión (p. ej. contexto GPU
      // perdido) mata el loop en silencio y todo se ve congelado.
      stop()
      cameraStatus.value = `El tracking se detuvo por un error de MediaPipe${error?.message ? ` (${error.message})` : ''}. Enciende la cámara de nuevo.`
      return
    }

    drawLandmarks(canvasRef.value, videoRef.value, {
      hands: handResults.value,
      pose: poseResults.value,
      face: faceResults.value,
    }, display)
    animationFrameId = requestAnimationFrame(detect)
  }

  const clearTracking = () => {
    handResults.value = null
    poseResults.value = null
    faceResults.value = null
    approximateFps.value = 0
    lastFrameTime = 0

    if (canvasRef.value) {
      const context = canvasRef.value.getContext('2d')
      context?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    }
  }

  const stop = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    cameraActive.value = false
    clearTracking()

    if (cameraStream.value) {
      stopCamera(cameraStream.value)
      cameraStream.value = null
    }
  }

  const start = async (activeStatus) => {
    // Algunos botones llaman start directo (@click="startCamera") y Vue les
    // pasa el evento de click: sin este filtro el status muestra
    // "[object PointerEvent]".
    const statusText = typeof activeStatus === 'string'
      ? activeStatus
      : 'Cámara encendida con landmarks de cuerpo y manos.'

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraStatus.value = 'Navegador sin soporte para cámara.'
      return
    }

    stop()

    try {
      cameraStatus.value = 'Cargando modelos de MediaPipe... (la primera vez tarda unos segundos)'
      await loadMissingModels()

      cameraStream.value = await startCamera(videoRef.value)
      cameraActive.value = true
      cameraStatus.value = statusText
      detect()
    } catch (error) {
      stop()
      cameraStatus.value = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
        ? 'Permiso denegado para acceder a la cámara.'
        : `No se pudo iniciar MediaPipe o la cámara${error?.message ? `: ${error.message}` : '.'}`
    }
  }

  onUnmounted(() => {
    stop()
    handLandmarker.value?.close()
    poseLandmarker.value?.close()
    faceLandmarker.value?.close()
  })

  return {
    approximateFps,
    cameraActive,
    cameraStatus,
    detectedHandsCount,
    display,
    faceDetected,
    faceResults,
    handResults,
    layers,
    poseDetected,
    poseResults,
    start,
    stop,
    trackingStatus,
    canvasRef,
    videoRef,
  }
}
