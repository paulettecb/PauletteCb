<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <router-link to="/" class="back-btn">← Back</router-link>
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



<style scoped>
.experiment-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #faf7f2 0%, #f5f0eb 100%);
}

.experiment-header {
  background: linear-gradient(135deg, #8e1d48 0%, #a53a61 100%);
  color: white;
  padding: 2rem;
}

.back-btn {
  display: inline-block;
  color: white;
  text-decoration: none;
  font-weight: 600;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.experiment-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.experiment-main {
  padding: 3rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.info-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e0dbd5;
}

.info-section h2 {
  color: #8e1d48;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.info-section p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.feature {
  text-align: center;
  padding: 1.5rem;
  background: #f8f6f2;
  border-radius: 12px;
  border: 1px solid #e0dbd5;
  transition: all 0.3s ease;
}

.feature:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(142, 29, 72, 0.08);
}

.feature-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.feature h3 {
  color: #8e1d48;
  margin-bottom: 0.5rem;
}

.feature p {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #8e1d48 0%, #a53a61 100%);
  color: white;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(142, 29, 72, 0.3);
}

.analysis-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f0f8ff;
  border-left: 4px solid #8e1d48;
  border-radius: 8px;
}

.status {
  color: #333;
  margin: 0;
}

@media (max-width: 768px) {
  .experiment-header h1 {
    font-size: 1.5rem;
  }

  .experiment-main {
    padding: 1.5rem 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
