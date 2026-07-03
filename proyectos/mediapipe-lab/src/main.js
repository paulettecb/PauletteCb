import './styles.css'
const labs = {
  lsm: {
    icon: '🤟',
    title: 'LSM - Mexican Sign Language',
    subtitle: 'Lengua de Señas Mexicana Practice',
    intro: 'Practice Mexican Sign Language with pose detection and real-time visual feedback.',
    features: [
      ['📹', 'Real-time Detection', 'Pose detection powered by MediaPipe'],
      ['✋', 'Hand Tracking', 'Finger and palm tracking'],
      ['🎯', 'Feedback', 'Visual feedback and guidance'],
      ['📊', 'Analytics', 'Track your progress']
    ]
  },
  agility: {
    icon: '🐕',
    title: 'AGILITY - Canine Movement Analysis',
    subtitle: 'Dog movement tracking lab',
    intro: 'Analyze dog movements, jumps, and agility exercises in real-time.',
    features: [
      ['🏁', 'Course Tracking', 'Follow paths and turns'],
      ['🦴', 'Jump Analysis', 'Measure timing and form'],
      ['📈', 'Movement Data', 'Capture useful motion signals'],
      ['🎥', 'Camera Ready', 'Prepare for live analysis']
    ]
  },
  exercise: {
    icon: '🏃',
    title: 'EXERCISE - Human Posture & Movement',
    subtitle: 'Exercise form analysis',
    intro: 'Track human exercise form, posture, and movement patterns with precision.',
    features: [
      ['🧍', 'Pose Landmarks', 'Map body keypoints'],
      ['💪', 'Form Checks', 'Spot alignment patterns'],
      ['⏱️', 'Repetition Flow', 'Prototype timing feedback'],
      ['📊', 'Progress Signals', 'Prepare metrics for sessions']
    ]
  },
  experiments: {
    icon: '⚗️',
    title: 'EXPERIMENTS - Experimental Playground',
    subtitle: 'Prototype new MediaPipe ideas',
    intro: 'Test new MediaPipe features, models, and creative applications.',
    features: [
      ['🧪', 'Rapid Tests', 'Try concepts quickly'],
      ['🧠', 'Model Notes', 'Compare task ideas'],
      ['🎛️', 'Controls', 'Prepare adjustable experiments'],
      ['🚀', 'Launch Pad', 'Move prototypes into labs']
    ]
  }
}

const card = ([slug, lab]) => `
  <div class="lab-card ${slug}-card">
    <div class="card-icon">${lab.icon}</div>
    <h2>${slug.toUpperCase()}</h2>
    <p>${lab.subtitle}</p>
    <p class="description">${lab.intro}</p>
    <a href="#/${slug}" class="btn btn-primary">Enter Lab</a>
  </div>`

const renderHome = () => `
  <div class="lab-container">
    <header class="lab-header"><div class="header-content"><h1>📡 MediaPipe Lab</h1><p class="subtitle">Real-Time Computer Vision Experiments</p></div></header>
    <main class="lab-main">
      <section class="lab-grid">${Object.entries(labs).map(card).join('')}</section>
      <section class="tech-stack"><h3>Tech Stack</h3><div class="tech-badges"><span class="badge">MediaPipe</span><span class="badge">Vite-ready</span><span class="badge">Vanilla JS</span><span class="badge">Web API</span></div></section>
    </main>
    <footer class="lab-footer"><p>MediaPipe Lab v0.1.0 | Powered by Google MediaPipe</p></footer>
  </div>`

const renderLab = (slug) => {
  const lab = labs[slug] || labs.lsm
  return `
    <div class="experiment-page">
      <header class="experiment-header"><a href="#/" class="back-btn">← Back</a><h1>${lab.icon} ${lab.title}</h1><p class="subtitle">${lab.subtitle}</p></header>
      <main class="experiment-main"><section class="info-section"><h2>Welcome to ${slug.toUpperCase()} Lab</h2><p>${lab.intro}</p><div class="features-grid">${lab.features.map(([icon, title, text]) => `<div class="feature"><span class="feature-icon">${icon}</span><h3>${title}</h3><p>${text}</p></div>`).join('')}</div><button class="btn btn-primary" id="camera-toggle">🎥 Start Camera</button><div class="camera-section"><div id="camera-stage" class="camera-stage is-inactive"><video id="camera-preview" class="camera-preview" autoplay playsinline muted></video><canvas id="landmarks-canvas" class="landmarks-canvas" aria-label="Hand landmarks overlay"></canvas></div><div id="camera-status"></div></div></section></main>
    </div>`
}

let activeStream = null

const setCameraStatus = (message) => {
  document.querySelector('#camera-status').innerHTML = `<p class="status">${message}</p>`
}

const startCamera = async () => {
  const video = document.querySelector('#camera-preview')
  const stage = document.querySelector('#camera-stage')

  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraStatus('Navegador sin soporte para cámara.')
    return
  }

  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    video.srcObject = activeStream
    await video.play()
    stage?.classList.add('is-active')
    stage?.classList.remove('is-inactive')
    setCameraStatus('Cámara encendida.')
  } catch (error) {
    stage?.classList.remove('is-active')
    stage?.classList.add('is-inactive')

    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      setCameraStatus('Permiso denegado para acceder a la cámara.')
    } else {
      setCameraStatus('No se pudo encender la cámara.')
    }
  }
}

const stopCamera = () => {
  activeStream?.getTracks().forEach((track) => track.stop())
  activeStream = null
  const stage = document.querySelector('#camera-stage')
  stage?.classList.remove('is-active')
  stage?.classList.add('is-inactive')
}

const render = () => {
  stopCamera()
  const app = document.querySelector('#app')
  const slug = window.location.hash.replace('#/', '')
  app.innerHTML = slug && labs[slug] ? renderLab(slug) : renderHome()
  document.querySelector('#camera-toggle')?.addEventListener('click', startCamera)
}

window.addEventListener('hashchange', render)
window.addEventListener('beforeunload', stopCamera)
render()

console.log('✅ MediaPipe Lab initialized successfully')
