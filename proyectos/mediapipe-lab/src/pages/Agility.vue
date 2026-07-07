<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a
        href="#/"
        class="back-btn"
      >← Back</a>
      <h1>🐕 AGILITY · MotionLab Trainer</h1>
      <p class="subtitle">
        Diseña pistas, estudia el reglamento FCI/FCM y entrena tus señales de guía con la cámara.
      </p>
      <a
        class="libro-link"
        href="./libro-agility.html"
        target="_blank"
        rel="noopener"
      >📕 Mini libro de agility — todo el deporte en un solo archivo</a>
    </header>

    <main class="experiment-main">
      <nav
        class="mode-tabs"
        aria-label="Modos del entrenador"
      >
        <button
          v-for="mode in MODES"
          :key="mode.id"
          type="button"
          class="mode-tab"
          :class="{ active: mode.id === activeMode }"
          @click="activeMode = mode.id"
        >
          <span class="mode-icon">{{ mode.icono }}</span>
          <span class="mode-text">
            <strong>{{ mode.titulo }}</strong>
            <span>{{ mode.descripcion }}</span>
          </span>
        </button>
      </nav>

      <section class="info-section mode-panel">
        <CourseDesigner v-if="activeMode === 'pistas'" />
        <TheoryLessons v-else-if="activeMode === 'teoria'" />
        <ManeuverCoach v-else-if="activeMode === 'maniobras'" />
        <HandlerCoach v-else />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CourseDesigner from '../components/agility/CourseDesigner.vue'
import TheoryLessons from '../components/agility/TheoryLessons.vue'
import HandlerCoach from '../components/agility/HandlerCoach.vue'
import ManeuverCoach from '../components/agility/ManeuverCoach.vue'

const MODES = [
  {
    id: 'pistas',
    icono: '📋',
    titulo: 'Diseñador de pistas',
    descripcion: 'Arma recorridos válidos según el reglamento',
  },
  {
    id: 'teoria',
    icono: '📚',
    titulo: 'Teoría en lecciones',
    descripcion: 'Microlecciones con quiz del reglamento FCI/FCM',
  },
  {
    id: 'coach',
    icono: '🎥',
    titulo: 'Coach de manejo',
    descripcion: 'Tu técnica de guía, corregida con MediaPipe',
  },
  {
    id: 'maniobras',
    icono: '🎓',
    titulo: 'Maniobras',
    descripcion: '11 maniobras entrenables + glosario de 26 paso a paso',
  },
]

const activeMode = ref('pistas')
</script>

<style scoped>
.libro-link {
  display: inline-block;
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-brand-soft);
  color: var(--text-accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  text-decoration: none;
  transition: box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.libro-link:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }

.mode-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: var(--border-width-strong) solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}

.mode-tab:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.mode-tab.active {
  border-color: var(--periwinkle-600);
  background: var(--surface-brand-soft);
  box-shadow: var(--shadow-sm);
}

.mode-icon { font-size: var(--text-xl); }
.mode-text { display: grid; gap: 2px; }
.mode-text strong { color: var(--text-primary); }
.mode-text span:last-child { color: var(--text-muted); font-size: var(--text-sm); }

.mode-panel { min-height: 400px; }
</style>
