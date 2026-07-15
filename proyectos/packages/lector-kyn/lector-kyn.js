// Lector KYN — módulo compartido de accesibilidad de lectura (TDAH / dislexia).
// Se enlaza con <script type="module" src=".../lector-kyn/lector-kyn.js"> y se
// auto-inyecta: barra de opciones, regla de lectura (sigue el cursor en vertical,
// CLICK EN EL TEXTO = pausa/reanuda con cursor ⏸/▶️), lectura biónica, tamaño de
// letra, modo mini y —opt-in— la MIRADA (webcam/iris, todo local): un puntito
// magenta sobre la banda marca a lo ancho dónde miras (complemento del mouse).
//
// Config (opcional) vía window.LECTOR_KYN_CONFIG antes del <script>:
//   { textSelector, containerSelector, modelUrl, side }
// - textSelector: nodos de texto corrido a bionizar (títulos quedan fuera).
// - containerSelector: contenedor a escalar con A−/A+ (null ⇒ documentElement).
// - modelUrl: override del modelo de cara (default: CDN de Google).
// - side: 'left' (default) | 'right' — esquina de la barra y el panel.
//
// Requiere http(s) (o servidor local): al ser módulo ESM + WASM, abrir el HTML
// como file:// no lo carga. La mirada además necesita permiso de cámara.

const CFG = Object.assign(
  {
    textSelector:
      '.capitulo p:not(.eyebrow), .capitulo li, .capitulo td, .capitulo blockquote, .glosario > p, .glos-item span, .indice-text span',
    containerSelector: null,
    modelUrl: null,
  },
  window.LECTOR_KYN_CONFIG || {},
)

const STORAGE_KEY = 'lector-kyn'
const RATIOS = { 1: 0.32, 2: 0.45, 3: 0.6 }
const TAMANOS = ['100%', '112%', '125%']
const NIVEL_MARCAS = { 1: '▁', 2: '▃', 3: '▅' }
const NIVEL_TITULOS = { 1: 'Fijación suave', 2: 'Fijación media', 3: 'Fijación fuerte' }
// Grosores de la regla, de la más delgadita a la más ancha (la de siempre).
const GROSORES = [
  { label: 'línea', css: '3px' },
  { label: 'fina', css: '1.2em' },
  { label: 'media', css: '2em' },
  { label: 'ancha', css: '3.2em' },
]
// Grid de calibración: 3 columnas × 5 filas = 15 puntos (máxima). Reusa las
// fracciones verticales del componente Vue.
const CAL_ROWS = [0.14, 0.32, 0.5, 0.68, 0.86]
const CAL_COLS = [0.2, 0.5, 0.8]

// Cursores ⏸/▶️ para la pausa de la regla (click en el texto congela/reanuda).
const cursorSvg = (inner) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>${inner}</svg>`)}") 12 12, pointer`
const CURSOR_PAUSA = cursorSvg("<circle cx='12' cy='12' r='10' fill='white' stroke='#5562A4' stroke-width='2'/><rect x='8.6' y='8' width='2.3' height='8' rx='1.1' fill='#5562A4'/><rect x='13.1' y='8' width='2.3' height='8' rx='1.1' fill='#5562A4'/>")
const CURSOR_PLAY = cursorSvg("<circle cx='12' cy='12' r='10' fill='white' stroke='#E85DA0' stroke-width='2'/><path d='M9.7 8L16 12L9.7 16Z' fill='#E85DA0'/>")

const readState = () => {
  const base = { bio: false, nivel: 2, regla: false, fuente: 0, grosor: 1 }
  try {
    return Object.assign(base, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'))
  } catch {
    return base
  }
}

const init = () => {
  const state = readState()
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

  // --- Inyectar CSS (resuelto por import.meta.url, inmune a dónde viva el host) ---
  const cssHref = new URL('./lector-kyn.css', import.meta.url).href
  if (!document.querySelector(`link[data-lector-kyn]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssHref
    link.setAttribute('data-lector-kyn', '')
    document.head.appendChild(link)
  }

  // --- Inyectar DOM ---
  const host = document.createElement('div')
  host.innerHTML = `
    <div class="lector-kyn-regla" aria-hidden="true"></div>
    <div class="lector-kyn-punto" aria-hidden="true"></div>
    <div class="lector-kyn-panel" aria-live="polite">
      <video class="lk-video" autoplay playsinline muted></video>
      <div class="lk-panel-info">
        <span class="lk-dot"></span>
        <span class="lk-panel-text">Listo para calibrar.</span>
        <button type="button" class="lk-recal" hidden>Recalibrar</button>
      </div>
    </div>
    <div class="lector-kyn-cal" role="dialog" aria-label="Calibración de mirada">
      <div class="lk-cal-dot"></div>
      <div class="lk-cal-card">
        <strong class="lk-cal-title"></strong>
        <p class="lk-cal-instr"></p>
        <p class="lk-cal-warn" hidden></p>
        <div class="lk-cal-actions">
          <button type="button" class="lk-primary lk-capturar">Capturar punto</button>
          <button type="button" class="lk-cancelar">Cancelar</button>
        </div>
        <div class="lk-cal-actions">
          <button type="button" class="lk-cal-modo" data-modo="max">Máxima (3×5)</button>
          <button type="button" class="lk-cal-modo" data-modo="rapida">Rápida (3 pts)</button>
        </div>
      </div>
    </div>
    <div class="lector-kyn-bar" role="toolbar" aria-label="Lector KYN: opciones de lectura">
      <button type="button" class="lk-mini-btn" aria-label="Abrir opciones de lectura" title="Lector KYN">⚡</button>
      <span class="lk-titulo">lector</span>
      <button type="button" class="lk-bio" aria-pressed="false" title="Lectura biónica: engrosa el inicio de cada palabra para anclar la vista">⚡ Biónica</button>
      <span class="lk-niveles" role="group" aria-label="Intensidad de fijación">
        <button type="button" data-nivel="1" title="${NIVEL_TITULOS[1]}">${NIVEL_MARCAS[1]}</button>
        <button type="button" data-nivel="2" title="${NIVEL_TITULOS[2]}">${NIVEL_MARCAS[2]}</button>
        <button type="button" data-nivel="3" title="${NIVEL_TITULOS[3]}">${NIVEL_MARCAS[3]}</button>
      </span>
      <button type="button" class="lk-regla" aria-pressed="false" title="Regla de lectura: una banda que sigue tu cursor (o tu mirada) para no perder el renglón">📏 Regla</button>
      <button type="button" class="lk-grosor" title="Grosor de la regla">grosor: fina</button>
      <button type="button" class="lk-mirada" aria-pressed="false" title="Regla con la mirada: la banda sigue tus ojos (usa la cámara, todo local, solo en el sitio publicado)">👁️ Mirada</button>
      <button type="button" class="lk-menos" title="Letra más chica">A−</button>
      <button type="button" class="lk-mas" title="Letra más grande">A+</button>
    </div>
  `
  while (host.firstElementChild) document.body.appendChild(host.firstElementChild)

  const $ = (sel) => document.querySelector(sel)
  const bar = $('.lector-kyn-bar')
  const regla = $('.lector-kyn-regla')
  const punto = $('.lector-kyn-punto')
  const panel = $('.lector-kyn-panel')
  const video = $('.lk-video')
  const cal = $('.lector-kyn-cal')
  const calDot = $('.lk-cal-dot')
  const calTitle = $('.lk-cal-title')
  const calInstr = $('.lk-cal-instr')
  const calWarn = $('.lk-cal-warn')
  const bioBtn = $('.lk-bio')
  const reglaBtn = $('.lk-regla')
  const grosorBtn = $('.lk-grosor')
  const miradaBtn = $('.lk-mirada')
  const niveles = [...document.querySelectorAll('.lk-niveles button')]
  const dot = $('.lk-dot')
  const panelText = $('.lk-panel-text')
  const recalBtn = $('.lk-recal')
  const capturarBtn = $('.lk-capturar')
  const calCard = $('.lk-cal-card')

  // Lado de la barra y el panel (default izquierda; los mini-libros KYN tienen
  // el botón "↑ índice" abajo-derecha). Configurable: LECTOR_KYN_CONFIG.side.
  if (CFG.side === 'right') { bar.classList.add('lk-right'); panel.classList.add('lk-right') }

  // ===== Lectura biónica =====
  let originales = new Map()
  const desbionizar = () => {
    originales.forEach((html, el) => { el.innerHTML = html })
    originales.clear()
  }
  const bionizar = () => {
    const ratio = RATIOS[state.nivel]
    document.querySelectorAll(CFG.textSelector).forEach((el) => {
      if (!originales.has(el)) originales.set(el, el.innerHTML)
      else el.innerHTML = originales.get(el)
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const nodos = []
      while (walker.nextNode()) nodos.push(walker.currentNode)
      nodos.forEach((nodo) => {
        if (!nodo.nodeValue.trim()) return
        const frag = document.createDocumentFragment()
        nodo.nodeValue.split(/(\s+)/).forEach((parte) => {
          if (!parte.trim() || !/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(parte)) {
            frag.appendChild(document.createTextNode(parte))
            return
          }
          const corte = Math.max(1, Math.round(parte.length * ratio))
          const b = document.createElement('b')
          b.className = 'lk-bio'
          b.textContent = parte.slice(0, corte)
          frag.appendChild(b)
          frag.appendChild(document.createTextNode(parte.slice(corte)))
        })
        nodo.parentNode.replaceChild(frag, nodo)
      })
    })
  }

  const aplicarFuente = () => {
    const container = CFG.containerSelector ? document.querySelector(CFG.containerSelector) : document.documentElement
    if (container) container.style.fontSize = TAMANOS[state.fuente]
  }

  // ===== Regla + puntito de mirada + pausa =====
  // Complemento: el MOUSE mueve la banda azul (el renglón, vertical) y —si la
  // mirada está calibrada— un puntito magenta sobre la banda marca a lo ancho
  // (horizontal) dónde van tus ojos. Un click en el texto CONGELA todo (pausa)
  // y otro lo reanuda: así retomas el renglón exacto donde te quedaste.
  let frozen = false
  let lastPointerY = null
  const gazeRuling = () => gazeOn && reader && reader.state.calibrated
  const bandVisible = () => state.regla || gazeRuling()
  const setReglaAt = (clientY) => {
    const alto = regla.offsetHeight || 0
    regla.style.top = `${clientY - alto / 2}px`
    punto.style.top = `${clientY}px` // el puntito viaja centrado sobre la banda
  }
  const setPuntoX = (x) => { punto.style.left = `${x}px` }
  const updateCursor = () => {
    document.body.style.cursor = bandVisible() && !cal.classList.contains('lk-on')
      ? (frozen ? CURSOR_PLAY : CURSOR_PAUSA)
      : ''
  }
  const aplicarRegla = () => {
    const show = bandVisible()
    if (!show) frozen = false
    regla.style.display = show ? 'block' : 'none'
    regla.style.setProperty('--regla-alto', GROSORES[state.grosor].css)
    regla.classList.toggle('lk-frozen', frozen)
    punto.style.display = gazeRuling() ? 'block' : 'none'
    punto.classList.toggle('lk-frozen', frozen)
    if (show && lastPointerY === null) setReglaAt(window.innerHeight * 0.4) // posición inicial
    updateCursor()
  }

  const aplicar = () => {
    document.body.classList.toggle('lk-bio-on', state.bio)
    bar.classList.toggle('lk-bio-on', state.bio)
    aplicarFuente()
    bioBtn.setAttribute('aria-pressed', String(state.bio))
    reglaBtn.setAttribute('aria-pressed', String(state.regla))
    niveles.forEach((btn) => btn.setAttribute('aria-pressed', String(Number(btn.dataset.nivel) === state.nivel)))
    grosorBtn.textContent = `grosor: ${GROSORES[state.grosor].label}`
    aplicarRegla()
    if (state.bio) bionizar()
    else desbionizar()
  }

  // ===== Eventos de la barra =====
  bioBtn.addEventListener('click', () => { state.bio = !state.bio; persist(); aplicar() })
  niveles.forEach((btn) => btn.addEventListener('click', () => {
    state.nivel = Number(btn.dataset.nivel); persist(); aplicar()
  }))
  reglaBtn.addEventListener('click', () => { state.regla = !state.regla; persist(); aplicar() })
  grosorBtn.addEventListener('click', () => {
    state.grosor = (state.grosor + 1) % GROSORES.length; persist(); aplicar()
  })
  $('.lk-menos').addEventListener('click', () => {
    state.fuente = Math.max(0, state.fuente - 1); persist(); aplicarFuente()
  })
  $('.lk-mas').addEventListener('click', () => {
    state.fuente = Math.min(TAMANOS.length - 1, state.fuente + 1); persist(); aplicarFuente()
  })

  // La banda sigue el cursor en vertical (salvo congelada).
  let raf = null
  document.addEventListener('pointermove', (e) => {
    lastPointerY = e.clientY
    if (frozen || !bandVisible() || raf) return
    raf = requestAnimationFrame(() => { setReglaAt(lastPointerY); raf = null })
  })

  // Click en el texto = pausa/reanuda (congela el renglón para retomarlo sin
  // perderlo). No toca clics en enlaces/botones ni cuando estás seleccionando.
  const NO_TOGGLE = 'a, button, input, textarea, select, label, summary, [role="button"], .lector-kyn-bar, .lector-kyn-panel, .lector-kyn-cal'
  document.addEventListener('click', (e) => {
    if (!bandVisible() || cal.classList.contains('lk-on')) return
    if (e.target.closest && e.target.closest(NO_TOGGLE)) return
    if (String(window.getSelection ? window.getSelection() : '').length) return // seleccionando texto
    frozen = !frozen
    if (!frozen && lastPointerY !== null) setReglaAt(lastPointerY) // al reanudar salta a donde está el mouse
    regla.classList.toggle('lk-frozen', frozen)
    punto.classList.toggle('lk-frozen', frozen)
    updateCursor()
  })

  // Modo mini: la barra se encoge a un botoncito ⚡ tras unos segundos.
  let miniTimer = null
  const armarMini = () => {
    clearTimeout(miniTimer)
    miniTimer = setTimeout(() => bar.classList.add('lk-mini'), 4000)
  }
  bar.addEventListener('click', () => { bar.classList.remove('lk-mini'); armarMini() })

  // ===== Mirada (opt-in, lazy) =====
  let reader = null
  let gazeOn = false
  let calMode = 'max'
  let calPoints = []
  let calStep = 0
  let calSamples = []
  let capturing = false

  const gridPoints = () => {
    const pts = []
    CAL_ROWS.forEach((fy, r) => {
      const cols = r % 2 ? [...CAL_COLS].reverse() : CAL_COLS
      cols.forEach((fx) => pts.push({ fx, fy }))
    })
    return pts
  }
  // Rápida = 3 puntos horizontales (izq/centro/der): el complemento usa la
  // mirada en horizontal, así que basta calibrar ese eje.
  const rapidaPoints = () => CAL_COLS.map((fx) => ({ fx, fy: 0.5 }))

  const onStatus = (s) => {
    dot.classList.toggle('lk-live', s.facePresent && !s.blinking)
    recalBtn.hidden = !(s.calibrated && cal.classList.contains('lk-on') === false)
    if (cal.classList.contains('lk-on')) return // el overlay maneja su propio texto
    if (s.status) panelText.textContent = s.status
    else if (!s.facePresent) panelText.textContent = 'No te veo — acomódate frente a la cámara.'
    else if (s.calibrated) panelText.textContent = 'Siguiendo tu mirada 👁️'
    else panelText.textContent = 'Listo para calibrar.'
  }
  // La mirada mueve el puntito en HORIZONTAL sobre la banda (la vertical la
  // lleva el mouse). Congelada, el puntito se queda marcando la palabra.
  const onGaze = (x) => { if (gazeRuling() && !frozen && x !== null) setPuntoX(x) }

  const ensureReader = async () => {
    if (reader) return reader
    const mod = await import(new URL('./gaze/gaze-reader.js', import.meta.url).href)
    reader = mod.createGazeReader({ onGaze, onStatus })
    return reader
  }

  const updateCard = () => {
    calTitle.textContent = `Calibrando la mirada · paso ${calStep + 1} de ${calPoints.length}`
    calInstr.textContent = capturing
      ? 'Midiendo un momento… sostén la mirada en el punto.'
      : 'Sin mover la cabeza, mira el punto rosa y presiona Espacio (o "Capturar"). Aguanta ahí un momento.'
    capturarBtn.textContent = capturing ? 'Midiendo…' : 'Capturar punto'
    capturarBtn.disabled = capturing || !(reader && reader.state.facePresent)
    document.querySelectorAll('.lk-cal-modo').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === calMode)))
  }
  const moveDot = () => {
    const p = calPoints[calStep]
    calDot.style.left = `${p.fx * 100}%`
    calDot.style.top = `${p.fy * 100}%`
    // La tarjeta de instrucciones se coloca en el cuadrante OPUESTO al punto,
    // para no taparlo nunca (antes tapaba los puntos de la esquina abajo-derecha).
    calCard.style.left = p.fx < 0.5 ? 'auto' : '1.5rem'
    calCard.style.right = p.fx < 0.5 ? '1.5rem' : 'auto'
    calCard.style.top = p.fy < 0.5 ? 'auto' : '1.5rem'
    calCard.style.bottom = p.fy < 0.5 ? '1.5rem' : 'auto'
  }
  const showWarn = (msg) => { calWarn.textContent = msg; calWarn.hidden = !msg }

  const startCalibration = (mode) => {
    calMode = mode
    calPoints = mode === 'rapida' ? rapidaPoints() : gridPoints()
    calStep = 0
    calSamples = []
    capturing = false
    showWarn('')
    cal.classList.add('lk-on')
    panel.classList.add('lk-calibrando')
    moveDot()
    updateCard()
  }

  const finishCalibration = () => {
    cal.classList.remove('lk-on')
    panel.classList.remove('lk-calibrando')
    if (!reader.setCalibration(calSamples)) startCalibration(calMode) // inválida, reintentar
    else { aplicarRegla(); onStatus({ ...reader.state }) }
  }

  const captureCalibration = async () => {
    if (capturing || !(reader && reader.state.facePresent)) return
    showWarn('')
    capturing = true
    updateCard()
    const pt = await reader.capturePoint()
    capturing = false
    if (!cal.classList.contains('lk-on')) return // se canceló mientras medía
    if (!pt) { showWarn('No pude medir (¿parpadeaste?). Míralo fijo e inténtalo de nuevo.'); updateCard(); return }
    const p = calPoints[calStep]
    calSamples.push({ sx: p.fx * window.innerWidth, sy: p.fy * window.innerHeight, oX: pt.oX, oY: pt.oY })
    if (calStep < calPoints.length - 1) { calStep += 1; moveDot(); updateCard(); return }
    finishCalibration()
  }

  const cancelCalibration = () => {
    if (capturing) return
    cal.classList.remove('lk-on')
    panel.classList.remove('lk-calibrando')
    if (!(reader && reader.state.calibrated)) { gazeOn = false; panel.classList.remove('lk-on'); miradaBtn.setAttribute('aria-pressed', 'false'); reader && reader.stop() }
  }

  const toggleMirada = async () => {
    if (gazeOn) {
      gazeOn = false
      miradaBtn.setAttribute('aria-pressed', 'false')
      cal.classList.remove('lk-on')
      panel.classList.remove('lk-on', 'lk-calibrando')
      if (reader) { reader.stop(); reader.clearCalibration() }
      aplicarRegla()
      return
    }
    miradaBtn.setAttribute('aria-pressed', 'true')
    gazeOn = true
    panel.classList.add('lk-on')
    panelText.textContent = 'Preparando cámara…'
    try {
      await ensureReader()
    } catch (e) {
      gazeOn = false
      miradaBtn.setAttribute('aria-pressed', 'false')
      panelText.textContent = `No se pudo cargar la mirada${e?.message ? `: ${e.message}` : '.'}`
      return
    }
    await reader.start(video, CFG.modelUrl || undefined)
    if (reader.state.active) startCalibration('max')
    else {
      gazeOn = false
      miradaBtn.setAttribute('aria-pressed', 'false')
      // reader.start ya dejó el mensaje de error en el status → visible en la pastilla.
      setTimeout(() => { if (!gazeOn) panel.classList.remove('lk-on') }, 4000)
    }
  }

  miradaBtn.addEventListener('click', toggleMirada)
  capturarBtn.addEventListener('click', captureCalibration)
  $('.lk-cancelar').addEventListener('click', cancelCalibration)
  recalBtn.addEventListener('click', () => startCalibration(calMode))
  document.querySelectorAll('.lk-cal-modo').forEach((b) => b.addEventListener('click', () => startCalibration(b.dataset.modo)))
  document.addEventListener('keydown', (e) => {
    if (cal.classList.contains('lk-on') && !capturing && (e.code === 'Space' || e.key === ' ')) {
      e.preventDefault()
      captureCalibration()
    }
  })

  aplicar()
  armarMini()
}

if (!window.__lectorKynLoaded) {
  window.__lectorKynLoaded = true
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
}
