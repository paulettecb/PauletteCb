<template>
  <div class="resumen">
    <template v-if="session">
      <div class="res-head">
        <h1 class="titulo">
          ¡Bien, Paulette!
        </h1>
        <span class="sub">{{ session.nombre }} · {{ durTexto }}</span>
        <UiBadge tone="soft">
          sesión guardada
        </UiBadge>
      </div>

      <!-- hero: calidad -->
      <div class="hero">
        <div class="ring-wrap">
          <svg
            width="130"
            height="130"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--periwinkle-100)"
              stroke-width="12"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--success)"
              stroke-width="12"
              stroke-linecap="round"
              :stroke-dasharray="calidadDash"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div class="ring-val">
            <strong>{{ session.calidad }}%</strong>
            <span>CALIDAD</span>
          </div>
        </div>
        <div class="stats">
          <div class="stat">
            <span>Reps logradas</span>
            <strong>{{ session.reps }}<em v-if="session.metaReps"> / {{ session.metaReps }}</em></strong>
          </div>
          <div class="stat">
            <span>Reps limpias</span>
            <strong>{{ session.cleanReps }}</strong>
          </div>
          <div class="stat">
            <span>Mejor aguante</span>
            <strong>{{ holdTexto }}</strong>
          </div>
          <div class="stat">
            <span>Duración</span>
            <strong>{{ durTexto }}</strong>
          </div>
        </div>
      </div>

      <!-- fallos -->
      <div class="tarjeta">
        <strong class="card-titulo">Dónde se te fue la forma</strong>
        <template v-if="session.fallos && session.fallos.length">
          <div
            v-for="f in session.fallos"
            :key="f.label"
            class="fallo"
          >
            <div class="fallo-top">
              <span class="fallo-nombre"><span
                class="fallo-dot"
                :style="{ background: colorPct(f.pct) }"
              />{{ f.label }}</span>
              <span class="fallo-veces">{{ f.veces }} {{ f.veces === 1 ? 'vez' : 'veces' }}</span>
            </div>
            <div class="fallo-bar">
              <div
                class="fallo-fill"
                :style="{ width: f.pct + '%', background: colorPct(f.pct) }"
              />
            </div>
          </div>
          <p class="fallo-nota">
            Repasa {{ session.fallos[0].label.toLowerCase() }} en la ficha de {{ session.nombre }}.
          </p>
        </template>
        <p
          v-else
          class="fallo-nota"
        >
          ¡Sin correcciones marcadas! Mantuviste la forma bonito. 🎉
        </p>
      </div>

      <div class="res-acciones">
        <UiButton
          variant="primary"
          size="md"
          @click="$emit('repeat')"
        >
          Repetir
        </UiButton>
        <UiButton
          variant="ghost"
          size="md"
          @click="$emit('back')"
        >
          Volver a la biblioteca
        </UiButton>
      </div>
    </template>

    <!-- sin sesión aún -->
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
        ><path d="M3 3v18h18" /><rect
          x="7"
          y="11"
          width="3"
          height="6"
          rx="0.6"
        /><rect
          x="12"
          y="7"
          width="3"
          height="10"
          rx="0.6"
        /><rect
          x="17"
          y="13"
          width="3"
          height="4"
          rx="0.6"
        /></svg>
      </div>
      <div class="vacio-text">
        <strong>Aún no tienes una sesión</strong>
        <p>Practica un ejercicio con el coach y aquí verás tu resumen: calidad, reps limpias y dónde se te fue la forma.</p>
      </div>
      <UiButton
        variant="primary"
        size="md"
        @click="$emit('back')"
      >
        Ir a la biblioteca
      </UiButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import UiButton from './UiButton.vue'
import UiBadge from './UiBadge.vue'

const props = defineProps({
  session: { type: Object, default: null },
})
defineEmits(['repeat', 'back'])

const RING_C = 2 * Math.PI * 52
const calidadDash = computed(() => {
  const pct = props.session?.calidad || 0
  return `${(pct / 100 * RING_C).toFixed(1)} ${RING_C.toFixed(1)}`
})

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const durTexto = computed(() => {
  const s = props.session?.durationSec || 0
  return s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`
})
const holdTexto = computed(() => fmtTime(props.session?.bestHold || 0))

const colorPct = (pct) => (pct >= 60 ? '#D9534F' : pct >= 35 ? '#D9A441' : '#4FA47A')
</script>

<style scoped>
.resumen { display: grid; gap: 18px; max-width: 960px; }
.res-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.titulo { margin: 0; font-family: var(--font-display); font-size: 36px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.sub { font-size: 13.5px; color: var(--ink-500); }

.hero { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; padding: 26px 30px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 24px; box-shadow: var(--shadow-sm); }
.ring-wrap { position: relative; width: 130px; height: 130px; flex: none; display: grid; place-items: center; }
.ring-val { position: absolute; display: grid; justify-items: center; line-height: 1; }
.ring-val strong { font-size: 34px; letter-spacing: -0.02em; }
.ring-val span { font-size: 11px; font-weight: 700; color: var(--ink-500); }
.stats { flex: 1; min-width: 220px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.stat { display: grid; gap: 4px; }
.stat span { font-size: 12px; font-weight: 600; color: var(--ink-500); }
.stat strong { font-size: 26px; letter-spacing: -0.02em; }
.stat em { font-size: 14px; font-weight: 500; font-style: normal; color: var(--ink-500); }

.tarjeta { display: grid; gap: 13px; padding: 20px 22px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 18px; }
.card-titulo { font-size: 14px; }
.fallo { display: grid; gap: 6px; }
.fallo-top { display: flex; align-items: baseline; font-size: 13px; }
.fallo-nombre { display: inline-flex; align-items: center; gap: 8px; }
.fallo-dot { width: 9px; height: 9px; border-radius: 999px; flex: none; }
.fallo-veces { margin-left: auto; font-size: 12px; color: var(--ink-500); }
.fallo-bar { height: 7px; border-radius: 999px; background: var(--periwinkle-100); overflow: hidden; }
.fallo-fill { height: 100%; }
.fallo-nota { margin: 2px 0 0; font-size: 12px; line-height: 1.5; color: var(--ink-500); }

.res-acciones { display: flex; gap: 10px; flex-wrap: wrap; }

.vacio { display: grid; justify-items: center; gap: 16px; text-align: center; padding: 56px 30px; background: var(--paper); border: 1.5px dashed var(--ink-300); border-radius: 24px; }
.vacio-icon { width: 66px; height: 66px; border-radius: 20px; background: var(--pastel-sky); display: grid; place-items: center; color: var(--ink-900); }
.vacio-text { display: grid; gap: 6px; max-width: 400px; }
.vacio-text strong { font-size: 20px; }
.vacio-text p { margin: 0; font-size: 14px; line-height: 1.5; color: var(--ink-500); }

@media (max-width: 880px) {
  .titulo { font-size: 26px; }
  .hero { gap: 18px; padding: 18px 20px; }
  .ring-wrap { width: 96px; height: 96px; }
}
</style>
