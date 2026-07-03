<template>
  <div class="lab-container">
    <header class="lab-header">
      <div class="header-content">
        <h1>📡 MediaPipe Lab</h1>
        <p class="subtitle">Real-Time Computer Vision Experiments</p>
      </div>
    </header>

    <main class="lab-main">
      <section class="lab-grid">
        <div class="lab-card lsm-card">
          <div class="card-icon">🤟</div>
          <h2>LSM</h2>
          <p>Lengua de Señas Mexicana</p>
          <p class="description">Practice Mexican Sign Language with pose detection and visual feedback.</p>
          <a href="#/lsm" class="btn btn-primary">Enter Lab</a>
        </div>

        <div class="lab-card agility-card">
          <div class="card-icon">🐕</div>
          <h2>AGILITY</h2>
          <p>Canine Movement Analysis</p>
          <p class="description">Analyze dog movements, jumps, and agility exercises in real-time.</p>
          <a href="#/agility" class="btn btn-primary">Enter Lab</a>
        </div>

        <div class="lab-card exercise-card">
          <div class="card-icon">🏃</div>
          <h2>EXERCISE</h2>
          <p>Human Posture & Movement</p>
          <p class="description">Track human exercise form, posture, and movement patterns with precision.</p>
          <a href="#/exercise" class="btn btn-primary">Enter Lab</a>
        </div>

        <div class="lab-card experiments-card">
          <div class="card-icon">⚗️</div>
          <h2>EXPERIMENTS</h2>
          <p>Experimental Playground</p>
          <p class="description">Test new MediaPipe features, models, and creative applications.</p>
          <a href="#/experiments" class="btn btn-primary">Enter Lab</a>
        </div>
      </section>

      <section class="tech-stack">
        <h3>Tech Stack</h3>
        <div class="tech-badges">
          <span class="badge">MediaPipe</span>
          <span class="badge">Vue 3</span>
          <span class="badge">Vite</span>
          <span class="badge">TensorFlow.js</span>
          <span class="badge">Web API</span>
        </div>
      </section>
    </main>

    <footer class="lab-footer">
      <p>MediaPipe Lab v0.1.0 | Powered by Google MediaPipe</p>
    </footer>
  </div>
</template>

<script setup>
</script>
