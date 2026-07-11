<template>
  <div class="today">
    <div class="hero-row">
      <h1 class="hero-title">Hola, Paulette</h1>
      <span class="hero-date">{{ todayLabel }}</span>
    </div>

    <div class="hero-card">
      <div class="hero-copy">
        <span class="hero-eyebrow">Sigue entrenando</span>
        <strong class="hero-headline">{{ heroHeadline }}</strong>
        <span class="hero-sub">{{ heroSub }}</span>
      </div>
      <div class="hero-actions">
        <button
          class="btn btn-primary"
          type="button"
          @click="$emit('navigate', 'maniobras')"
        >
          Entrenar ahora
        </button>
        <button
          class="btn"
          type="button"
          @click="$emit('navigate', 'teoria')"
        >
          Ver teoría
        </button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-label">Teoría</span>
        <strong class="stat-value">{{ completedLessons }}<span> / {{ totalLessons }} lecciones</span></strong>
        <div class="stat-track">
          <div
            class="stat-fill"
            :style="{ width: `${theoryPct}%` }"
          />
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-label">Pistas guardadas</span>
        <strong class="stat-value">{{ savedCoursesCount }}</strong>
        <span class="stat-note">{{ lastCourseNote }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Maniobras</span>
        <strong class="stat-value">{{ MANEUVER_COUNT }}</strong>
        <span class="stat-note">entrenables con perro virtual</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LESSONS, readProgress } from '../../data/agilityLessons'
import { COURSES_STORAGE_KEY } from '../../data/agilityRules'
import { MANEUVERS } from '../../data/agilityManeuvers'

defineEmits(['navigate'])

const progress = readProgress()
const totalLessons = LESSONS.length
const completedLessons = LESSONS.filter((lesson) => progress[lesson.id]).length
const theoryPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0
const nextLesson = LESSONS.find((lesson) => !progress[lesson.id])

const MANEUVER_COUNT = MANEUVERS.length

const readSavedCourses = () => {
  try {
    return JSON.parse(localStorage.getItem(COURSES_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}
const savedCourses = readSavedCourses()
const savedCoursesCount = savedCourses.length
const lastCourseNote = computed(() => {
  if (!savedCourses.length) return 'aún no guardas ninguna'
  return `última: ${savedCourses[savedCourses.length - 1].nombre}`
})

const heroHeadline = computed(() => (nextLesson ? nextLesson.titulo : 'Ya viste toda la teoría'))
const heroSub = computed(() => (nextLesson
  ? `Te faltan ${totalLessons - completedLessons} lecciones — o practica una maniobra con el perro virtual.`
  : 'Repasa una maniobra con el perro virtual o arma una pista nueva.'))

const todayLabel = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
</script>

<style scoped>
.today { display: grid; gap: var(--space-4); max-width: 880px; }

.hero-row { display: flex; align-items: baseline; gap: var(--space-3); flex-wrap: wrap; }
.hero-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 500;
  line-height: 1;
  color: var(--periwinkle-600);
}
.hero-date { margin-left: auto; font-size: var(--text-sm); color: var(--text-muted); text-transform: capitalize; }

.hero-card {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-6);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}
.hero-copy { flex: 1; min-width: 240px; display: grid; gap: 6px; }
.hero-eyebrow { font-size: 10.5px; letter-spacing: 0.18em; font-weight: 700; color: var(--periwinkle-700); text-transform: uppercase; }
.hero-headline { font-size: var(--text-lg); letter-spacing: -0.01em; }
.hero-sub { font-size: var(--text-sm); color: var(--text-muted); }
.hero-actions { display: flex; gap: var(--space-2); flex: none; }

.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: var(--space-3); }
.stat-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.stat-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-muted); }
.stat-value { font-size: var(--text-2xl); letter-spacing: -0.02em; }
.stat-value span { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--text-muted); }
.stat-note { font-size: 12.5px; color: var(--text-muted); }
.stat-track { height: 7px; border-radius: var(--radius-pill); background: var(--periwinkle-100); overflow: hidden; }
.stat-fill { height: 100%; border-radius: var(--radius-pill); background: var(--periwinkle-500); }
</style>
