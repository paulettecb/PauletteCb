<template>
  <div class="exercise-app">
    <!-- Sidebar (escritorio) -->
    <nav
      class="sidebar"
      aria-label="Navegación de Exercise"
    >
      <a
        href="#/"
        class="back-link"
      >← MotionLab</a>
      <div class="wordmark">
        <span class="wordmark-text">Exercise</span>
        <span class="wordmark-heart">♥</span>
      </div>
      <div class="wordmark-sub">
        MOTIONLAB · ENTRENADOR DE POSTURA
      </div>

      <button
        v-for="item in NAV_ITEMS"
        :key="item.id"
        type="button"
        class="nav-item"
        :class="{ active: item.id === screen }"
        @click="irA(item.id)"
      >
        <span
          class="nav-icon"
          v-html="item.icon"
        />
        {{ item.label }}
      </button>

      <div class="local-card">
        <span class="local-dot" />
        <div class="local-text">
          <strong>Todo local</strong>
          <span>la cámara no sale de aquí</span>
        </div>
      </div>
    </nav>

    <div class="exercise-main">
      <!-- Header (móvil) -->
      <header class="mobile-header">
        <a
          href="#/"
          class="back-link mobile-back"
        >←</a>
        <span class="wordmark-text mobile-wordmark">Exercise</span>
        <span class="wordmark-heart">♥</span>
        <span class="mobile-local"><span class="local-dot" />local</span>
      </header>

      <main class="exercise-content">
        <ExerciseLibrary
          v-if="screen === 'biblioteca'"
          @open="abrirFicha"
          @capture="irA('capturar')"
        />
        <ExerciseDetail
          v-else-if="screen === 'ficha'"
          :exercise="selectedExercise"
          @back="irA('biblioteca')"
          @coach="irA('coach')"
          @capture="irA('capturar')"
          @add-routine="agregarARutina"
        />
        <ExerciseCoach
          v-else-if="screen === 'coach'"
          :key="'coach-' + selectedId"
          :exercise="selectedExercise"
          :reference="referenciaActual"
          @back="irA('ficha')"
          @finish="terminarSesion"
        />
        <PoseCapture
          v-else-if="screen === 'capturar'"
          :key="'cap-' + selectedId"
          :exercise="selectedExercise"
          @back="irA('ficha')"
          @saved="poseGuardada"
        />
        <RoutineBuilder
          v-else-if="screen === 'rutina'"
          :routine="routine"
          @update="actualizarRutina"
          @add="irA('biblioteca')"
          @start="empezarRutina"
        />
        <SessionSummary
          v-else
          :session="lastSession"
          @repeat="repetir"
          @back="irA('biblioteca')"
        />
      </main>

      <!-- Bottom nav (móvil) -->
      <nav
        class="bottom-nav"
        aria-label="Navegación de Exercise"
      >
        <button
          v-for="item in NAV_ITEMS"
          :key="item.id"
          type="button"
          class="bottom-nav-item"
          :class="{ active: item.id === screen }"
          @click="irA(item.id)"
        >
          <span
            class="nav-icon"
            v-html="item.icon"
          />
          {{ item.labelCorto }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getExercise, DEFAULT_ROUTINE } from '../data/exerciseLibrary'
import { loadState, saveRoutine, saveLastSession } from '../services/exerciseStore'
import ExerciseLibrary from '../components/exercise/ExerciseLibrary.vue'
import ExerciseDetail from '../components/exercise/ExerciseDetail.vue'
import ExerciseCoach from '../components/exercise/ExerciseCoach.vue'
import PoseCapture from '../components/exercise/PoseCapture.vue'
import RoutineBuilder from '../components/exercise/RoutineBuilder.vue'
import SessionSummary from '../components/exercise/SessionSummary.vue'

const ICON_BIBLIOTECA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect></svg>'
const ICON_COACH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5A2.5 2.5 0 0 1 4.5 5h2L8 3h5l1.5 2h2A2.5 2.5 0 0 1 19 7.5V17a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 2 17z"></path><circle cx="10.5" cy="12" r="3.2"></circle></svg>'
const ICON_CAPTURAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>'
const ICON_RUTINA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="m3 6 1 1 2-2"></path><path d="m3 12 1 1 2-2"></path><path d="m3 18 1 1 2-2"></path></svg>'
const ICON_RESUMEN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><rect x="7" y="11" width="3" height="6" rx="0.6"></rect><rect x="12" y="7" width="3" height="10" rx="0.6"></rect><rect x="17" y="13" width="3" height="4" rx="0.6"></rect></svg>'

const NAV_ITEMS = [
  { id: 'biblioteca', label: 'Biblioteca', labelCorto: 'Biblioteca', icon: ICON_BIBLIOTECA },
  { id: 'coach', label: 'Coach en vivo', labelCorto: 'Coach', icon: ICON_COACH },
  { id: 'capturar', label: 'Capturar pose', labelCorto: 'Capturar', icon: ICON_CAPTURAR },
  { id: 'rutina', label: 'Rutinas', labelCorto: 'Rutinas', icon: ICON_RUTINA },
  { id: 'resumen', label: 'Resumen', labelCorto: 'Resumen', icon: ICON_RESUMEN },
]

const persisted = loadState()
const screen = ref('biblioteca')
const selectedId = ref('sentadilla')
const routine = ref(persisted.rutina || structuredCloneSafe(DEFAULT_ROUTINE))
const lastSession = ref(persisted.ultimaSesion || null)
const referencias = ref(persisted.referencias || {})

const selectedExercise = computed(() => getExercise(selectedId.value))
const referenciaActual = computed(() => referencias.value[selectedId.value] || null)

function structuredCloneSafe (obj) {
  return JSON.parse(JSON.stringify(obj))
}

const irA = (id) => { screen.value = id }
const abrirFicha = (id) => { selectedId.value = id; screen.value = 'ficha' }

const agregarARutina = () => {
  const e = selectedExercise.value
  const items = [...(routine.value.items || [])]
  if (!items.some((it) => it.id === e.id)) {
    const d = e.dosis || { series: 3, reps: 12, repsLabel: 'reps', descanso: '60 s' }
    items.push({ id: e.id, series: d.series, reps: d.reps, repsLabel: d.repsLabel, descanso: d.descanso })
  }
  actualizarRutina({ ...routine.value, items })
  screen.value = 'rutina'
}

const actualizarRutina = (nueva) => {
  routine.value = nueva
  saveRoutine(nueva)
}

const empezarRutina = (firstId) => {
  if (firstId) selectedId.value = firstId
  screen.value = 'coach'
}

const terminarSesion = (resumen) => {
  lastSession.value = resumen
  saveLastSession(resumen)
  screen.value = 'resumen'
}

const poseGuardada = (id) => {
  referencias.value = loadState().referencias
  selectedId.value = id
  screen.value = 'ficha'
}

const repetir = () => {
  screen.value = lastSession.value ? 'coach' : 'biblioteca'
}
</script>

<style scoped>
.exercise-app {
  display: flex;
  min-height: 100vh;
  align-items: stretch;
  font-family: 'Hanken Grotesk', var(--font-sans);
  color: var(--ink-900);
}

/* ---------- Sidebar (escritorio) ---------- */
.sidebar {
  width: 230px;
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
.back-link { padding: 4px 10px 10px; font-size: 12.5px; font-weight: 600; color: var(--ink-500); text-decoration: none; }
.back-link:hover { color: var(--periwinkle-700); }
.wordmark { padding: 4px 10px 2px; display: flex; align-items: baseline; gap: 7px; }
.wordmark-text { font-family: var(--font-display); font-size: 25px; line-height: 1; }
.wordmark-heart { color: var(--pop-magenta); font-size: 15px; }
.wordmark-sub { padding: 0 10px 14px; font-size: 10px; letter-spacing: 0.16em; font-weight: 600; color: var(--ink-500); }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border: none; border-radius: 12px;
  cursor: pointer; font: inherit; font-size: 14.5px; font-weight: 600;
  background: transparent; color: var(--ink-700); text-align: left;
  transition: background 0.15s ease;
}
.nav-item:hover { background: var(--periwinkle-50); }
.nav-item.active { background: var(--periwinkle-50); color: var(--periwinkle-700); }
.nav-icon { display: inline-flex; flex: none; }
.nav-icon :deep(svg) { display: block; }

.local-card { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 16px; background: var(--oat); }
.local-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--success); flex: none; box-shadow: 0 0 0 4px rgba(79, 164, 122, 0.16); }
.local-text { display: grid; }
.local-text strong { font-size: 12.5px; }
.local-text span { font-size: 11px; color: var(--ink-500); }

/* ---------- Main ---------- */
.exercise-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.exercise-content { flex: 1; padding: 30px 34px; box-sizing: border-box; }
.mobile-header { display: none; }
.bottom-nav { display: none; }

/* ---------- Móvil ---------- */
@media (max-width: 880px) {
  .sidebar { display: none; }
  .mobile-header {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 18px; background: var(--paper); border-bottom: 1px solid var(--ink-100);
  }
  .mobile-back { padding: 4px; font-size: 15px; }
  .mobile-wordmark { font-size: 20px; }
  .mobile-local { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: var(--ink-700); }
  .exercise-content { padding: 16px 16px 20px; }
  .bottom-nav {
    display: grid; grid-template-columns: repeat(5, 1fr);
    border-top: 1px solid var(--ink-100); background: var(--paper);
    padding: 8px 4px calc(10px + env(safe-area-inset-bottom, 0px));
    position: sticky; bottom: 0; z-index: 5;
  }
  .bottom-nav-item {
    display: grid; justify-items: center; gap: 3px; padding: 6px 2px;
    border: none; background: transparent; cursor: pointer; font: inherit;
    color: var(--ink-700); font-size: 9.5px; font-weight: 700;
  }
  .bottom-nav-item.active { color: var(--periwinkle-700); }
}
</style>
