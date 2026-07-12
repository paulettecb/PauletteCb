/* Lector KYN — lectura biónica + regla + tamaño + barra mini (TDAH / dislexia).
   Fuente única para los mini-libros KYN. Uso: enlazar este archivo (defer) y
   su CSS con ruta relativa a "KYN Design System/lector-kyn/". Se inyecta la
   barra + la regla y se auto-inicia; no hace falta copiar markup.
   Comparte el localStorage 'lector-kyn' con el resto del ecosistema KYN.
   El selector de texto corrido a bionizar se puede sobrescribir por libro con
   window.LECTOR_KYN_SELECTOR = '...' antes de cargar el script. */
(() => {
  const init = () => {
    const RATIOS = { 1: 0.32, 2: 0.45, 3: 0.6 }
    const KEY = 'lector-kyn'
    const state = Object.assign(
      { bio: false, nivel: 2, regla: false, fuente: 1 },
      JSON.parse(localStorage.getItem(KEY) || '{}'),
    )
    const save = () => localStorage.setItem(KEY, JSON.stringify(state))

    // Los contenedores de texto corrido; títulos y nombres quedan fuera a
    // propósito (la fijación parcial en display grande se ve rota).
    const SELECTOR = window.LECTOR_KYN_SELECTOR || [
      '.capitulo p:not(.eyebrow)', '.capitulo li', '.capitulo td', '.capitulo blockquote',
      '.glosario > p', '.glos-item span', '.portada .dedicatoria', '.indice-text span',
    ].join(', ')

    // Inyecta la barra + la regla (así el mini-libro solo enlaza el bundle).
    document.body.insertAdjacentHTML('beforeend', `
      <div class="regla" aria-hidden="true"></div>
      <div class="lector-bar" role="toolbar" aria-label="Lector KYN: opciones de lectura">
        <button type="button" class="lector-mini" aria-label="Abrir opciones de lectura" title="Lector KYN">⚡</button>
        <span class="lector-titulo">lector</span>
        <button type="button" id="bio-btn" aria-pressed="false" title="Lectura biónica: engrosa el inicio de cada palabra para anclar la vista">⚡ Biónica</button>
        <span class="niveles" role="group" aria-label="Intensidad de fijación">
          <button type="button" data-nivel="1" title="Fijación suave">▁</button>
          <button type="button" data-nivel="2" aria-pressed="true" title="Fijación media">▃</button>
          <button type="button" data-nivel="3" title="Fijación fuerte">▅</button>
        </span>
        <button type="button" id="regla-btn" aria-pressed="false" title="Regla de lectura: una banda que sigue tu cursor para no perder el renglón">📏 Regla</button>
        <button type="button" id="fuente-menos" title="Letra más chica">A−</button>
        <button type="button" id="fuente-mas" title="Letra más grande">A+</button>
      </div>`)

    const originales = new Map()

    const bionizar = (ratio) => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
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
            b.className = 'bio'
            b.textContent = parte.slice(0, corte)
            frag.appendChild(b)
            frag.appendChild(document.createTextNode(parte.slice(corte)))
          })
          nodo.parentNode.replaceChild(frag, nodo)
        })
      })
    }

    const desbionizar = () => {
      originales.forEach((html, el) => { el.innerHTML = html })
      originales.clear()
    }

    const bioBtn = document.getElementById('bio-btn')
    const niveles = document.querySelectorAll('.niveles button')
    const reglaBtn = document.getElementById('regla-btn')
    const regla = document.querySelector('.regla')
    const TAMANOS = ['100%', '112%', '125%']

    const aplicar = () => {
      document.body.classList.toggle('bio-on', state.bio)
      document.body.classList.toggle('regla-on', state.regla)
      document.documentElement.style.fontSize = TAMANOS[state.fuente]
      bioBtn.setAttribute('aria-pressed', String(state.bio))
      reglaBtn.setAttribute('aria-pressed', String(state.regla))
      niveles.forEach((btn) => btn.setAttribute('aria-pressed', String(Number(btn.dataset.nivel) === state.nivel)))
      if (state.bio) bionizar(RATIOS[state.nivel])
      else desbionizar()
    }

    bioBtn.addEventListener('click', () => { state.bio = !state.bio; save(); aplicar() })
    niveles.forEach((btn) => btn.addEventListener('click', () => {
      state.nivel = Number(btn.dataset.nivel); save(); aplicar()
    }))
    reglaBtn.addEventListener('click', () => { state.regla = !state.regla; save(); aplicar() })
    document.getElementById('fuente-menos').addEventListener('click', () => {
      state.fuente = Math.max(0, state.fuente - 1); save(); aplicar()
    })
    document.getElementById('fuente-mas').addEventListener('click', () => {
      state.fuente = Math.min(TAMANOS.length - 1, state.fuente + 1); save(); aplicar()
    })

    let raf = null
    document.addEventListener('pointermove', (e) => {
      if (!state.regla || raf) return
      raf = requestAnimationFrame(() => {
        regla.style.top = `${e.clientY - regla.offsetHeight / 2}px`
        raf = null
      })
    })

    // Modo mini: unos segundos después de tu último ajuste, la barra se
    // encoge a un botoncito ⚡; tócalo para volver a abrirla.
    const bar = document.querySelector('.lector-bar')
    let miniTimer = null
    const armarMini = () => {
      clearTimeout(miniTimer)
      miniTimer = setTimeout(() => bar.classList.add('mini'), 4000)
    }
    bar.addEventListener('click', () => {
      bar.classList.remove('mini')
      armarMini()
    })
    armarMini()

    aplicar()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
