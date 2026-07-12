<template>
  <div class="biblioteca">
    <div class="head">
      <h1 class="titulo">
        Biblioteca
      </h1>
      <span class="sub">tus ejercicios con pose de referencia guardada</span>
      <span class="head-cta">
        <UiButton
          variant="primary"
          size="md"
          @click="$emit('capture')"
        >+ Nueva pose</UiButton>
      </span>
    </div>

    <!-- Buscador -->
    <label class="buscador">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--ink-500)"
        stroke-width="1.9"
        stroke-linecap="round"
        stroke-linejoin="round"
      ><circle
        cx="11"
        cy="11"
        r="7"
      /><path d="m20 20-3.2-3.2" /></svg>
      <input
        v-model="query"
        type="search"
        class="buscador-input"
        placeholder="Busca un ejercicio…"
        aria-label="Busca un ejercicio"
      >
      <span class="conteo">{{ filtrados.length }} {{ filtrados.length === 1 ? 'ejercicio' : 'ejercicios' }}</span>
    </label>

    <!-- Filtros -->
    <div class="filtros">
      <div
        v-for="grupo in FILTERS"
        :key="grupo.key"
        class="filtro-fila"
      >
        <span class="filtro-label">{{ grupo.label }}</span>
        <div class="filtro-chips">
          <button
            v-for="chip in grupo.chips"
            :key="chip"
            type="button"
            class="chip"
            :class="{ on: activo[grupo.key] === chip }"
            @click="activo[grupo.key] = chip"
          >
            {{ chip }}
          </button>
        </div>
      </div>
    </div>

    <!-- Grid -->
    <div
      v-if="filtrados.length"
      class="grid"
    >
      <button
        v-for="e in filtrados"
        :key="e.id"
        type="button"
        class="card"
        @click="$emit('open', e.id)"
      >
        <div
          class="card-pose"
          :style="{ background: e.pastel }"
        >
          <div class="card-glyph">
            <PoseGlyph :pose="e.pose" />
          </div>
          <span class="card-nivel">{{ e.nivel }}</span>
        </div>
        <strong class="card-nombre">{{ e.nombre }}</strong>
        <div class="card-chips">
          <span class="card-chip zona">{{ e.zona }}</span>
          <span class="card-chip apar">{{ e.aparato }}</span>
        </div>
      </button>
    </div>

    <!-- Sin resultados -->
    <div
      v-else
      class="vacio"
    >
      <div class="vacio-icon">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><circle
          cx="11"
          cy="11"
          r="7"
        /><path d="m20 20-3.2-3.2" /></svg>
      </div>
      <div class="vacio-text">
        <strong>No encontré ejercicios con esos filtros</strong>
        <p>Prueba con otra búsqueda o limpia los filtros. También puedes capturar una pose nueva.</p>
      </div>
      <div class="vacio-acciones">
        <UiButton
          variant="secondary"
          size="md"
          @click="limpiar"
        >
          Limpiar filtros
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="$emit('capture')"
        >
          Capturar una pose
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EXERCISES, FILTERS } from '../../data/exerciseLibrary'
import PoseGlyph from './PoseGlyph.vue'
import UiButton from './UiButton.vue'

defineEmits(['open', 'capture'])

const query = ref('')
const activo = reactive({ aparato: 'Todos', zona: 'Todas', nivel: 'Todos', cat: 'Todas' })

const esComodin = (chip) => chip === 'Todos' || chip === 'Todas'

const filtrados = computed(() => {
  const q = query.value.trim().toLowerCase()
  return EXERCISES.filter((e) => {
    if (q && !e.nombre.toLowerCase().includes(q) && !e.zona.toLowerCase().includes(q)) return false
    for (const grupo of FILTERS) {
      const sel = activo[grupo.key]
      if (!esComodin(sel) && e[grupo.key] !== sel) return false
    }
    return true
  })
})

const limpiar = () => {
  query.value = ''
  activo.aparato = 'Todos'
  activo.zona = 'Todas'
  activo.nivel = 'Todos'
  activo.cat = 'Todas'
}
</script>

<style scoped>
.biblioteca { display: grid; gap: 20px; max-width: 1040px; }

.head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.titulo { margin: 0; font-family: var(--font-display); font-size: 38px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.sub { font-size: 13.5px; color: var(--ink-500); }
.head-cta { margin-left: auto; }

.buscador { display: flex; align-items: center; gap: 12px; padding: 11px 18px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 16px; box-shadow: var(--shadow-sm); }
.buscador svg { flex: none; }
.buscador-input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; font: inherit; font-size: 15px; color: var(--ink-900); }
.buscador-input::placeholder { color: var(--ink-500); }
.conteo { flex: none; font-size: 11.5px; color: var(--ink-300); }

.filtros { display: flex; flex-direction: column; gap: 9px; }
.filtro-fila { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filtro-label { width: 72px; flex: none; font-size: 10.5px; letter-spacing: 0.12em; font-weight: 700; color: var(--ink-500); }
.filtro-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { font-family: inherit; font-size: 12.5px; font-weight: 600; padding: 6px 13px; border-radius: 999px; cursor: pointer; background: var(--paper); color: var(--ink-700); border: 1px solid var(--ink-100); transition: border-color 0.15s ease; }
.chip:hover { border-color: var(--periwinkle-300); }
.chip.on { background: var(--periwinkle-500); color: #fff; border-color: var(--periwinkle-500); }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.card { display: grid; gap: 12px; padding: 16px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 18px; cursor: pointer; text-align: left; font: inherit; transition: box-shadow 0.15s ease; }
.card:hover { box-shadow: var(--shadow-md); }
.card-pose { position: relative; aspect-ratio: 4 / 3; border-radius: 13px; display: grid; place-items: center; overflow: hidden; }
.card-glyph { width: 58%; height: 70%; opacity: 0.82; }
.card-nivel { position: absolute; top: 9px; right: 9px; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.72); color: var(--ink-700); }
.card-nombre { font-size: 15.5px; color: var(--ink-900); }
.card-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.card-chip { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
.card-chip.zona { background: var(--periwinkle-50); color: var(--periwinkle-700); }
.card-chip.apar { background: var(--oat); color: var(--ink-700); }

.vacio { display: grid; justify-items: center; gap: 16px; text-align: center; padding: 48px 30px; background: var(--paper); border: 1.5px dashed var(--ink-300); border-radius: 24px; }
.vacio-icon { width: 66px; height: 66px; border-radius: 20px; background: var(--pastel-mint); display: grid; place-items: center; color: var(--ink-900); }
.vacio-text { display: grid; gap: 6px; max-width: 400px; }
.vacio-text strong { font-size: 19px; }
.vacio-text p { margin: 0; font-size: 14px; line-height: 1.5; color: var(--ink-500); }
.vacio-acciones { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

@media (max-width: 880px) {
  .titulo { font-size: 30px; }
  .grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .filtro-label { width: 100%; }
  .card-pose { aspect-ratio: 1 / 1; }
}
</style>
