const signs = [
  { name: 'Hola', state: 'wave', cue: 'Palma abierta + movimiento suave', note: 'Dispara una animación de saludo del avatar.' },
  { name: 'Gracias', state: 'thank', cue: 'Pulgar arriba / gesto positivo', note: 'Reutiliza el gesto como confirmación o celebración.' },
  { name: 'Pausa', state: 'stop', cue: 'Puño cerrado', note: 'Detiene animaciones y sirve como comando de control.' }
];

const avatar = document.querySelector('.avatar');
const status = document.querySelector('#avatarStatus');
const signList = document.querySelector('#signList');
const canvas = document.querySelector('#landmarkCanvas');
const ctx = canvas.getContext('2d');
const video = document.querySelector('#practiceVideo');
const cameraButton = document.querySelector('#cameraButton');
const placeholder = document.querySelector('#cameraPlaceholder');
let activeButton = null;
let stream = null;
let tick = 0;

function setSign(sign, button) {
  avatar.dataset.state = sign.state;
  status.textContent = `${sign.name}: ${sign.note}`;
  if (activeButton) activeButton.setAttribute('aria-pressed', 'false');
  activeButton = button;
  activeButton.setAttribute('aria-pressed', 'true');
  drawDemoLandmarks(sign.state);
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
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(246, 235, 196, .92)';
  ctx.fillStyle = 'rgba(232, 93, 160, .95)';

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

  const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20]];
  connections.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(points[a][0], points[a][1]);
    ctx.lineTo(points[b][0], points[b][1]);
    ctx.stroke();
  });
  points.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

async function toggleCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
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
  drawDemoLandmarks(avatar.dataset.state);
  requestAnimationFrame(loop);
}

renderSigns();
cameraButton.addEventListener('click', toggleCamera);
loop();
