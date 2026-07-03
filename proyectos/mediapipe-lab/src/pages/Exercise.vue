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
            {{ analysisSummary }}
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
              <span class="metric-label">Hands: {{ detectedHandsCount }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../composables/useMediaPipeTrackingCamera'
import { isVisible } from '../utils/drawLandmarks'

const {
  cameraActive: analysisActive,
  cameraStatus: analysisStatus,
  detectedHandsCount,
  poseDetected,
  poseResults,
  start: startTracking,
  trackingStatus,
  canvasRef,
  videoRef,
} = useMediaPipeTrackingCamera({ hands: true, pose: true })

const metrics = reactive({
  shouldersVisible: false,
  hipsVisible: false,
  kneesVisible: false,
})

const visibilityLabel = (visible) => (visible ? 'Yes' : 'No')
const areVisible = (landmarks, indexes) => indexes.every((index) => isVisible(landmarks[index]))

watch(poseResults, (results) => {
  const landmarks = results?.landmarks?.[0]
  metrics.shouldersVisible = Boolean(landmarks && areVisible(landmarks, [11, 12]))
  metrics.hipsVisible = Boolean(landmarks && areVisible(landmarks, [23, 24]))
  metrics.kneesVisible = Boolean(landmarks && areVisible(landmarks, [25, 26]))
})

const analysisSummary = computed(() => trackingStatus.value || analysisStatus.value)

const startAnalysis = () => {
  startTracking('Exercise analysis activo con landmarks de cuerpo y manos.')
}
</script>
