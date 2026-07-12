// Persistencia local de Exercise. TODO vive en localStorage — nada de red ni de
// datos que salgan del dispositivo (misma privacidad que el resto de MotionLab).
//
// Guarda: las poses de referencia que capturas (ángulos objetivo + rigor por
// ejercicio), tu rutina, y el resumen de la última sesión.

const KEY = 'motionlab.exercise.v1'

const empty = () => ({ version: 1, referencias: {}, rutina: null, ultimaSesion: null })

const hasStorage = () => {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

export const loadState = () => {
  if (!hasStorage()) return empty()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw)
    return { ...empty(), ...parsed }
  } catch {
    return empty()
  }
}

export const saveState = (state) => {
  if (!hasStorage()) return
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Sin espacio o modo privado: la app sigue, solo no persiste.
  }
}

export const getReference = (id) => loadState().referencias[id] || null

export const saveReference = (id, data) => {
  const state = loadState()
  state.referencias[id] = { ...data }
  saveState(state)
  return state
}

export const getRoutine = () => loadState().rutina

export const saveRoutine = (rutina) => {
  const state = loadState()
  state.rutina = rutina
  saveState(state)
  return state
}

export const getLastSession = () => loadState().ultimaSesion

export const saveLastSession = (sesion) => {
  const state = loadState()
  state.ultimaSesion = sesion
  saveState(state)
  return state
}
