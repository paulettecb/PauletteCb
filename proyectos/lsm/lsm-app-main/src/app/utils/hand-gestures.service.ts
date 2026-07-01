import { Injectable } from '@angular/core';

export type GestureName = 'thumbUp' | 'palmOpen' | 'fistClosed' | 'unknown';

export type HandLandmark = {
  x?: number;
  y?: number;
  z?: number;
} | [number, number, number?];

export interface GestureResult {
  gestureName: GestureName;
  confidence: number;
  detectedAt: Date;
  landmarks: HandLandmark[];
}

interface GestureRule {
  name: Exclude<GestureName, 'unknown'>;
  evaluate: (landmarks: HandLandmark[]) => number;
}

@Injectable({
  providedIn: 'root'
})
export class HandGesturesService {
  private readonly minimumLandmarks = 21;
  private readonly confidenceThreshold = 0.7;

  private readonly gestureRules: GestureRule[] = [
    { name: 'thumbUp', evaluate: (landmarks) => this.scoreThumbUp(landmarks) },
    { name: 'palmOpen', evaluate: (landmarks) => this.scorePalmOpen(landmarks) },
    { name: 'fistClosed', evaluate: (landmarks) => this.scoreFistClosed(landmarks) }
  ];

  constructor() { }

  detectGesture(landmarks: HandLandmark[]): GestureResult {
    const normalizedLandmarks = this.normalizeLandmarks(landmarks);

    if (!this.hasEnoughLandmarks(normalizedLandmarks)) {
      return this.createResult('unknown', 0, normalizedLandmarks);
    }

    const bestGesture = this.gestureRules
      .map((rule) => ({ name: rule.name, confidence: rule.evaluate(normalizedLandmarks) }))
      .sort((current, next) => next.confidence - current.confidence)[0];

    if (!bestGesture || bestGesture.confidence < this.confidenceThreshold) {
      return this.createResult('unknown', bestGesture?.confidence ?? 0, normalizedLandmarks);
    }

    return this.createResult(bestGesture.name, bestGesture.confidence, normalizedLandmarks);
  }

  thumbUp(landmarks: HandLandmark[]): boolean {
    const result = this.detectGesture(landmarks);
    return result.gestureName === 'thumbUp' && result.confidence >= this.confidenceThreshold;
  }

  palmOpen(landmarks: HandLandmark[]): boolean {
    const result = this.detectGesture(landmarks);
    return result.gestureName === 'palmOpen' && result.confidence >= this.confidenceThreshold;
  }

  fistClosed(landmarks: HandLandmark[]): boolean {
    const result = this.detectGesture(landmarks);
    return result.gestureName === 'fistClosed' && result.confidence >= this.confidenceThreshold;
  }

  private scoreThumbUp(landmarks: HandLandmark[]): number {
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const indexKnuckle = landmarks[5];
    const wrist = landmarks[0];
    const nonThumbFingersFolded = this.foldedFingersRatio(landmarks);

    return this.average([
      this.isAbove(thumbTip, indexKnuckle),
      this.isAbove(thumbBase, thumbTip),
      this.isHorizontallySeparated(thumbTip, thumbBase),
      this.isAbove(thumbTip, wrist),
      nonThumbFingersFolded
    ]);
  }

  private scorePalmOpen(landmarks: HandLandmark[]): number {
    const fingerExtension = this.extendedFingersRatio(landmarks);
    const thumbOpen = this.isHorizontallySeparated(landmarks[4], landmarks[2]);
    const fingertipsAboveWrist = this.average([8, 12, 16, 20].map((tip) => this.isAbove(landmarks[tip], landmarks[0])));

    return this.average([fingerExtension, thumbOpen, fingertipsAboveWrist]);
  }

  private scoreFistClosed(landmarks: HandLandmark[]): number {
    const foldedFingers = this.foldedFingersRatio(landmarks);
    const thumbAcrossPalm = this.isCloseOnX(landmarks[4], landmarks[9]);

    return this.average([foldedFingers, thumbAcrossPalm]);
  }

  private normalizeLandmarks(landmarks: HandLandmark[] = []): HandLandmark[] {
    return landmarks.map((landmark) => ({
      x: this.coordinate(landmark, 'x'),
      y: this.coordinate(landmark, 'y'),
      z: this.coordinate(landmark, 'z')
    }));
  }

  private coordinate(landmark: HandLandmark, axis: 'x' | 'y' | 'z'): number {
    const indexByAxis = { x: 0, y: 1, z: 2 }[axis] as 0 | 1 | 2;

    if (Array.isArray(landmark)) {
      return landmark[indexByAxis] ?? 0;
    }

    return landmark?.[axis] ?? 0;
  }

  private hasEnoughLandmarks(landmarks: HandLandmark[]): boolean {
    return Array.isArray(landmarks) && landmarks.length >= this.minimumLandmarks;
  }

  private extendedFingersRatio(landmarks: HandLandmark[]): number {
    return this.average([
      this.isAbove(landmarks[8], landmarks[6]),
      this.isAbove(landmarks[12], landmarks[10]),
      this.isAbove(landmarks[16], landmarks[14]),
      this.isAbove(landmarks[20], landmarks[18])
    ]);
  }

  private foldedFingersRatio(landmarks: HandLandmark[]): number {
    return this.average([
      this.isBelow(landmarks[8], landmarks[6]),
      this.isBelow(landmarks[12], landmarks[10]),
      this.isBelow(landmarks[16], landmarks[14]),
      this.isBelow(landmarks[20], landmarks[18])
    ]);
  }

  private isAbove(first: HandLandmark, second: HandLandmark): number {
    return this.coordinate(first, 'y') < this.coordinate(second, 'y') ? 1 : 0;
  }

  private isBelow(first: HandLandmark, second: HandLandmark): number {
    return this.coordinate(first, 'y') > this.coordinate(second, 'y') ? 1 : 0;
  }

  private isHorizontallySeparated(first: HandLandmark, second: HandLandmark): number {
    return Math.abs(this.coordinate(first, 'x') - this.coordinate(second, 'x')) > 0.08 ? 1 : 0;
  }

  private isCloseOnX(first: HandLandmark, second: HandLandmark): number {
    return Math.abs(this.coordinate(first, 'x') - this.coordinate(second, 'x')) < 0.18 ? 1 : 0;
  }

  private average(values: number[]): number {
    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  private createResult(gestureName: GestureName, confidence: number, landmarks: HandLandmark[]): GestureResult {
    return {
      gestureName,
      confidence: Number(confidence.toFixed(2)),
      detectedAt: new Date(),
      landmarks
    };
  }
}
