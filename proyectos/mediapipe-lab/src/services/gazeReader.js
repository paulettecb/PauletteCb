// Mate de la mirada — FUENTE ÚNICA en el package compartido lector-kyn. Este
// módulo solo re-exporta para que el composable useGazeReader (y el componente
// Vue) usen exactamente el mismo motor que el lector de los mini-libros y no se
// desincronicen. La lógica y los comentarios viven en:
//   proyectos/packages/lector-kyn/gaze/gaze-math.js
export {
  averageVerticalGaze,
  averageHorizontalGaze,
  eyeOpenness,
  isBlink,
  updateOpenBaseline,
  median,
  buildGazeMapping,
  mapOffsetToY,
  readGaze,
  build2DMapping,
  mapGaze,
  verticalSpan,
} from '../../../packages/lector-kyn/gaze/gaze-math.js'
