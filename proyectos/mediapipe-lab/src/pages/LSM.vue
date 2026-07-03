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

        <div v-if="cameraActive" class="camera-section">
          <p class="status">Camera is ready. MediaPipe integration coming soon...</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const cameraActive = ref(false)

const startCamera = () => {
  cameraActive.value = !cameraActive.value
}
</script>
