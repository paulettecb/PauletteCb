const signs = [
  { name: 'Hola', state: 'wave', cue: 'Palma abierta + movimiento suave', note: 'Dispara una animación de saludo del avatar.', confidence: 92 },
  { name: 'Gracias', state: 'thank', cue: 'Pulgar arriba / gesto positivo', note: 'Reutiliza el gesto como confirmación o celebración.', confidence: 88 },
  { name: 'Pausa', state: 'stop', cue: 'Puño cerrado', note: 'Detiene animaciones y sirve como comando de control.', confidence: 84 }
];

const avatar = document.querySelector('.avatar');
const status = document.querySelector('#avatarStatus');
const signList = document.querySelector('#signList');
const handCanvas = document.querySelector('#handLandmarkCanvas');
const bodyCanvas = document.querySelector('#bodyLandmarkCanvas');
const handCtx = handCanvas.getContext('2d');
const bodyCtx = bodyCanvas.getContext('2d');
const video = document.querySelector('#practiceVideo');
const cameraOverlay = document.querySelector('#cameraOverlayCanvas');
const cameraCtx = cameraOverlay.getContext('2d');
const cameraButton = document.querySelector('#cameraButton');
const placeholder = document.querySelector('#cameraPlaceholder');
const detectedGesture = document.querySelector('#detectedGesture');
const detectedConfidence = document.querySelector('#detectedConfidence');
const detectionHistory = document.querySelector('#detectionHistory');
let activeButton = null;
let activeSign = signs[0];
let stream = null;
let tick = 0;
let historyCounter = 0;
const handConnections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20]];

function setSign(sign, button) {
  activeSign = sign;
  avatar.dataset.state = sign.state;
  status.textContent = `${sign.name}: ${sign.note}`;
  detectedGesture.textContent = sign.name;
  detectedConfidence.textContent = `Confianza demo: ${sign.confidence}%`;
  if (activeButton) activeButton.setAttribute('aria-pressed', 'false');
  activeButton = button;
  activeButton.setAttribute('aria-pressed', 'true');
  addDetection(sign);
  drawDemoLandmarks(sign.state);
}

function addDetection(sign) {
  historyCounter += 1;
  const item = document.createElement('li');
  item.innerHTML = `<strong>${sign.name}</strong><span>#${String(historyCounter).padStart(2, '0')} · ${sign.confidence}% · ${sign.cue}</span>`;
  detectionHistory.prepend(item);
  while (detectionHistory.children.length > 5) detectionHistory.lastElementChild.remove();
}

function renderSigns() {
  signs.forEach((sign) => {
    const button = document.createElement('button');
    button.className = 'sign-card';
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<strong>${sign.name}</strong><span>${sign.cue}</span>`;
    button.addEventListener('click', () => setSign(sign, button));
    signList.appendChild(button);
  });
  setSign(signs[0], signList.querySelector('button'));
}

function drawDemoLandmarks(mode = 'wave') {
  drawHandLandmarks(mode);
  drawBodyLandmarks(mode);
}

function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.2, 20, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8);
  gradient.addColorStop(0, 'rgba(135, 149, 210, .18)');
  gradient.addColorStop(1, 'rgba(42, 41, 51, .18)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHandLandmarks(mode = 'wave') {
  const width = handCanvas.width;
  const height = handCanvas.height;
  clearCanvas(handCtx, handCanvas);
  handCtx.lineWidth = 4;
  handCtx.strokeStyle = 'rgba(246, 235, 196, .92)';
  handCtx.fillStyle = 'rgba(232, 93, 160, .95)';

  const cx = width * 0.5 + Math.sin(tick / 20) * 22;
  const cy = height * 0.56;
  const spread = mode === 'stop' ? 20 : mode === 'thank' ? 34 : 48;
  const points = Array.from({ length: 21 }, (_, index) => {
    const finger = Math.floor((index - 1) / 4);
    const joint = (index - 1) % 4;
    if (index === 0) return [cx, cy + 86];
    const x = cx + (finger - 2) * spread + Math.sin(tick / 16 + index) * 4;
    const y = cy + 58 - joint * (mode === 'stop' ? 14 : 34) - Math.abs(finger - 2) * 7;
    return [x, y];
  });

  handConnections.forEach(([a, b]) => drawSegment(handCtx, points[a], points[b]));
  points.forEach((point) => drawPoint(handCtx, point, 6));
}

function drawBodyLandmarks(mode = 'wave') {
  const width = bodyCanvas.width;
  const height = bodyCanvas.height;
  clearCanvas(bodyCtx, bodyCanvas);
  bodyCtx.lineWidth = 5;
  bodyCtx.strokeStyle = 'rgba(135, 149, 210, .95)';
  bodyCtx.fillStyle = 'rgba(246, 235, 196, .96)';

  const sway = Math.sin(tick / 22) * 10;
  const rightHandLift = mode === 'wave' ? 78 + Math.sin(tick / 10) * 12 : mode === 'thank' ? 36 : -8;
  const leftHandTuck = mode === 'stop' ? 18 : 0;
  const points = {
    head: [width * 0.5 + sway * 0.3, height * 0.18],
    neck: [width * 0.5, height * 0.31],
    leftShoulder: [width * 0.38, height * 0.36],
    rightShoulder: [width * 0.62, height * 0.36],
    leftElbow: [width * 0.31 + leftHandTuck, height * 0.51],
    rightElbow: [width * 0.72, height * 0.48 - rightHandLift * 0.4],
    leftWrist: [width * 0.34 + leftHandTuck, height * 0.66],
    rightWrist: [width * 0.77, height * 0.56 - rightHandLift],
    hip: [width * 0.5, height * 0.68]
  };
  [['head','neck'],['neck','leftShoulder'],['neck','rightShoulder'],['leftShoulder','leftElbow'],['leftElbow','leftWrist'],['rightShoulder','rightElbow'],['rightElbow','rightWrist'],['neck','hip']]
    .forEach(([a, b]) => drawSegment(bodyCtx, points[a], points[b]));
  Object.values(points).forEach((point) => drawPoint(bodyCtx, point, 7));
}


function resizeCameraOverlay() {
  const rect = cameraOverlay.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (cameraOverlay.width !== width) cameraOverlay.width = width;
  if (cameraOverlay.height !== height) cameraOverlay.height = height;
}

function getVideoCoverMetrics() {
  const width = cameraOverlay.width;
  const height = cameraOverlay.height;
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;

  return {
    width,
    height,
    renderedWidth,
    renderedHeight,
    offsetX: (width - renderedWidth) / 2,
    offsetY: (height - renderedHeight) / 2
  };
}

function projectBodyPoint(point, bodyBox, metrics) {
  return [
    metrics.offsetX + bodyBox.x + point[0] * bodyBox.width,
    metrics.offsetY + bodyBox.y + point[1] * bodyBox.height
  ];
}

function buildCameraBody(mode, metrics) {
  const sway = Math.sin(tick / 22) * metrics.renderedWidth * 0.012;
  const lift = mode === 'wave' ? 0.2 + Math.sin(tick / 10) * 0.035 : mode === 'thank' ? 0.08 : -0.02;
  const tuck = mode === 'stop' ? 0.04 : 0;
  const bodyBox = {
    x: metrics.renderedWidth * 0.25,
    y: metrics.renderedHeight * 0.08,
    width: metrics.renderedWidth * 0.5,
    height: metrics.renderedHeight * 0.86
  };

  return {
    head: projectBodyPoint([0.5 + sway / bodyBox.width, 0.13], bodyBox, metrics),
    neck: projectBodyPoint([0.5, 0.28], bodyBox, metrics),
    leftShoulder: projectBodyPoint([0.28, 0.36], bodyBox, metrics),
    rightShoulder: projectBodyPoint([0.72, 0.36], bodyBox, metrics),
    leftElbow: projectBodyPoint([0.18 + tuck, 0.56], bodyBox, metrics),
    rightElbow: projectBodyPoint([0.82, 0.54 - lift * 0.45], bodyBox, metrics),
    leftWrist: projectBodyPoint([0.24 + tuck, 0.75], bodyBox, metrics),
    rightWrist: projectBodyPoint([0.88, 0.75 - lift], bodyBox, metrics),
    hip: projectBodyPoint([0.5, 0.78], bodyBox, metrics)
  };
}

function buildCameraHand(mode, wrist, metrics) {
  const palmSize = Math.min(metrics.width, metrics.height) * (mode === 'stop' ? 0.045 : mode === 'thank' ? 0.055 : 0.07);
  const spread = mode === 'stop' ? palmSize * 0.42 : mode === 'thank' ? palmSize * 0.62 : palmSize * 0.82;
  const curl = mode === 'stop' ? 0.44 : 1;
  const palm = [wrist[0] - palmSize * 0.05, wrist[1] - palmSize * 0.15];

  return Array.from({ length: 21 }, (_, index) => {
    if (index === 0) return wrist;
    const finger = Math.floor((index - 1) / 4);
    const joint = (index - 1) % 4;
    const fingerOffset = finger - 2;
    const thumbBias = finger === 0 ? -palmSize * 0.55 : 0;
    return [
      palm[0] + fingerOffset * spread + thumbBias + Math.sin(tick / 16 + index) * 2.5,
      palm[1] - (joint + 1) * palmSize * 0.52 * curl - Math.abs(fingerOffset) * palmSize * 0.1
    ];
  });
}

function drawCameraLandmarks(mode = 'wave') {
  resizeCameraOverlay();
  cameraCtx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);

  // La app Angular original proyecta cada punto al canvas usando la escala
  // tipo object-fit: cover del video. Repetimos esa idea aquí para que el
  // overlay demo no flote: primero construimos un cuerpo dentro del encuadre
  // visible y después anclamos la mano exactamente a su muñeca derecha.
  const metrics = getVideoCoverMetrics();
  const bodyPoints = buildCameraBody(mode, metrics);
  const handPoints = buildCameraHand(mode, bodyPoints.rightWrist, metrics);

  cameraCtx.save();
  cameraCtx.shadowBlur = 14;
  cameraCtx.shadowColor = 'rgba(0, 0, 0, .35)';
  cameraCtx.lineCap = 'round';
  cameraCtx.lineJoin = 'round';
  cameraCtx.lineWidth = 4;
  cameraCtx.strokeStyle = 'rgba(135, 149, 210, .95)';
  cameraCtx.fillStyle = 'rgba(246, 235, 196, .96)';
  [['head','neck'],['neck','leftShoulder'],['neck','rightShoulder'],['leftShoulder','leftElbow'],['leftElbow','leftWrist'],['rightShoulder','rightElbow'],['rightElbow','rightWrist'],['neck','hip']]
    .forEach(([a, b]) => drawSegment(cameraCtx, bodyPoints[a], bodyPoints[b]));
  Object.values(bodyPoints).forEach((point) => drawPoint(cameraCtx, point, 5.5));
  cameraCtx.restore();

  cameraCtx.save();
  cameraCtx.shadowBlur = 14;
  cameraCtx.shadowColor = 'rgba(0, 0, 0, .35)';
  cameraCtx.lineCap = 'round';
  cameraCtx.lineJoin = 'round';
  cameraCtx.lineWidth = 5;
  cameraCtx.strokeStyle = 'rgba(246, 235, 196, .96)';
  cameraCtx.fillStyle = 'rgba(232, 93, 160, .98)';
  handConnections.forEach(([a, b]) => drawSegment(cameraCtx, handPoints[a], handPoints[b]));
  handPoints.forEach((point) => drawPoint(cameraCtx, point, 7));
  cameraCtx.restore();
}

function drawSegment(ctx, from, to) {
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
}

function drawPoint(ctx, [x, y], radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

async function toggleCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    cameraCtx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);
    placeholder.hidden = false;
    cameraButton.textContent = 'Activar cámara';
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    placeholder.hidden = true;
    cameraButton.textContent = 'Apagar cámara';
  } catch (error) {
    placeholder.hidden = false;
    placeholder.innerHTML = '<strong>No se pudo activar la cámara</strong><span>Revisa permisos del navegador; el demo sigue funcionando con landmarks simulados.</span>';
  }
}

function loop() {
  tick += 1;
  drawDemoLandmarks(activeSign.state);
  if (stream) drawCameraLandmarks(activeSign.state);
  requestAnimationFrame(loop);
}

renderSigns();
cameraButton.addEventListener('click', toggleCamera);
loop();
