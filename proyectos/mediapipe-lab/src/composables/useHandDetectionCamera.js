import { computed, onUnmounted, ref } from 'vue'
import { createHandLandmarker } from '../services/mediapipeHands'
import { startCamera, stopCamera } from '../utils/camera'
import { drawLandmarks } from '../utils/drawLandmarks'

export const useHandDetectionCamera = () => {
  const cameraActive = ref(false)
  const cameraStatus = ref('')
  const cameraStream = ref(null)
  const handLandmarker = ref(null)
  const handResults = ref(null)
  const videoRef = ref(null)
  const canvasRef = ref(null)
  let animationFrameId = null

  const detectedHandsCount = computed(() => handResults.value?.landmarks?.length || 0)
  const handDetectionStatus = computed(() => {
    if (!cameraActive.value) {
      return ''
    }

    if (!handResults.value) {
      return 'Detectando manos...'
    }

    if (detectedHandsCount.value === 0) {
      return 'No se detectan manos'
    }

    return `${detectedHandsCount.value} ${detectedHandsCount.value === 1 ? 'mano detectada' : 'manos detectadas'}`
  })

  const detectHands = () => {
    if (!cameraActive.value || !handLandmarker.value || !videoRef.value) {
      return
    }

    handResults.value = handLandmarker.value.detectForVideo(videoRef.value, performance.now())
    drawLandmarks(canvasRef.value, videoRef.value, handResults.value)
    animationFrameId = requestAnimationFrame(detectHands)
  }

  const stopHandDetection = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    handResults.value = null

    if (canvasRef.value) {
      const context = canvasRef.value.getContext('2d')
      context?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    }
  }

  const stop = () => {
    stopHandDetection()
    cameraActive.value = false

    if (cameraStream.value) {
      stopCamera(cameraStream.value)
      cameraStream.value = null
    }
  }

  const start = async (activeStatus = 'Cámara encendida.') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraStatus.value = 'Navegador sin soporte para cámara.'
      return
    }

    stop()

    try {
      cameraStream.value = await startCamera(videoRef.value)
      cameraActive.value = true
      cameraStatus.value = activeStatus
      handLandmarker.value ||= await createHandLandmarker()
      detectHands()
    } catch (error) {
      stop()

      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        cameraStatus.value = 'Permiso denegado para acceder a la cámara.'
      } else {
        cameraStatus.value = 'No se pudo encender la cámara.'
      }
    }
  }

  onUnmounted(() => {
    stop()

    if (handLandmarker.value) {
      handLandmarker.value.close()
    }
  })

  return {
    cameraActive,
    cameraStatus,
    detectedHandsCount,
    handDetectionStatus,
    handResults,
    start,
    stop,
    canvasRef,
    videoRef,
  }
}
