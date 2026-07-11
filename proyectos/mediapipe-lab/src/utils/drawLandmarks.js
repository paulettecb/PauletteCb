import { FaceLandmarker } from '@mediapipe/tasks-vision'

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
]

// El esqueleto de pose (33 puntos) partido en zonas para que el playground
// pueda prender/apagar cada una por separado.
const POSE_FACE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
]
const POSE_ARMS_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24],
]
const POSE_LEGS_CONNECTIONS = [
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
]
const POSE_CONNECTIONS = [...POSE_FACE_CONNECTIONS, ...POSE_ARMS_CONNECTIONS, ...POSE_LEGS_CONNECTIONS]

// Nombres para el modo explicación ("izq/der" = TU lado: en la vista espejo
// coinciden con lo que ves).
const POSE_LABELS = [
  'nariz', 'ojo izq int', 'ojo izq', 'ojo izq ext', 'ojo der int', 'ojo der', 'ojo der ext',
  'oreja izq', 'oreja der', 'boca izq', 'boca der',
  'hombro izq', 'hombro der', 'codo izq', 'codo der', 'muñeca izq', 'muñeca der',
  'meñique izq', 'meñique der', 'índice izq', 'índice der', 'pulgar izq', 'pulgar der',
  'cadera izq', 'cadera der', 'rodilla izq', 'rodilla der', 'tobillo izq', 'tobillo der',
  'talón izq', 'talón der', 'punta pie izq', 'punta pie der',
]
const HAND_TIP_LABELS = [
  [0, 'muñeca'], [4, 'pulgar'], [8, 'índice'], [12, 'medio'], [16, 'anular'], [20, 'meñique'],
]
const FACE_REGION_LABELS = [
  ['labios', FaceLandmarker.FACE_LANDMARKS_LIPS],
  ['ojo izq', FaceLandmarker.FACE_LANDMARKS_LEFT_EYE],
  ['ojo der', FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE],
  ['ceja izq', FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW],
  ['ceja der', FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW],
]

// Qué se dibuja de cada resultado; el playground de Experiments lo muta en
// vivo. "etiquetas" es el modo explicación (nombres sobre cada punto).
export const DEFAULT_DISPLAY = {
  poseCara: true,
  poseBrazos: true,
  posePiernas: true,
  faceMalla: true,
  faceRasgos: true,
  faceIris: true,
  etiquetas: false,
}

const REQUIRED_VISIBILITY = 0.5

// Trazos, radios y fuentes de los overlays están dimensionados para video de
// 640 de ancho; con esto se escalan igual en todos los canvas (landmarks,
// jardín de Whimsy, métricas de ManeuverCoach) cuando la cámara da 720p+.
export const overlayScale = (width) => Math.max(width / 640, 1)

const getVideoSize = (video) => ({
  width: video.videoWidth || video.clientWidth || 0,
  height: video.videoHeight || video.clientHeight || 0,
})

const isVisible = (landmark) => Boolean(landmark && (landmark.visibility ?? 1) >= REQUIRED_VISIBILITY)

const drawPoint = (context, landmark, width, height, radius = 5, requireVisibility = true) => {
  if (!landmark) return
  if (requireVisibility && !isVisible(landmark)) return

  context.beginPath()
  context.arc(landmark.x * width, landmark.y * height, radius, 0, Math.PI * 2)
  context.fill()
}

const drawConnection = (context, landmarks, connection, width, height, requireVisibility = true) => {
  const [fromIndex, toIndex] = connection
  const from = landmarks[fromIndex]
  const to = landmarks[toIndex]

  if (!from || !to) return
  if (requireVisibility && (!isVisible(from) || !isVisible(to))) return

  context.beginPath()
  context.moveTo(from.x * width, from.y * height)
  context.lineTo(to.x * width, to.y * height)
  context.stroke()
}

// Las conexiones de FaceLandmarker vienen como { start, end }; la malla trae
// ~2600 segmentos, así que va todo en un solo trazo.
const drawFaceSet = (context, landmarks, connections, width, height, strokeStyle, lineWidth) => {
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.beginPath()
  connections.forEach(({ start, end }) => {
    const from = landmarks[start]
    const to = landmarks[end]
    if (!from || !to) return
    context.moveTo(from.x * width, from.y * height)
    context.lineTo(to.x * width, to.y * height)
  })
  context.stroke()
}

// El canvas de landmarks está espejado por CSS (scaleX(-1)); el texto se
// pre-espeja aquí para que en pantalla se lea derecho.
const drawLabel = (context, text, x, y, scale) => {
  context.save()
  context.translate(x, y - 8 * scale)
  context.scale(-1, 1)
  context.font = `600 ${Math.round(11 * scale)}px sans-serif`
  context.textAlign = 'center'
  context.lineWidth = 3 * scale
  context.strokeStyle = 'rgba(38, 42, 74, 0.85)'
  context.fillStyle = '#FFFFFF'
  context.strokeText(text, 0, 0)
  context.fillText(text, 0, 0)
  context.restore()
}

const faceRegionAnchor = (landmarks, connections) => {
  const indexes = new Set()
  connections.forEach(({ start, end }) => {
    indexes.add(start)
    indexes.add(end)
  })
  let sumX = 0
  let sumY = 0
  indexes.forEach((index) => {
    sumX += landmarks[index].x
    sumY += landmarks[index].y
  })
  return { x: sumX / indexes.size, y: sumY / indexes.size }
}

const normalizeResults = (results) => {
  if (results?.hands || results?.pose || results?.face) return results
  return { hands: results, pose: null, face: null }
}

const drawLandmarkGroup = (context, groups, connections, width, height, styles, pointRange = null) => {
  context.save()
  context.lineWidth = styles.lineWidth
  context.strokeStyle = styles.strokeStyle
  context.fillStyle = styles.fillStyle
  const requireVisibility = styles.requireVisibility ?? true

  groups.forEach((landmarks) => {
    connections.forEach((connection) => drawConnection(context, landmarks, connection, width, height, requireVisibility))
    if (pointRange) {
      for (let i = pointRange[0]; i <= pointRange[1]; i += 1) {
        drawPoint(context, landmarks[i], width, height, styles.radius, requireVisibility)
      }
    } else {
      landmarks.forEach((landmark) => drawPoint(context, landmark, width, height, styles.radius, requireVisibility))
    }
  })

  context.restore()
}

export const drawLandmarks = (canvas, video, results, display = DEFAULT_DISPLAY) => {
  if (!canvas || !video) return

  const { width, height } = getVideoSize(video)
  const context = canvas.getContext('2d')

  if (!context || !width || !height) return

  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height

  context.clearRect(0, 0, width, height)

  const normalizedResults = normalizeResults(results)
  const hands = normalizedResults.hands?.landmarks || []
  const poses = normalizedResults.pose?.landmarks || []
  const faces = normalizedResults.face?.faceLandmarks || []

  const scale = overlayScale(width)
  const anyFaceLayer = display.faceMalla || display.faceRasgos || display.faceIris

  // La cara va primero para que el esqueleto y las manos queden encima.
  faces.forEach((landmarks) => {
    if (display.faceMalla) {
      drawFaceSet(context, landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, width, height, 'rgba(135, 149, 210, 0.35)', 1 * scale)
    }
    if (display.faceRasgos) {
      drawFaceSet(context, landmarks, FaceLandmarker.FACE_LANDMARKS_CONTOURS, width, height, '#5562A4', 2 * scale)
    }
    if (display.faceIris) {
      drawFaceSet(context, landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, width, height, '#F4B860', 2 * scale)
      drawFaceSet(context, landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, width, height, '#F4B860', 2 * scale)
    }
  })

  const poseStyles = {
    lineWidth: 4 * scale,
    strokeStyle: '#4FA47A',
    fillStyle: '#F4B860',
    radius: 4 * scale,
  }
  const poseGroups = [
    display.poseCara && { connections: POSE_FACE_CONNECTIONS, points: [0, 10] },
    display.poseBrazos && { connections: POSE_ARMS_CONNECTIONS, points: [11, 22] },
    display.posePiernas && { connections: POSE_LEGS_CONNECTIONS, points: [23, 32] },
  ].filter(Boolean)

  poseGroups.forEach((group) => {
    drawLandmarkGroup(context, poses, group.connections, width, height, poseStyles, group.points)
  })

  // OJO: el HandLandmarker NO calcula visibility — el campo llega SIEMPRE en
  // 0. Con el filtro de visibilidad activo ni un solo punto de mano se
  // pintaría (así estuvo roto durante meses: "2 manos" en el status y nada
  // en pantalla). El cuerpo sí trae visibility real y conserva su filtro.
  drawLandmarkGroup(context, hands, HAND_CONNECTIONS, width, height, {
    lineWidth: 3 * scale,
    strokeStyle: '#E85DA0',
    fillStyle: '#8795D2',
    radius: 5 * scale,
    requireVisibility: false,
  })

  if (display.etiquetas) {
    poses.forEach((landmarks) => {
      poseGroups.forEach((group) => {
        for (let i = group.points[0]; i <= group.points[1]; i += 1) {
          if (isVisible(landmarks[i])) {
            drawLabel(context, POSE_LABELS[i], landmarks[i].x * width, landmarks[i].y * height, scale)
          }
        }
      })
    })
    hands.forEach((landmarks) => {
      HAND_TIP_LABELS.forEach(([index, text]) => {
        const landmark = landmarks[index]
        if (landmark) drawLabel(context, text, landmark.x * width, landmark.y * height, scale)
      })
    })
    if (anyFaceLayer) {
      faces.forEach((landmarks) => {
        FACE_REGION_LABELS.forEach(([text, connections]) => {
          const anchor = faceRegionAnchor(landmarks, connections)
          drawLabel(context, text, anchor.x * width, anchor.y * height, scale)
        })
      })
    }
  }
}

export { HAND_CONNECTIONS, POSE_CONNECTIONS, isVisible }
