import { computed, onUnmounted, ref, shallowRef } from 'vue'
import { createHandLandmarker } from '../services/mediapipeHands'
import { createPoseLandmarker } from '../services/mediapipePose'
import { startCamera, stopCamera } from '../utils/camera'
import { drawLandmarks } from '../utils/drawLandmarks'

export const useMediaPipeTrackingCamera = ({ hands = true, pose = true } = {}) => {
  const cameraActive = ref(false)
  const cameraStatus = ref('')
  const cameraStream = shallowRef(null)
  // shallowRef obligatorio: un ref() normal envuelve el landmarker en un Proxy
  // reactivo profundo que rompe el estado interno de MediaPipe — detectForVideo
  // falla con "Task is not initialized with video mode".
  const handLandmarker = shallowRef(null)
  const poseLandmarker = shallowRef(null)
  const handResults = shallowRef(null)
  const poseResults = shallowRef(null)
  const approximateFps = ref(0)
  const videoRef = ref(null)
  const canvasRef = ref(null)
  let animationFrameId = null
  let lastFrameTime = 0

  const detectedHandsCount = computed(() => handResults.value?.landmarks?.length || 0)
  const poseDetected = computed(() => Boolean(poseResults.value?.landmarks?.length))
  const trackingStatus = computed(() => {
    if (!cameraActive.value) return ''

    const parts = []
    if (hands) {
      parts.push(detectedHandsCount.value === 0
        ? 'sin manos'
        : `${detectedHandsCount.value} ${detectedHandsCount.value === 1 ? 'mano' : 'manos'}`)
    }
    if (pose) {
      parts.push(poseDetected.value ? 'cuerpo detectado' : 'sin cuerpo')
    }

    return parts.length ? `Landmarks: ${parts.join(' · ')}` : 'Cámara activa.'
  })

  const detect = () => {
    if (!cameraActive.value || !videoRef.value) return

    const now = performance.now()
    if (lastFrameTime) {
      const instantFps = 1000 / (now - lastFrameTime)
      approximateFps.value = Math.round(approximateFps.value ? (approximateFps.value * 0.85) + (instantFps * 0.15) : instantFps)
    }
    lastFrameTime = now

    handResults.value = hands && handLandmarker.value
      ? handLandmarker.value.detectForVideo(videoRef.value, now)
      : null
    poseResults.value = pose && poseLandmarker.value
      ? poseLandmarker.value.detectForVideo(videoRef.value, now)
      : null

    drawLandmarks(canvasRef.value, videoRef.value, {
      hands: handResults.value,
      pose: poseResults.value,
    })
    animationFrameId = requestAnimationFrame(detect)
  }

  const clearTracking = () => {
    handResults.value = null
    poseResults.value = null
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

  const start = async (activeStatus = 'Cámara encendida con landmarks de cuerpo y manos.') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraStatus.value = 'Navegador sin soporte para cámara.'
      return
    }

    stop()

    try {
      cameraStatus.value = 'Cargando modelos de MediaPipe...'
      const modelPromises = []
      if (hands && !handLandmarker.value) modelPromises.push(createHandLandmarker().then((model) => { handLandmarker.value = model }))
      if (pose && !poseLandmarker.value) modelPromises.push(createPoseLandmarker().then((model) => { poseLandmarker.value = model }))
      await Promise.all(modelPromises)

      cameraStream.value = await startCamera(videoRef.value)
      cameraActive.value = true
      cameraStatus.value = activeStatus
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
  })

  return {
    approximateFps,
    cameraActive,
    cameraStatus,
    detectedHandsCount,
    handResults,
    poseDetected,
    poseResults,
    start,
    stop,
    trackingStatus,
    canvasRef,
    videoRef,
  }
}
