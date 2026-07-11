<template>
  <div class="ml-home" :class="{ 'is-camara': screen === 'camara' }">
    <!-- ══════════ SIDEBAR (escritorio) ══════════ -->
    <nav class="ml-side" aria-label="Navegación principal">
      <div class="ml-brand">
        <span class="ml-brand-name">Motion Lab</span>
        <span class="ml-heart" aria-hidden="true">♥</span>
      </div>
      <p class="ml-brand-tag">MEDIAPIPE · 100% LOCAL</p>

      <button
        v-for="item in NAV"
        :key="item.id"
        type="button"
        class="ml-side-link"
        :class="{ 'is-active': screen === item.id }"
        :aria-current="screen === item.id ? 'page' : undefined"
        @click="go(item.id)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span class="ml-ic" aria-hidden="true" v-html="item.icon" />
        {{ item.label }}
      </button>

      <div class="ml-side-status">
        <span class="ml-dot ml-dot--live" aria-hidden="true" />
        <div>
          <strong>Todo local</strong>
          <span>ningún frame sale de aquí</span>
        </div>
      </div>
    </nav>

    <!-- ══════════ TOPBAR (móvil) ══════════ -->
    <header v-show="screen !== 'camara'" class="ml-topbar">
      <span class="ml-brand-name ml-brand-name--sm">Motion Lab</span>
      <span class="ml-heart" aria-hidden="true">♥</span>
      <span class="ml-topbar-badge">
        <span class="ml-dot ml-dot--live" aria-hidden="true" />local
      </span>
    </header>

    <!-- ══════════ MAIN ══════════ -->
    <main class="ml-main">
      <!-- ─────── INICIO ─────── -->
      <section v-show="screen === 'inicio'" class="ml-screen" aria-label="Inicio">
        <div class="ml-hero">
          <div class="ml-hero-copy">
            <span class="ml-eyebrow">MEDIAPIPE · VISIÓN EN EL NAVEGADOR</span>
            <h1 class="ml-display">Tu cámara,<br>tu movimiento.</h1>
            <p class="ml-lede">
              Un laboratorio de visión por computadora que corre entero en tu
              navegador. Manos, cuerpo y gestos — sin servidor, sin subir un solo frame.
            </p>
            <div class="ml-hero-cta">
              <button type="button" class="ml-btn ml-btn--primary ml-btn--lg" @click="go('camara')">
                Activa tu cámara
              </button>
              <button type="button" class="ml-btn ml-btn--ghost ml-btn--lg" @click="go('modulos')">
                Ver los módulos
              </button>
            </div>
          </div>
          <div class="ml-hero-mesh">
            <canvas ref="meshCanvas" class="ml-mesh-canvas" aria-hidden="true" />
            <span class="ml-mesh-hint">mueve el cursor · demo viva</span>
          </div>
        </div>

        <div class="ml-section-head">
          <h2 class="ml-section-title">Cuatro formas de moverte</h2>
          <button type="button" class="ml-link" @click="go('modulos')">Ver detalle →</button>
        </div>

        <div class="ml-mod-grid">
          <button
            v-for="m in MODULOS"
            :key="m.id"
            type="button"
            class="ml-mod-card"
            @click="go('modulos')"
          >
            <span class="ml-mod-icon" :style="{ background: m.pastel }">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span class="ml-ic ml-ic--lg" aria-hidden="true" v-html="m.icon" />
            </span>
            <strong class="ml-mod-name">{{ m.nombre }}</strong>
            <p class="ml-mod-desc">{{ m.desc }}</p>
            <span class="ml-chips">
              <span v-for="c in m.chips" :key="c" class="ml-chip">{{ c }}</span>
            </span>
          </button>
        </div>

        <div class="ml-privacy-strip">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span class="ml-ic ml-ic--peri" aria-hidden="true" v-html="IC.shield" />
          <p>
            <strong>Todo se procesa en tu dispositivo.</strong>
            Ningún video sale de tu navegador — no lo grabamos ni lo enviamos a ningún servidor.
          </p>
          <button type="button" class="ml-link ml-link--tight" @click="go('privacidad')">Cómo →</button>
        </div>
      </section>

      <!-- ─────── MÓDULOS ─────── -->
      <section v-show="screen === 'modulos'" class="ml-screen" aria-label="Módulos">
        <div class="ml-page-head">
          <h1 class="ml-display ml-display--md">Módulos</h1>
          <span class="ml-page-sub">cada uno es su propia app · comparten cámara y modelos</span>
        </div>

        <div class="ml-mod-detail-grid">
          <article v-for="m in MODULOS" :key="m.id" class="ml-mod-detail">
            <span class="ml-mod-icon ml-mod-icon--lg" :style="{ background: m.pastel }">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span class="ml-ic ml-ic--xl" aria-hidden="true" v-html="m.icon" />
            </span>
            <div class="ml-mod-detail-body">
              <div class="ml-mod-detail-top">
                <strong class="ml-mod-detail-name">{{ m.nombre }}</strong>
                <span class="ml-mod-estado" :style="{ color: m.estadoColor }">{{ m.estado }}</span>
              </div>
              <p class="ml-mod-largo">{{ m.largo }}</p>
              <span class="ml-chips">
                <span v-for="c in m.chips" :key="c" class="ml-chip">{{ c }}</span>
              </span>
              <button type="button" class="ml-link ml-mod-open" @click="abrirModulo(m)">{{ m.cta }} →</button>
            </div>
          </article>
        </div>

        <div class="ml-pipeline">
          <span class="ml-mono">PIPELINE</span>
          <span>
            Un solo motor de cámara + detección, compartido. Cada módulo declara qué
            necesita — <strong>manos</strong>, <strong>pose</strong> o ambos — y nada más se enciende.
          </span>
        </div>
      </section>

      <!-- ─────── CÁMARA ─────── -->
      <section v-show="screen === 'camara'" class="ml-screen ml-cam-screen" aria-label="Cámara">
        <div class="ml-cam-head">
          <h1 class="ml-display ml-display--sm">Cámara</h1>
          <span class="ml-badge-soft">{{ estadoBadge }}</span>
          <div class="ml-cam-head-actions">
            <button type="button" class="ml-btn ml-btn--ghost ml-btn--sm" @click="mirror = !mirror">
              Espejo: {{ mirror ? 'on' : 'off' }}
            </button>
            <button type="button" class="ml-btn ml-btn--ghost ml-btn--sm" @click="grid = !grid">
              Cuadrícula: {{ grid ? 'on' : 'off' }}
            </button>
          </div>
        </div>

        <div class="ml-cam-layout">
          <div class="ml-cam-col">
            <div class="ml-cam-stage" ref="camStage">
              <video
                ref="videoEl"
                class="ml-cam-video"
                :class="{ 'is-mirror': mirror, 'is-hidden': camState !== 'listo' }"
                autoplay
                muted
                playsinline
              />

              <!-- LISTO -->
              <template v-if="camState === 'listo'">
                <div v-show="grid" class="ml-cam-grid" aria-hidden="true" />
                <div class="ml-scanline" aria-hidden="true" />
                <span class="ml-live-pill">
                  <span class="ml-dot ml-dot--rec" aria-hidden="true" />EN VIVO
                </span>
                <span class="ml-fps-pill">cámara local · {{ renderFps }} fps</span>
              </template>

              <!-- PIDIENDO permiso -->
              <div v-else-if="camState === 'pidiendo'" class="ml-cam-overlay">
                <div class="ml-cam-ask">
                  <span class="ml-cam-ask-ic" aria-hidden="true">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span class="ml-ic ml-ic--lg" v-html="IC.cam" />
                  </span>
                  <strong>Vamos a pedir tu cámara</strong>
                  <p>El video se queda en tu dispositivo. Nada se graba ni se envía.</p>
                  <button type="button" class="ml-btn ml-btn--primary ml-btn--md" @click="startCam">
                    Permitir cámara
                  </button>
                </div>
              </div>

              <!-- INICIANDO -->
              <div v-else-if="camState === 'iniciando'" class="ml-cam-overlay">
                <div class="ml-cam-loading">
                  <span class="ml-mono ml-mono--dim">INICIANDO CÁMARA · getUserMedia</span>
                  <div class="ml-progress"><div class="ml-progress-bar" /></div>
                </div>
              </div>

              <!-- ERROR -->
              <div v-else-if="camState === 'error'" class="ml-cam-overlay">
                <div class="ml-cam-ask">
                  <strong>No pudimos abrir la cámara</strong>
                  <p>Revisa que el navegador tenga permiso y que ninguna otra app la esté usando.</p>
                  <button type="button" class="ml-btn ml-btn--primary ml-btn--md" @click="startCam">
                    Reintentar
                  </button>
                </div>
              </div>

              <!-- APAGADA -->
              <div v-else class="ml-cam-overlay">
                <div class="ml-cam-loading">
                  <span class="ml-mono ml-mono--dim">CÁMARA DETENIDA</span>
                </div>
              </div>
            </div>

            <div class="ml-cam-controls">
              <button
                v-if="camState === 'listo'"
                type="button"
                class="ml-btn ml-btn--primary ml-btn--md"
                @click="detener"
              >
                Detener
              </button>
              <button
                v-else-if="camState === 'apagada' || camState === 'error'"
                type="button"
                class="ml-btn ml-btn--primary ml-btn--md"
                @click="startCam"
              >
                Iniciar
              </button>
              <button type="button" class="ml-btn ml-btn--ghost ml-btn--md" @click="fullscreen">
                Pantalla completa
              </button>
              <span class="ml-cam-hint">
                ¿Quieres pose y manos? <button type="button" class="ml-link ml-link--tight" @click="go('modulos')">abre un módulo →</button>
              </span>
            </div>
          </div>

          <!-- panel técnico -->
          <aside class="ml-cam-panel">
            <div class="ml-panel-tech">
              <div class="ml-panel-tech-head">
                <span class="ml-mono ml-mono--dim">PANEL TÉCNICO</span>
                <span class="ml-panel-state">{{ estadoCorto }}</span>
              </div>
              <div v-for="row in metricas" :key="row.k" class="ml-panel-row">
                <span>{{ row.k }}</span>
                <span class="ml-mono ml-panel-val">{{ row.v }}</span>
              </div>
            </div>
            <div class="ml-panel-toggles">
              <strong>Vista</strong>
              <label class="ml-toggle">
                <span class="ml-switch" :class="{ 'is-on': mirror }"><span class="ml-knob" /></span>
                <input v-model="mirror" type="checkbox" class="ml-sr">Espejo
              </label>
              <label class="ml-toggle">
                <span class="ml-switch" :class="{ 'is-on': grid }"><span class="ml-knob" /></span>
                <input v-model="grid" type="checkbox" class="ml-sr">Cuadrícula (regla de tercios)
              </label>
            </div>
          </aside>
        </div>
      </section>

      <!-- ─────── PRIVACIDAD ─────── -->
      <section v-show="screen === 'privacidad'" class="ml-screen" aria-label="Privacidad">
        <div class="ml-priv-hero">
          <span class="ml-eyebrow">PRIVACIDAD COMO FEATURE</span>
          <h1 class="ml-display ml-display--md">El video nunca sale de tu dispositivo.</h1>
          <p class="ml-lede">
            Todo el procesamiento corre localmente con WebAssembly en tu navegador.
            No grabamos, no subimos, no guardamos ningún frame.
          </p>
        </div>

        <div class="ml-priv-grid">
          <div v-for="p in PRIVACIDAD" :key="p.t" class="ml-priv-card">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="ml-ic ml-ic--check" aria-hidden="true" v-html="IC.check" />
            <div>
              <strong>{{ p.t }}</strong>
              <span>{{ p.d }}</span>
            </div>
          </div>
        </div>

        <div class="ml-priv-foot">
          <span>Motion Lab · v0.5</span>
          <span class="ml-sep" aria-hidden="true" />
          <span>Detección: MediaPipe Tasks Vision</span>
          <span class="ml-sep" aria-hidden="true" />
          <span>Señas LSM: «Manos con Voz» (CONAPRED)</span>
          <a class="ml-link ml-link--tight ml-priv-repo" href="https://github.com/paulettecb/paulettecb" target="_blank" rel="noopener">Repositorio →</a>
        </div>
      </section>
    </main>

    <!-- ══════════ BOTTOM NAV (móvil) ══════════ -->
    <nav class="ml-bottomnav" :class="{ 'is-cam': screen === 'camara' }" aria-label="Navegación">
      <button
        v-for="item in NAV"
        :key="item.id"
        type="button"
        class="ml-bn-item"
        :class="{ 'is-active': screen === item.id }"
        :aria-current="screen === item.id ? 'page' : undefined"
        @click="go(item.id)"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span class="ml-ic" aria-hidden="true" v-html="item.icon" />
        {{ item.label }}
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

/* ── Iconos (SVG propios, estáticos) ──────────────────────────────── */
const IC = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5A2.5 2.5 0 0 1 4.5 5h2L8 3h5l1.5 2h2A2.5 2.5 0 0 1 19 7.5V17a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 2 17z"/><circle cx="10.5" cy="12" r="3.2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
}

const GLYPH = {
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M14 11V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a5 5 0 0 1-3.6-1.5L5 15.6a1.6 1.6 0 0 1 2.3-2.2L8 14"/></svg>',
  pose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M12 6.5v6"/><path d="M12 8.5 6.5 11"/><path d="m12 8.5 5.5 2.5"/><path d="M12 12.5 8 21"/><path d="m12 12.5 4 8.5"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5 17.5 17.5"/><path d="m3.5 8 1.5-1.5"/><path d="M8 3.5 6.5 5"/><rect x="2.2" y="6" width="4.2" height="4.2" rx="1" transform="rotate(45 4.3 8.1)"/><path d="m16 19 1.5-1.5"/><path d="M20.5 16 19 17.5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4"/><path d="M12 17v4"/><path d="m5 5 2.5 2.5"/><path d="m16.5 16.5 2.5 2.5"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5 19 2.5-2.5"/><path d="m16.5 7.5 2.5-2.5"/></svg>'
}

const NAV = [
  { id: 'inicio', label: 'Inicio', icon: IC.home },
  { id: 'modulos', label: 'Módulos', icon: IC.grid },
  { id: 'camara', label: 'Cámara', icon: IC.cam },
  { id: 'privacidad', label: 'Privacidad', icon: IC.shield }
]

const MODULOS = [
  { id: 'lsm', nombre: 'LSM', hash: '/lsm', pastel: 'var(--pastel-sky)', icon: GLYPH.hand, chips: ['manos'], desc: 'Explora la Lengua de Señas Mexicana.', largo: 'Explorador de señas con landmarks de manos, diccionario con fuentes citadas y práctica con feedback en vivo. Un tutor, no un traductor.', estado: 'listo', estadoColor: 'var(--success)', cta: 'Abrir LSM' },
  { id: 'agility', nombre: 'Agility', hash: '/agility', pastel: 'var(--pastel-lilac)', icon: GLYPH.pose, chips: ['pose'], desc: 'Entrena las señales de agility con tu perro.', largo: 'Diseña pistas FCI, practica el timing de tus señales frente a la cámara y sigue tu progreso. Tu app de agility canino.', estado: 'listo', estadoColor: 'var(--success)', cta: 'Abrir Agility' },
  { id: 'exercise', nombre: 'Exercise', hash: '/exercise', pastel: 'var(--pastel-mint)', icon: GLYPH.dumbbell, chips: ['pose'], desc: 'Cuenta reps y cuida tu forma.', largo: 'Cuenta repeticiones con una máquina de estados por ángulo y te da feedback geométrico en vivo. Sin promesas médicas.', estado: 'en curso', estadoColor: 'var(--periwinkle-600)', cta: 'Abrir Exercise' },
  { id: 'experiments', nombre: 'Experiments', hash: '/experiments', pastel: 'var(--pastel-peach)', icon: GLYPH.spark, chips: ['manos', 'pose'], desc: 'Controla la pantalla con el cuerpo.', largo: 'Arte interactivo y control creativo de UI: dibuja con el dedo, mueve variables CSS con la mano, campos de partículas alrededor de tu esqueleto.', estado: 'próximo', estadoColor: 'var(--ink-300)', cta: 'Abrir Experiments' }
]

const PRIVACIDAD = [
  { t: 'Procesamiento local', d: 'WebAssembly corre la detección en tu navegador, sin backend.' },
  { t: 'Cero grabación', d: 'Ningún frame se guarda ni se sube. Los landmarks solo se exportan si tú lo pides.' },
  { t: 'LED apagado al salir', d: 'Al dejar un módulo se detiene la cámara: la luz se apaga.' },
  { t: 'Sin cuentas', d: 'No pedimos datos personales. Tus preferencias viven solo en este dispositivo.' }
]

/* ── Navegación entre secciones ───────────────────────────────────── */
const screen = ref('inicio')
function go (id) { screen.value = id }
function abrirModulo (m) { window.location.hash = m.hash }

/* ── Hero: malla de partículas interactiva ────────────────────────── */
const meshCanvas = ref(null)
let meshRaf = null
const mouse = { x: 0.5, y: 0.5, on: false }

function startMesh () {
  const cv = meshCanvas.value
  if (!cv) return
  const N = 46
  const pts = []
  for (let i = 0; i < N; i += 1) {
    pts.push({
      x: (i * 0.61803398875) % 1,
      y: (i * 0.75487766624) % 1,
      vx: (((i * 13) % 7) / 7 - 0.5) * 0.0016,
      vy: (((i * 29) % 11) / 11 - 0.5) * 0.0016
    })
  }
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const onMove = (e) => {
    const r = cv.getBoundingClientRect()
    mouse.x = (e.clientX - r.left) / r.width
    mouse.y = (e.clientY - r.top) / r.height
    mouse.on = true
  }
  const onLeave = () => { mouse.on = false }
  cv.addEventListener('pointermove', onMove)
  cv.addEventListener('pointerleave', onLeave)
  cv._teardown = () => {
    cv.removeEventListener('pointermove', onMove)
    cv.removeEventListener('pointerleave', onLeave)
  }

  function frame () {
    if (!meshCanvas.value) return
    const c = meshCanvas.value
    if (c.clientWidth) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = c.clientWidth
      const h = c.clientHeight
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
      const ctx = c.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      for (const p of pts) {
        if (!reduce) { p.x += p.vx; p.y += p.vy }
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1
        if (mouse.on) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          if (dx * dx + dy * dy < 0.045) { p.x += dx * 0.05; p.y += dy * 0.05 }
        }
      }
      for (let i = 0; i < N; i += 1) {
        for (let j = i + 1; j < N; j += 1) {
          const dx = (pts[i].x - pts[j].x) * w
          const dy = (pts[i].y - pts[j].y) * h
          const d = Math.hypot(dx, dy)
          if (d < 92) {
            ctx.strokeStyle = 'rgba(155,166,218,' + (0.5 * (1 - d / 92)).toFixed(3) + ')'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(pts[i].x * w, pts[i].y * h)
            ctx.lineTo(pts[j].x * w, pts[j].y * h)
            ctx.stroke()
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = 'rgba(232,93,160,0.9)'
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, 2.1, 0, 6.2832)
        ctx.fill()
      }
      if (mouse.on) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(mouse.x * w, mouse.y * h, 4, 0, 6.2832)
        ctx.fill()
      }
    }
    meshRaf = requestAnimationFrame(frame)
  }
  frame()
}

/* ── Cámara: vista previa real (getUserMedia) ─────────────────────── */
const videoEl = ref(null)
const camStage = ref(null)
const camState = ref('pidiendo') // pidiendo | iniciando | listo | apagada | error
const camGranted = ref(false)
const mirror = ref(true)
const grid = ref(false)
const renderFps = ref(0)
const camRes = ref('—')
const camLabel = ref('—')
let camStream = null
let fpsRaf = null
let fpsCount = 0
let fpsLast = 0

async function startCam () {
  camState.value = 'iniciando'
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
    camGranted.value = true
    await nextTick()
    // el usuario pudo salir de la pantalla mientras se pedía el permiso
    if (screen.value !== 'camara') { stopCam(); camState.value = 'apagada'; return }
    const v = videoEl.value
    if (v) { v.srcObject = camStream; try { await v.play() } catch (_) { /* autoplay */ } }
    const track = camStream.getVideoTracks()[0]
    const s = (track && track.getSettings) ? track.getSettings() : {}
    camRes.value = (s.width && s.height) ? `${s.width}×${s.height}` : '—'
    camLabel.value = (track && track.label) ? track.label : 'cámara'
    camState.value = 'listo'
    startFps()
  } catch (_) {
    camState.value = 'error'
  }
}

function stopCam () {
  if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null }
  stopFps()
  if (videoEl.value) videoEl.value.srcObject = null
}

function detener () { stopCam(); camState.value = 'apagada' }

function startFps () {
  fpsCount = 0
  fpsLast = 0
  const tick = (ts) => {
    if (!fpsLast) fpsLast = ts
    fpsCount += 1
    if (ts - fpsLast >= 500) {
      renderFps.value = Math.round((fpsCount * 1000) / (ts - fpsLast))
      fpsCount = 0
      fpsLast = ts
    }
    fpsRaf = requestAnimationFrame(tick)
  }
  fpsRaf = requestAnimationFrame(tick)
}
function stopFps () { if (fpsRaf) { cancelAnimationFrame(fpsRaf); fpsRaf = null } renderFps.value = 0 }

function fullscreen () {
  const el = camStage.value
  if (!el) return
  if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen()
  else el.requestFullscreen && el.requestFullscreen()
}

// al entrar/salir de la pantalla de cámara: privacidad primero
watch(screen, (now, prev) => {
  if (prev === 'camara' && now !== 'camara') {
    stopCam()
    camState.value = camGranted.value ? 'apagada' : 'pidiendo'
  }
})

const shortLabel = computed(() => {
  const l = camLabel.value || '—'
  return l.length > 16 ? l.slice(0, 15) + '…' : l
})

const metricas = computed(() => {
  if (camState.value !== 'listo') {
    return [
      { k: 'Render', v: '—' },
      { k: 'Resolución', v: '—' },
      { k: 'Cámara', v: '—' },
      { k: 'Modo', v: '—' },
      { k: 'Inferencia', v: '—' }
    ]
  }
  return [
    { k: 'Render', v: `${renderFps.value} fps` },
    { k: 'Resolución', v: camRes.value },
    { k: 'Cámara', v: shortLabel.value },
    { k: 'Modo', v: 'vista previa' },
    { k: 'Inferencia', v: 'en módulos' }
  ]
})

const estadoBadge = computed(() => ({
  listo: 'en vivo · local',
  iniciando: 'iniciando…',
  pidiendo: 'esperando permiso',
  apagada: 'detenida',
  error: 'sin acceso'
}[camState.value]))

const estadoCorto = computed(() => ({
  listo: 'RUNNING',
  iniciando: 'LOADING',
  pidiendo: 'IDLE',
  apagada: 'IDLE',
  error: 'ERROR'
}[camState.value]))

/* ── Ciclo de vida ────────────────────────────────────────────────── */
onMounted(startMesh)
onBeforeUnmount(() => {
  if (meshRaf) cancelAnimationFrame(meshRaf)
  if (meshCanvas.value && meshCanvas.value._teardown) meshCanvas.value._teardown()
  stopCam()
})
</script>

<style scoped>
/* ══════════ SHELL ══════════ */
.ml-home {
  --side-w: 236px;
  display: flex;
  min-height: 100vh;
  align-items: stretch;
  background: var(--oat);
  color: var(--ink-900);
  font-family: 'Hanken Grotesk', var(--font-sans);
}

/* ── Sidebar (escritorio) ── */
.ml-side {
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
.ml-brand { padding: 4px 10px 4px; display: flex; align-items: baseline; gap: 7px; }
.ml-brand-name { font-family: var(--font-display); font-size: 25px; line-height: 1; }
.ml-brand-name--sm { font-size: 21px; }
.ml-heart { color: var(--pop-magenta); font-size: 15px; }
.ml-brand-tag { margin: 0; padding: 0 10px 14px; font-size: 10px; letter-spacing: 0.16em; font-weight: 600; color: var(--ink-500); }

.ml-side-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14.5px;
  font-weight: 600;
  font-family: inherit;
  text-align: left;
  background: transparent;
  color: var(--ink-700);
  transition: background var(--dur-fast, 140ms) var(--ease-out), color var(--dur-fast, 140ms) var(--ease-out);
}
.ml-side-link:hover { background: var(--periwinkle-50); }
.ml-side-link.is-active { background: var(--periwinkle-50); color: var(--periwinkle-700); }
.ml-side-link:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

.ml-side-status {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: var(--oat);
}
.ml-side-status strong { font-size: 12.5px; display: block; }
.ml-side-status span { font-size: 11px; color: var(--ink-500); }

.ml-dot { width: 9px; height: 9px; border-radius: 999px; flex: none; }
.ml-dot--live { background: var(--success); box-shadow: 0 0 0 4px rgba(79, 164, 122, 0.16); }
.ml-dot--rec { width: 8px; height: 8px; background: var(--danger); animation: ml-rec 1.4s infinite; }

/* ── Topbar (móvil) ── */
.ml-topbar { display: none; }

/* ══════════ MAIN ══════════ */
.ml-main { flex: 1; min-width: 0; padding: 30px 34px; box-sizing: border-box; }
.ml-screen { display: grid; gap: 22px; max-width: 1000px; }

/* ── Tipografía ── */
.ml-display { margin: 0; font-family: var(--font-display); font-size: 46px; font-weight: 500; line-height: 1; color: var(--periwinkle-600); }
.ml-display--md { font-size: 34px; }
.ml-display--sm { font-size: 30px; }
.ml-eyebrow { font-size: 10.5px; letter-spacing: 0.18em; font-weight: 700; color: var(--periwinkle-700); }
.ml-lede { margin: 0; font-size: 15.5px; line-height: 1.55; color: var(--ink-700); max-width: 460px; }
.ml-mono { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; font-size: 11px; letter-spacing: 0.04em; }
.ml-mono--dim { color: rgba(255, 255, 255, 0.6); letter-spacing: 0.06em; }

.ml-link { border: none; background: none; padding: 0; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--periwinkle-700); text-decoration: none; }
.ml-link:hover { color: var(--periwinkle-600); }
.ml-link--tight { font-size: 13px; }

/* ── Botones ── */
.ml-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; border: 1.5px solid transparent; border-radius: 999px;
  cursor: pointer; font-family: inherit; font-weight: 600; white-space: nowrap;
  transition: background var(--dur-fast, 140ms) var(--ease-out), color var(--dur-fast, 140ms) var(--ease-out), border-color var(--dur-fast, 140ms) var(--ease-out), box-shadow var(--dur-base, 220ms) var(--ease-out), transform var(--dur-fast, 140ms) var(--ease-out);
}
.ml-btn:active { transform: translateY(1px) scale(0.99); }
.ml-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.ml-btn--lg { height: 52px; padding: 0 24px; font-size: 15.5px; }
.ml-btn--md { height: 44px; padding: 0 20px; font-size: 15px; }
.ml-btn--sm { height: 36px; padding: 0 15px; font-size: 13.5px; }
.ml-btn--primary { background: var(--periwinkle-500); color: #fff; box-shadow: var(--shadow-sm); }
.ml-btn--primary:hover { background: var(--periwinkle-600); box-shadow: var(--shadow-md); }
.ml-btn--ghost { background: transparent; color: var(--periwinkle-700); border-color: var(--ink-100); }
.ml-btn--ghost:hover { background: var(--periwinkle-50); border-color: var(--periwinkle-200); }

/* ── Iconos ── */
.ml-ic { display: inline-flex; width: 18px; height: 18px; }
.ml-ic :deep(svg) { width: 100%; height: 100%; display: block; }
.ml-ic--lg { width: 22px; height: 22px; }
.ml-ic--xl { width: 28px; height: 28px; }
.ml-ic--peri { width: 26px; height: 26px; color: var(--periwinkle-700); flex: none; }
.ml-ic--check { width: 22px; height: 22px; color: var(--success); flex: none; margin-top: 1px; }

/* ── Hero ── */
.ml-hero {
  display: flex; flex-wrap: wrap; gap: 26px; align-items: center;
  padding: 32px 34px; background: var(--paper); border: 1px solid var(--ink-100);
  border-radius: 28px; box-shadow: var(--shadow-sm);
}
.ml-hero-copy { flex: 1 1 340px; min-width: 0; display: grid; gap: 16px; }
.ml-hero-cta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 2px; }
.ml-hero-mesh { flex: 1 1 300px; min-width: 260px; position: relative; aspect-ratio: 4 / 3; border-radius: 22px; overflow: hidden; background: var(--ink-900); }
.ml-mesh-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.ml-mesh-hint { position: absolute; left: 14px; bottom: 14px; font-family: ui-monospace, Menlo, monospace; font-size: 11px; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.55); }

/* ── Sección de módulos (inicio) ── */
.ml-section-head { display: flex; align-items: baseline; gap: 10px; }
.ml-section-title { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 0.01em; }
.ml-section-head .ml-link { margin-left: auto; }

.ml-mod-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.ml-mod-card {
  display: grid; gap: 12px; padding: 18px; text-align: left;
  background: var(--paper); border: 1px solid var(--ink-100); border-radius: 18px;
  cursor: pointer; font-family: inherit; color: inherit;
  transition: box-shadow var(--dur-base, 220ms) var(--ease-out), transform var(--dur-base, 220ms) var(--ease-out);
}
.ml-mod-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.ml-mod-card:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.ml-mod-icon { width: 44px; height: 44px; border-radius: 13px; display: grid; place-items: center; color: var(--ink-900); }
.ml-mod-icon--lg { width: 56px; height: 56px; border-radius: 16px; flex: none; }
.ml-mod-name { font-size: 15.5px; }
.ml-mod-desc { margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--ink-500); }

.ml-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
.ml-chip { font-size: 10.5px; font-weight: 700; letter-spacing: 0.02em; padding: 3px 9px; border-radius: 999px; background: var(--periwinkle-50); color: var(--periwinkle-700); }

.ml-privacy-strip { display: flex; align-items: center; gap: 16px; padding: 18px 22px; background: var(--periwinkle-50); border-radius: 20px; }
.ml-privacy-strip p { margin: 0; flex: 1; font-size: 13.5px; color: var(--ink-700); }
.ml-privacy-strip strong { font-size: 14px; color: var(--ink-900); }

/* ── Módulos (detalle) ── */
.ml-page-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.ml-page-sub { font-size: 13.5px; color: var(--ink-500); }
.ml-mod-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ml-mod-detail { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; padding: 22px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 20px; box-shadow: var(--shadow-sm); }
.ml-mod-detail-body { display: grid; gap: 8px; min-width: 0; }
.ml-mod-detail-top { display: flex; align-items: baseline; gap: 8px; }
.ml-mod-detail-name { font-size: 18px; }
.ml-mod-estado { margin-left: auto; font-size: 11px; font-weight: 700; }
.ml-mod-largo { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--ink-700); }
.ml-mod-open { margin-top: 2px; }

.ml-pipeline { display: flex; align-items: center; gap: 14px; padding: 16px 20px; background: var(--oat); border-radius: 16px; font-size: 13px; color: var(--ink-700); }
.ml-pipeline .ml-mono { color: var(--ink-500); flex: none; }

/* ── Cámara ── */
.ml-cam-screen { max-width: 1080px; gap: 16px; }
.ml-cam-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ml-cam-head-actions { margin-left: auto; display: flex; gap: 8px; }
.ml-badge-soft { display: inline-flex; align-items: center; padding: 4px 11px; border-radius: 999px; background: var(--periwinkle-50); color: var(--periwinkle-700); font-size: 12px; font-weight: 700; }

.ml-cam-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 14px; align-items: start; }
.ml-cam-col { display: grid; gap: 12px; min-width: 0; }
.ml-cam-stage { position: relative; width: 100%; box-sizing: border-box; aspect-ratio: 16 / 9; background: var(--ink-900); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-md); }
.ml-cam-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; background: var(--ink-900); }
.ml-cam-video.is-mirror { transform: scaleX(-1); }
.ml-cam-video.is-hidden { opacity: 0; }

.ml-scanline { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(135, 149, 210, 0.9), transparent); animation: ml-scan 3.2s var(--ease-out, ease) infinite; }
.ml-cam-grid { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px); background-size: 33.333% 33.333%; background-position: center; }
.ml-live-pill { position: absolute; top: 14px; left: 14px; display: inline-flex; align-items: center; gap: 7px; padding: 6px 13px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); font-size: 12.5px; font-weight: 700; color: var(--ink-900); }
.ml-fps-pill { position: absolute; top: 14px; right: 14px; padding: 6px 13px; border-radius: 999px; background: rgba(79, 164, 122, 0.92); color: #fff; font-size: 12px; font-weight: 700; }

.ml-cam-overlay { position: absolute; inset: 0; display: grid; place-items: center; padding: 30px; text-align: center; }
.ml-cam-ask { display: grid; justify-items: center; gap: 12px; max-width: 340px; }
.ml-cam-ask strong { font-size: 18px; color: #fff; }
.ml-cam-ask p { margin: 0; font-size: 13.5px; line-height: 1.5; color: rgba(255, 255, 255, 0.7); }
.ml-cam-ask-ic { width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 255, 255, 0.08); display: grid; place-items: center; color: rgba(255, 255, 255, 0.85); }
.ml-cam-loading { display: grid; justify-items: center; gap: 14px; width: 100%; max-width: 320px; }
.ml-progress { width: 100%; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.16); overflow: hidden; }
.ml-progress-bar { width: 40%; height: 100%; border-radius: 999px; background: var(--periwinkle-400); animation: ml-indeterminate 1.3s var(--ease-in-out, ease-in-out) infinite; }

.ml-cam-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.ml-cam-hint { margin-left: auto; font-size: 12.5px; color: var(--ink-500); }

.ml-cam-panel { display: grid; gap: 12px; }
.ml-panel-tech { display: grid; gap: 10px; padding: 18px; background: var(--ink-900); border-radius: 16px; color: #fff; }
.ml-panel-tech-head { display: flex; align-items: center; gap: 8px; }
.ml-panel-state { margin-left: auto; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px; background: rgba(79, 164, 122, 0.25); color: #8FE0B4; }
.ml-panel-row { display: flex; align-items: baseline; font-size: 12.5px; color: rgba(255, 255, 255, 0.6); }
.ml-panel-val { margin-left: auto; font-weight: 700; color: #fff; }
.ml-panel-toggles { display: grid; gap: 12px; padding: 16px 18px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 16px; }
.ml-panel-toggles strong { font-size: 13px; }
.ml-toggle { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-700); cursor: pointer; }
.ml-switch { width: 34px; height: 20px; border-radius: 999px; background: var(--ink-100); position: relative; flex: none; transition: background var(--dur-fast, 140ms) var(--ease-out); }
.ml-switch.is-on { background: var(--periwinkle-500); }
.ml-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 999px; background: #fff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); transition: left var(--dur-fast, 140ms) var(--ease-out); }
.ml-switch.is-on .ml-knob { left: 16px; }
.ml-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* ── Privacidad ── */
.ml-priv-hero { display: grid; gap: 14px; padding: 34px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 24px; box-shadow: var(--shadow-sm); }
.ml-priv-hero .ml-display { line-height: 1.02; }
.ml-priv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ml-priv-card { display: flex; gap: 12px; padding: 18px 20px; background: var(--paper); border: 1px solid var(--ink-100); border-radius: 16px; }
.ml-priv-card strong { font-size: 14px; display: block; }
.ml-priv-card span { font-size: 13px; line-height: 1.5; color: var(--ink-500); }
.ml-priv-foot { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 16px 20px; background: var(--oat); border-radius: 16px; font-size: 12.5px; color: var(--ink-500); }
.ml-sep { width: 4px; height: 4px; border-radius: 999px; background: var(--ink-300); }
.ml-priv-repo { margin-left: auto; }

/* ── Bottom nav (móvil) ── */
.ml-bottomnav { display: none; }

/* ══════════ ANIMACIONES ══════════ */
@keyframes ml-scan { 0% { transform: translateY(-10%); } 100% { transform: translateY(760%); } }
@keyframes ml-rec { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes ml-indeterminate { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }

@media (prefers-reduced-motion: reduce) {
  .ml-scanline, .ml-dot--rec, .ml-progress-bar { animation: none; }
}

/* ══════════ RESPONSIVE (móvil) ══════════ */
@media (max-width: 880px) {
  .ml-home { flex-direction: column; }
  .ml-side { display: none; }
  .ml-topbar {
    display: flex; align-items: center; gap: 8px; padding: 18px 20px 12px;
    background: var(--paper); border-bottom: 1px solid var(--ink-100);
    position: sticky; top: 0; z-index: 5;
  }
  .ml-topbar-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; background: var(--oat); font-size: 11.5px; font-weight: 700; color: var(--ink-700); }
  .ml-topbar-badge .ml-dot--live { box-shadow: none; }

  .ml-main { padding: 16px 18px calc(76px + env(safe-area-inset-bottom, 0px)); }
  .ml-screen { gap: 16px; max-width: none; }

  .ml-display { font-size: 32px; }
  .ml-display--md { font-size: 28px; }
  .ml-hero { padding: 0; background: none; border: none; box-shadow: none; flex-direction: column; align-items: stretch; gap: 14px; }
  .ml-hero-mesh { order: -1; aspect-ratio: 5 / 4; border-radius: 22px; }
  .ml-hero-cta .ml-btn { flex: 1; }
  .ml-mod-grid { grid-template-columns: 1fr 1fr; }
  .ml-mod-detail-grid, .ml-priv-grid { grid-template-columns: 1fr; }

  /* Cámara inmersiva a pantalla completa entre topbar y bottom-nav */
  .ml-home.is-camara .ml-main { padding: 0; }
  .ml-cam-screen { gap: 0; height: calc(100vh - 64px); }
  .ml-cam-head, .ml-cam-panel { display: none; }
  .ml-cam-layout { grid-template-columns: 1fr; height: 100%; }
  .ml-cam-col { height: 100%; gap: 0; }
  .ml-cam-stage { height: 100%; aspect-ratio: auto; border-radius: 0; }
  .ml-cam-controls {
    position: absolute; left: 0; right: 0; bottom: 76px; z-index: 4;
    justify-content: center; padding: 0 16px;
  }
  .ml-cam-controls .ml-btn { backdrop-filter: blur(8px); }
  .ml-cam-hint { display: none; }

  .ml-bottomnav {
    display: grid; grid-template-columns: repeat(4, 1fr);
    position: sticky; bottom: 0; z-index: 6;
    border-top: 1px solid var(--ink-100); background: var(--paper);
    padding: 8px 6px calc(12px + env(safe-area-inset-bottom, 0px));
  }
  .ml-bottomnav.is-cam { position: fixed; left: 0; right: 0; background: rgba(20, 19, 27, 0.82); backdrop-filter: blur(10px); border-top: none; }
  .ml-bn-item {
    display: grid; justify-items: center; gap: 3px; padding: 6px;
    border: none; background: none; cursor: pointer; font-family: inherit;
    font-size: 10.5px; font-weight: 700; color: var(--ink-700);
  }
  .ml-bn-item .ml-ic { width: 20px; height: 20px; }
  .ml-bn-item.is-active { color: var(--periwinkle-700); }
  .ml-bottomnav.is-cam .ml-bn-item { color: rgba(255, 255, 255, 0.6); }
  .ml-bottomnav.is-cam .ml-bn-item.is-active { color: #fff; }
  .ml-bn-item:focus-visible { outline: none; box-shadow: var(--shadow-focus); border-radius: 10px; }
}

@media (max-width: 420px) {
  .ml-mod-grid { grid-template-columns: 1fr; }
}
</style>
