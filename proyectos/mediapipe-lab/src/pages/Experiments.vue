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

        <div v-if="experimentRunning" class="experiment-section">
          <p class="status">Experimental mode activated. Ready for innovation...</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const experimentRunning = ref(false)

const launchExperiment = () => {
  experimentRunning.value = !experimentRunning.value
}
</script>
