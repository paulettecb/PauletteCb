// Tests del motor de retos de la alarma, con landmarks sintéticos.
// Correr: node --test proyectos/mediapipe-lab/tests/alarm-challenges.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { CHALLENGES, createAlarmChallenge } from '../src/services/alarmChallenges.js'

// Cuerpo de referencia (coordenadas normalizadas, y hacia abajo). Los ajustes
// se pasan como overrides por índice de landmark de MediaPipe Pose.
//   0 nariz · 11/12 hombros · 15/16 muñecas · 23/24 caderas · 25/26 rodillas
//   27/28 tobillos.  Izquierda anatómica = 11/15/23/25/27.
const cuerpo = (over = {}) => {
  const pts = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }))
  const set = (i, x, y) => { pts[i] = { x, y, visibility: 0.9 } }
  set(0, 0.50, 0.10) // nariz
  set(11, 0.58, 0.25); set(12, 0.42, 0.25) // hombros (torso alto = 0.25)
  set(15, 0.62, 0.45); set(16, 0.38, 0.45) // muñecas abajo
  set(23, 0.56, 0.50); set(24, 0.44, 0.50) // caderas
  set(25, 0.56, 0.70); set(26, 0.44, 0.70) // rodillas
  set(27, 0.56, 0.90); set(28, 0.44, 0.90) // tobillos
  for (const [i, p] of Object.entries(over)) pts[Number(i)] = { visibility: 0.9, ...pts[Number(i)], ...p }
  return pts
}

const manosArriba = () => cuerpo({ 15: { y: 0.02 }, 16: { y: 0.02 } })

// Sentadilla: la cadera baja hacia el nivel de la rodilla (depthFrac alto).
const sentadillaAbajo = () => cuerpo({ 23: { y: 0.66 }, 24: { y: 0.66 } })

const jackAbierto = () => cuerpo({
  15: { x: 0.75, y: 0.05 }, 16: { x: 0.25, y: 0.05 },
  27: { x: 0.72 }, 28: { x: 0.28 },
})

const toqueDerecho = () => cuerpo({ 15: { x: 0.42, y: 0.26 } }) // mano izq → hombro der
const toqueIzquierdo = () => cuerpo({ 16: { x: 0.58, y: 0.26 } }) // mano der → hombro izq

test('el catálogo expone los cuatro retos con su meta', () => {
  assert.equal(CHALLENGES.length, 4)
  for (const r of CHALLENGES) {
    assert.ok(r.id && r.nombre && r.comoSeHace)
    assert.ok(r.metaDefault > 0)
  }
})

test('manos arriba: acumula el sostenido y se completa al llegar a la meta', () => {
  const reto = createAlarmChallenge({ id: 'manos-arriba', meta: 1 })
  let t = 0
  let out = reto.update(manosArriba(), t)
  assert.equal(out.listo, false)
  assert.ok(out.checks.every((c) => c.ok))

  // 6 frames de 200 ms = 1.2 s sosteniendo (el primer frame no suma dt).
  for (let i = 0; i < 6; i += 1) {
    t += 200
    out = reto.update(manosArriba(), t)
  }
  assert.equal(out.listo, true)
  assert.ok(out.progreso.hecho >= 1)
})

test('manos arriba: bajar las manos reinicia el sostenido (tras la gracia)', () => {
  const reto = createAlarmChallenge({ id: 'manos-arriba', meta: 3 })
  let t = 0
  for (let i = 0; i < 4; i += 1) { t += 200; reto.update(manosArriba(), t) }
  assert.ok(reto.update(manosArriba(), (t += 200)).holdMs >= 800)

  // Manos abajo más allá de la gracia (350 ms) ⇒ vuelve a cero.
  t += 200
  reto.update(cuerpo(), t)
  t += 200
  const out = reto.update(cuerpo(), t)
  assert.equal(out.holdMs, 0)
  assert.equal(out.evento, 'reinicio')
  assert.equal(out.listo, false)
})

test('manos arriba: un parpadeo de un frame NO borra el sostenido', () => {
  const reto = createAlarmChallenge({ id: 'manos-arriba', meta: 3 })
  let t = 0
  for (let i = 0; i < 5; i += 1) { t += 200; reto.update(manosArriba(), t) }
  const antes = reto.update(manosArriba(), (t += 200)).holdMs

  // 100 ms sin cumplir: dentro de la gracia.
  const out = reto.update(cuerpo(), (t += 100))
  assert.equal(out.holdMs, antes)
})

test('sentadillas: una rep se cuenta al bajar y volver a subir', () => {
  const reto = createAlarmChallenge({ id: 'sentadillas', meta: 2 })
  let t = 0
  const paso = (lm) => { t += 100; return reto.update(lm, t) }

  paso(cuerpo())
  assert.equal(paso(sentadillaAbajo()).progreso.hecho, 0) // aún no sube
  const arriba = paso(cuerpo())
  assert.equal(arriba.progreso.hecho, 1)
  assert.equal(arriba.evento, 'rep')

  // Quedarse arriba no suma reps de más.
  assert.equal(paso(cuerpo()).progreso.hecho, 1)

  paso(sentadillaAbajo())
  const fin = paso(cuerpo())
  assert.equal(fin.progreso.hecho, 2)
  assert.equal(fin.listo, true)
})

test('sentadillas: quedarse abajo no cuenta reps repetidas', () => {
  const reto = createAlarmChallenge({ id: 'sentadillas', meta: 5 })
  let t = 0
  for (let i = 0; i < 10; i += 1) { t += 100; reto.update(sentadillaAbajo(), t) }
  assert.equal(reto.update(sentadillaAbajo(), (t += 100)).progreso.hecho, 0)
})

test('jumping jacks: abrir y cerrar cuenta una rep', () => {
  const reto = createAlarmChallenge({ id: 'jumping-jacks', meta: 1 })
  let t = 0
  reto.update(cuerpo(), t)
  const abierto = reto.update(jackAbierto(), (t += 100))
  assert.ok(abierto.checks.every((c) => c.ok))
  assert.equal(abierto.progreso.hecho, 0)
  const cerrado = reto.update(cuerpo(), (t += 100))
  assert.equal(cerrado.progreso.hecho, 1)
  assert.equal(cerrado.listo, true)
})

test('jumping jacks: solo brazos (sin abrir piernas) no cuenta', () => {
  const reto = createAlarmChallenge({ id: 'jumping-jacks', meta: 1 })
  let t = 0
  reto.update(cuerpo(), t)
  const soloBrazos = reto.update(manosArriba(), (t += 100))
  assert.equal(soloBrazos.checks.find((c) => c.id === 'brazos').ok, true)
  assert.equal(soloBrazos.checks.find((c) => c.id === 'piernas').ok, false)
  assert.equal(reto.update(cuerpo(), (t += 100)).progreso.hecho, 0)
})

test('toques cruzados: alternar cuenta, repetir el mismo lado no', () => {
  const reto = createAlarmChallenge({ id: 'toques-cruzados', meta: 3 })
  let t = 0
  const paso = (lm) => { t += 100; return reto.update(lm, t) }

  assert.equal(paso(toqueDerecho()).progreso.hecho, 1)
  assert.equal(paso(toqueDerecho()).progreso.hecho, 1) // mismo lado: no suma
  assert.equal(paso(toqueIzquierdo()).progreso.hecho, 2)
  assert.equal(paso(cuerpo()).progreso.hecho, 2) // sin tocar: no suma
  const fin = paso(toqueDerecho())
  assert.equal(fin.progreso.hecho, 3)
  assert.equal(fin.listo, true)
})

test('sin cuerpo: no cuenta nada y dice qué falta', () => {
  const reto = createAlarmChallenge({ id: 'manos-arriba', meta: 1 })
  const vacio = reto.update(null, 0)
  assert.equal(vacio.detectado, false)
  assert.equal(vacio.bloqueo, 'No te veo en cámara')
  assert.equal(vacio.listo, false)

  // Muñecas invisibles ⇒ bloqueo nombrando la parte que falta.
  const sinManos = cuerpo({ 15: { y: 0.02, visibility: 0.1 }, 16: { y: 0.02 } })
  const out = reto.update(sinManos, 200)
  assert.equal(out.detectado, true)
  assert.match(out.bloqueo, /muñecas/)
  assert.equal(out.progreso.hecho, 0)
})

test('sin cuerpo el sostenido no avanza aunque pasen segundos', () => {
  const reto = createAlarmChallenge({ id: 'manos-arriba', meta: 1 })
  let t = 0
  for (let i = 0; i < 10; i += 1) { t += 200; reto.update(null, t) }
  assert.equal(reto.update(null, (t += 200)).listo, false)
})

test('un salto de reloj (pestaña dormida) no regala segundos', () => {
  const reto = createAlarmChallenge({ id: 'manos-arriba', meta: 3 })
  reto.update(manosArriba(), 0)
  const out = reto.update(manosArriba(), 60000) // un minuto de golpe
  assert.ok(out.holdMs <= 250)
  assert.equal(out.listo, false)
})

test('reset deja el reto en ceros', () => {
  const reto = createAlarmChallenge({ id: 'toques-cruzados', meta: 2 })
  reto.update(toqueDerecho(), 100)
  reto.reset()
  const out = reto.update(cuerpo(), 200)
  assert.equal(out.progreso.hecho, 0)
  assert.equal(out.listo, false)
})
