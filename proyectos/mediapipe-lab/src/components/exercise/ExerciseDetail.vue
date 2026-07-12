<template>
  <div class="ficha">
    <a
      href="#/exercise"
      class="volver"
      @click.prevent="$emit('back')"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ><path d="m15 18-6-6 6-6" /></svg>
      Biblioteca
    </a>

    <div class="cuerpo">
      <!-- Preview de referencia -->
      <div class="preview">
        <div
          class="preview-pose"
          :style="{ background: exercise.pastel }"
        >
          <div class="preview-glyph">
            <PoseGlyph :pose="exercise.pose" />
          </div>
          <span class="preview-label">POSE DE REFERENCIA</span>
        </div>
        <UiButton
          variant="primary"
          size="lg"
          block
          @click="$emit('coach')"
        >
          Practicar con cámara
        </UiButton>
        <div class="preview-acciones">
          <UiButton
            variant="ghost"
            size="sm"
            @click="$emit('capture')"
          >
            Recapturar
          </UiButton>
          <UiButton
            variant="ghost"
            size="sm"
            @click="$emit('add-routine')"
          >
            Añadir a rutina
          </UiButton>
        </div>
      </div>

      <!-- Info educativa -->
      <div class="info">
        <div class="info-head">
          <h1 class="nombre">
            {{ exercise.nombre }}
          </h1>
          <div class="badges">
            <UiBadge tone="brand">
              {{ exercise.zona }}
            </UiBadge>
            <UiBadge tone="soft">
              {{ exercise.aparato }}
            </UiBadge>
            <UiBadge tone="soft">
              {{ exercise.nivel }}
            </UiBadge>
            <UiBadge tone="mint">
              {{ exercise.cat }}
            </UiBadge>
          </div>
          <p class="para">
            {{ exercise.para }}
          </p>
        </div>

        <!-- Músculos -->
        <div class="tarjeta">
          <span class="eyebrow">MÚSCULOS QUE TRABAJAN</span>
          <div class="musculos">
            <span
              v-for="m in exercise.musculos"
              :key="m"
              class="musculo"
            >{{ m }}</span>
          </div>
        </div>

        <!-- Cómo + Beneficios -->
        <div class="dos-col">
          <div class="tarjeta">
            <span class="eyebrow">CÓMO SE HACE</span>
            <div class="pasos">
              <div
                v-for="paso in exercise.como"
                :key="paso.n"
                class="paso"
              >
                <span class="paso-n">{{ paso.n }}</span>
                <span class="paso-t">{{ paso.t }}</span>
              </div>
            </div>
          </div>
          <div class="tarjeta">
            <span class="eyebrow">BENEFICIOS</span>
            <div class="beneficios">
              <div
                v-for="b in exercise.beneficios"
                :key="b"
                class="beneficio"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--success)"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ><path d="M20 6 9 17l-5-5" /></svg>
                <span>{{ b }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Errores comunes -->
        <div class="errores">
          <span class="eyebrow dark">ERRORES COMUNES</span>
          <div class="errores-lista">
            <div
              v-for="er in exercise.errores"
              :key="er"
              class="error"
            >
              <span class="error-x">✕</span>
              <span>{{ er }}</span>
            </div>
          </div>
        </div>

        <!-- Precauciones -->
        <div class="precaucion">
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
            cx="12"
            cy="12"
            r="9"
          /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>
          <span>{{ exercise.precauciones }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PoseGlyph from './PoseGlyph.vue'
import UiButton from './UiButton.vue'
import UiBadge from './UiBadge.vue'

defineProps({
  exercise: { type: Object, required: true },
})
defineEmits(['back', 'coach', 'capture', 'add-routine'])
</script>

<style scoped>
.ficha { display: grid; gap: 18px; max-width: 1000px; }
.volver { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; text-decoration: none; color: var(--ink-500); width: fit-content; }
.volver:hover { color: var(--periwinkle-700); }

.cuerpo { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 20px; align-items: start; }

.preview { display: grid; gap: 14px; position: sticky; top: 20px; }
.preview-pose { position: relative; aspect-ratio: 3 / 4; border-radius: 22px; overflow: hidden; display: grid; place-items: center; box-shadow: var(--shadow-sm); }
.preview-glyph { width: 64%; height: 70%; opacity: 0.85; }
.preview-label { position: absolute; top: 12px; left: 12px; font-size: 10px; letter-spacing: 0.12em; font-weight: 700; padding: 5px 11px; border-radius: 999px; background: rgba(255, 255, 255, 0.8); color: var(--ink-700); }
.preview-acciones { display: flex; gap: 8px; justify-content: center; }

.info { display: grid; gap: 16px; min-width: 0; }
.info-head { display: grid; gap: 8px; }
.nombre { margin: 0; font-family: var(--font-display); font-size: 36px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.badges { display: flex; gap: 7px; flex-wrap: wrap; }
.para { margin: 4px 0 0; font-size: 16px; line-height: 1.55; color: var(--ink-700); }

.tarjeta { display: grid; gap: 12px; padding: 18px 20px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 18px; }
.eyebrow { font-size: 10.5px; letter-spacing: 0.14em; font-weight: 700; color: var(--periwinkle-700); }
.eyebrow.dark { color: var(--ink-700); }

.musculos { display: flex; gap: 7px; flex-wrap: wrap; }
.musculo { font-size: 13px; font-weight: 600; padding: 6px 13px; border-radius: 999px; background: var(--periwinkle-50); color: var(--periwinkle-700); }

.dos-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.pasos { display: grid; gap: 12px; }
.paso { display: grid; grid-template-columns: 24px 1fr; gap: 11px; align-items: start; }
.paso-n { width: 24px; height: 24px; border-radius: 999px; background: var(--periwinkle-500); color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
.paso-t { font-size: 13.5px; line-height: 1.5; color: var(--ink-700); }
.beneficios { display: grid; gap: 10px; }
.beneficio { display: flex; gap: 10px; align-items: start; }
.beneficio svg { flex: none; margin-top: 1px; }
.beneficio span { font-size: 13.5px; line-height: 1.5; color: var(--ink-700); }

.errores { display: grid; gap: 12px; padding: 18px 20px; background: var(--pastel-butter); border-radius: 18px; }
.errores-lista { display: grid; gap: 9px; }
.error { display: flex; gap: 10px; align-items: start; }
.error-x { color: #C7842F; font-weight: 800; flex: none; font-size: 15px; line-height: 1.35; }
.error span:last-child { font-size: 13.5px; line-height: 1.5; color: var(--ink-900); }

.precaucion { display: flex; gap: 12px; align-items: start; padding: 15px 18px; background: var(--oat); border-radius: 14px; }
.precaucion svg { flex: none; margin-top: 1px; }
.precaucion span { font-size: 12.5px; line-height: 1.5; color: var(--ink-500); }

@media (max-width: 880px) {
  .cuerpo { grid-template-columns: 1fr; }
  .preview { position: static; }
  .preview-pose { aspect-ratio: 4 / 3; }
  .nombre { font-size: 28px; }
  .dos-col { grid-template-columns: 1fr; }
}
</style>
