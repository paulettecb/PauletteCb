<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a href="#/" class="back-btn">← Back</a>
      <h1>🏃 EXERCISE - Human Movement Analysis</h1>
      <p class="subtitle">Posture & Exercise Form Tracking</p>
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

        <button class="btn btn-primary" @click="startAnalysis">
          🎥 Start Analysis
        </button>

        <div class="analysis-section">
          <video ref="videoRef" class="camera-preview" autoplay playsinline muted v-show="analysisActive"></video>
          <p v-if="analysisStatus" class="status">{{ analysisStatus }}</p>
          <p v-if="handDetectionStatus" class="status">{{ handDetectionStatus }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useHandDetectionCamera } from '../composables/useHandDetectionCamera'

const {
  cameraActive: analysisActive,
  cameraStatus: analysisStatus,
  handDetectionStatus,
  start: startHandDetection,
  videoRef,
} = useHandDetectionCamera()

const startAnalysis = () => {
  startHandDetection('Exercise analysis con detección de manos activo.')
}
</script>
