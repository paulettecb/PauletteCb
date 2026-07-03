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
          <video ref="videoRef" class="camera-preview" autoplay playsinline muted v-show="experimentRunning"></video>
          <p v-if="experimentStatus" class="status">{{ experimentStatus }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue'
import { startCamera, stopCamera } from '../utils/camera'

const experimentRunning = ref(false)
const experimentStatus = ref('')
const experimentStream = ref(null)
const videoRef = ref(null)

const launchExperiment = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    experimentStatus.value = 'Navegador sin soporte para cámara.'
    return
  }

  try {
    experimentStream.value = await startCamera(videoRef.value)
    experimentRunning.value = true
    experimentStatus.value = 'Cámara encendida.'
  } catch (error) {
    experimentRunning.value = false

    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      experimentStatus.value = 'Permiso denegado para acceder a la cámara.'
    } else {
      experimentStatus.value = 'No se pudo encender la cámara.'
    }
  }
}

onUnmounted(() => {
  if (experimentStream.value) {
    stopCamera(experimentStream.value)
  }
})
</script>
