// Dibuja el "doble esqueleto" del coach de Exercise sobre el canvas:
//   · fantasma de referencia (periwinkle, punteado), anclado a TU cadera y
//     escalado a TU torso para que se te encime sin importar tu tamaño;
//   · tu esqueleto en vivo (magenta), respetando la visibilidad de cada punto;
//   · un punto de color por articulación según el semáforo (verde/ámbar/rojo).
//
// El canvas se espeja por CSS igual que el video (scaleX(-1)); como aquí no hay
// texto, no hace falta pre-espejar nada.

import { overlayScale, isVisible } from './drawLandmarks'
import { BODY_CONNECTIONS, BODY_LANDMARKS, poseAnchor, liveAnchor } from '../data/referencePoses'

const REF_COLOR = '#AEB8E2'
const LIVE_COLOR = '#E85DA0'

const getVideoSize = (video) => ({
  width: video.videoWidth || video.clientWidth || 0,
  height: video.videoHeight || video.clientHeight || 0,
})

// Puntos de la plantilla de referencia llevados a píxeles, anclados/escalados a
// la pose viva cuando hay cadera visible; si no, se centran tal cual.
const resolveReference = (pose, live, width, height) => {
  const tmpl = poseAnchor(pose)
  if (!tmpl) return null
  const anchored = liveAnchor(live)
  const k = anchored ? anchored.torso / (tmpl.torso || 0.2) : 1
  const hip = anchored ? anchored.hip : tmpl.hip
  const points = {}
  for (const i of BODY_LANDMARKS) {
    const t = pose[i]
    if (!t) continue
    const nx = hip[0] + (t[0] - tmpl.hip[0]) * k
    const ny = hip[1] + (t[1] - tmpl.hip[1]) * k
    points[i] = { x: nx * width, y: ny * height }
  }
  return points
}

const strokeSkeleton = (ctx, points, connections, { visibilityGuard = false } = {}) => {
  for (const [a, b] of connections) {
    const from = points[a]
    const to = points[b]
    if (!from || !to) continue
    if (visibilityGuard && (!isVisible(from) || !isVisible(to))) continue
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }
}

export const drawExercisePose = (canvas, video, live, opts = {}) => {
  if (!canvas || !video) return
  const { width, height } = getVideoSize(video)
  const ctx = canvas.getContext('2d')
  if (!ctx || !width || !height) return

  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  ctx.clearRect(0, 0, width, height)

  const scale = overlayScale(width)
  const { referencePose, showReference = true, statusByIndex = {}, liveColor = LIVE_COLOR } = opts

  // ── Fantasma de referencia ──
  if (showReference && referencePose) {
    const refPoints = resolveReference(referencePose, live, width, height)
    if (refPoints) {
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = REF_COLOR
      ctx.lineWidth = 3 * scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([6 * scale, 5 * scale])
      strokeSkeleton(ctx, refPoints, BODY_CONNECTIONS)
      ctx.restore()
    }
  }

  if (!live) return

  // Pasa los landmarks vivos a píxeles (conservando visibility para el guard).
  const livePx = {}
  for (const i of BODY_LANDMARKS) {
    const lm = live[i]
    if (!lm) continue
    livePx[i] = { x: lm.x * width, y: lm.y * height, visibility: lm.visibility }
  }

  // ── Tu esqueleto en vivo ──
  ctx.save()
  ctx.strokeStyle = liveColor
  ctx.lineWidth = 3.6 * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  strokeSkeleton(ctx, livePx, BODY_CONNECTIONS, { visibilityGuard: true })
  ctx.restore()

  // ── Puntos del semáforo por articulación ──
  ctx.save()
  for (const i of BODY_LANDMARKS) {
    const p = livePx[i]
    if (!p || !isVisible(p)) continue
    const color = statusByIndex[i]
    if (color) {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.globalAlpha = 0.22
      ctx.arc(p.x, p.y, 11 * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(p.x, p.y, 6 * scale, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.fillStyle = liveColor
      ctx.arc(p.x, p.y, 4 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}
