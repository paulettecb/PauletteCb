<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a href="#/" class="back-btn">← Back</a>
      <h1>🐕 AGILITY - Canine Movement Analysis</h1>
      <p class="subtitle">Real-time Dog Movement Tracking</p>
    </header>

    <main class="experiment-main">
      <section class="info-section">
        <h2>Canine Agility Tracker</h2>
        <p>Analyze dog movements, jumps, and agility exercises with real-time pose detection.</p>

        <div class="features-grid">
          <div class="feature">
            <span class="feature-icon">📍</span>
            <h3>Pose Tracking</h3>
            <p>Follow all body joints</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🏃</span>
            <h3>Movement Analysis</h3>
            <p>Detect running, jumping, turning</p>
          </div>
          <div class="feature">
            <span class="feature-icon">📈</span>
            <h3>Performance Metrics</h3>
            <p>Measure agility performance</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🎓</span>
            <h3>Training Mode</h3>
            <p>Improve dog training techniques</p>
          </div>
        </div>

        <button class="btn btn-primary" @click="startTracking">
          🎥 Start Tracking
        </button>

        <div v-if="trackingActive" class="tracking-section">
          <p class="status">Agility tracking initialized. MediaPipe integration in progress...</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const trackingActive = ref(false)

const startTracking = () => {
  trackingActive.value = !trackingActive.value
}
</script>
