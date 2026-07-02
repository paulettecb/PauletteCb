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
          <router-link to="/lsm" class="btn btn-primary">Enter Lab</router-link>
        </div>

        <div class="lab-card agility-card">
          <div class="card-icon">🐕</div>
          <h2>AGILITY</h2>
          <p>Canine Movement Analysis</p>
          <p class="description">Analyze dog movements, jumps, and agility exercises in real-time.</p>
          <router-link to="/agility" class="btn btn-primary">Enter Lab</router-link>
        </div>

        <div class="lab-card exercise-card">
          <div class="card-icon">🏃</div>
          <h2>EXERCISE</h2>
          <p>Human Posture & Movement</p>
          <p class="description">Track human exercise form, posture, and movement patterns with precision.</p>
          <router-link to="/exercise" class="btn btn-primary">Enter Lab</router-link>
        </div>

        <div class="lab-card experiments-card">
          <div class="card-icon">⚗️</div>
          <h2>EXPERIMENTS</h2>
          <p>Experimental Playground</p>
          <p class="description">Test new MediaPipe features, models, and creative applications.</p>
          <router-link to="/experiments" class="btn btn-primary">Enter Lab</router-link>
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

<style scoped>
.lab-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #faf7f2 0%, #f5f0eb 100%);
}

.lab-header {
  background: linear-gradient(135deg, #8e1d48 0%, #a53a61 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.header-content h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
  font-weight: 300;
}

.lab-main {
  flex: 1;
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.lab-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e0dbd5;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.lab-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(142, 29, 72, 0.1);
  border-color: #8e1d48;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.lab-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #8e1d48;
  font-weight: 700;
}

.lab-card p {
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.description {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: auto;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #8e1d48 0%, #a53a61 100%);
  color: white;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(142, 29, 72, 0.3);
}

.tech-stack {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e0dbd5;
}

.tech-stack h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #8e1d48;
}

.tech-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.badge {
  background: #f5e6ec;
  color: #8e1d48;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.lab-footer {
  background: #2a2a2a;
  color: #aaa;
  text-align: center;
  padding: 2rem;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .lab-header {
    padding: 2rem 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .lab-main {
    padding: 2rem 1rem;
  }

  .lab-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
