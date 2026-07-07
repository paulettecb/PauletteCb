// Coach de voz sobre la Web Speech API: instrucciones y correcciones habladas
// para entrenar sin mirar la pantalla. Prefiere una voz en español y degrada
// en silencio cuando el navegador no soporta speechSynthesis (o en headless).

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

let cachedVoice = null
let voicesLoaded = false

const pickSpanishVoice = () => {
  if (!supported) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  voicesLoaded = true
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith('es-mx')) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('es-us')) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('es')) ||
    null
  )
}

if (supported) {
  cachedVoice = pickSpanishVoice()
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = pickSpanishVoice()
  }
}

export const createVoiceCoach = () => {
  let enabled = true
  let lastSpoken = ''
  let lastSpokenAt = 0

  return {
    get supported() { return supported },
    get enabled() { return enabled },
    setEnabled(value) {
      enabled = value
      if (!value && supported) window.speechSynthesis.cancel()
    },
    // interrupt: corta lo que se esté diciendo (para correcciones urgentes).
    // dedupeMs: evita repetir la misma frase en bucle cuadro a cuadro.
    speak(text, { interrupt = false, dedupeMs = 1500, rate = 1.05 } = {}) {
      if (!supported || !enabled || !text) return
      const now = Date.now()
      if (text === lastSpoken && now - lastSpokenAt < dedupeMs) return
      lastSpoken = text
      lastSpokenAt = now

      if (interrupt) window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-MX'
      utterance.rate = rate
      if (!voicesLoaded) cachedVoice = pickSpanishVoice()
      if (cachedVoice) utterance.voice = cachedVoice
      window.speechSynthesis.speak(utterance)
    },
    stop() {
      if (supported) window.speechSynthesis.cancel()
    },
  }
}
