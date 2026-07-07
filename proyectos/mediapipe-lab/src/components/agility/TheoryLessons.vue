<template>
  <section class="lessons">
    <template v-if="!activeLesson">
      <div class="lessons-header">
        <p class="lessons-progress">
          {{ completedCount }} de {{ LESSONS.length }} lecciones completadas
        </p>
        <div
          class="progress-track"
          role="progressbar"
          :aria-valuenow="completedCount"
          :aria-valuemax="LESSONS.length"
        >
          <div
            class="progress-fill"
            :style="{ width: `${(completedCount / LESSONS.length) * 100}%` }"
          />
        </div>
      </div>

      <div class="lesson-grid">
        <button
          v-for="lesson in LESSONS"
          :key="lesson.id"
          type="button"
          class="lesson-card"
          :class="{ done: progress[lesson.id] }"
          @click="openLesson(lesson)"
        >
          <span class="lesson-icon">{{ lesson.icono }}</span>
          <span class="lesson-body">
            <strong>{{ lesson.titulo }}</strong>
            <span class="lesson-resumen">{{ lesson.resumen }}</span>
          </span>
          <span
            v-if="progress[lesson.id]"
            class="lesson-check"
            aria-label="completada"
          >✓</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="lesson-view">
        <button
          class="btn mini"
          type="button"
          @click="closeLesson"
        >
          ← Todas las lecciones
        </button>
        <h3>{{ activeLesson.icono }} {{ activeLesson.titulo }}</h3>

        <template v-if="!quizMode">
          <div class="lesson-content">
            <template
              v-for="(block, i) in activeLesson.contenido"
              :key="i"
            >
              <p v-if="block.tipo === 'p'">
                {{ block.texto }}
              </p>
              <ul v-else-if="block.tipo === 'lista'">
                <li
                  v-for="(item, j) in block.items"
                  :key="j"
                >
                  {{ item }}
                </li>
              </ul>
              <div
                v-else-if="block.tipo === 'dato'"
                class="dato"
              >
                <span class="dato-icon">💡</span>
                <p>{{ block.texto }}</p>
              </div>
            </template>
          </div>
          <button
            class="btn btn-primary"
            type="button"
            @click="startQuiz"
          >
            📝 Quiz de la lección
          </button>
        </template>

        <template v-else>
          <div class="quiz">
            <div
              v-for="(question, qi) in activeLesson.quiz"
              :key="qi"
              class="quiz-question"
            >
              <p class="quiz-prompt">
                {{ qi + 1 }}. {{ question.pregunta }}
              </p>
              <div class="quiz-options">
                <button
                  v-for="(option, oi) in question.opciones"
                  :key="oi"
                  type="button"
                  class="quiz-option"
                  :class="optionClass(qi, oi)"
                  :disabled="answers[qi] !== null"
                  @click="answer(qi, oi)"
                >
                  {{ option }}
                </button>
              </div>
              <p
                v-if="answers[qi] !== null"
                class="quiz-explanation"
                :class="{ correct: answers[qi] === question.correcta }"
              >
                {{ answers[qi] === question.correcta ? '✓ ¡Correcto!' : '✗ Casi.' }} {{ question.explicacion }}
              </p>
            </div>

            <div
              v-if="quizFinished"
              class="quiz-result"
              :class="{ passed: quizPassed }"
            >
              <strong v-if="quizPassed">🎉 {{ score }}/{{ activeLesson.quiz.length }} — ¡Lección dominada!</strong>
              <strong v-else>{{ score }}/{{ activeLesson.quiz.length }} — Repasa y vuelve a intentarlo.</strong>
              <div class="panel-actions">
                <button
                  class="btn mini"
                  type="button"
                  @click="startQuiz"
                >
                  ↻ Reintentar
                </button>
                <button
                  class="btn mini"
                  type="button"
                  @click="quizMode = false"
                >
                  📖 Releer lección
                </button>
                <button
                  class="btn mini"
                  type="button"
                  @click="closeLesson"
                >
                  ✓ Seguir con otra
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { LESSONS, readProgress, saveProgress } from '../../data/agilityLessons'

const progress = ref(readProgress())
const activeLesson = ref(null)
const quizMode = ref(false)
const answers = ref([])

const completedCount = computed(() => LESSONS.filter((lesson) => progress.value[lesson.id]).length)

const openLesson = (lesson) => {
  activeLesson.value = lesson
  quizMode.value = false
}

const closeLesson = () => {
  activeLesson.value = null
  quizMode.value = false
}

const startQuiz = () => {
  answers.value = activeLesson.value.quiz.map(() => null)
  quizMode.value = true
}

const answer = (questionIndex, optionIndex) => {
  if (answers.value[questionIndex] !== null) return
  answers.value[questionIndex] = optionIndex
  if (quizFinished.value && quizPassed.value) {
    progress.value = { ...progress.value, [activeLesson.value.id]: true }
    saveProgress(progress.value)
  }
}

const quizFinished = computed(() => answers.value.length > 0 && answers.value.every((a) => a !== null))
const score = computed(() => activeLesson.value
  ? answers.value.filter((a, i) => a === activeLesson.value.quiz[i].correcta).length
  : 0)
const quizPassed = computed(() => activeLesson.value && score.value === activeLesson.value.quiz.length)

const optionClass = (questionIndex, optionIndex) => {
  const given = answers.value[questionIndex]
  if (given === null) return ''
  const correct = activeLesson.value.quiz[questionIndex].correcta
  if (optionIndex === correct) return 'is-correct'
  if (optionIndex === given) return 'is-wrong'
  return 'is-muted'
}
</script>

<style scoped>
.lessons { display: grid; gap: var(--space-4); }

.lessons-header { display: grid; gap: var(--space-2); }
.lessons-progress { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); font-weight: var(--weight-semibold); }
.progress-track { height: 10px; border-radius: var(--radius-pill); background: var(--periwinkle-100); overflow: hidden; }
.progress-fill { height: 100%; border-radius: var(--radius-pill); background: var(--periwinkle-500); transition: width var(--dur-slow) var(--ease-out); }

.lesson-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr)); gap: var(--space-3); }
.lesson-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: border-color var(--dur-fast) var(--ease-out), transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.lesson-card:hover { border-color: var(--periwinkle-400); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.lesson-card.done { border-color: var(--success); background: linear-gradient(0deg, rgba(79, 164, 122, 0.06), rgba(79, 164, 122, 0.06)), var(--surface-card); }
.lesson-icon { font-size: var(--text-xl); }
.lesson-body { display: grid; gap: 4px; }
.lesson-body strong { color: var(--text-primary); }
.lesson-resumen { color: var(--text-muted); font-size: var(--text-sm); }
.lesson-check { margin-left: auto; color: var(--success); font-weight: var(--weight-bold); font-size: var(--text-md); }

.lesson-view { display: grid; gap: var(--space-4); justify-items: start; }
.lesson-view h3 { margin: 0; font-size: var(--text-xl); }

.lesson-content { display: grid; gap: var(--space-3); max-width: 720px; }
.lesson-content p { margin: 0; color: var(--text-secondary); line-height: var(--leading-relaxed); }
.lesson-content ul { margin: 0; padding-left: 20px; display: grid; gap: var(--space-2); color: var(--text-secondary); }
.dato {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--pastel-butter);
  border: var(--border-width) solid var(--warning);
}
.dato p { margin: 0; color: var(--ink-900); font-weight: var(--weight-medium); }
.dato-icon { font-size: var(--text-lg); }

.quiz { display: grid; gap: var(--space-5); width: 100%; max-width: 720px; }
.quiz-question { display: grid; gap: var(--space-2); }
.quiz-prompt { margin: 0; font-weight: var(--weight-semibold); color: var(--text-primary); }
.quiz-options { display: grid; gap: var(--space-2); }
.quiz-option {
  padding: 10px 14px;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.quiz-option:hover:not(:disabled) { border-color: var(--periwinkle-400); background: var(--surface-brand-soft); }
.quiz-option:disabled { cursor: default; }
.quiz-option.is-correct { border-color: var(--success); background: rgba(79, 164, 122, 0.12); font-weight: var(--weight-semibold); }
.quiz-option.is-wrong { border-color: var(--danger); background: rgba(217, 83, 79, 0.08); }
.quiz-option.is-muted { opacity: 0.55; }
.quiz-explanation { margin: 0; font-size: var(--text-sm); color: var(--danger); }
.quiz-explanation.correct { color: var(--success); }

.quiz-result {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: var(--border-width) solid var(--border-strong);
  background: var(--surface-brand-soft);
}
.quiz-result.passed { border-color: var(--success); background: rgba(79, 164, 122, 0.1); }
.panel-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.btn.mini { min-height: 32px; padding: 5px 12px; font-size: var(--text-xs); box-shadow: none; border-color: var(--border-subtle); }
.btn.mini:hover { border-color: var(--periwinkle-400); }
</style>
