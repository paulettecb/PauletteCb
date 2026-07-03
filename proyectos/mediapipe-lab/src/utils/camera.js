export const startCamera = async (videoElement) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  })

  videoElement.srcObject = stream
  await videoElement.play()

  return stream
}

export const stopCamera = (stream) => {
  stream.getTracks().forEach((track) => {
    track.stop()
  })
}
