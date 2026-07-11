export const startCamera = async (videoElement) => {
  // Sin constraints el navegador suele entregar 640x480: las manos lejos de
  // la cámara quedan de pocos pixeles y el detector no las encuentra. "ideal"
  // pide 720p sin fallar en cámaras que no lo soportan.
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
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
