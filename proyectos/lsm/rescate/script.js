const signs = [
  { name: 'Hola', state: 'wave', cue: 'Palma abierta + movimiento lateral', note: 'Dispara una animación de saludo del avatar.', confidence: 92 },
  { name: 'Gracias', state: 'thank', cue: 'Pulgar arriba / gesto positivo', note: 'Reutiliza el gesto como confirmación o celebración.', confidence: 88 },
  { name: 'Pausa', state: 'stop', cue: 'Puño cerrado', note: 'Detiene animaciones y sirve como comando de control.', confidence: 84 },
  { name: 'Adiós', state: 'wave', cue: 'Palma abierta oscilando para despedirse', note: 'Seña visual de despedida; reutiliza la animación de saludo.', confidence: 82 },
  { name: 'Te amo', state: 'thank', cue: 'Pulgar, índice y meñique extendidos', note: 'Reconoce la configuración ILY de la mano para expresar cariño.', confidence: 80 }
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
let handModel = null;
let handModelStatus = 'idle';
let lastHandDetectedAt = 0;
let detectionInFlight = false;
let lastGestureName = signs[0].name;
const handMotionHistory = [];
const handMotionHistoryLimit = 12;
const handConnections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20]];

function normalizeLandmark(landmark) {
  if (Array.isArray(landmark)) return { x: landmark[0] || 0, y: landmark[1] || 0, z: landmark[2] || 0 };
  return { x: landmark?.x || 0, y: landmark?.y || 0, z: landmark?.z || 0 };
}

function average(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function updateHandMotionHistory(normalized) {
  handMotionHistory.push({
    x: normalized[0].x,
    y: normalized[0].y,
    at: performance.now()
  });
  while (handMotionHistory.length > handMotionHistoryLimit) handMotionHistory.shift();
}

function scoreWaveMotion() {
  if (handMotionHistory.length < 6) return 0;
  const xs = handMotionHistory.map((point) => point.x);
  const ys = handMotionHistory.map((point) => point.y);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);
  const directionChanges = xs.slice(2).reduce((changes, x, index) => {
    const previousDelta = xs[index + 1] - xs[index];
    const currentDelta = x - xs[index + 1];
    return changes + (Math.abs(previousDelta) > 0.01 && Math.abs(currentDelta) > 0.01 && Math.sign(previousDelta) !== Math.sign(currentDelta) ? 1 : 0);
  }, 0);

  return average([xRange > 0.12 ? 1 : xRange / 0.12, yRange < 0.18 ? 1 : 0, Math.min(directionChanges / 2, 1)]);
}

function scoreGesture(landmarks) {
  const normalized = landmarks.map(normalizeLandmark);
  if (normalized.length < 21) return { gestureName: 'unknown', confidence: 0 };
  updateHandMotionHistory(normalized);
  const isAbove = (a, b) => (normalized[a].y < normalized[b].y ? 1 : 0);
  const isBelow = (a, b) => (normalized[a].y > normalized[b].y ? 1 : 0);
  const horizontalGap = (a, b) => Math.abs(normalized[a].x - normalized[b].x);
  const extendedFingers = average([isAbove(8, 6), isAbove(12, 10), isAbove(16, 14), isAbove(20, 18)]);
  const foldedFingers = average([isBelow(8, 6), isBelow(12, 10), isBelow(16, 14), isBelow(20, 18)]);
  const ilyHand = average([isAbove(4, 2), isAbove(8, 6), isBelow(12, 10), isBelow(16, 14), isAbove(20, 18), horizontalGap(4, 20) > 0.18 ? 1 : 0]);
  const scores = [
    { gestureName: 'waveGreeting', confidence: average([extendedFingers, scoreWaveMotion()]) },
    { gestureName: 'palmOpen', confidence: average([extendedFingers, horizontalGap(4, 2) > 0.08 ? 1 : 0, average([8, 12, 16, 20].map((tip) => isAbove(tip, 0)))]) },
    { gestureName: 'thumbUp', confidence: average([isAbove(4, 5), isAbove(4, 0), horizontalGap(4, 2) > 0.08 ? 1 : 0, foldedFingers]) },
    { gestureName: 'fistClosed', confidence: average([foldedFingers, horizontalGap(4, 9) < 0.18 ? 1 : 0]) },
    { gestureName: 'ilyHand', confidence: ilyHand }
  ].sort((a, b) => b.confidence - a.confidence);
  return scores[0].confidence >= 0.7 ? { ...scores[0], confidence: Number(scores[0].confidence.toFixed(2)) } : { gestureName: 'unknown', confidence: Number(scores[0].confidence.toFixed(2)) };
}

function updateGestureFromLandmarks(landmarks) {
  const gesture = scoreGesture(landmarks.map((point) => [point[0] / (video.videoWidth || 1), point[1] / (video.videoHeight || 1), point[2] || 0]));
  const signByGesture = {
    waveGreeting: signs[0],
    palmOpen: signs[3],
    thumbUp: signs[1],
    fistClosed: signs[2],
    ilyHand: signs[4]
  }[gesture.gestureName];

  if (!signByGesture) {
    detectedConfidence.textContent = `Confianza real: ${Math.round(gesture.confidence * 100)}% · ajusta la mano frente a cámara`;
    return;
  }

  avatar.dataset.state = signByGesture.state;
  status.textContent = `${signByGesture.name}: gesto detectado por Handpose.`;
  detectedGesture.textContent = signByGesture.name;
  detectedConfidence.textContent = `Confianza real: ${Math.round(gesture.confidence * 100)}%`;
  if (lastGestureName !== signByGesture.name) {
    lastGestureName = signByGesture.name;
    addDetection({ ...signByGesture, confidence: Math.round(gesture.confidence * 100) });
  }
}

async function loadHandModel() {
  if (handModel || handModelStatus === 'loading') return handModel;
  if (!window.handpose) {
    handModelStatus = 'missing';
    return null;
  }
  handModelStatus = 'loading';
  detectedConfidence.textContent = 'Cargando Handpose…';
  try {
    handModel = await window.handpose.load();
    handModelStatus = 'ready';
    detectedConfidence.textContent = 'Handpose listo: muestra tu mano a la cámara.';
    return handModel;
  } catch (error) {
    handModelStatus = 'error';
    console.warn('No se pudo cargar Handpose:', error);
    detectedConfidence.textContent = 'No se pudo cargar Handpose; seguimos con demo.';
    return null;
  }
}

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

function toCameraPoint(landmark, metrics) {
  const x = Array.isArray(landmark) ? landmark[0] : landmark?.x;
  const y = Array.isArray(landmark) ? landmark[1] : landmark?.y;
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  const sourceWidth = video.videoWidth || metrics.width;
  const sourceHeight = video.videoHeight || metrics.height;
  const sourceX = x <= 1 ? x * sourceWidth : x;
  const sourceY = y <= 1 ? y * sourceHeight : y;
  return [metrics.offsetX + sourceX * (metrics.renderedWidth / sourceWidth), metrics.offsetY + sourceY * (metrics.renderedHeight / sourceHeight)];
}

function drawRealHandLandmarks(landmarks) {
  resizeCameraOverlay();
  cameraCtx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);
  const metrics = getVideoCoverMetrics();
  const points = landmarks.map((landmark) => toCameraPoint(landmark, metrics));

  cameraCtx.save();
  cameraCtx.shadowBlur = 14;
  cameraCtx.shadowColor = 'rgba(0, 0, 0, .35)';
  cameraCtx.lineCap = 'round';
  cameraCtx.lineJoin = 'round';
  cameraCtx.lineWidth = 5;
  cameraCtx.strokeStyle = 'rgba(246, 235, 196, .96)';
  cameraCtx.fillStyle = 'rgba(232, 93, 160, .98)';
  handConnections.forEach(([a, b]) => points[a] && points[b] && drawSegment(cameraCtx, points[a], points[b]));
  points.forEach((point) => point && drawPoint(cameraCtx, point, 7));
  cameraCtx.restore();

  clearCanvas(handCtx, handCanvas);
  const sx = handCanvas.width / (video.videoWidth || metrics.width);
  const sy = handCanvas.height / (video.videoHeight || metrics.height);
  const panelPoints = landmarks.map((point) => [point[0] * sx, point[1] * sy]);
  handCtx.lineWidth = 4;
  handCtx.strokeStyle = 'rgba(246, 235, 196, .92)';
  handCtx.fillStyle = 'rgba(232, 93, 160, .95)';
  handConnections.forEach(([a, b]) => panelPoints[a] && panelPoints[b] && drawSegment(handCtx, panelPoints[a], panelPoints[b]));
  panelPoints.forEach((point) => drawPoint(handCtx, point, 6));
}

async function detectRealHandFrame() {
  if (detectionInFlight || !stream || !handModel || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;
  detectionInFlight = true;
  try {
    const predictions = await handModel.estimateHands(video);
    const landmarks = predictions?.[0]?.landmarks;
    if (!landmarks?.length) return false;
    lastHandDetectedAt = performance.now();
    drawRealHandLandmarks(landmarks);
    updateGestureFromLandmarks(landmarks);
    return true;
  } catch (error) {
    console.warn('No se pudieron estimar landmarks en este frame:', error);
    return false;
  } finally {
    detectionInFlight = false;
  }
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
    await loadHandModel();
  } catch (error) {
    placeholder.hidden = false;
    placeholder.innerHTML = '<strong>No se pudo activar la cámara</strong><span>Revisa permisos del navegador; el demo sigue funcionando con landmarks simulados.</span>';
  }
}

function loop() {
  tick += 1;
  drawDemoLandmarks(activeSign.state);
  if (stream) {
    if (handModelStatus === 'ready') {
      detectRealHandFrame().then((detected) => {
        if (!detected && performance.now() - lastHandDetectedAt > 1000) drawCameraLandmarks(activeSign.state);
      });
    } else {
      drawCameraLandmarks(activeSign.state);
    }
  }
  requestAnimationFrame(loop);
}

renderSigns();
cameraButton.addEventListener('click', toggleCamera);
loop();
