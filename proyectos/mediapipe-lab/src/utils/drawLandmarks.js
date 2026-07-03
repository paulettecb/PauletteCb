const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
]

const getVideoSize = (video) => ({
  width: video.videoWidth || video.clientWidth || 0,
  height: video.videoHeight || video.clientHeight || 0,
})

const drawPoint = (context, landmark, width, height) => {
  context.beginPath()
  context.arc(landmark.x * width, landmark.y * height, 5, 0, Math.PI * 2)
  context.fill()
}

const drawConnection = (context, landmarks, connection, width, height) => {
  const [fromIndex, toIndex] = connection
  const from = landmarks[fromIndex]
  const to = landmarks[toIndex]

  if (!from || !to) {
    return
  }

  context.beginPath()
  context.moveTo(from.x * width, from.y * height)
  context.lineTo(to.x * width, to.y * height)
  context.stroke()
}

export const drawLandmarks = (canvas, video, results) => {
  if (!canvas || !video) {
    return
  }

  const { width, height } = getVideoSize(video)
  const context = canvas.getContext('2d')

  if (!context || !width || !height) {
    return
  }

  if (canvas.width !== width) {
    canvas.width = width
  }

  if (canvas.height !== height) {
    canvas.height = height
  }

  context.clearRect(0, 0, width, height)

  const hands = results?.landmarks || []

  context.save()
  context.lineWidth = 3
  context.strokeStyle = '#E85DA0'
  context.fillStyle = '#8795D2'

  hands.forEach((landmarks) => {
    HAND_CONNECTIONS.forEach((connection) => {
      drawConnection(context, landmarks, connection, width, height)
    })

    landmarks.forEach((landmark) => {
      drawPoint(context, landmark, width, height)
    })
  })

  context.restore()
}

export { HAND_CONNECTIONS }
