<template>
  <div class="experiment-page al-page">
    <header class="experiment-header">
      <a
        href="#/"
        class="back-btn"
      >← Back</a>
      <h1>⏰ ALARMA - No se apaga sola</h1>
      <p class="subtitle">
        Suena hasta que te muevas de verdad frente a la cámara — y te enseña qué está viendo y qué no.
      </p>
    </header>

    <main class="experiment-main">
      <section class="info-section al-section">
        <!-- ═══════ CONFIGURAR ═══════ -->
        <div
          v-if="fase === 'config'"
          class="al-config"
        >
          <div class="al-card">
            <h2 class="al-card-title">
              1 · ¿Cuándo suena?
            </h2>
            <div class="al-row">
              <button
                type="button"
                class="al-chip"
                :class="{ 'is-on': modo === 'minutos' }"
                @click="modo = 'minutos'"
              >
                En un rato
              </button>
              <button
                type="button"
                class="al-chip"
                :class="{ 'is-on': modo === 'hora' }"
                @click="modo = 'hora'"
              >
                A una hora
              </button>
            </div>

            <label
              v-if="modo === 'minutos'"
              class="al-field"
            >
              <span>Minutos desde ahora</span>
              <input
                v-model.number="minutos"
                type="number"
                min="1"
                max="720"
              >
            </label>
            <label
              v-else
              class="al-field"
            >
              <span>Hora (24 h)</span>
              <input
                v-model="hora"
                type="time"
              >
            </label>
          </div>

          <div class="al-card">
            <h2 class="al-card-title">
              2 · ¿Qué tienes que hacer para apagarla?
            </h2>
            <div class="al-retos">
              <button
                v-for="r in CHALLENGES"
                :key="r.id"
                type="button"
                class="al-reto"
                :class="{ 'is-on': retoId === r.id }"
                @click="elegirReto(r)"
              >
                <span class="al-reto-emoji">{{ r.emoji }}</span>
                <strong>{{ r.nombre }}</strong>
                <span class="al-reto-desc">{{ r.comoSeHace }}</span>
                <span class="al-reto-necesita">necesita ver: {{ r.necesita }}</span>
              </button>
            </div>

            <label class="al-field">
              <span>{{ retoActual.tipo === 'hold' ? 'Segundos sosteniendo' : `Cuántas ${retoActual.unidad}` }}</span>
              <input
                v-model.number="meta"
                type="number"
                min="1"
                max="60"
              >
            </label>
          </div>

          <div class="al-card">
            <h2 class="al-card-title">
              3 · Volumen
            </h2>
            <div class="al-row">
              <input
                v-model.number="volumen"
                class="al-slider"
                type="range"
                min="0"
                max="100"
                aria-label="Volumen de la alarma"
              >
              <span class="al-vol">{{ volumen }}%</span>
              <button
                type="button"
                class="btn"
                @click="probarSonido"
              >
                Probar sonido
              </button>
            </div>
            <p class="al-nota">
              El volumen sube solo mientras suena: empieza incómodo y termina imposible de ignorar.
            </p>
          </div>

          <div class="al-acciones">
            <button
              class="btn btn-primary"
              @click="armar"
            >
              ⏰ Armar alarma
            </button>
            <button
              class="btn"
              @click="practicar"
            >
              👀 Probar la detección ahora
            </button>
          </div>

          <p class="al-privacidad">
            🔒 Todo corre en tu navegador: la cámara solo se enciende cuando suena (o cuando tú
            la pruebas) y ningún frame sale de aquí.
          </p>
        </div>

        <!-- ═══════ ARMADA ═══════ -->
        <div
          v-else-if="fase === 'armada'"
          class="al-armada"
        >
          <span class="al-eyebrow">ALARMA ARMADA</span>
          <p class="al-cuenta">
            {{ cuentaRegresiva }}
          </p>
          <p class="al-armada-sub">
            Suena a las <strong>{{ horaObjetivoTexto }}</strong> y solo se apaga con
            <strong>{{ retoActual.emoji }} {{ retoActual.nombre }}</strong> × {{ meta }} {{ retoActual.unidad }}.
          </p>
          <p class="al-nota">
            Deja esta pestaña abierta. Si la cierras, la alarma se va con ella.
          </p>
          <div class="al-acciones">
            <button
              class="btn"
              @click="cancelar"
            >
              Cancelar alarma
            </button>
            <button
              class="btn"
              @click="practicar"
            >
              👀 Probar la detección mientras espero
            </button>
          </div>
        </div>

        <!-- ═══════ LOGRADA ═══════ -->
        <div
          v-else-if="fase === 'lograda'"
          class="al-lograda"
        >
          <p class="al-lograda-emoji">
            🎉
          </p>
          <h2>Ya, te levantaste.</h2>
          <p class="al-armada-sub">
            {{ retoActual.emoji }} {{ retoActual.nombre }} completado — la alarma se apagó porque de
            verdad te moviste.
          </p>
          <div class="al-acciones">
            <button
              class="btn btn-primary"
              @click="volverAConfig"
            >
              Programar otra
            </button>
          </div>
        </div>

        <!-- ═══════ SONANDO / PRÁCTICA ═══════ -->
        <div
          v-if="fase === 'sonando' || fase === 'practica'"
          class="al-live"
          :class="{ 'is-alarma': fase === 'sonando' }"
        >
          <div class="al-live-head">
            <span
              class="al-live-badge"
              :class="fase === 'sonando' ? 'is-rojo' : 'is-calma'"
            >
              {{ fase === 'sonando' ? '🔔 SONANDO' : '👀 MODO PRUEBA' }}
            </span>
            <strong class="al-live-reto">{{ retoActual.emoji }} {{ retoActual.nombre }}</strong>
            <span class="al-live-como">{{ retoActual.comoSeHace }}</span>
          </div>

          <div class="al-live-grid">
            <!-- cámara -->
            <div
              class="camera-stage al-stage"
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
                class="landmarks-canvas"
                aria-label="Landmarks del cuerpo en vivo"
              />
              <span
                class="al-verdict"
                :class="veo ? 'is-si' : 'is-no'"
              >{{ veo ? '✅ Te veo' : '⚠️ No te veo' }}</span>
            </div>

            <!-- panel honesto de detección -->
            <aside
              class="al-panel"
              aria-label="Qué está detectando"
            >
              <div class="al-progreso">
                <div class="al-progreso-top">
                  <span>Progreso</span>
                  <strong>{{ progresoTexto }}</strong>
                </div>
                <div class="al-barra al-barra--grande">
                  <div
                    class="al-barra-fill"
                    :style="{ width: `${Math.round((estado?.progreso?.pct || 0) * 100)}%` }"
                  />
                </div>
              </div>

              <div class="al-checks">
                <span class="al-panel-title">Condiciones en vivo</span>
                <div
                  v-for="c in checks"
                  :key="c.id"
                  class="al-check"
                  :class="{ 'is-ok': c.ok }"
                >
                  <span class="al-check-top">
                    <span class="al-check-ic">{{ c.ok ? '✅' : '⬜' }}</span>
                    <span class="al-check-label">{{ c.label }}</span>
                    <span class="al-check-val">{{ formatoValor(c) }}</span>
                  </span>
                  <div class="al-barra">
                    <div
                      class="al-barra-fill"
                      :class="{ 'is-ok': c.ok }"
                      :style="{ width: `${Math.round(c.pct * 100)}%` }"
                    />
                  </div>
                  <span
                    v-if="!c.ok && c.pista"
                    class="al-check-pista"
                  >{{ c.pista }}</span>
                </div>
              </div>

              <div class="al-salud">
                <span class="al-panel-title">Salud de la detección</span>
                <div class="al-salud-row">
                  <span>Cámara</span>
                  <strong>{{ cameraActive ? 'encendida' : 'apagada' }}</strong>
                </div>
                <div class="al-salud-row">
                  <span>FPS</span>
                  <strong>{{ approximateFps }}</strong>
                </div>
                <div class="al-salud-row">
                  <span>Cuerpo visible</span>
                  <strong>{{ Math.round((estado?.cobertura?.pct || 0) * 100) }}%</strong>
                </div>
                <div
                  v-if="estado?.bloqueo"
                  class="al-bloqueo"
                >
                  {{ estado.bloqueo }} — acomódate o aléjate un poco de la cámara.
                </div>
                <p
                  v-if="cameraStatus"
                  class="al-nota"
                >
                  {{ cameraStatus }}
                </p>
              </div>

              <div class="al-bitacora">
                <span class="al-panel-title">Bitácora</span>
                <ul>
                  <li
                    v-for="(l, i) in bitacora"
                    :key="i"
                  >
                    <span class="al-bit-hora">{{ l.hora }}</span> {{ l.texto }}
                  </li>
                  <li v-if="!bitacora.length">
                    Aún no pasa nada — empieza a moverte.
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          <div class="al-acciones">
            <button
              v-if="fase === 'practica'"
              class="btn"
              @click="salirDePractica"
            >
              Terminar prueba
            </button>
            <button
              v-if="fase === 'practica'"
              class="btn"
              @click="reiniciarReto"
            >
              Reiniciar conteo
            </button>
            <button
              v-if="fase === 'sonando' && !cameraActive"
              class="btn btn-primary"
              @click="encenderCamara"
            >
              Reintentar cámara
            </button>
          </div>

          <!-- Escape solo cuando la detección NO está disponible: si la cámara
               falla, la alarma no puede volverse una trampa. -->
          <div
            v-if="fase === 'sonando' && !cameraActive"
            class="al-emergencia"
          >
            <p>¿La cámara no abre? Puedes apagarla a la mala, pero te va a costar 10 segundos:</p>
            <button
              class="btn al-emergencia-btn"
              @pointerdown="empezarEmergencia"
              @pointerup="cancelarEmergencia"
              @pointerleave="cancelarEmergencia"
            >
              Mantén presionado para apagar ({{ Math.ceil(10 - emergenciaSeg) }} s)
            </button>
            <div class="al-barra">
              <div
                class="al-barra-fill"
                :style="{ width: `${Math.min(100, (emergenciaSeg / 10) * 100)}%` }"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMediaPipeTrackingCamera } from '../composables/useMediaPipeTrackingCamera'
import { CHALLENGES, DEFAULT_CHALLENGE, createAlarmChallenge } from '../services/alarmChallenges'
import { createAlarmSound } from '../services/alarmSound'

const STORAGE_KEY = 'motionlab-alarma'

const {
  approximateFps,
  cameraActive,
  cameraStatus,
  poseResults,
  start,
  stop,
  canvasRef,
  videoRef,
} = useMediaPipeTrackingCamera({ hands: false, pose: true, face: false })

/* ── Configuración ────────────────────────────────────────────────── */
const fase = ref('config') // config | armada | sonando | practica | lograda
const modo = ref('minutos')
const minutos = ref(20)
const hora = ref('07:00')
const retoId = ref(DEFAULT_CHALLENGE)
const meta = ref(CHALLENGES[0].metaDefault)
const volumen = ref(80)

const retoActual = computed(() => CHALLENGES.find((r) => r.id === retoId.value) || CHALLENGES[0])

const elegirReto = (r) => {
  retoId.value = r.id
  meta.value = r.metaDefault
}

/* ── Sonido + motor del reto ──────────────────────────────────────── */
const sonido = createAlarmSound()
let tracker = createAlarmChallenge({ id: retoId.value, meta: meta.value })
const estado = ref(null)
const bitacora = ref([])

const checks = computed(() => estado.value?.checks || [])
const veo = computed(() => Boolean(estado.value?.detectado && estado.value?.cobertura?.ok))

const progresoTexto = computed(() => {
  const p = estado.value?.progreso
  if (!p) return `0 / ${meta.value} ${retoActual.value.unidad}`
  return `${p.hecho} / ${p.meta} ${p.unidad}`
})

const formatoValor = (c) => {
  if (c.valor === null || c.valor === undefined) return '—'
  return `${c.valor.toFixed(2)} / ${c.meta.toFixed(2)}`
}

const log = (texto) => {
  const hh = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  bitacora.value = [{ hora: hh, texto }, ...bitacora.value].slice(0, 8)
}

watch(volumen, (v) => sonido.setVolumen(v / 100), { immediate: true })

/* ── Cada frame de pose alimenta el motor del reto ────────────────── */
let veiaAntes = false
watch(poseResults, (res) => {
  if (fase.value !== 'sonando' && fase.value !== 'practica') return
  const lm = res?.landmarks?.[0] || null
  const out = tracker.update(lm, performance.now())
  estado.value = out

  const ahoraVeo = Boolean(out.detectado && out.cobertura.ok)
  if (ahoraVeo !== veiaAntes) {
    log(ahoraVeo ? 'Te encontré completa ✅' : `Te perdí: ${out.bloqueo || 'sin cuerpo'}`)
    veiaAntes = ahoraVeo
  }

  if (out.evento === 'rep') log(`${out.progreso.hecho} de ${out.progreso.meta} ${out.progreso.unidad}`)
  if (out.evento === 'reinicio') log('Se reinició el sostenido (bajaste antes de tiempo)')
  if (out.evento === 'listo') {
    log('¡Reto completado!')
    completarReto()
  }
})

const completarReto = () => {
  if (fase.value === 'sonando') {
    sonido.stop()
    stop()
    fase.value = 'lograda'
  }
  // En práctica no se apaga nada: solo se avisa y el conteo queda listo para
  // reiniciarse a mano.
}

/* ── Reloj de la alarma ───────────────────────────────────────────── */
const objetivoTs = ref(0)
const ahora = ref(Date.now())
let reloj = null

const horaObjetivoTexto = computed(() => (
  objetivoTs.value
    ? new Date(objetivoTs.value).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—'
))

const cuentaRegresiva = computed(() => {
  const ms = Math.max(0, objetivoTs.value - ahora.value)
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const dosDigitos = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${dosDigitos(m)}:${dosDigitos(s)}` : `${dosDigitos(m)}:${dosDigitos(s)}`
})

const calcularObjetivo = () => {
  if (modo.value === 'minutos') {
    const min = Math.max(1, Number(minutos.value) || 1)
    return Date.now() + min * 60000
  }
  const [h, m] = String(hora.value || '07:00').split(':').map(Number)
  const t = new Date()
  t.setHours(h || 0, m || 0, 0, 0)
  // Si esa hora ya pasó hoy, es para mañana.
  if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1)
  return t.getTime()
}

const armar = () => {
  sonido.desbloquear() // el audio necesita este gesto tuyo para poder sonar
  sonido.setVolumen(volumen.value / 100)
  objetivoTs.value = calcularObjetivo()
  guardar()
  fase.value = 'armada'
  if (!reloj) reloj = setInterval(tick, 250)
}

const cancelar = () => {
  objetivoTs.value = 0
  fase.value = 'config'
  sonido.stop()
  if (cameraActive.value) stop()
}

const tick = () => {
  ahora.value = Date.now()
  if (objetivoTs.value && ahora.value >= objetivoTs.value && (fase.value === 'armada' || fase.value === 'practica')) {
    objetivoTs.value = 0
    dispararAlarma()
  }
}

const nuevoTracker = () => {
  tracker = createAlarmChallenge({ id: retoId.value, meta: Number(meta.value) || retoActual.value.metaDefault })
  estado.value = null
  veiaAntes = false
}

const encenderCamara = async () => {
  await start('Alarma: buscando tu cuerpo para contar el reto.')
}

const dispararAlarma = async () => {
  fase.value = 'sonando'
  bitacora.value = []
  nuevoTracker()
  sonido.start()
  log('¡Alarma sonando! Enciende la cámara y haz el reto.')
  if (!cameraActive.value) await encenderCamara()
}

const practicar = async () => {
  const veniaArmada = fase.value === 'armada'
  fase.value = 'practica'
  bitacora.value = []
  nuevoTracker()
  log(veniaArmada ? 'Prueba mientras la alarma sigue armada.' : 'Modo prueba: nada suena, solo detección.')
  if (!cameraActive.value) await encenderCamara()
}

const salirDePractica = () => {
  stop()
  fase.value = objetivoTs.value ? 'armada' : 'config'
}

const reiniciarReto = () => {
  nuevoTracker()
  log('Conteo reiniciado.')
}

const volverAConfig = () => {
  fase.value = 'config'
  estado.value = null
  bitacora.value = []
}

const probarSonido = () => {
  sonido.setVolumen(volumen.value / 100)
  sonido.probar()
}

/* ── Escape de emergencia (solo si la cámara no está disponible) ───── */
const emergenciaSeg = ref(0)
let emergenciaTimer = null

const empezarEmergencia = () => {
  cancelarEmergencia()
  emergenciaTimer = setInterval(() => {
    emergenciaSeg.value += 0.1
    if (emergenciaSeg.value >= 10) {
      cancelarEmergencia()
      sonido.stop()
      stop()
      fase.value = 'config'
    }
  }, 100)
}

const cancelarEmergencia = () => {
  if (emergenciaTimer) { clearInterval(emergenciaTimer); emergenciaTimer = null }
  emergenciaSeg.value = 0
}

/* ── Preferencias en este dispositivo (nada de servidores) ─────────── */
const guardar = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      modo: modo.value,
      minutos: minutos.value,
      hora: hora.value,
      retoId: retoId.value,
      meta: meta.value,
      volumen: volumen.value,
    }))
  } catch (_) { /* modo privado: ni modo */ }
}

const cargar = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const p = JSON.parse(raw)
    if (p.modo === 'hora' || p.modo === 'minutos') modo.value = p.modo
    if (Number.isFinite(p.minutos)) minutos.value = p.minutos
    if (typeof p.hora === 'string') hora.value = p.hora
    if (CHALLENGES.some((r) => r.id === p.retoId)) retoId.value = p.retoId
    if (Number.isFinite(p.meta)) meta.value = p.meta
    if (Number.isFinite(p.volumen)) volumen.value = p.volumen
  } catch (_) { /* datos corruptos: se ignoran */ }
}

onMounted(() => {
  cargar()
  reloj = setInterval(tick, 250)
})

onBeforeUnmount(() => {
  if (reloj) clearInterval(reloj)
  cancelarEmergencia()
  sonido.destroy()
  stop()
})
</script>

<style scoped>
.al-section {
  display: grid;
  gap: var(--space-5);
  text-align: left;
}

.al-card {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.al-card-title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
}

.al-config { display: grid; gap: var(--space-4); }
.al-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }

.al-chip {
  padding: 6px 16px;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  cursor: pointer;
}
.al-chip.is-on { background: var(--surface-brand); border-color: var(--surface-brand); color: var(--text-on-brand); }

.al-field { display: grid; gap: 4px; max-width: 260px; font-size: var(--text-sm); color: var(--text-secondary); }
.al-field input {
  padding: 10px 12px;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-family: inherit;
}

.al-retos { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: var(--space-3); }
.al-reto {
  display: grid;
  gap: 4px;
  padding: var(--space-4);
  text-align: left;
  background: var(--surface-brand-soft);
  border: var(--border-width-strong) solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary);
}
.al-reto.is-on { border-color: var(--surface-brand); background: var(--white); box-shadow: var(--shadow-sm); }
.al-reto-emoji { font-size: var(--text-lg); }
.al-reto-desc { font-size: var(--text-xs); line-height: var(--leading-normal); color: var(--text-secondary); }
.al-reto-necesita { font-size: var(--text-xs); color: var(--text-muted); }

.al-slider { flex: 1; min-width: 160px; accent-color: var(--surface-brand); }
.al-vol { font-variant-numeric: tabular-nums; font-weight: var(--weight-bold); }

.al-acciones { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.al-nota { margin: 0; font-size: var(--text-xs); color: var(--text-muted); }
.al-privacidad {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-brand-soft);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* ── Armada / lograda ── */
.al-armada, .al-lograda {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
  padding: var(--space-6);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
.al-eyebrow { font-size: var(--text-xs); letter-spacing: var(--tracking-eyebrow); font-weight: var(--weight-bold); color: var(--text-accent); }
.al-cuenta {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(var(--text-3xl), 12vw, var(--text-5xl));
  line-height: var(--leading-tight);
  color: var(--text-accent);
  font-variant-numeric: tabular-nums;
}
.al-armada-sub { margin: 0; font-size: var(--text-base); color: var(--text-secondary); }
.al-lograda-emoji { margin: 0; font-size: var(--text-3xl); }
.al-lograda h2 { margin: 0; font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 500; }

/* ── En vivo ── */
.al-live {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--surface-card);
  border: var(--border-width-strong) solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
.al-live.is-alarma { border-color: var(--danger); box-shadow: 0 0 0 4px rgba(217, 83, 79, 0.12); }
.al-live-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.al-live-badge { padding: 5px 14px; border-radius: var(--radius-pill); font-size: var(--text-xs); font-weight: var(--weight-bold); }
.al-live-badge.is-rojo { background: var(--danger); color: var(--white); animation: al-pulso 1.1s infinite; }
.al-live-badge.is-calma { background: var(--surface-brand-soft); color: var(--text-accent); }
.al-live-reto { font-size: var(--text-md); }
.al-live-como { flex: 1 1 260px; font-size: var(--text-xs); color: var(--text-muted); }

.al-live-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, 1fr); gap: var(--space-4); align-items: start; }
.al-stage { position: relative; }
.al-verdict {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  background: rgba(255, 255, 255, 0.92);
}
.al-verdict.is-si { color: var(--success); }
.al-verdict.is-no { color: var(--danger); }

.al-panel { display: grid; gap: var(--space-4); align-content: start; }
.al-panel-title { font-size: var(--text-xs); letter-spacing: var(--tracking-wide); font-weight: var(--weight-bold); color: var(--text-muted); }

.al-progreso { display: grid; gap: 6px; }
.al-progreso-top { display: flex; justify-content: space-between; font-size: var(--text-sm); }
.al-progreso-top strong { font-variant-numeric: tabular-nums; }

.al-barra { height: 8px; border-radius: var(--radius-pill); background: var(--border-subtle); overflow: hidden; }
.al-barra--grande { height: 14px; }
.al-barra-fill { height: 100%; background: var(--surface-brand); transition: width var(--dur-fast) linear; }
.al-barra-fill.is-ok { background: var(--success); }

.al-checks { display: grid; gap: var(--space-3); }
.al-check { display: grid; gap: 4px; }
.al-check-top { display: flex; align-items: baseline; gap: 6px; font-size: var(--text-sm); }
.al-check-label { flex: 1; }
.al-check-val { font-variant-numeric: tabular-nums; font-size: var(--text-xs); color: var(--text-muted); }
.al-check-pista { font-size: var(--text-xs); color: var(--warning); }
.al-check.is-ok .al-check-label { color: var(--success); font-weight: var(--weight-semibold); }

.al-salud { display: grid; gap: 4px; }
.al-salud-row { display: flex; justify-content: space-between; font-size: var(--text-sm); color: var(--text-secondary); }
.al-bloqueo {
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: rgba(217, 83, 79, 0.1);
  color: var(--danger);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}

.al-bitacora ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 3px; }
.al-bitacora li { font-size: var(--text-xs); color: var(--text-secondary); }
.al-bit-hora { font-variant-numeric: tabular-nums; color: var(--text-muted); }

.al-emergencia { display: grid; gap: 6px; padding: var(--space-4); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); }
.al-emergencia p { margin: 0; font-size: var(--text-xs); color: var(--text-muted); }
.al-emergencia-btn { justify-self: start; }

@keyframes al-pulso { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

@media (prefers-reduced-motion: reduce) {
  .al-live-badge.is-rojo { animation: none; }
}

@media (max-width: 860px) {
  .al-live-grid { grid-template-columns: 1fr; }
}
</style>
