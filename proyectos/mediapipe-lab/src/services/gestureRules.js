const FINGERS = {
  index: { tip: 8, pip: 6, mcp: 5 },
  middle: { tip: 12, pip: 10, mcp: 9 },
  ring: { tip: 16, pip: 14, mcp: 13 },
  pinky: { tip: 20, pip: 18, mcp: 17 },
}

const MIN_EXTENDED_MARGIN = 0.025
const MIN_FOLDED_MARGIN = 0.005

const hasLandmark = (landmark) => (
  landmark && Number.isFinite(landmark.x) && Number.isFinite(landmark.y)
)

const hasRequiredLandmarks = (handLandmarks) => (
  Array.isArray(handLandmarks) &&
  Object.values(FINGERS).every(({ tip, pip, mcp }) => (
    hasLandmark(handLandmarks[tip]) &&
    hasLandmark(handLandmarks[pip]) &&
    hasLandmark(handLandmarks[mcp])
  ))
)

const isFingerExtended = (handLandmarks, finger) => {
  const { tip, pip, mcp } = FINGERS[finger]
  const tipPoint = handLandmarks[tip]
  const pipPoint = handLandmarks[pip]
  const mcpPoint = handLandmarks[mcp]

  return tipPoint.y < pipPoint.y - MIN_EXTENDED_MARGIN && pipPoint.y < mcpPoint.y
}

const isFingerFolded = (handLandmarks, finger) => {
  const { tip, pip } = FINGERS[finger]
  const tipPoint = handLandmarks[tip]
  const pipPoint = handLandmarks[pip]

  return tipPoint.y >= pipPoint.y - MIN_FOLDED_MARGIN
}

export const detectBasicGesture = (handLandmarks) => {
  if (!hasRequiredLandmarks(handLandmarks)) {
    return 'unknown'
  }

  const fingers = Object.keys(FINGERS)
  const extendedFingers = fingers.filter((finger) => isFingerExtended(handLandmarks, finger))
  const foldedFingers = fingers.filter((finger) => isFingerFolded(handLandmarks, finger))

  if (extendedFingers.length === fingers.length) {
    return 'open_hand'
  }

  if (foldedFingers.length === fingers.length) {
    return 'fist'
  }

  if (
    isFingerExtended(handLandmarks, 'index') &&
    ['middle', 'ring', 'pinky'].every((finger) => isFingerFolded(handLandmarks, finger))
  ) {
    return 'index_up'
  }

  return 'unknown'
}
