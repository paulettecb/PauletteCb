import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HandGesturesService } from '../../utils/hand-gestures.service';
import { AvatarAnimationsService } from '../../utils/avatar-animations.service';
import { LsmSign, SignAnimation, SignPlaybackService } from './sign-playback.service';
import * as posedetection from '@tensorflow-models/pose-detection';

@Component({
  selector: 'app-lsm-avatar',
  templateUrl: './lsm-avatar.component.html',
  styleUrls: ['./lsm-avatar.component.scss']
})
export class LsmAvatarComponent implements OnInit, OnDestroy {
  @ViewChild('threeCanvas', { static: true }) canvasRef!: ElementRef;
  @ViewChild('video', { static: true }) videoRef!: ElementRef;
  @ViewChild('handCanvas', { static: true }) handCanvasRef!: ElementRef;  // New Canvas for Hand Visualization
  @ViewChild('poseCanvas', { static: true }) poseCanvasRef!: ElementRef;

  private handCtx!: CanvasRenderingContext2D | null;  // Canvas Context for Hand Drawing
  private poseCtx!: CanvasRenderingContext2D | null;
  private detectionTimerId?: number;

  private readonly handConnections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20]
  ];

  private readonly poseConnections = [
    [5, 6],
    [5, 7], [7, 9],
    [6, 8], [8, 10],
    [5, 11], [6, 12],
    [11, 12],
    [11, 13], [13, 15],
    [12, 14], [14, 16]
  ];

  constructor(
    private avatarService: AvatarAnimationsService,
    private handGestureService: HandGesturesService,
    private signPlaybackService: SignPlaybackService
  ) {}

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private handModel!: any;
  private avatar!: THREE.Object3D;
  private skeleton!: THREE.Skeleton;
  private poseModel!: any; // Declare it

  signs: LsmSign[] = this.signPlaybackService.signs;
  selectedSign: LsmSign = this.signs[0];
  practiceMode = false;
  feedbackMessage = 'Observa la demostración y activa la cámara para practicar.';

  async ngOnInit() {
    await tf.setBackend('webgl');
    await tf.ready();
    this.initThreeJS();
    this.handCtx = this.handCanvasRef.nativeElement.getContext('2d'); // Initialize Hand Canvas
    this.poseCtx = this.poseCanvasRef.nativeElement.getContext('2d');
    await this.initPoseTracking();
    await this.initHandTracking();
    await this.loadAvatar();
  }

  ngOnDestroy(): void {
    if (this.detectionTimerId) {
      window.clearInterval(this.detectionTimerId);
    }

    const stream = (this.videoRef.nativeElement as HTMLVideoElement).srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
  }

  private initThreeJS() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1, 3);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 4, 5);
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);

    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  private async loadAvatar() {
    const loader = new GLTFLoader();
    const avatarPath = window.location.pathname.includes('lsm-app')
      ? '/lsm-app/assets/avatar.glb'
      : '/assets/avatar.glb';
    loader.load(avatarPath, (gltf) => {
      this.avatar = gltf.scene;
      this.scene.add(this.avatar);
      this.extractSkeleton();
      this.avatar.scale.set(1.5, 1.5, 1.5);
    }, undefined, (error) => console.error('Error loading model:', error));
  }

  private extractSkeleton() {
    const skinnedMesh = this.avatar.getObjectByProperty("type", "SkinnedMesh") as THREE.SkinnedMesh;
    if (skinnedMesh && skinnedMesh.skeleton) {
      this.skeleton = skinnedMesh.skeleton;
      console.log("✅ Skeleton Loaded:", this.skeleton);
    } else {
      console.warn("⚠️ No skeleton found in the model.");
    }
  }

  loadSign(sign: LsmSign) {
    this.selectedSign = sign;
    const animationStarted = this.signPlaybackService.loadSign(sign, this.skeleton);
    this.feedbackMessage = animationStarted
      ? `Demostrando: ${sign.nombre}. Revisa los pasos y practica cuando estés listo.`
      : 'El avatar aún está cargando. Intenta de nuevo en unos segundos.';
  }

  startPractice() {
    this.practiceMode = true;
    this.feedbackMessage = `Cámara activa. Practica la seña "${this.selectedSign.nombre}" frente a la cámara.`;
  }

  private updatePracticeFeedback(detectedAnimation: SignAnimation | null) {
    if (!this.practiceMode || !detectedAnimation) return;

    this.feedbackMessage = detectedAnimation === this.selectedSign.animacion
      ? `¡Bien! Detectamos un gesto compatible con "${this.selectedSign.nombre}".`
      : `Gesto detectado. Ajusta tu postura siguiendo los pasos de "${this.selectedSign.nombre}".`;
  }

  private playDetectedAnimation(animation: SignAnimation) {
    const sign = this.signPlaybackService.getSignByAnimation(animation);
    if (!sign) return;

    if (this.practiceMode) {
      this.signPlaybackService.loadSign(sign, this.skeleton);
      return;
    }

    this.loadSign(sign);
  }

  private async initHandTracking() {
    try {
      this.handModel = await handpose.load();
      const video = this.videoRef.nativeElement;

      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          console.log("📸 Camera ready, starting detection...");
          this.detectHands();
        };
      });
    } catch (error) {
      console.error("Error initializing hand tracking:", error);
    }
  }

  private async initPoseTracking() {
    try {
        this.poseModel = await posedetection.createDetector(
            posedetection.SupportedModels.MoveNet, 
            { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        console.log("🏃‍♂️ Pose Model Loaded!");
    } catch (error) {
        console.error("⚠️ Error loading pose model:", error);
    }
}

  private async detectHands() {
    const video = this.videoRef.nativeElement as HTMLVideoElement;

    if (!this.handCtx || !this.poseCtx) {
      console.warn("⚠️ Landmark canvas context not available.");
      return;
    }

    this.detectionTimerId = window.setInterval(async () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      this.syncOverlaySize(video);
      const predictions = await this.handModel.estimateHands(video);
      const poses = this.poseModel ? await this.poseModel.estimatePoses(video) : [];

      this.clearHandCanvas();
      this.clearPoseCanvas();

      if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        this.drawHandLandmarks(landmarks);

        const gesture = this.handGestureService.detectGesture(landmarks);
        const detectedAnimation = gesture.gestureName === 'palmOpen' ? 'wave' : gesture.gestureName === 'thumbUp' ? 'thank_you' : null;
        this.updatePracticeFeedback(detectedAnimation);

        if (gesture.gestureName === 'fistClosed') {
          console.log(`✊ Fist Detected (${gesture.confidence}) → Avatar Stops`);
          this.avatarService.stopAvatar(this.avatar, this.skeleton);
        } else if (gesture.gestureName === 'palmOpen') {
          console.log(`🖐️ Open Palm Detected (${gesture.confidence}) → Avatar Waves`);
          this.playDetectedAnimation('wave');
        } else if (gesture.gestureName === 'thumbUp') {
          console.log(`👍 Thumb Up Detected (${gesture.confidence}) → Avatar Nods`);
          this.playDetectedAnimation('thank_you');
        }
      }

      if (poses.length > 0 && this.poseCtx) {
        const poseLandmarks = poses[0]?.keypoints ?? poses[0]?.landmarks ?? [];
        const poseCtx = this.poseCtx;
        this.drawConnections(poseCtx, poseLandmarks, this.poseConnections, 'rgba(135, 149, 210, .95)', 5);
        this.drawLandmarks(poseCtx, poseLandmarks, 'rgba(246, 235, 196, .96)', 7);
      }
    }, 100);
  }

  // ✅ Function to Draw Hand Landmarks
  private drawHandLandmarks(landmarks: number[][]): void {
    if (!this.handCtx || !landmarks) return;

    const ctx = this.handCtx;
    const canvas = this.handCanvasRef.nativeElement;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections imported from the original prototype.
    ctx.strokeStyle = 'rgba(246, 235, 196, .92)';
    ctx.lineWidth = 4;
    this.handConnections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(landmarks[start][0], landmarks[start][1]);
        ctx.lineTo(landmarks[end][0], landmarks[end][1]);
        ctx.stroke();
    });

    // Draw landmarks
    ctx.fillStyle = 'rgba(232, 93, 160, .95)';
    landmarks.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
    });
  }

  // ✅ Clears the hand canvas when no hands are detected
  private clearHandCanvas(): void {
    if (!this.handCtx) return;
    this.handCtx.clearRect(0, 0, this.handCanvasRef.nativeElement.width, this.handCanvasRef.nativeElement.height);
  }

  private clearPoseCanvas(): void {
    if (!this.poseCtx) return;
    this.poseCtx.clearRect(0, 0, this.poseCanvasRef.nativeElement.width, this.poseCanvasRef.nativeElement.height);
  }

  private syncOverlaySize(video: HTMLVideoElement): void {
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    [this.handCanvasRef.nativeElement, this.poseCanvasRef.nativeElement].forEach((canvas: HTMLCanvasElement) => {
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    });
  }

  private drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[], color: string, radius = 5) {
    ctx.fillStyle = color;
    for (const landmark of landmarks ?? []) {
      const point = this.toCanvasPoint(landmark);
      if (!point) continue;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private drawConnections(ctx: CanvasRenderingContext2D, landmarks: any[], connections: number[][], color: string, lineWidth = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (const [start, end] of connections) {
      const from = this.toCanvasPoint(landmarks?.[start]);
      const to = this.toCanvasPoint(landmarks?.[end]);
      if (!from || !to) continue;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  private toCanvasPoint(landmark: any): { x: number; y: number } | null {
    if (!landmark) return null;
    if (Array.isArray(landmark)) return { x: landmark[0], y: landmark[1] };
    if (typeof landmark.x === 'number' && typeof landmark.y === 'number') return { x: landmark.x, y: landmark.y };
    return null;
  }
}