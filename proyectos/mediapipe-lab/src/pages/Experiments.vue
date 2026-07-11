<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a
        href="#/"
        class="back-btn"
      >← Back</a>
      <h1>⚗️ EXPERIMENTS - Playground</h1>
      <p class="subtitle">
        Todos los landmarks de MediaPipe, capa por capa
      </p>
    </header>

    <main class="experiment-main">
      <section class="info-section">
        <h2>Laboratorio de capas</h2>
        <p>
          Aquí corren los tres modelos a la vez: cuerpo, manos y cara. Prende y apaga cada capa
          para ver qué trae, cuánto FPS cuesta, y qué se te ocurre construir con ella.
        </p>

        <div class="features-grid">
          <div class="feature">
            <span class="feature-icon">🫂</span>
            <h3>Cuerpo</h3>
            <p>33 puntos: cara, brazos y torso, piernas y pies — por zonas.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">✋</span>
            <h3>Manos</h3>
            <p>21 puntos por mano con todas las articulaciones de los dedos.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🙂</span>
            <h3>Cara</h3>
            <p>Malla de 478 puntos con rasgos e iris.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🏷️</span>
            <h3>Modo explicación</h3>
            <p>El nombre de cada punto, en vivo sobre el video.</p>
          </div>
        </div>

        <button
          class="btn btn-primary"
          @click="launchExperiment"
        >
          🧪 Launch Experiment
        </button>

        <div class="experiment-section">
          <div
            class="camera-stage"
            :class="{ 'is-active': experimentRunning, 'is-inactive': !experimentRunning }"
          >
            <video
              ref="videoRef"
              class="camera-preview"
              autoplay
              playsinline
              muted
            />
            <canvas
              ref="canvasRef"
              class="landmarks-canvas"
              aria-label="Landmarks de cuerpo, manos y cara"
            />
          </div>

          <div
            v-if="experimentRunning"
            class="layers-panel"
            aria-label="Capas de landmarks"
          >
            <div class="layer-group">
              <span class="layer-title">🫂 Cuerpo</span>
              <label class="chip"><input
                v-model="layers.pose"
                type="checkbox"
              > activo</label>
              <label
                class="chip"
                :class="{ dim: !layers.pose }"
              >
                <input
                  v-model="display.poseCara"
                  :disabled="!layers.pose"
                  type="checkbox"
                > puntos de cara
              </label>
              <label
                class="chip"
                :class="{ dim: !layers.pose }"
              >
                <input
                  v-model="display.poseBrazos"
                  :disabled="!layers.pose"
                  type="checkbox"
                > brazos y torso
              </label>
              <label
                class="chip"
                :class="{ dim: !layers.pose }"
              >
                <input
                  v-model="display.posePiernas"
                  :disabled="!layers.pose"
                  type="checkbox"
                > piernas y pies
              </label>
            </div>
            <div class="layer-group">
              <span class="layer-title">✋ Manos</span>
              <label class="chip"><input
                v-model="layers.hands"
                type="checkbox"
              > activas</label>
            </div>
            <div class="layer-group">
              <span class="layer-title">🙂 Cara</span>
              <label class="chip"><input
                v-model="layers.face"
                type="checkbox"
              > activa</label>
              <label
                class="chip"
                :class="{ dim: !layers.face }"
              >
                <input
                  v-model="display.faceMalla"
                  :disabled="!layers.face"
                  type="checkbox"
                > malla
              </label>
              <label
                class="chip"
                :class="{ dim: !layers.face }"
              >
                <input
                  v-model="display.faceRasgos"
                  :disabled="!layers.face"
                  type="checkbox"
                > rasgos
              </label>
              <label
                class="chip"
                :class="{ dim: !layers.face }"
              >
                <input
                  v-model="display.faceIris"
                  :disabled="!layers.face"
                  type="checkbox"
                > iris
              </label>
            </div>
            <div class="layer-group">
              <span class="layer-title">🏷️ Explicación</span>
              <label class="chip"><input
                v-model="display.etiquetas"
                type="checkbox"
              > nombres de los puntos</label>
              <span class="fps-badge">{{ approximateFps }} fps</span>
            </div>
          </div>

          <p
            v-if="experimentStatus"
            class="status"
          >
            {{ experimentStatus }}
          </p>
          <p
            v-if="trackingStatus"
            class="status"
          >
            {{ trackingStatus }}
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useMediaPipeTrackingCamera } from '../composables/useMediaPipeTrackingCamera'

const {
  approximateFps,
  cameraActive: experimentRunning,
  cameraStatus: experimentStatus,
  display,
  layers,
  start,
  trackingStatus,
  canvasRef,
  videoRef,
} = useMediaPipeTrackingCamera({ hands: true, pose: true, face: true })

const launchExperiment = () => {
  start('Playground activo: prende y apaga capas para ver qué trae cada modelo.')
}
</script>

<style scoped>
.layers-panel {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-align: left;
}

.layer-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.layer-title {
  min-width: 118px;
  font-weight: 700;
  font-size: var(--text-sm);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  font-size: var(--text-xs);
  cursor: pointer;
  user-select: none;
}

.chip.dim {
  opacity: 0.45;
}

.fps-badge {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
