import { computed } from 'vue'
import { useMediaPipeTrackingCamera } from './useMediaPipeTrackingCamera'

export const useHandDetectionCamera = () => {
  const trackingCamera = useMediaPipeTrackingCamera({ hands: true, pose: true })

  return {
    ...trackingCamera,
    handDetectionStatus: computed(() => trackingCamera.trackingStatus.value),
  }
}
