# Motion Lab

Real-time computer vision experiments lab powered by Google MediaPipe and Vue 3.

## Overview

Motion Lab is an experimental playground for building and testing computer vision applications using MediaPipe tasks. Organized into five main sections:

- **LSM** - Lengua de Señas Mexicana (Mexican Sign Language)
- **AGILITY** - MotionLab Agility Trainer: FCI/FCM course designer, theory micro-lessons with quizzes, and a camera-based handler coach that checks your handling cues (signal arm, front cross rotation, weave entry stance, deceleration) with pose landmarks
- **EXERCISE** - Human posture and exercise form analysis
- **WHIMSY** - Jardín de Manos: a hand-gesture garden (pinch to plant flowers, open palm for wind, fist for butterflies, index finger for sparkle trails)
- **EXPERIMENTS** - Open playground for new features and ideas

### AGILITY · MotionLab Agility Trainer

Built around the FCI Agility Regulations as applied in Mexico by the Federación Canófila Mexicana (FCM):

- **Diseñador de pistas**: drag & drop SVG course editor with the full FCI obstacle set, sequence numbering, dog-path preview, course length + TRS/TRM calculation, and live validation against regulation constraints (obstacle counts, jump minimums, weave rules, spacing, straight approaches). Courses persist to localStorage and export as JSON/SVG.
- **Teoría en lecciones**: Spanish micro-lessons covering size categories, grades, obstacle specs, contact zones, the weave entry rule, faults/refusals/eliminations and course times — each with a quiz and tracked progress.
- **Coach de manejo**: MediaPipe Pose drills for the handler's body language — signal-arm extension by dog side, weave-entry stance, full front-cross rotation counting, and deceleration (knee flexion) reps with real-time ✓/✗ criteria.

## Quick Start

### Installation

```bash
# Run from the repository root
npm install
```

### Development

```bash
# Run from the repository root
npm run dev
```

Opens at `http://localhost:5174`

### Build

```bash
# Run from the repository root
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
