<template>
  <div class="experiment-page">
    <header class="experiment-header">
      <a
        href="#/"
        class="back-btn"
      >← Back</a>
      <h1>🪄 WHIMSY · Jardín de Manos</h1>
      <p class="subtitle">
        Un jardín que florece con tus gestos: nada de clics, pura magia de manos.
      </p>
    </header>

    <main class="experiment-main">
      <section class="info-section">
        <div class="features-grid">
          <div class="feature">
            <span class="feature-icon">🤏</span>
            <h3>Pellizca</h3>
            <p>Junta índice y pulgar para plantar una flor donde pellizques.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">🖐️</span>
            <h3>Palma abierta</h3>
            <p>Mueve la mano abierta y sopla viento que mece el jardín.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">✊</span>
            <h3>Puño</h3>
            <p>Cierra el puño para soltar una nube de mariposas.</p>
          </div>
          <div class="feature">
            <span class="feature-icon">☝️</span>
            <h3>Índice arriba</h3>
            <p>Dibuja estelas de destellos con la punta del dedo.</p>
          </div>
        </div>

        <div class="stage-controls">
          <button
            v-if="!cameraActive"
            class="btn btn-primary"
            type="button"
            @click="startGarden"
          >
            🌱 Abrir el jardín
          </button>
          <button
            v-else
            class="btn"
            type="button"
            @click="stop"
          >
            ■ Cerrar
          </button>
          <button
            class="btn"
            type="button"
            :disabled="!flowersCount"
            @click="pruneGarden"
          >
            ✂️ Podar jardín
          </button>
        </div>

        <div class="tracking-section">
          <div
            class="camera-stage garden-stage"
            :class="{ 'is-active': cameraActive, 'is-inactive': !cameraActive }"
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
              class="landmarks-canvas subtle"
              aria-hidden="true"
            />
            <canvas
              ref="gardenCanvasRef"
              class="garden-canvas"
              aria-label="Jardín interactivo"
            />
          </div>
          <p
            v-if="cameraStatus"
            class="status"
          >
            {{ cameraStatus }}
          </p>
          <p
            v-if="cameraActive"
            class="status"
          >
            🌼 {{ flowersCount }} flores · viento {{ windLabel }}
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../composables/useMediaPipeTrackingCamera'
import { detectBasicGesture } from '../services/gestureRules'

const MAX_FLOWERS = 36
const MAX_SPARKLES = 140
const MAX_BUTTERFLIES = 24
const PINCH_THRESHOLD = 0.055

const {
  cameraActive,
  cameraStatus,
  handResults,
  start,
  stop,
  canvasRef,
  videoRef,
} = useMediaPipeTrackingCamera({ hands: true, pose: false })

const gardenCanvasRef = ref(null)
const flowersCount = ref(0)
const windLevel = ref(0)

const flowers = []
const sparkles = []
const butterflies = []
const handMemory = new Map()
let wind = 0
let gardenFrameId = null
// El arte del jardín está dimensionado en pixeles pensados para video de 640
// de ancho; a 720p las flores saldrían de la mitad de tamaño sin este factor.
let resScale = 1

const windLabel = computed(() => {
  if (windLevel.value > 0.6) return 'fuerte 🌬️'
  if (windLevel.value > 0.15) return 'suave 🍃'
  return 'en calma'
})

const plantFlower = (x, y) => {
  flowers.push({
    x,
    y,
    hue: 290 + Math.random() * 120,
    size: 0.75 + Math.random() * 0.6,
    plantedAt: performance.now(),
    phase: Math.random() * Math.PI * 2,
  })
  if (flowers.length > MAX_FLOWERS) flowers.shift()
  flowersCount.value = flowers.length
}

const spawnSparkle = (x, y) => {
  sparkles.push({ x, y, bornAt: performance.now(), drift: (Math.random() - 0.5) * 0.6 })
  if (sparkles.length > MAX_SPARKLES) sparkles.shift()
}

const releaseButterflies = (x, y) => {
  for (let i = 0; i < 5; i += 1) {
    butterflies.push({
      x,
      y,
      hue: 20 + Math.random() * 320,
      bornAt: performance.now(),
      speed: 0.4 + Math.random() * 0.9,
      angle: Math.random() * Math.PI * 2,
      wobble: Math.random() * Math.PI * 2,
    })
  }
  while (butterflies.length > MAX_BUTTERFLIES) butterflies.shift()
}

const pruneGarden = () => {
  flowers.length = 0
  sparkles.length = 0
  butterflies.length = 0
  flowersCount.value = 0
}

const easeOutBack = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * ((t - 1) ** 3) + c1 * ((t - 1) ** 2)
}

const readHands = (width, height) => {
  const results = handResults.value
  const now = performance.now()
  const seen = new Set()

  results?.landmarks?.forEach((landmarks, index) => {
    seen.add(index)
    const memory = handMemory.get(index) || { pinching: false, fist: false, palm: null }

    const thumb = landmarks[4]
    const indexTip = landmarks[8]
    const pinchDistance = Math.hypot(thumb.x - indexTip.x, thumb.y - indexTip.y)
    const pinching = pinchDistance < PINCH_THRESHOLD

    if (pinching && !memory.pinching) {
      plantFlower(((thumb.x + indexTip.x) / 2) * width, ((thumb.y + indexTip.y) / 2) * height)
    }

    const gesture = detectBasicGesture(landmarks)
    const palm = landmarks[9]

    if (gesture === 'fist' && !memory.fist) {
      releaseButterflies(palm.x * width, palm.y * height)
    }

    if (gesture === 'index_up') {
      spawnSparkle(indexTip.x * width, indexTip.y * height)
    }

    if (gesture === 'open_hand' && memory.palm) {
      const dt = Math.max(16, now - memory.palm.at)
      const vx = Math.abs(palm.x - memory.palm.x) / dt
      const vy = Math.abs(palm.y - memory.palm.y) / dt
      wind = Math.min(1.4, wind + (vx + vy) * 260)
    }

    handMemory.set(index, {
      pinching,
      fist: gesture === 'fist',
      palm: { x: palm.x, y: palm.y, at: now },
    })
  })

  for (const key of handMemory.keys()) {
    if (!seen.has(key)) handMemory.delete(key)
  }
}

const drawFlower = (context, flower, now) => {
  const growth = Math.min(1, (now - flower.plantedAt) / 900)
  const scale = flower.size * easeOutBack(growth) * resScale
  const sway = Math.sin(now * 0.0018 + flower.phase) * (2.5 + wind * 26) * resScale
  const stemHeight = 46 * scale
  const headX = flower.x + sway
  const headY = flower.y - stemHeight

  context.strokeStyle = 'hsl(140 45% 38%)'
  context.lineWidth = 3 * scale
  context.beginPath()
  context.moveTo(flower.x, flower.y)
  context.quadraticCurveTo(flower.x + sway * 0.4, flower.y - stemHeight * 0.55, headX, headY)
  context.stroke()

  context.fillStyle = 'hsl(140 45% 45%)'
  context.beginPath()
  context.ellipse(flower.x + 7 * scale + sway * 0.2, flower.y - stemHeight * 0.4, 7 * scale, 3.2 * scale, -0.6, 0, Math.PI * 2)
  context.fill()

  const petals = 6
  for (let i = 0; i < petals; i += 1) {
    const angle = (i / petals) * Math.PI * 2 + flower.phase
    context.fillStyle = `hsl(${flower.hue} 78% 78%)`
    context.beginPath()
    context.ellipse(
      headX + Math.cos(angle) * 9 * scale,
      headY + Math.sin(angle) * 9 * scale,
      7.5 * scale,
      4.5 * scale,
      angle,
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  context.fillStyle = `hsl(${(flower.hue + 160) % 360} 80% 62%)`
  context.beginPath()
  context.arc(headX, headY, 5 * scale, 0, Math.PI * 2)
  context.fill()
}

const drawSparkle = (context, sparkle, now) => {
  const age = (now - sparkle.bornAt) / 900
  if (age >= 1) return false
  const alpha = 1 - age
  const size = (3 + age * 5) * resScale
  const x = sparkle.x + sparkle.drift * age * 60 * resScale
  const y = sparkle.y - age * 34 * resScale

  context.save()
  context.globalAlpha = alpha
  context.fillStyle = 'hsl(48 95% 72%)'
  context.translate(x, y)
  context.rotate(age * 3)
  context.beginPath()
  for (let i = 0; i < 4; i += 1) {
    context.rotate(Math.PI / 2)
    context.moveTo(0, 0)
    context.lineTo(size, 0)
    context.lineTo(size * 0.3, size * 0.3)
  }
  context.fill()
  context.restore()
  return true
}

const drawButterfly = (context, butterfly, now) => {
  const age = (now - butterfly.bornAt) / 4200
  if (age >= 1) return false

  butterfly.wobble += 0.14
  butterfly.angle += (Math.random() - 0.5) * 0.3
  butterfly.x += Math.cos(butterfly.angle) * butterfly.speed * 2.2 * resScale
  butterfly.y += (Math.sin(butterfly.angle) * butterfly.speed * 2.2 - 0.5) * resScale

  const flap = Math.abs(Math.sin(butterfly.wobble)) * 0.8 + 0.2
  context.save()
  context.globalAlpha = 1 - age
  context.translate(butterfly.x, butterfly.y)
  context.scale(resScale, resScale)
  context.fillStyle = `hsl(${butterfly.hue} 82% 70%)`
  context.beginPath()
  context.ellipse(-5, 0, 6 * flap, 4, 0.5, 0, Math.PI * 2)
  context.ellipse(5, 0, 6 * flap, 4, -0.5, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = 'hsl(260 25% 30%)'
  context.fillRect(-1, -5, 2, 10)
  context.restore()
  return true
}

const renderGarden = () => {
  const canvas = gardenCanvasRef.value
  const video = videoRef.value
  if (!canvas || !video) {
    gardenFrameId = requestAnimationFrame(renderGarden)
    return
  }

  const width = video.videoWidth || 1280
  const height = video.videoHeight || 720
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  resScale = Math.max(width / 640, 1)

  const context = canvas.getContext('2d')
  const now = performance.now()
  context.clearRect(0, 0, width, height)

  readHands(width, height)

  wind *= 0.94
  windLevel.value = Math.round(wind * 100) / 100

  flowers.forEach((flower) => drawFlower(context, flower, now))

  for (let i = sparkles.length - 1; i >= 0; i -= 1) {
    if (!drawSparkle(context, sparkles[i], now)) sparkles.splice(i, 1)
  }
  for (let i = butterflies.length - 1; i >= 0; i -= 1) {
    if (!drawButterfly(context, butterflies[i], now)) butterflies.splice(i, 1)
  }

  gardenFrameId = requestAnimationFrame(renderGarden)
}

watch(cameraActive, (active) => {
  if (active && gardenFrameId === null) {
    gardenFrameId = requestAnimationFrame(renderGarden)
  } else if (!active && gardenFrameId !== null) {
    cancelAnimationFrame(gardenFrameId)
    gardenFrameId = null
    const context = gardenCanvasRef.value?.getContext('2d')
    context?.clearRect(0, 0, gardenCanvasRef.value.width, gardenCanvasRef.value.height)
  }
})

onBeforeUnmount(() => {
  if (gardenFrameId !== null) cancelAnimationFrame(gardenFrameId)
})

const startGarden = () => {
  start('Jardín abierto: pellizca para plantar tu primera flor.')
}
</script>

<style scoped>
.garden-stage { aspect-ratio: 16 / 10; }
.garden-stage::before { content: 'Jardín cerrado'; }

.landmarks-canvas.subtle { opacity: 0.35; }

.garden-canvas {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform: scaleX(-1);
  /* Igual que .landmarks-canvas: el buffer mide videoWidth x videoHeight,
     así que debe recortarse con cover como el video para que flores y
     destellos caigan donde está la mano. */
  object-fit: cover;
}

.stage-controls { display: flex; flex-wrap: wrap; gap: var(--space-2); }
</style>
