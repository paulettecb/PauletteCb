import { TestBed } from '@angular/core/testing';

import { HandGesturesService, HandLandmark } from './hand-gestures.service';

describe('HandGesturesService', () => {
  let service: HandGesturesService;

  const baseLandmarks = (): HandLandmark[] => Array.from({ length: 21 }, (_, index) => ({
    x: 0.5,
    y: 0.5 + index * 0.001,
    z: 0
  }));

  const openPalm = (): HandLandmark[] => {
    const landmarks = baseLandmarks();
    landmarks[0] = { x: 0.5, y: 0.9 };
    landmarks[2] = { x: 0.48, y: 0.7 };
    landmarks[4] = { x: 0.25, y: 0.55 };
    [
      [6, 8],
      [10, 12],
      [14, 16],
      [18, 20]
    ].forEach(([joint, tip], fingerIndex) => {
      landmarks[joint] = { x: 0.4 + fingerIndex * 0.06, y: 0.6 };
      landmarks[tip] = { x: 0.4 + fingerIndex * 0.06, y: 0.3 };
    });

    return landmarks;
  };

  const fist = (): HandLandmark[] => {
    const landmarks = baseLandmarks();
    landmarks[4] = { x: 0.48, y: 0.55 };
    landmarks[9] = { x: 0.5, y: 0.52 };
    [
      [6, 8],
      [10, 12],
      [14, 16],
      [18, 20]
    ].forEach(([joint, tip]) => {
      landmarks[joint] = { x: 0.5, y: 0.45 };
      landmarks[tip] = { x: 0.5, y: 0.7 };
    });

    return landmarks;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandGesturesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the most probable gesture with metadata', () => {
    const result = service.detectGesture(openPalm());

    expect(result.gestureName).toBe('palmOpen');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.detectedAt instanceof Date).toBeTrue();
    expect(result.landmarks.length).toBe(21);
  });

  it('should keep the normalized boolean methods available', () => {
    expect(service.palmOpen(openPalm())).toBeTrue();
    expect(service.fistClosed(fist())).toBeTrue();
  });

  it('should support array-based landmarks from handpose', () => {
    const result = service.detectGesture(openPalm().map((landmark) => [landmark.x ?? 0, landmark.y ?? 0, landmark.z ?? 0]));

    expect(result.gestureName).toBe('palmOpen');
  });
});
