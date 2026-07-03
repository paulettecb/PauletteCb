<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a
        href="#/"
        class="back-btn"
      >← Back</a>
      <h1>🏃 EXERCISE - Human Movement Analysis</h1>
      <p class="subtitle">
        Posture & Exercise Form Tracking
      </p>
    </header>

    <main class="experiment-main">
      <section class="info-section">
        <h2>Exercise Form Analyzer</h2>
        <p>Track human exercise form, posture, and movement patterns with precision MediaPipe tracking.</p>

        <div class="features-grid">
          <div class="feature">
            <span class="feature-icon">💪</span>
            <h3>Form Analysis</h3>
            <p>Verify correct exercise form</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🧍</span>
            <h3>Posture Check</h3>
            <p>Monitor body alignment</p>
          </div>
          <div class="feature">
            <span class="feature-icon">📊</span>
            <h3>Range of Motion</h3>
            <p>Track joint angles and mobility</p>
          </div>
          <div class="feature">
            <span class="feature-icon">⏱️</span>
            <h3>Rep Counter</h3>
            <p>Automatic exercise counting</p>
          </div>
        </div>

        <button
          class="btn btn-primary"
          @click="startAnalysis"
        >
          🎥 Start Analysis
        </button>

        <div class="analysis-section">
          <div
            class="camera-stage"
            :class="{ 'is-active': analysisActive, 'is-inactive': !analysisActive }"
          >
            <video
              ref="videoRef"
              class="camera-preview"
              autoplay
              playsinline
              muted
            />
            <canvas
              ref="canvasRef"
              class="landmarks-canvas"
              aria-label="Pose landmarks overlay"
            />
          </div>

          <p class="status">
            {{ analysisStatus }}
          </p>

          <div
            class="metrics-grid"
            aria-live="polite"
          >
            <div class="metric-card">
              <span class="metric-label">Shoulders visible</span>
              <strong>{{ visibilityLabel(metrics.shouldersVisible) }}</strong>
            </div>
            <div class="metric-card">
              <span class="metric-label">Hips visible</span>
              <strong>{{ visibilityLabel(metrics.hipsVisible) }}</strong>
            </div>
            <div class="metric-card">
              <span class="metric-label">Knees visible</span>
              <strong>{{ visibilityLabel(metrics.kneesVisible) }}</strong>
            </div>
            <div class="metric-card">
              <span class="metric-label">Overall status</span>
              <strong>{{ poseDetected ? 'Pose detected' : 'No pose detected' }}</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onUnmounted, reactive, ref } from 'vue'
import { createPoseLandmarker } from '../services/mediapipePose'
import { startCamera, stopCamera } from '../utils/camera'

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [24, 26], [26, 28], [27, 29], [29, 31], [28, 30], [30, 32],
]
const REQUIRED_VISIBILITY = 0.5

const analysisActive = ref(false)
const analysisStatus = ref('Exercise analysis active. Real-time feedback coming soon...')
const cameraStream = ref(null)
const poseLandmarker = ref(null)
const poseDetected = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)
const metrics = reactive({
  shouldersVisible: false,
  hipsVisible: false,
  kneesVisible: false,
})
let animationFrameId = null

const visibilityLabel = (isVisible) => (isVisible ? 'Yes' : 'No')

const isVisible = (landmark) => Boolean(landmark && (landmark.visibility ?? 1) >= REQUIRED_VISIBILITY)
const areVisible = (landmarks, indexes) => indexes.every((index) => isVisible(landmarks[index]))

const syncCanvasSize = (canvas, video) => {
  const width = video.videoWidth || video.clientWidth || 0
  const height = video.videoHeight || video.clientHeight || 0

  if (canvas.width !== width) {
    canvas.width = width
  }

  if (canvas.height !== height) {
    canvas.height = height
  }

  return { width, height }
}

const drawPoseLandmarks = (results) => {
  const canvas = canvasRef.value
  const video = videoRef.value

  if (!canvas || !video) {
    return
  }

  const context = canvas.getContext('2d')
  const { width, height } = syncCanvasSize(canvas, video)

  if (!context || !width || !height) {
    return
  }

  context.clearRect(0, 0, width, height)
  const poses = results?.landmarks || []

  context.save()
  context.lineWidth = 4
  context.strokeStyle = '#E85DA0'
  context.fillStyle = '#8795D2'

  poses.forEach((landmarks) => {
    POSE_CONNECTIONS.forEach(([fromIndex, toIndex]) => {
      const from = landmarks[fromIndex]
      const to = landmarks[toIndex]

      if (!isVisible(from) || !isVisible(to)) {
        return
      }

      context.beginPath()
      context.moveTo(from.x * width, from.y * height)
      context.lineTo(to.x * width, to.y * height)
      context.stroke()
    })

    landmarks.forEach((landmark) => {
      if (!isVisible(landmark)) {
        return
      }

      context.beginPath()
      context.arc(landmark.x * width, landmark.y * height, 5, 0, Math.PI * 2)
      context.fill()
    })
  })

  context.restore()
}

const updateMetrics = (results) => {
  const landmarks = results?.landmarks?.[0]
  poseDetected.value = Boolean(landmarks)
  metrics.shouldersVisible = Boolean(landmarks && areVisible(landmarks, [11, 12]))
  metrics.hipsVisible = Boolean(landmarks && areVisible(landmarks, [23, 24]))
  metrics.kneesVisible = Boolean(landmarks && areVisible(landmarks, [25, 26]))
}

const detectPose = () => {
  if (!analysisActive.value || !poseLandmarker.value || !videoRef.value) {
    return
  }

  const results = poseLandmarker.value.detectForVideo(videoRef.value, performance.now())
  updateMetrics(results)
  drawPoseLandmarks(results)
  animationFrameId = requestAnimationFrame(detectPose)
}

const clearAnalysis = () => {
  poseDetected.value = false
  metrics.shouldersVisible = false
  metrics.hipsVisible = false
  metrics.kneesVisible = false

  if (canvasRef.value) {
    const context = canvasRef.value.getContext('2d')
    context?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

const stopAnalysis = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  analysisActive.value = false
  clearAnalysis()

  if (cameraStream.value) {
    stopCamera(cameraStream.value)
    cameraStream.value = null
  }
}

const startAnalysis = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    analysisStatus.value = 'Browser does not support camera access.'
    return
  }

  stopAnalysis()

  try {
    cameraStream.value = await startCamera(videoRef.value)
    analysisActive.value = true
    analysisStatus.value = 'Exercise analysis active. Real-time feedback coming soon...'
    poseLandmarker.value ||= await createPoseLandmarker()
    detectPose()
  } catch (error) {
    stopAnalysis()
    analysisStatus.value = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
      ? 'Camera permission denied.'
      : 'Unable to start the camera.'
  }
}

onUnmounted(() => {
  stopAnalysis()
  poseLandmarker.value?.close()
})
</script>
