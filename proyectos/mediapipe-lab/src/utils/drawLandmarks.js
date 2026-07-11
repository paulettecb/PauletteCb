const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
]

const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31],
  [27, 31], [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
]

const REQUIRED_VISIBILITY = 0.5

const getVideoSize = (video) => ({
  width: video.videoWidth || video.clientWidth || 0,
  height: video.videoHeight || video.clientHeight || 0,
})

const isVisible = (landmark) => Boolean(landmark && (landmark.visibility ?? 1) >= REQUIRED_VISIBILITY)

const drawPoint = (context, landmark, width, height, radius = 5) => {
  if (!isVisible(landmark)) return

  context.beginPath()
  context.arc(landmark.x * width, landmark.y * height, radius, 0, Math.PI * 2)
  context.fill()
}

const drawConnection = (context, landmarks, connection, width, height) => {
  const [fromIndex, toIndex] = connection
  const from = landmarks[fromIndex]
  const to = landmarks[toIndex]

  if (!isVisible(from) || !isVisible(to)) return

  context.beginPath()
  context.moveTo(from.x * width, from.y * height)
  context.lineTo(to.x * width, to.y * height)
  context.stroke()
}

const normalizeResults = (results) => {
  if (results?.hands || results?.pose) return results
  return { hands: results, pose: null }
}

const drawLandmarkGroup = (context, groups, connections, width, height, styles) => {
  context.save()
  context.lineWidth = styles.lineWidth
  context.strokeStyle = styles.strokeStyle
  context.fillStyle = styles.fillStyle

  groups.forEach((landmarks) => {
    connections.forEach((connection) => drawConnection(context, landmarks, connection, width, height))
    landmarks.forEach((landmark) => drawPoint(context, landmark, width, height, styles.radius))
  })

  context.restore()
}

export const drawLandmarks = (canvas, video, results) => {
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

  // Grosores pensados para video de 640 de ancho; a 720p o más se escalan
  // para que el trazo se vea igual en pantalla.
  const scale = Math.max(width / 640, 1)

  drawLandmarkGroup(context, poses, POSE_CONNECTIONS, width, height, {
    lineWidth: 4 * scale,
    strokeStyle: '#4FA47A',
    fillStyle: '#F4B860',
    radius: 4 * scale,
  })

  drawLandmarkGroup(context, hands, HAND_CONNECTIONS, width, height, {
    lineWidth: 3 * scale,
    strokeStyle: '#E85DA0',
    fillStyle: '#8795D2',
    radius: 5 * scale,
  })
}

export { HAND_CONNECTIONS, POSE_CONNECTIONS, isVisible }
