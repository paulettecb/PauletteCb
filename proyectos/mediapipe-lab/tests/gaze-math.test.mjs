// Tests de la mate de mirada (package lector-kyn), con landmarks sintéticos.
// Correr: node --test proyectos/mediapipe-lab/tests/gaze-math.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  averageVerticalGaze,
  averageHorizontalGaze,
  eyeOpenness,
  isBlink,
  updateOpenBaseline,
  median,
  buildGazeMapping,
  mapOffsetToY,
  build2DMapping,
  mapGaze,
} from '../../packages/lector-kyn/gaze/gaze-math.js'

// Fabrica un arreglo de 478 landmarks que codifica exactamente (oX, oY) y una
// apertura `op`. Coloca comisuras de ancho 0.10 e iris desplazado oX/oY·ancho.
const W = 0.1
const makeLandmarks = ({ oX = 0, oY = 0, op = 0.3 } = {}) => {
  const pts = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }))
  const eye = (outerI, innerI, irisI, topI, botI, cx) => {
    const midX = cx
    const midY = 0.5
    pts[outerI] = { x: cx - W / 2, y: midY }
    pts[innerI] = { x: cx + W / 2, y: midY }
    pts[irisI] = { x: midX + oX * W, y: midY + oY * W }
    pts[topI] = { x: midX, y: midY - (op * W) / 2 }
    pts[botI] = { x: midX, y: midY + (op * W) / 2 }
  }
  // Izquierdo: 33/133 comisuras, 468 iris, 159/145 párpados.
  eye(33, 133, 468, 159, 145, 0.35)
  // Derecho: 263/362 comisuras, 473 iris, 386/374 párpados.
  eye(263, 362, 473, 386, 374, 0.65)
  return pts
}

test('offsets: vertical y horizontal se recuperan del iris', () => {
  const lm = makeLandmarks({ oX: 0.2, oY: -0.15, op: 0.35 })
  assert.ok(Math.abs(averageVerticalGaze(lm) - -0.15) < 1e-9)
  assert.ok(Math.abs(averageHorizontalGaze(lm) - 0.2) < 1e-9)
  assert.ok(Math.abs(eyeOpenness(lm) - 0.35) < 1e-9)
})

test('mirar a la derecha ⇒ offset horizontal sube (no se cancela el signo)', () => {
  assert.ok(averageHorizontalGaze(makeLandmarks({ oX: 0.25 })) > 0)
  assert.ok(averageHorizontalGaze(makeLandmarks({ oX: -0.25 })) < 0)
})

test('landmarks insuficientes ⇒ null', () => {
  assert.equal(averageVerticalGaze([{ x: 0, y: 0 }]), null)
  assert.equal(averageHorizontalGaze(null), null)
})

test('median ignora no-finitos', () => {
  assert.equal(median([3, 1, 2]), 2)
  assert.equal(median([1, 2, 3, 4]), 2.5)
  assert.equal(median([NaN, 5, NaN]), 5)
  assert.equal(median([]), null)
})

test('isBlink / updateOpenBaseline', () => {
  assert.equal(isBlink(null, 0.3), true, 'sin señal = parpadeo')
  let base = null
  base = updateOpenBaseline(base, 0.3)
  assert.equal(base, 0.3)
  base = updateOpenBaseline(base, 0.4) // sube rápido
  assert.ok(base > 0.3)
  assert.equal(isBlink(0.3, 0.3), false, 'abierto normal no es parpadeo')
  assert.equal(isBlink(0.05, 0.3), true, 'muy cerrado es parpadeo')
})

test('mapeo 1D por tramos: interpola y satura', () => {
  const m = buildGazeMapping([{ offset: -0.1, y: 100 }, { offset: 0.1, y: 300 }])
  assert.equal(mapOffsetToY(0, m), 200)
  assert.equal(mapOffsetToY(-5, m), 100, 'satura abajo')
  assert.equal(mapOffsetToY(5, m), 300, 'satura arriba')
  assert.equal(buildGazeMapping([{ offset: 0.1, y: 100 }]), null, '<2 anclas ⇒ null')
})

// Grid sintético 3×5 con acoplamiento cruzado conocido (ladeo). El detilt debe
// removerlo y recuperar la pantalla en los propios puntos de calibración.
const H = 1000
const WIDTH = 1000
const ROWS = [0.14, 0.32, 0.5, 0.68, 0.86]
const COLS = [0.2, 0.5, 0.8]
const K_TRUE = 0.2 // ladeo de oY por oX
const KX_TRUE = 0.15 // ladeo de oX por oY
const buildGrid = (cols = COLS) => {
  const samples = []
  ROWS.forEach((ry, r) => {
    cols.forEach((cx, c) => {
      const oYbase = -0.06 + r * 0.03
      const oXbase = -0.05 + c * 0.05
      samples.push({
        sx: cx * WIDTH,
        sy: ry * H,
        oX: oXbase + KX_TRUE * oYbase,
        oY: oYbase + K_TRUE * oXbase,
      })
    })
  })
  return samples
}

test('calibración 2D: recupera pantalla en los puntos (detilt quita el ladeo)', () => {
  const samples = buildGrid()
  const mapping = build2DMapping(samples)
  assert.ok(mapping, 'mapping construido')
  assert.ok(Math.abs(mapping.kY - K_TRUE) < 1e-9, 'kY recuperado')
  assert.ok(Math.abs(mapping.kX - KX_TRUE) < 1e-9, 'kX recuperado')
  for (const s of samples) {
    const { x, y } = mapGaze(s.oX, s.oY, mapping)
    assert.ok(Math.abs(y - s.sy) < 1e-6, `y≈sy (got ${y}, want ${s.sy})`)
    assert.ok(Math.abs(x - s.sx) < 1e-6, `x≈sx (got ${x}, want ${s.sx})`)
  }
})

test('calibración 2D es monótona en Y', () => {
  const mapping = build2DMapping(buildGrid())
  const ys = ROWS.map((ry) => {
    const oYbase = -0.06 + ROWS.indexOf(ry) * 0.03
    return mapGaze(0, oYbase, mapping).y
  })
  for (let i = 1; i < ys.length; i += 1) assert.ok(ys[i] >= ys[i - 1], 'y no decrece')
})

test('degradación: una sola columna ≡ vertical 1D, sin eje X', () => {
  const oneCol = buildGrid([0.5])
  const mapping = build2DMapping(oneCol)
  assert.ok(mapping, 'mapping con 1 columna')
  assert.equal(mapping.kY, 0, 'sin variación horizontal ⇒ kY=0')
  assert.ok(mapping.vertical, 'eje vertical calibrado')
  assert.equal(mapping.horizontal, null, 'no se puede mapear X con 1 columna')
  const { x, y } = mapGaze(0, 0, mapping)
  assert.equal(x, null)
  assert.ok(Number.isFinite(y))
})

test('degenerado: todos los offsets iguales ⇒ null', () => {
  const flat = ROWS.flatMap((ry) => COLS.map((cx) => ({ sx: cx * WIDTH, sy: ry * H, oX: 0.01, oY: 0.02 })))
  assert.equal(build2DMapping(flat), null)
  assert.equal(build2DMapping([]), null)
})
