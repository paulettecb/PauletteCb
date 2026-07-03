<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a href="#/" class="back-btn">← Back</a>
      <h1>⚗️ EXPERIMENTS - Playground</h1>
      <p class="subtitle">Test New Features & Creative Ideas</p>
    </header>

    <main class="experiment-main">
      <section class="info-section">
        <h2>Experimental Laboratory</h2>
        <p>A sandbox for testing cutting-edge MediaPipe features, custom models, and creative applications.</p>

        <div class="features-grid">
          <div class="feature">
            <span class="feature-icon">🔬</span>
            <h3>Custom Models</h3>
            <p>Test your own models</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🎨</span>
            <h3>Creative Projects</h3>
            <p>Artistic applications</p>
          </div>
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <h3>Performance Tuning</h3>
            <p>Optimize for speed & accuracy</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🚀</span>
            <h3>Rapid Prototyping</h3>
            <p>Quick experimentation</p>
          </div>
        </div>

        <button class="btn btn-primary" @click="launchExperiment">
          🧪 Launch Experiment
        </button>

        <div class="experiment-section">
          <div class="camera-stage" :class="{ 'is-active': experimentRunning, 'is-inactive': !experimentRunning }">
            <video ref="videoRef" class="camera-preview" autoplay playsinline muted></video>
            <canvas ref="canvasRef" class="landmarks-canvas" aria-label="Body and hand landmarks overlay"></canvas>
          </div>
          <p v-if="experimentStatus" class="status">{{ experimentStatus }}</p>
          <p v-if="handDetectionStatus" class="status">{{ handDetectionStatus }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useHandDetectionCamera } from '../composables/useHandDetectionCamera'

const {
  cameraActive: experimentRunning,
  cameraStatus: experimentStatus,
  handDetectionStatus,
  start: startHandDetection,
  canvasRef,
  videoRef,
} = useHandDetectionCamera()

const launchExperiment = () => {
  startHandDetection('Experimento con landmarks de cuerpo y manos activos.')
}
</script>
