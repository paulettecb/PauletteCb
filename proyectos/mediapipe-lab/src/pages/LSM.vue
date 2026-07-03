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
          <div class="camera-stage" :class="{ 'is-active': cameraActive, 'is-inactive': !cameraActive }">
            <video ref="videoRef" class="camera-preview" autoplay playsinline muted></video>
            <canvas ref="canvasRef" class="landmarks-canvas" aria-label="Body and hand landmarks overlay"></canvas>
          </div>
          <p v-if="cameraStatus" class="status">{{ cameraStatus }}</p>
          <p v-if="handDetectionStatus" class="status">{{ handDetectionStatus }}</p>
          <p class="status">{{ poseDetected ? 'Cuerpo detectado para referencia de señas.' : 'Alinea tu cuerpo frente a la cámara para ver pose.' }}</p>

          <aside class="gesture-panel" aria-label="Hand detection summary">
            <h3>Detection Panel</h3>
            <dl>
              <div>
                <dt>Hands</dt>
                <dd>{{ detectedHandsCount }}</dd>
              </div>
              <div>
                <dt>Gesture</dt>
                <dd>{{ detectedGesture }}</dd>
              </div>
              <div>
                <dt>FPS</dt>
                <dd>{{ approximateFps || '—' }}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHandDetectionCamera } from '../composables/useHandDetectionCamera'
import { detectBasicGesture } from '../services/gestureRules'

const {
  approximateFps,
  cameraActive,
  cameraStatus,
  detectedHandsCount,
  handDetectionStatus,
  poseDetected,
  handResults,
  start: startCamera,
  canvasRef,
  videoRef,
} = useHandDetectionCamera()

const detectedGesture = computed(() => (
  detectBasicGesture(handResults.value?.landmarks?.[0])
))
</script>

<style scoped>
.gesture-panel {
  max-width: 360px;
  margin: var(--space-5) auto 0;
  padding: var(--space-4);
  text-align: left;
  background: var(--surface-brand-soft);
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
}

.gesture-panel h3 {
  margin: 0 0 var(--space-3);
  color: var(--text-accent);
}

.gesture-panel dl {
  display: grid;
  gap: var(--space-2);
  margin: 0;
}

.gesture-panel div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.gesture-panel dt {
  color: var(--text-muted);
  font-weight: var(--weight-semibold);
}

.gesture-panel dd {
  margin: 0;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
