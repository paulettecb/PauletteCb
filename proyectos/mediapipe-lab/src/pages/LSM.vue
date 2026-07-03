<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a href="#/" class="back-btn">← Back</a>
      <h1>🤟 LSM - Mexican Sign Language</h1>
      <p class="subtitle">Lengua de Señas Mexicana Practice</p>
    </header>

    <main class="experiment-main">
      <section class="info-section">
        <h2>Welcome to LSM Lab</h2>
        <p>This section is dedicated to learning and practicing Mexican Sign Language through pose detection and real-time visual feedback.</p>

        <div class="features-grid">
          <div class="feature">
            <span class="feature-icon">📹</span>
            <h3>Real-time Detection</h3>
            <p>Pose detection powered by MediaPipe</p>
          </div>
          <div class="feature">
            <span class="feature-icon">✋</span>
            <h3>Hand Tracking</h3>
            <p>Finger and palm tracking</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🎯</span>
            <h3>Feedback</h3>
            <p>Visual feedback and guidance</p>
          </div>
          <div class="feature">
            <span class="feature-icon">📊</span>
            <h3>Analytics</h3>
            <p>Track your progress</p>
          </div>
        </div>

        <button class="btn btn-primary" @click="startCamera">
          🎥 Start Camera
        </button>

        <div class="camera-section">
          <video ref="videoRef" class="camera-preview" autoplay playsinline muted v-show="cameraActive"></video>
          <p v-if="cameraStatus" class="status">{{ cameraStatus }}</p>
          <p v-if="handDetectionStatus" class="status">{{ handDetectionStatus }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { createHandLandmarker } from '../services/mediapipeHands'
import { startCamera as startCameraStream, stopCamera } from '../utils/camera'

const cameraActive = ref(false)
const cameraStatus = ref('')
const cameraStream = ref(null)
const handLandmarker = ref(null)
const handResults = ref(null)
const videoRef = ref(null)
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
  animationFrameId = requestAnimationFrame(detectHands)
}

const stopHandDetection = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  handResults.value = null
}

const startCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraStatus.value = 'Navegador sin soporte para cámara.'
    return
  }

  stopHandDetection()

  try {
    if (cameraStream.value) {
      stopCamera(cameraStream.value)
    }

    cameraStream.value = await startCameraStream(videoRef.value)
    cameraActive.value = true
    cameraStatus.value = 'Cámara encendida.'
    handLandmarker.value ||= await createHandLandmarker()
    detectHands()
  } catch (error) {
    stopHandDetection()
    cameraActive.value = false

    if (cameraStream.value) {
      stopCamera(cameraStream.value)
      cameraStream.value = null
    }

    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      cameraStatus.value = 'Permiso denegado para acceder a la cámara.'
    } else {
      cameraStatus.value = 'No se pudo encender la cámara.'
    }
  }
}

onUnmounted(() => {
  stopHandDetection()

  if (handLandmarker.value) {
    handLandmarker.value.close()
  }

  if (cameraStream.value) {
    stopCamera(cameraStream.value)
  }
})
</script>
