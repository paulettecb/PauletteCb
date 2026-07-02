# MediaPipe Lab

Real-time computer vision experiments lab powered by Google MediaPipe and Vue 3.

## Overview

MediaPipe Lab is an experimental playground for building and testing computer vision applications using MediaPipe tasks. Organized into four main sections:

- **LSM** - Lengua de Señas Mexicana (Mexican Sign Language)
- **AGILITY** - Canine movement analysis and tracking
- **EXERCISE** - Human posture and exercise form analysis
- **EXPERIMENTS** - Open playground for new features and ideas

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5174`

### Build

```bash
npm run build
```

## Technologies

- **MediaPipe Tasks Vision** - Real-time pose detection, hand tracking, body segmentation
- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend tooling
- **TensorFlow.js** - Machine learning in the browser

## Project Structure

```
src/
  ├── main.js           # Application entry point
  ├── App.vue          # Root component
  └── components/      # Reusable components
experiments/
  ├── pose-detection/
  ├── hand-tracking/
  ├── body-segmentation/
  └── custom-models/
assets/
  ├── models/          # MediaPipe model files
  └── videos/          # Test videos
```

## Supported MediaPipe Tasks

- ✅ Pose Landmarker - 33 body keypoints
- ✅ Hand Landmarker - Finger and palm tracking
- ✅ Holistic - Simultaneous pose, hand, face detection
- ✅ Object Detector
- ✅ Image Segmentation

## Performance Considerations

- GPU acceleration via WebGL when available
- Model caching for optimal load times
- Responsive canvas scaling
- Real-time inference (30+ FPS target)

## Browser Support

- Chrome 90+
- Safari 15+ (limited)
- Edge 90+
- Firefox 88+

## Next Steps

1. Implement routing between lab sections
2. Build pose detection visualization
3. Add camera permission handling
4. Create performance monitoring dashboard
