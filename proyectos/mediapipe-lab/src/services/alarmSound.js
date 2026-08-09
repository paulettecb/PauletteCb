// Sonido de la alarma, con WebAudio puro (ningún archivo que descargar).
//
// Un patrón de bips que sube de volumen con los segundos: empieza incómodo y
// termina imposible de ignorar. El AudioContext se crea con un gesto tuyo
// (armar la alarma o probar el sonido) porque los navegadores no dejan sonar
// nada sin interacción previa — si no, la alarma sonaría en silencio.

const BIP_HZ = 880
const BIP_ALTO_HZ = 1174 // una quinta arriba: el segundo bip del par
const PERIODO_MS = 900
const RAMPA_MS = 25000 // en cuánto llega del volumen inicial al máximo
const VOL_INICIAL = 0.25

export const createAlarmSound = () => {
  let ctx = null
  let master = null
  let timer = null
  let inicio = 0
  let volumen = 0.8 // 0..1, el que elige Paulette
  let sonando = false
  let vibrarTimer = null

  const asegurarCtx = () => {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!ctx) {
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  // Llamar dentro de un click para dejar el audio listo antes de que suene.
  const desbloquear = () => Boolean(asegurarCtx())

  const bip = (hz, cuando, dur, ganancia) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = hz
    // Ataque y caída suaves: un cuadrado sin rampa truena en las bocinas.
    g.gain.setValueAtTime(0.0001, cuando)
    g.gain.exponentialRampToValueAtTime(Math.max(ganancia, 0.0002), cuando + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur)
    osc.connect(g)
    g.connect(master)
    osc.start(cuando)
    osc.stop(cuando + dur + 0.02)
  }

  const paso = () => {
    if (!ctx || !sonando) return
    const t = ctx.currentTime
    const avance = Math.min(1, (Date.now() - inicio) / RAMPA_MS)
    const nivel = (VOL_INICIAL + (1 - VOL_INICIAL) * avance) * volumen
    master.gain.setTargetAtTime(nivel, t, 0.05)
    bip(BIP_HZ, t + 0.02, 0.16, 0.5)
    bip(BIP_ALTO_HZ, t + 0.24, 0.16, 0.5)
  }

  const vibrar = () => {
    if (!navigator.vibrate) return
    navigator.vibrate([350, 180, 350, 600])
  }

  const start = () => {
    if (sonando) return
    if (!asegurarCtx()) return
    sonando = true
    inicio = Date.now()
    paso()
    timer = setInterval(paso, PERIODO_MS)
    vibrar()
    vibrarTimer = setInterval(vibrar, 2000)
  }

  const stop = () => {
    sonando = false
    if (timer) { clearInterval(timer); timer = null }
    if (vibrarTimer) { clearInterval(vibrarTimer); vibrarTimer = null }
    if (navigator.vibrate) navigator.vibrate(0)
    if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.04)
  }

  // Dos bips al volumen elegido, para calibrar sin armar nada.
  const probar = () => {
    if (!asegurarCtx()) return
    const t = ctx.currentTime
    master.gain.setTargetAtTime(volumen, t, 0.02)
    bip(BIP_HZ, t + 0.02, 0.16, 0.5)
    bip(BIP_ALTO_HZ, t + 0.24, 0.16, 0.5)
    master.gain.setTargetAtTime(0, t + 0.55, 0.05)
  }

  const setVolumen = (v) => {
    volumen = Math.max(0, Math.min(1, Number(v) || 0))
  }

  const destroy = () => {
    stop()
    if (ctx) { ctx.close(); ctx = null; master = null }
  }

  return { start, stop, probar, setVolumen, desbloquear, destroy, get sonando () { return sonando } }
}
