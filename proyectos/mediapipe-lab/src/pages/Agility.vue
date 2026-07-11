<template>
  <div class="agility-app">
    <!-- Sidebar (escritorio) -->
    <nav
      class="sidebar"
      aria-label="Navegación de Agility"
    >
      <a
        href="#/"
        class="back-link"
      >← MotionLab</a>
      <div class="wordmark">
        <span class="wordmark-text">Agility</span>
        <span class="wordmark-heart">♥</span>
      </div>
      <div class="wordmark-sub">MOTIONLAB · FCI/FCM</div>

      <button
        v-for="item in NAV_ITEMS"
        :key="item.id"
        type="button"
        class="nav-item"
        :class="{ active: item.id === activeMode }"
        @click="activeMode = item.id"
      >
        <span
          class="nav-icon"
          v-html="item.icon"
        />
        {{ item.label }}
      </button>

      <a
        class="nav-item libro-item"
        href="./libro-agility.html"
        target="_blank"
        rel="noopener"
      >
        <span
          class="nav-icon"
          v-html="ICON_LIBRO"
        />
        Libro
      </a>
    </nav>

    <div class="agility-main">
      <!-- Header (móvil) -->
      <header class="mobile-header">
        <a
          href="#/"
          class="back-link mobile-back"
        >←</a>
        <span class="wordmark-text mobile-wordmark">Agility</span>
        <span class="wordmark-heart">♥</span>
        <a
          class="mobile-libro-link"
          href="./libro-agility.html"
          target="_blank"
          rel="noopener"
        >📕 Libro</a>
      </header>

      <main class="agility-content">
        <Today
          v-if="activeMode === 'hoy'"
          @navigate="(id) => (activeMode = id)"
        />
        <CourseDesigner v-else-if="activeMode === 'pista'" />
        <ManeuverCoach v-else-if="activeMode === 'maniobras'" />
        <HandlerCoach v-else-if="activeMode === 'coach'" />
        <TheoryLessons v-else />
      </main>

      <!-- Bottom nav (móvil) -->
      <nav
        class="bottom-nav"
        aria-label="Navegación de Agility"
      >
        <button
          v-for="item in NAV_ITEMS"
          :key="item.id"
          type="button"
          class="bottom-nav-item"
          :class="{ active: item.id === activeMode }"
          @click="activeMode = item.id"
        >
          <span
            class="nav-icon"
            v-html="item.icon"
          />
          {{ item.label }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Today from '../components/agility/Today.vue'
import CourseDesigner from '../components/agility/CourseDesigner.vue'
import TheoryLessons from '../components/agility/TheoryLessons.vue'
import HandlerCoach from '../components/agility/HandlerCoach.vue'
import ManeuverCoach from '../components/agility/ManeuverCoach.vue'

const ICON_HOY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path></svg>'
const ICON_PISTA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2.4"></circle><circle cx="18" cy="5" r="2.4"></circle><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"></path></svg>'
const ICON_COACH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="13" height="12" rx="2.5"></rect><path d="m15 11 6-3.5v9L15 13"></path></svg>'
const ICON_MANIOBRAS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5 12 5l10 4.5L12 14 2 9.5z"></path><path d="M6.5 11.5V16c3.2 2.6 7.8 2.6 11 0v-4.5"></path></svg>'
const ICON_TEORIA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"></path><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"></path></svg>'
const ICON_LIBRO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'

// "Coach" apunta a HandlerCoach.vue (drills genéricos de postura) y
// "Maniobras" a ManeuverCoach.vue, que ya trae su propio hub + vista de
// práctica con perro virtual — ningún componente cambia de comportamiento,
// solo se reordena la navegación para calzar con las 5 pantallas del diseño.
const NAV_ITEMS = [
  { id: 'hoy', label: 'Hoy', icon: ICON_HOY },
  { id: 'pista', label: 'Pista', icon: ICON_PISTA },
  { id: 'coach', label: 'Coach', icon: ICON_COACH },
  { id: 'maniobras', label: 'Maniobras', icon: ICON_MANIOBRAS },
  { id: 'teoria', label: 'Teoría', icon: ICON_TEORIA },
]

const activeMode = ref('hoy')
</script>

<style scoped>
.agility-app {
  display: flex;
  min-height: 100vh;
  align-items: stretch;
  font-family: 'Hanken Grotesk', var(--font-sans);
}

/* ---------- Sidebar (escritorio) ---------- */
.sidebar {
  width: 228px;
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 14px;
  background: var(--paper);
  border-right: 1px solid var(--ink-100);
  position: sticky;
  top: 0;
  height: 100vh;
  box-sizing: border-box;
}
.back-link {
  padding: 4px 10px 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
}
.back-link:hover { color: var(--periwinkle-700); }

.wordmark { padding: 0 10px; display: flex; align-items: baseline; gap: 7px; }
.wordmark-text { font-family: var(--font-display); font-size: 26px; line-height: 1; }
.wordmark-heart { color: var(--pop-magenta); font-size: 17px; }
.wordmark-sub { padding: 0 10px 12px; font-size: 10.5px; letter-spacing: 0.18em; font-weight: 600; color: var(--ink-500); }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  font-size: 14.5px;
  font-weight: 600;
  background: transparent;
  color: var(--ink-700);
  text-align: left;
  text-decoration: none;
  transition: background var(--dur-fast) var(--ease-out);
}
.nav-item:hover { background: var(--periwinkle-50); }
.nav-item.active { background: var(--periwinkle-50); color: var(--periwinkle-700); }
.nav-icon { display: inline-flex; flex: none; }
.nav-icon :deep(svg) { display: block; }

.libro-item { margin-top: 4px; }

/* ---------- Main ---------- */
.agility-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.agility-content { flex: 1; padding: 30px 34px; box-sizing: border-box; }

.mobile-header { display: none; }
.bottom-nav { display: none; }

/* ---------- Móvil ---------- */
@media (max-width: 880px) {
  .sidebar { display: none; }

  .mobile-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 18px;
    background: var(--paper);
    border-bottom: 1px solid var(--ink-100);
  }
  .mobile-back { padding: 4px; font-size: 15px; }
  .mobile-wordmark { font-size: 20px; }
  .mobile-libro-link {
    margin-left: auto;
    font-size: 12.5px;
    font-weight: 600;
    text-decoration: none;
    color: var(--text-accent);
  }

  .agility-content { padding: 16px 16px 20px; }

  .bottom-nav {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-top: 1px solid var(--ink-100);
    background: var(--paper);
    padding: 8px 4px calc(10px + env(safe-area-inset-bottom, 0px));
    position: sticky;
    bottom: 0;
  }
  .bottom-nav-item {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 6px 2px;
    border: none;
    background: transparent;
    cursor: pointer;
    font: inherit;
    color: var(--ink-700);
    font-size: 10px;
    font-weight: 700;
  }
  .bottom-nav-item.active { color: var(--periwinkle-700); }
}
</style>
