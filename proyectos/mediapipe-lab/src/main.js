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

const injectKynStyles = () => {
  if (document.querySelector('[data-mediapipe-kyn-styles]')) return

  const style = document.createElement('style')
  style.setAttribute('data-mediapipe-kyn-styles', '')
  style.textContent = `@font-face {
  font-family: 'Friendship';
  src: url('../../KYN%20Design%20System/assets/fonts/Friendship-Medium.otf') format('opentype');
  font-display: swap;
}

:root {
  --periwinkle-50: #f0f2fb;
  --periwinkle-100: #e2e6f5;
  --periwinkle-200: #c9d0ed;
  --periwinkle-500: #8795d2;
  --periwinkle-700: #5562a4;
  --paper: #fbfaf7;
  --oat: #f4f0e8;
  --sand: #e9e3d7;
  --white: #ffffff;
  --ink-900: #2a2933;
  --ink-700: #4a4955;
  --ink-500: #75737f;
  --pop-magenta: #e85da0;
  --pastel-blush: #f6d2dd;
  --pastel-peach: #f8dcc9;
  --pastel-butter: #f6ebc4;
  --pastel-sky: #cfe0f2;
  --pastel-lilac: #e2d6f0;
  --glass: rgba(255, 255, 255, 0.76);
  --border: rgba(201, 208, 237, 0.68);
  --shadow: 0 24px 70px rgba(47, 54, 88, 0.13);
  --font-sans: 'Hanken Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Friendship', cursive;
}

* { box-sizing: border-box; }

html,
body {
  width: 100%;
  min-height: 100%;
  margin: 0;
  overflow-x: clip;
  color: var(--ink-900);
  background: var(--paper);
  font-family: var(--font-sans);
  line-height: 1.6;
}

body::before {
  content: '';
  position: fixed;
  inset: -12% -8%;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 10% 12%, rgba(246, 210, 221, 0.72) 0 10rem, transparent 10.2rem),
    radial-gradient(circle at 82% 20%, rgba(207, 224, 242, 0.76) 0 12rem, transparent 12.2rem),
    radial-gradient(circle at 18% 78%, rgba(226, 214, 240, 0.72) 0 13rem, transparent 13.2rem),
    radial-gradient(circle at 72% 72%, rgba(246, 235, 196, 0.76) 0 11rem, transparent 11.2rem),
    linear-gradient(135deg, var(--paper), var(--oat));
}

button,
a { font: inherit; }

.app,
.lab-container,
.experiment-page {
  width: 100%;
  min-height: 100vh;
}

.lab-container,
.experiment-page {
  display: flex;
  flex-direction: column;
  background: transparent;
}

.lab-header,
.experiment-header {
  width: min(1080px, 92vw);
  margin: 1rem auto 0;
  padding: clamp(1.4rem, 4vw, 2.8rem);
  position: relative;
  overflow: hidden;
  color: var(--ink-900);
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 28px;
  box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,.55);
  backdrop-filter: blur(28px) saturate(150%);
  -webkit-backdrop-filter: blur(28px) saturate(150%);
}

.lab-header::after,
.experiment-header::after {
  content: 'vision';
  position: absolute;
  right: 1.4rem;
  bottom: -0.6rem;
  color: rgba(232, 93, 160, 0.14);
  font-family: var(--font-display);
  font-size: clamp(3.4rem, 12vw, 8rem);
  line-height: .8;
  pointer-events: none;
}

.header-content h1,
.experiment-header h1 {
  max-width: 850px;
  margin: 0 0 .6rem;
  font-size: clamp(2.2rem, 6vw, 4.6rem);
  line-height: .92;
  letter-spacing: -.04em;
  font-weight: 800;
}

.header-content h1::first-letter,
.experiment-header h1::first-letter {
  color: var(--pop-magenta);
}

.subtitle {
  margin: 0;
  color: var(--ink-500);
  font-size: clamp(1rem, 2vw, 1.22rem);
  font-weight: 600;
}

.lab-main,
.experiment-main {
  flex: 1;
  width: min(1080px, 92vw);
  margin: 0 auto;
  padding: clamp(1.2rem, 3vw, 2.2rem) 0 3rem;
}

.lab-grid,
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
  gap: 1rem;
}

.lab-grid { margin-bottom: 1rem; }
.features-grid { margin: 1.5rem 0; }

.lab-card,
.info-section,
.tech-stack,
.feature {
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(24px) saturate(145%);
  -webkit-backdrop-filter: blur(24px) saturate(145%);
}

.lab-card,
.info-section,
.tech-stack { padding: clamp(1.2rem, 3vw, 2rem); }
.lab-card { display: flex; flex-direction: column; min-height: 100%; transition: transform .22s ease, box-shadow .22s ease; }
.lab-card:hover,
.feature:hover { transform: translateY(-3px); box-shadow: 0 28px 80px rgba(47, 54, 88, .18); }

.card-icon,
.feature-icon { display: inline-grid; place-items: center; width: 3.4rem; height: 3.4rem; margin-bottom: 1rem; border-radius: 18px; background: linear-gradient(135deg, var(--pastel-blush), var(--pastel-sky)); font-size: 1.9rem; }

.lab-card h2,
.info-section h2,
.feature h3,
.tech-stack h3 {
  margin: 0 0 .6rem;
  color: var(--ink-900);
  letter-spacing: -.025em;
}

.lab-card h2,
.info-section h2 { font-size: clamp(1.5rem, 3vw, 2.2rem); }
.lab-card p,
.info-section p,
.feature p { margin: 0 0 .75rem; color: var(--ink-500); }
.description { flex: 1; }

.btn,
.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 2.75rem;
  padding: .72rem 1.15rem;
  border: 1px solid rgba(255,255,255,.82);
  border-radius: 999px;
  text-decoration: none;
  font-weight: 800;
  color: var(--ink-900);
  background: rgba(255,255,255,.64);
  box-shadow: 0 12px 28px rgba(125, 72, 118, .12);
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}

.btn-primary { color: white; background: linear-gradient(135deg, var(--pop-magenta), var(--periwinkle-500)); margin-top: auto; }
.btn:hover,
.back-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 32px rgba(125, 72, 118, .2); }
.back-btn { margin-bottom: 1rem; }

.tech-badges { display: flex; flex-wrap: wrap; gap: .65rem; }
.badge { display: inline-flex; align-items: center; padding: .46rem .85rem; border-radius: 999px; color: var(--periwinkle-700); background: rgba(240, 242, 251, .86); border: 1px solid var(--periwinkle-200); font-weight: 800; }

.feature { padding: 1.2rem; transition: transform .22s ease, box-shadow .22s ease; }
.camera-section,
.tracking-section,
.exercise-section,
.experiments-section,
.status {
  margin-top: 1.25rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  color: var(--ink-700);
  background: rgba(246, 210, 221, .55);
  border: 1px solid rgba(232, 93, 160, .2);
}

.lab-footer { width: min(1080px, 92vw); margin: 0 auto 1rem; color: var(--ink-500); text-align: center; font-size: .92rem; }
`
  document.head.append(style)
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
      <main class="experiment-main"><section class="info-section"><h2>Welcome to ${slug.toUpperCase()} Lab</h2><p>${lab.intro}</p><div class="features-grid">${lab.features.map(([icon, title, text]) => `<div class="feature"><span class="feature-icon">${icon}</span><h3>${title}</h3><p>${text}</p></div>`).join('')}</div><button class="btn btn-primary" id="camera-toggle">🎥 Start Camera</button><div id="camera-status"></div></section></main>
    </div>`
}

const render = () => {
  const app = document.querySelector('#app')
  const slug = window.location.hash.replace('#/', '')
  app.innerHTML = slug && labs[slug] ? renderLab(slug) : renderHome()
  document.querySelector('#camera-toggle')?.addEventListener('click', () => {
    document.querySelector('#camera-status').innerHTML = '<p class="status">Camera is ready. MediaPipe integration coming soon...</p>'
  })
}

injectKynStyles()
window.addEventListener('hashchange', render)
render()

console.log('✅ MediaPipe Lab initialized successfully')
