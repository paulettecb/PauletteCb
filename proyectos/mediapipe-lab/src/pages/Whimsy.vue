<template>
  <div class="wg" :class="{ 'is-jardin': screen === 'jardin' }">
    <!-- ══════════ SIDEBAR (escritorio) ══════════ -->
    <nav class="wg-side" aria-label="Navegación de Whimsy Garden">
      <div class="wg-brand">
        <span class="wg-brand-name">Whimsy Garden</span>
        <span class="wg-heart" aria-hidden="true">♥</span>
      </div>
      <p class="wg-brand-tag">MOTION LAB · MANOS EN VIVO</p>

      <a class="wg-side-home" href="#/">← Motion Lab</a>

      <button
        v-for="item in NAV"
        :key="item.id"
        type="button"
        class="wg-side-link"
        :class="{ 'is-active': screen === item.id }"
        :aria-current="screen === item.id ? 'page' : undefined"
        @click="go(item.id)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span class="wg-ic" aria-hidden="true" v-html="item.icon" />
        {{ item.label }}
      </button>

      <div class="wg-side-status">
        <span class="wg-dot wg-dot--live" aria-hidden="true" />
        <div>
          <strong>Todo local</strong>
          <span>tu mano nunca sale de aquí</span>
        </div>
      </div>
    </nav>

    <!-- ══════════ TOPBAR (móvil) ══════════ -->
    <header v-show="screen !== 'jardin'" class="wg-topbar">
      <a class="wg-topback" href="#/" aria-label="Volver a Motion Lab">←</a>
      <span class="wg-brand-name wg-brand-name--sm">Whimsy Garden</span>
      <span class="wg-heart" aria-hidden="true">♥</span>
      <span class="wg-topbar-badge">
        <span class="wg-dot wg-dot--live" aria-hidden="true" />local
      </span>
    </header>

    <!-- ══════════ MAIN ══════════ -->
    <main class="wg-main">
      <!-- ─────── JARDÍN ─────── -->
      <section v-show="screen === 'jardin'" class="wg-screen wg-screen--jardin" aria-label="Jardín">
        <div class="wg-jardin-head">
          <h1 class="wg-display">Tu jardín</h1>
          <span class="wg-badge-soft">{{ estadoBadge }}</span>
          <div class="wg-jardin-actions">
            <button
              type="button"
              class="wg-btn wg-btn--ghost wg-btn--sm"
              :disabled="!flowersCount"
              @click="pruneGarden"
            >
              Podar
            </button>
            <button
              v-if="cameraActive"
              type="button"
              class="wg-btn wg-btn--ghost wg-btn--sm"
              @click="stop"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div class="wg-jardin-layout">
          <!-- STAGE -->
          <div class="wg-stage-col">
            <div class="wg-stage" ref="stageRef">
              <video
                ref="videoRef"
                class="wg-stage-video"
                :class="{ 'is-hidden': !cameraActive }"
                autoplay
                playsinline
                muted
              />
              <canvas
                ref="canvasRef"
                class="wg-stage-skeleton"
                :class="{ 'is-off': !showSkeleton }"
                aria-hidden="true"
              />
              <canvas
                ref="gardenCanvasRef"
                class="wg-stage-garden"
                aria-label="Jardín interactivo que florece con tus manos"
              />

              <!-- HUD (cámara activa) -->
              <template v-if="cameraActive">
                <span class="wg-live-pill">
                  <span class="wg-dot wg-dot--rec" aria-hidden="true" />EN VIVO
                </span>
                <div class="wg-hud-right">
                  <span class="wg-hud-pill">✋ {{ handsLabel }}</span>
                  <span class="wg-hud-pill wg-hud-pill--ok">{{ approximateFps }} fps</span>
                </div>
                <div class="wg-hint-pill">
                  <span class="wg-dot wg-dot--pop" aria-hidden="true" />
                  Pellizca para plantar · abre la palma para el viento
                </div>
                <div class="wg-gesture-dock" aria-hidden="true">
                  <span v-for="g in GESTOS" :key="g.id" class="wg-dock-chip">
                    <span class="wg-dock-emoji">{{ g.emoji }}</span>{{ g.corto }}
                  </span>
                </div>
              </template>

              <!-- CARGANDO -->
              <div v-else-if="starting" class="wg-stage-overlay">
                <div class="wg-stage-loading">
                  <span class="wg-mono wg-mono--dim">CARGANDO MODELO · hand_landmarker</span>
                  <div class="wg-progress"><div class="wg-progress-bar" /></div>
                </div>
              </div>

              <!-- APAGADO (pedir cámara) -->
              <div v-else class="wg-stage-overlay">
                <div class="wg-stage-ask">
                  <span class="wg-ask-ic" aria-hidden="true">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span class="wg-ic wg-ic--lg" v-html="IC.plant" />
                  </span>
                  <strong>Vamos a pedir tu cámara</strong>
                  <p>Mueve las manos frente al lente y el jardín florece. El video se queda en tu dispositivo — nada se graba ni se envía.</p>
                  <button type="button" class="wg-btn wg-btn--primary wg-btn--md" @click="startGarden">
                    🌱 Abrir el jardín
                  </button>
                </div>
              </div>
            </div>

            <div class="wg-stage-controls">
              <button
                v-if="cameraActive"
                type="button"
                class="wg-btn wg-btn--ghost wg-btn--md"
                @click="stop"
              >
                ■ Cerrar
              </button>
              <button type="button" class="wg-btn wg-btn--ghost wg-btn--md" @click="fullscreen">
                Pantalla completa
              </button>
              <span v-if="cameraActive" class="wg-stage-meta">
                🌼 {{ flowersCount }} flores · viento {{ windLabel }}
              </span>
              <span v-else-if="cameraStatus" class="wg-stage-meta">{{ cameraStatus }}</span>
            </div>
          </div>

          <!-- RAIL -->
          <aside class="wg-rail">
            <div class="wg-rail-card wg-rail-card--dark">
              <div class="wg-rail-card-head">
                <span class="wg-mono wg-mono--dim">EN TU JARDÍN</span>
                <span class="wg-rail-state">{{ estadoCorto }}</span>
              </div>
              <div v-for="row in metricas" :key="row.k" class="wg-rail-row">
                <span>{{ row.k }}</span>
                <span class="wg-mono wg-rail-val">{{ row.v }}</span>
              </div>
            </div>

            <div class="wg-rail-card">
              <strong class="wg-rail-title">Overlays</strong>
              <label class="wg-toggle">
                <span class="wg-switch" :class="{ 'is-on': showSkeleton }"><span class="wg-knob" /></span>
                <input v-model="showSkeleton" type="checkbox" class="wg-sr">Esqueleto de mano
              </label>
              <label class="wg-toggle">
                <span class="wg-switch" :class="{ 'is-on': showPolen }"><span class="wg-knob" /></span>
                <input v-model="showPolen" type="checkbox" class="wg-sr">Rastro de destellos
              </label>
            </div>

            <button type="button" class="wg-rail-card wg-rail-card--link" @click="go('gestos')">
              <span class="wg-rail-title">Gestos del jardín</span>
              <span class="wg-rail-hint">Pellizca, puño, índice y palma · toca para ver qué siembra cada uno →</span>
            </button>
          </aside>
        </div>
      </section>

      <!-- ─────── GESTOS ─────── -->
      <section v-show="screen === 'gestos'" class="wg-screen" aria-label="Gestos">
        <div class="wg-page-head">
          <h1 class="wg-display wg-display--md">Gestos</h1>
          <span class="wg-page-sub">tus manos siembran distinto según el gesto · sin clics, pura magia</span>
        </div>

        <div class="wg-gesto-grid">
          <article v-for="g in GESTOS" :key="g.id" class="wg-gesto-card">
            <div class="wg-gesto-icon" :style="{ background: g.pastel }">{{ g.emoji }}</div>
            <div class="wg-gesto-body">
              <strong class="wg-gesto-name">{{ g.nombre }}</strong>
              <p class="wg-gesto-desc">{{ g.desc }}</p>
              <span class="wg-chips">
                <span v-for="c in g.chips" :key="c" class="wg-chip">{{ c }}</span>
              </span>
            </div>
          </article>
        </div>

        <div class="wg-landmarks-note">
          <span class="wg-mono">21 LANDMARKS</span>
          <span>
            MediaPipe sigue <strong>21 puntos por mano</strong> en tu navegador. De ahí salen el
            pellizco, el puño y la palma abierta — todo en vivo, sin subir un solo frame.
          </span>
        </div>
      </section>

      <!-- ─────── CÓMO FUNCIONA ─────── -->
      <section v-show="screen === 'como'" class="wg-screen" aria-label="Cómo funciona">
        <div class="wg-como-hero">
          <span class="wg-eyebrow">MANOS EN VIVO · 100% LOCAL</span>
          <h1 class="wg-display wg-display--md">Siembras con las manos, no con el ratón.</h1>
          <p class="wg-lede">
            MediaPipe detecta 21 puntos de cada mano en tu navegador. Esos puntos guían dónde
            brota cada flor — y el video nunca sale de tu dispositivo.
          </p>
        </div>

        <div class="wg-pasos-grid">
          <div v-for="p in PASOS" :key="p.n" class="wg-paso-card">
            <span class="wg-paso-num" :style="{ background: p.pastel }">{{ p.n }}</span>
            <strong class="wg-paso-title">{{ p.t }}</strong>
            <p class="wg-paso-desc">{{ p.d }}</p>
          </div>
        </div>

        <div class="wg-priv-grid">
          <div v-for="p in PRIVACIDAD" :key="p.t" class="wg-priv-card">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="wg-ic wg-ic--check" aria-hidden="true" v-html="IC.check" />
            <div>
              <strong>{{ p.t }}</strong>
              <span>{{ p.d }}</span>
            </div>
          </div>
        </div>

        <div class="wg-como-foot">
          <span>Whimsy Garden · Jardín de Manos</span>
          <span class="wg-sep" aria-hidden="true" />
          <span>Detección: MediaPipe Hand Landmarker</span>
          <button type="button" class="wg-link wg-link--tight wg-como-back" @click="go('jardin')">
            Volver al jardín →
          </button>
        </div>
      </section>
    </main>

    <!-- ══════════ BOTTOM NAV (móvil) ══════════ -->
    <nav class="wg-bottomnav" :class="{ 'is-jardin': screen === 'jardin' }" aria-label="Navegación">
      <button
        v-for="item in NAV"
        :key="item.id"
        type="button"
        class="wg-bn-item"
        :class="{ 'is-active': screen === item.id }"
        :aria-current="screen === item.id ? 'page' : undefined"
        @click="go(item.id)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span class="wg-ic" aria-hidden="true" v-html="item.icon" />
        {{ item.label }}
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../composables/useMediaPipeTrackingCamera'
import { detectBasicGesture } from '../services/gestureRules'
import { overlayScale } from '../utils/drawLandmarks'

/* ── Iconos (SVG propios, estáticos) ──────────────────────────────── */
const IC = {
  plant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V11"/><path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5z"/><path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5z"/><path d="M8 22h8"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M14 11V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a5 5 0 0 1-3.6-1.5L5 15.6a1.6 1.6 0 0 1 2.3-2.2L8 14"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
}

const NAV = [
  { id: 'jardin', label: 'Jardín', icon: IC.plant },
  { id: 'gestos', label: 'Gestos', icon: IC.hand },
  { id: 'como', label: 'Cómo', icon: IC.info },
]

/* ── Gestos: qué siembra cada uno (motor real, sin fabricar) ───────── */
const GESTOS = [
  { id: 'pellizco', emoji: '🤏', corto: 'Flores', nombre: 'Pellizco', pastel: 'var(--pastel-blush)', desc: 'Junta índice y pulgar y planta una flor donde pellizques. Crece y se mece con la brisa.', chips: ['plantar', 'persistente'] },
  { id: 'palma', emoji: '🖐️', corto: 'Viento', nombre: 'Palma abierta', pastel: 'var(--pastel-sky)', desc: 'Mueve la mano abierta y levantas viento que mece todo el jardín.', chips: ['brisa'] },
  { id: 'puno', emoji: '✊', corto: 'Mariposas', nombre: 'Puño', pastel: 'var(--pastel-butter)', desc: 'Cierra el puño y sueltas una nube de mariposas que revolotean y se van.', chips: ['efímero'] },
  { id: 'indice', emoji: '☝️', corto: 'Destellos', nombre: 'Índice arriba', pastel: 'var(--pastel-lilac)', desc: 'Dibuja estelas de destellos con la punta del dedo índice.', chips: ['rastro', 'efímero'] },
]

const PASOS = [
  { n: '1', t: 'Abre el jardín', d: 'El modelo de manos se carga localmente. Nada se sube.', pastel: 'var(--pastel-sky)' },
  { n: '2', t: 'Mueve las manos', d: 'MediaPipe sigue 21 puntos por mano en tiempo real.', pastel: 'var(--pastel-mint)' },
  { n: '3', t: 'Florece el jardín', d: 'Cada gesto siembra algo distinto. Poda cuando quieras.', pastel: 'var(--pastel-blush)' },
]

const PRIVACIDAD = [
  { t: 'Procesamiento local', d: 'WebAssembly corre la detección en tu navegador, sin backend.' },
  { t: 'Cero grabación', d: 'Ningún frame se guarda ni se sube. Solo se procesan landmarks.' },
  { t: 'LED apagado al salir', d: 'Al cerrar el jardín se detiene la cámara: la luz se apaga.' },
  { t: 'Sin cuentas', d: 'No pedimos datos personales para sembrar.' },
]

/* ── Navegación entre pantallas ───────────────────────────────────── */
const screen = ref('jardin')
function go (id) { screen.value = id }

/* ── Motor de manos (MediaPipe, sin tocar) ────────────────────────── */
const MAX_FLOWERS = 36
const MAX_SPARKLES = 140
const MAX_BUTTERFLIES = 24
const PINCH_THRESHOLD = 0.055

const {
  approximateFps,
  cameraActive,
  cameraStatus,
  detectedHandsCount,
  handResults,
  start,
  stop,
  canvasRef,
  videoRef,
} = useMediaPipeTrackingCamera({ hands: true, pose: false })

const stageRef = ref(null)
const gardenCanvasRef = ref(null)
const flowersCount = ref(0)
const windLevel = ref(0)
const starting = ref(false)

/* Overlays (toggles reales que sí controlan el render) */
const showSkeleton = ref(true)
const showPolen = ref(true)

const flowers = []
const sparkles = []
const butterflies = []
const handMemory = new Map()
let wind = 0
let gardenFrameId = null
let resScale = 1

const windLabel = computed(() => {
  if (windLevel.value > 0.6) return 'fuerte 🌬️'
  if (windLevel.value > 0.15) return 'suave 🍃'
  return 'en calma'
})

const handsLabel = computed(() => {
  const n = detectedHandsCount.value
  return `${n} ${n === 1 ? 'mano' : 'manos'}`
})

const estadoBadge = computed(() => {
  if (cameraActive.value) return 'sembrando · en vivo'
  if (starting.value) return 'cargando modelo…'
  return 'jardín en pausa'
})
const estadoCorto = computed(() => {
  if (cameraActive.value) return 'RUNNING'
  if (starting.value) return 'LOADING'
  return 'IDLE'
})

const metricas = computed(() => {
  if (!cameraActive.value) {
    return [
      { k: 'Flores plantadas', v: '—' },
      { k: 'Manos activas', v: '0' },
      { k: 'Render', v: '—' },
      { k: 'Modelo', v: 'hand_landmarker' },
      { k: 'Motor', v: 'WASM local' },
    ]
  }
  return [
    { k: 'Flores plantadas', v: String(flowersCount.value) },
    { k: 'Manos activas', v: String(detectedHandsCount.value) },
    { k: 'Render', v: `${approximateFps.value} fps` },
    { k: 'Modelo', v: 'hand_landmarker' },
    { k: 'Motor', v: 'WASM local' },
  ]
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
  if (!showPolen.value) return
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

  // Sin dimensiones reales del video todavía no hay dónde dibujar: con un
  // tamaño inventado las flores ya plantadas saldrían movidas unos frames.
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) {
    gardenFrameId = requestAnimationFrame(renderGarden)
    return
  }
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  resScale = overlayScale(width)

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

const startGarden = async () => {
  if (starting.value || cameraActive.value) return
  starting.value = true
  try {
    await start('Jardín abierto: pellizca para plantar tu primera flor.')
  } finally {
    starting.value = false
  }
}

const fullscreen = () => {
  const el = stageRef.value
  if (!el) return
  if (document.fullscreenElement) document.exitFullscreen?.()
  else el.requestFullscreen?.()
}
</script>

<style scoped>
/* ══════════ SHELL ══════════ */
.wg {
  --side-w: 236px;
  display: flex;
  min-height: 100vh;
  align-items: stretch;
  background: var(--oat);
  color: var(--ink-900);
  font-family: 'Hanken Grotesk', var(--font-sans);
}

/* ── Sidebar (escritorio) ── */
.wg-side {
  width: var(--side-w);
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
.wg-brand { padding: 4px 10px 2px; display: flex; align-items: baseline; gap: 7px; }
.wg-brand-name { font-family: var(--font-display); font-size: 24px; line-height: 1; }
.wg-brand-name--sm { font-size: 20px; }
.wg-heart { color: var(--pop-magenta); font-size: 14px; }
.wg-brand-tag { margin: 0; padding: 0 10px 10px; font-size: 10px; letter-spacing: 0.16em; font-weight: 600; color: var(--ink-500); }

.wg-side-home {
  margin: 0 6px 8px; padding: 6px 6px; font-size: 12px; font-weight: 600;
  color: var(--ink-500); text-decoration: none; border-radius: 8px;
}
.wg-side-home:hover { color: var(--periwinkle-700); }

.wg-side-link {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border: none; border-radius: 12px; cursor: pointer;
  font-size: 14.5px; font-weight: 600; font-family: inherit; text-align: left;
  background: transparent; color: var(--ink-700);
  transition: background var(--dur-fast, 140ms) var(--ease-out), color var(--dur-fast, 140ms) var(--ease-out);
}
.wg-side-link:hover { background: var(--periwinkle-50); }
.wg-side-link.is-active { background: var(--periwinkle-50); color: var(--periwinkle-700); }
.wg-side-link:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

.wg-side-status {
  margin-top: auto; display: flex; align-items: center; gap: 10px;
  padding: 12px; border-radius: 16px; background: var(--oat);
}
.wg-side-status strong { font-size: 12.5px; display: block; }
.wg-side-status span { font-size: 11px; color: var(--ink-700); }

.wg-dot { width: 9px; height: 9px; border-radius: 999px; flex: none; }
.wg-dot--live { background: var(--success); box-shadow: 0 0 0 4px rgba(79, 164, 122, 0.16); }
.wg-dot--rec { width: 8px; height: 8px; background: var(--danger); animation: wg-rec 1.4s infinite; }
.wg-dot--pop { width: 8px; height: 8px; background: var(--pop-magenta); }

/* ── Topbar (móvil) ── */
.wg-topbar { display: none; }

/* ══════════ MAIN ══════════ */
.wg-main { flex: 1; min-width: 0; padding: 28px 32px; box-sizing: border-box; }
.wg-screen { display: grid; gap: 20px; max-width: 1040px; }
.wg-screen--jardin { max-width: 1180px; gap: 16px; }

/* ── Tipografía ── */
.wg-display { margin: 0; font-family: var(--font-display); font-size: 32px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.wg-display--md { font-size: 34px; line-height: 1.04; }
.wg-eyebrow { font-size: 10.5px; letter-spacing: 0.18em; font-weight: 700; color: var(--periwinkle-700); }
.wg-lede { margin: 0; font-size: 15px; line-height: 1.6; color: var(--ink-700); max-width: 520px; }
.wg-mono { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 11px; letter-spacing: 0.04em; }
.wg-mono--dim { color: rgba(255, 255, 255, 0.6); letter-spacing: 0.06em; }

.wg-link { border: none; background: none; padding: 0; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--periwinkle-700); text-decoration: none; }
.wg-link:hover { color: var(--periwinkle-600); }

/* ── Botones ── */
.wg-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1.5px solid transparent; border-radius: 999px; cursor: pointer;
  font-family: inherit; font-weight: 600; white-space: nowrap;
  transition: background var(--dur-fast, 140ms) var(--ease-out), color var(--dur-fast, 140ms) var(--ease-out), border-color var(--dur-fast, 140ms) var(--ease-out), box-shadow var(--dur-base, 220ms) var(--ease-out), transform var(--dur-fast, 140ms) var(--ease-out);
}
.wg-btn:active { transform: translateY(1px) scale(0.99); }
.wg-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.wg-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.wg-btn--md { height: 44px; padding: 0 20px; font-size: 15px; }
.wg-btn--sm { height: 36px; padding: 0 15px; font-size: 13.5px; }
.wg-btn--primary { background: var(--periwinkle-500); color: #fff; box-shadow: var(--shadow-sm); }
.wg-btn--primary:hover { background: var(--periwinkle-600); box-shadow: var(--shadow-md); }
.wg-btn--ghost { background: transparent; color: var(--periwinkle-700); border-color: var(--ink-100); }
.wg-btn--ghost:hover:not(:disabled) { background: var(--periwinkle-50); border-color: var(--periwinkle-200); }

/* ── Iconos ── */
.wg-ic { display: inline-flex; width: 18px; height: 18px; }
.wg-ic :deep(svg) { width: 100%; height: 100%; display: block; }
.wg-ic--lg { width: 30px; height: 30px; }
.wg-ic--check { width: 22px; height: 22px; color: var(--success); flex: none; margin-top: 1px; }

/* ══════════ JARDÍN ══════════ */
.wg-jardin-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.wg-jardin-actions { margin-left: auto; display: flex; gap: 8px; }
.wg-badge-soft { display: inline-flex; align-items: center; padding: 4px 11px; border-radius: 999px; background: var(--periwinkle-50); color: var(--periwinkle-700); font-size: 12px; font-weight: 700; }

.wg-jardin-layout { display: grid; grid-template-columns: minmax(0, 1fr) 284px; gap: 16px; align-items: start; }
.wg-stage-col { display: grid; gap: 12px; min-width: 0; }

.wg-stage {
  position: relative; width: 100%; box-sizing: border-box;
  aspect-ratio: 16 / 10; min-height: 400px;
  background: var(--ink-900); border-radius: 24px; overflow: hidden; box-shadow: var(--shadow-lg);
}
.wg-stage-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; transform: scaleX(-1); background: var(--ink-900); filter: brightness(0.72) saturate(1.05); }
.wg-stage-video.is-hidden { opacity: 0; }
.wg-stage-skeleton {
  position: absolute; inset: 0; width: 100%; height: 100%; display: block;
  pointer-events: none; transform: scaleX(-1); object-fit: cover; opacity: 0.4;
  transition: opacity var(--dur-base, 220ms) var(--ease-out);
}
.wg-stage-skeleton.is-off { opacity: 0; }
.wg-stage-garden {
  position: absolute; inset: 0; z-index: 3; display: block; width: 100%; height: 100%;
  pointer-events: none; transform: scaleX(-1); object-fit: cover;
}

/* HUD */
.wg-live-pill { position: absolute; top: 16px; left: 16px; z-index: 4; display: inline-flex; align-items: center; gap: 7px; padding: 6px 13px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); font-size: 12.5px; font-weight: 700; color: var(--ink-900); }
.wg-hud-right { position: absolute; top: 16px; right: 16px; z-index: 4; display: flex; gap: 8px; }
.wg-hud-pill { padding: 6px 12px; border-radius: 999px; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(6px); color: #fff; font-size: 12px; font-weight: 700; }
.wg-hud-pill--ok { background: rgba(79, 164, 122, 0.92); }
.wg-hint-pill { position: absolute; left: 50%; transform: translateX(-50%); top: 60px; z-index: 4; display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.9); font-size: 12px; font-weight: 600; color: var(--ink-700); white-space: nowrap; }
.wg-gesture-dock { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 4; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding: 7px; border-radius: 22px; background: rgba(20, 19, 27, 0.6); backdrop-filter: blur(10px); box-sizing: border-box; }
.wg-dock-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.12); color: #fff; font-size: 12px; font-weight: 700; }
.wg-dock-emoji { font-size: 14px; }

/* Overlays de estado */
.wg-stage-overlay { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 34px; text-align: center; background: rgba(20, 19, 27, 0.55); }
.wg-stage-ask { display: grid; justify-items: center; gap: 13px; max-width: 360px; }
.wg-stage-ask strong { font-size: 20px; color: #fff; }
.wg-stage-ask p { margin: 0; font-size: 13.5px; line-height: 1.55; color: rgba(255, 255, 255, 0.72); }
.wg-ask-ic { width: 58px; height: 58px; border-radius: 18px; background: rgba(255, 255, 255, 0.1); display: grid; place-items: center; color: rgba(255, 255, 255, 0.9); }
.wg-stage-loading { display: grid; justify-items: center; gap: 14px; width: 100%; max-width: 320px; }
.wg-progress { width: 100%; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.16); overflow: hidden; }
.wg-progress-bar { width: 40%; height: 100%; border-radius: 999px; background: var(--periwinkle-400); animation: wg-indeterminate 1.3s var(--ease-in-out, ease-in-out) infinite; }

.wg-stage-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.wg-stage-meta { margin-left: auto; font-size: 12.5px; color: var(--ink-700); }

/* Rail */
.wg-rail { display: grid; gap: 12px; }
.wg-rail-card { display: grid; gap: 10px; padding: 18px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 18px; }
.wg-rail-card--dark { background: var(--ink-900); color: #fff; border: none; }
.wg-rail-card-head { display: flex; align-items: center; gap: 8px; }
.wg-rail-state { margin-left: auto; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: rgba(79, 164, 122, 0.25); color: #8FE0B4; }
.wg-rail-row { display: flex; align-items: baseline; font-size: 12.5px; color: rgba(255, 255, 255, 0.6); }
.wg-rail-val { margin-left: auto; font-weight: 700; color: #fff; }
.wg-rail-title { font-size: 13px; }
.wg-rail-card--link { text-align: left; cursor: pointer; font-family: inherit; color: inherit; transition: box-shadow var(--dur-base, 220ms) var(--ease-out); }
.wg-rail-card--link:hover { box-shadow: var(--shadow-md); }
.wg-rail-card--link:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.wg-rail-hint { font-size: 11.5px; line-height: 1.4; color: var(--ink-500); }

/* Toggles */
.wg-toggle { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-700); cursor: pointer; }
.wg-switch { width: 34px; height: 20px; border-radius: 999px; background: var(--ink-100); position: relative; flex: none; transition: background var(--dur-fast, 140ms) var(--ease-out); }
.wg-switch.is-on { background: var(--periwinkle-500); }
.wg-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 999px; background: #fff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); transition: left var(--dur-fast, 140ms) var(--ease-out); }
.wg-switch.is-on .wg-knob { left: 16px; }
.wg-toggle:has(.wg-sr:focus-visible) .wg-switch { box-shadow: var(--shadow-focus); }
.wg-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* ══════════ GESTOS ══════════ */
.wg-page-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.wg-page-sub { font-size: 13.5px; color: var(--ink-500); }
.wg-gesto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.wg-gesto-card { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; padding: 22px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 20px; box-shadow: var(--shadow-sm); }
.wg-gesto-icon { width: 58px; height: 58px; border-radius: 17px; display: grid; place-items: center; font-size: 30px; }
.wg-gesto-body { display: grid; gap: 8px; min-width: 0; }
.wg-gesto-name { font-size: 18px; }
.wg-gesto-desc { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--ink-700); }

.wg-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.wg-chip { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: var(--periwinkle-50); color: var(--periwinkle-700); }

.wg-landmarks-note { display: flex; align-items: center; gap: 14px; padding: 16px 20px; background: var(--oat); border-radius: 16px; font-size: 13px; color: var(--ink-700); }
.wg-landmarks-note .wg-mono { color: var(--ink-500); flex: none; }

/* ══════════ CÓMO FUNCIONA ══════════ */
.wg-como-hero { display: grid; gap: 14px; padding: 34px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 24px; box-shadow: var(--shadow-sm); }
.wg-pasos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.wg-paso-card { display: grid; gap: 10px; padding: 20px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 18px; }
.wg-paso-num { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; font-family: var(--font-display); font-size: 17px; color: var(--ink-900); }
.wg-paso-title { font-size: 15px; }
.wg-paso-desc { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ink-500); }

.wg-priv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.wg-priv-card { display: flex; gap: 12px; padding: 18px 20px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 16px; }
.wg-priv-card strong { font-size: 14px; display: block; }
.wg-priv-card span { font-size: 13px; line-height: 1.5; color: var(--ink-500); }

.wg-como-foot { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 16px 20px; background: var(--oat); border-radius: 16px; font-size: 12.5px; color: var(--ink-500); }
.wg-sep { width: 4px; height: 4px; border-radius: 999px; background: var(--ink-300); }
.wg-como-back { margin-left: auto; }

/* ══════════ BOTTOM NAV (móvil) ══════════ */
.wg-bottomnav { display: none; }

/* ══════════ ANIMACIONES ══════════ */
@keyframes wg-rec { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes wg-indeterminate { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }

@media (prefers-reduced-motion: reduce) {
  .wg-dot--rec, .wg-progress-bar { animation: none; }
}

/* ══════════ RESPONSIVE (móvil) ══════════ */
@media (max-width: 880px) {
  .wg { flex-direction: column; }
  .wg-side { display: none; }
  .wg-topbar {
    display: flex; align-items: center; gap: 8px; padding: 16px 18px 12px;
    background: var(--paper); border-bottom: 1px solid var(--ink-100);
    position: sticky; top: 0; z-index: 5;
  }
  .wg-topback { font-size: 18px; color: var(--ink-500); text-decoration: none; }
  .wg-topbar-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; background: var(--oat); font-size: 11.5px; font-weight: 700; color: var(--ink-700); }
  .wg-topbar-badge .wg-dot--live { box-shadow: none; }

  .wg-main { padding: 16px 16px calc(76px + env(safe-area-inset-bottom, 0px)); }
  .wg-screen { gap: 16px; max-width: none; }
  .wg-screen--jardin { gap: 14px; }

  .wg-display--md { font-size: 26px; }
  .wg-jardin-layout { grid-template-columns: 1fr; }
  .wg-gesto-grid, .wg-priv-grid { grid-template-columns: 1fr; }
  .wg-pasos-grid { grid-template-columns: 1fr; }

  /* Jardín inmersivo entre topbar y bottom-nav */
  .wg.is-jardin .wg-main { padding: 0; }
  .wg-screen--jardin { height: calc(100vh - 64px); }
  .wg.is-jardin .wg-jardin-head { display: none; }
  .wg-jardin-layout { height: 100%; }
  .wg-stage-col { height: 100%; gap: 0; }
  .wg-stage { height: 100%; aspect-ratio: auto; min-height: 0; border-radius: 0; }
  .wg-rail { display: none; }
  .wg-stage-controls {
    position: fixed; left: 0; right: 0; bottom: 84px; z-index: 7;
    justify-content: center; padding: 0 16px;
  }
  .wg-stage-controls .wg-btn { backdrop-filter: blur(8px); }
  .wg-stage-controls .wg-btn--ghost { background: rgba(20, 19, 27, 0.55); color: #fff; border-color: rgba(255, 255, 255, 0.28); }
  .wg-stage-meta { display: none; }
  .wg-gesture-dock { bottom: 150px; }

  .wg-bottomnav {
    display: grid; grid-template-columns: repeat(3, 1fr);
    position: sticky; bottom: 0; z-index: 6;
    border-top: 1px solid var(--ink-100); background: var(--paper);
    padding: 8px 6px calc(12px + env(safe-area-inset-bottom, 0px));
  }
  .wg-bottomnav.is-jardin { position: fixed; left: 0; right: 0; background: rgba(20, 19, 27, 0.82); backdrop-filter: blur(10px); border-top: none; }
  .wg-bn-item {
    display: grid; justify-items: center; gap: 3px; padding: 6px;
    border: none; background: none; cursor: pointer; font-family: inherit;
    font-size: 10.5px; font-weight: 700; color: var(--ink-700);
  }
  .wg-bn-item .wg-ic { width: 20px; height: 20px; }
  .wg-bn-item.is-active { color: var(--periwinkle-700); }
  .wg-bottomnav.is-jardin .wg-bn-item { color: rgba(255, 255, 255, 0.6); }
  .wg-bottomnav.is-jardin .wg-bn-item.is-active { color: #fff; }
  .wg-bn-item:focus-visible { outline: none; box-shadow: var(--shadow-focus); border-radius: 10px; }
}

@media (max-width: 420px) {
  .wg-gesto-card { grid-template-columns: 1fr; }
}
</style>
