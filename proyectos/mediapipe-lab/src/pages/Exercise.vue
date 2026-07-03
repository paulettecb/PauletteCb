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

        <div v-if="analysisActive" class="analysis-section">
          <p class="status">Exercise analysis active. Real-time feedback coming soon...</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const analysisActive = ref(false)

const startAnalysis = () => {
  analysisActive.value = !analysisActive.value
}
</script>
