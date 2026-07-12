<template>
  <div class="rutina">
    <div class="rut-head">
      <h1 class="titulo">
        {{ routine.nombre }}
      </h1>
      <UiBadge tone="soft">
        {{ items.length }} ejercicios · ~{{ estMin }} min
      </UiBadge>
      <div class="rut-acciones">
        <UiButton
          variant="secondary"
          size="sm"
          @click="$emit('update', routine)"
        >
          Guardar
        </UiButton>
        <UiButton
          variant="pop"
          size="sm"
          :disabled="!items.length"
          @click="empezar"
        >
          Iniciar modo rutina
        </UiButton>
      </div>
    </div>

    <div class="rut-grid">
      <!-- secuencia -->
      <div class="secuencia">
        <div
          v-for="(p, i) in items"
          :key="p.id + '-' + i"
          class="fila"
        >
          <div class="flechas">
            <button
              type="button"
              class="flecha"
              :disabled="i === 0"
              aria-label="Subir"
              @click="mover(i, -1)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><path d="m6 15 6-6 6 6" /></svg>
            </button>
            <button
              type="button"
              class="flecha"
              :disabled="i === items.length - 1"
              aria-label="Bajar"
              @click="mover(i, 1)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </div>
          <div
            class="fila-pose"
            :style="{ background: p.pastel }"
          >
            <div class="fila-glyph">
              <PoseGlyph :pose="p.pose" />
            </div>
          </div>
          <div class="fila-info">
            <div class="fila-top">
              <strong>{{ p.nombre }}</strong>
              <span class="fila-meta">{{ p.zona }} · {{ p.aparato }}</span>
            </div>
            <div class="fila-chips">
              <span class="fchip">{{ p.series }} series</span>
              <span class="fchip">{{ p.reps }} {{ p.repsLabel }}</span>
              <span class="fchip oat">{{ p.descanso }} descanso</span>
            </div>
          </div>
          <button
            type="button"
            class="borrar"
            aria-label="Quitar de la rutina"
            @click="quitar(i)"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" /></svg>
          </button>
        </div>

        <button
          type="button"
          class="agregar"
          @click="$emit('add')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          Añadir ejercicio de la biblioteca
        </button>
      </div>

      <!-- panel -->
      <div class="rut-panel">
        <div class="panel-modo">
          <span class="eyebrow">MODO RUTINA</span>
          <p>Te lleva ejercicio por ejercicio: cuenta reps, avisa el descanso y pasa al siguiente.</p>
          <div class="pasos">
            <div
              v-for="(p, i) in primeros"
              :key="p.id"
              class="paso"
              :class="{ activo: i === 0 }"
            >
              <span class="paso-n">{{ i + 1 }}</span>
              {{ i === 0 ? `Empieza por ${p.nombre}` : `Luego ${p.nombre}` }}
            </div>
          </div>
          <UiButton
            variant="pop"
            size="md"
            block
            :disabled="!items.length"
            @click="empezar"
          >
            Empezar rutina
          </UiButton>
        </div>
        <div class="panel-dur">
          <span>Duración estimada</span>
          <strong>~{{ estMin }} min</strong>
          <span>{{ items.length }} ejercicios · {{ totalSeries }} series</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getExercise } from '../../data/exerciseLibrary'
import PoseGlyph from './PoseGlyph.vue'
import UiButton from './UiButton.vue'
import UiBadge from './UiBadge.vue'

const props = defineProps({
  routine: { type: Object, required: true },
})
const emit = defineEmits(['update', 'add', 'start'])

const items = computed(() => (props.routine.items || []).map((it) => {
  const e = getExercise(it.id)
  return { ...it, nombre: e.nombre, zona: e.zona, aparato: e.aparato, pastel: e.pastel, pose: e.pose }
}))
const primeros = computed(() => items.value.slice(0, 3))
const totalSeries = computed(() => (props.routine.items || []).reduce((n, it) => n + (Number(it.series) || 0), 0))
const estMin = computed(() => Math.max(1, Math.round(totalSeries.value * 1.7)))

const commit = (nuevos) => {
  emit('update', { ...props.routine, items: nuevos })
}

const mover = (i, dir) => {
  const arr = [...props.routine.items]
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  commit(arr)
}

const quitar = (i) => {
  const arr = [...props.routine.items]
  arr.splice(i, 1)
  commit(arr)
}

const empezar = () => {
  if (items.value.length) emit('start', props.routine.items[0].id)
}
</script>

<style scoped>
.rutina { display: grid; gap: 16px; max-width: 1100px; }
.rut-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.titulo { margin: 0; font-family: var(--font-display); font-size: 30px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.rut-acciones { margin-left: auto; display: flex; gap: 8px; }

.rut-grid { display: grid; grid-template-columns: minmax(0, 1fr) 288px; gap: 16px; align-items: start; }
.secuencia { display: grid; gap: 10px; }
.fila { display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 13px 18px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 16px; }
.flechas { display: grid; gap: 2px; }
.flecha { width: 24px; height: 20px; border: none; background: transparent; cursor: pointer; color: var(--ink-500); display: grid; place-items: center; }
.flecha:disabled { color: var(--ink-100); cursor: default; }
.fila-pose { width: 48px; height: 48px; border-radius: 13px; display: grid; place-items: center; }
.fila-glyph { width: 26px; height: 26px; opacity: 0.85; }
.fila-info { display: grid; gap: 5px; min-width: 0; }
.fila-top { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
.fila-top strong { font-size: 15.5px; line-height: 1.1; }
.fila-meta { font-size: 11.5px; color: var(--ink-500); }
.fila-chips { display: flex; gap: 7px; flex-wrap: wrap; }
.fchip { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: var(--periwinkle-50); color: var(--periwinkle-700); }
.fchip.oat { background: var(--oat); color: var(--ink-700); font-weight: 600; }
.borrar { width: 34px; height: 34px; border: none; border-radius: 10px; background: var(--oat); cursor: pointer; display: grid; place-items: center; color: var(--ink-500); }
.borrar:hover { color: var(--pop-magenta); }

.agregar { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border: 1.5px dashed var(--ink-300); border-radius: 16px; background: transparent; cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; color: var(--periwinkle-700); }
.agregar:hover { border-color: var(--periwinkle-400); }

.rut-panel { display: grid; gap: 12px; }
.panel-modo { display: grid; gap: 12px; padding: 18px 20px; background: var(--periwinkle-50); border-radius: 18px; }
.eyebrow { font-size: 10.5px; letter-spacing: 0.14em; font-weight: 700; color: var(--periwinkle-700); }
.panel-modo p { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--ink-700); }
.pasos { display: grid; gap: 8px; }
.paso { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-500); }
.paso.activo { color: var(--ink-700); }
.paso-n { width: 22px; height: 22px; border-radius: 999px; background: var(--ink-100); display: grid; place-items: center; font-size: 11px; font-weight: 700; }
.paso.activo .paso-n { background: var(--periwinkle-500); color: #fff; }
.panel-dur { display: grid; gap: 6px; padding: 16px 18px; background: var(--oat); border-radius: 16px; }
.panel-dur span { font-size: 12px; color: var(--ink-500); }
.panel-dur strong { font-size: 22px; letter-spacing: -0.02em; }

@media (max-width: 880px) {
  .rut-grid { grid-template-columns: 1fr; }
  .titulo { font-size: 24px; }
}
</style>
