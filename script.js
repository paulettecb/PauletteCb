const STORAGE_KEY = 'pau-lang';

const skills = [
  { key: 'build', items: ['JavaScript · TypeScript', 'Vue', 'React', 'Vite', 'CSS architecture'] },
  { key: 'systems', items: ['Design systems', 'Performance', 'Accessibility', 'Component strategy'] },
  { key: 'humans', items: ['Cognition', 'Behavior', 'ADHD-friendly UX', 'Learning design'] },
  { key: 'lab', items: ['MediaPipe', 'Computer vision', 'Prototyping', 'Whimsy engineering'] },
];

const pastels = ['var(--pastel-blush)', 'var(--pastel-sky)', 'var(--pastel-butter)', 'var(--pastel-mint)', 'var(--pastel-lilac)'];

const content = {
  en: {
    nav: { about: 'About', skills: 'Skills', projects: 'Projects', now: 'Now', contact: 'Contact' },
    heroEyebrow: 'I like understanding people. Design is my excuse.',
    heroSpark: 'hello!',
    headlineA: 'Between the pixel',
    headlineB: 'and the person',
    intro: 'nd the occasional do',
    ctaProjects: 'See the lab',
    ctaContact: 'Say hi',
    marquee: ['Front-end architecture', 'Design systems', 'Human behavior', 'Computer vision', 'ADHD-friendly design', 'Pattern recognition'],
    aboutTitle: 'About',
    aboutSpark: 'systems',
    about1: 'Front-End Lead Developer and psychology student, exploring where technology and human behavior overlap.',
    about2: 'By day I lead front-end projects focused on performance and architecture. By night I study how minds — including mine — navigate complexity.',
    about3: 'My curious ADHD brain runs on abstraction and pattern recognition. I don’t see chaos; I see systems waiting to be understood.',
    about4: 'Off-screen I train Kenna (Border Collie) and negotiate creative boundaries with Rodolfo (cat) — daily proof that intelligence takes many forms.',
    expTitle: 'Experience',
    exp: [
      { role: 'Front-End Lead Developer', detail: 'High-performance web experiences: scalable architecture, design-system alignment, maintainable components.' },
      { role: 'Psychology Student', detail: 'Cognition, emotion and behavior — how humans process information, decide, and adapt to complexity.' },
    ],
    skillsTitle: 'Skills & stack',
    skillGroups: { build: 'I build with', systems: 'I think in', humans: 'I study', lab: 'I play with' },
    projectsTitle: 'Projects',
    projectsPill: 'Visual Lab',
    projectsNote: 'A playful internal lab — every card is a real, living experiment.',
    projectOpen: 'Open',
    projectsLoading: 'Loading projects…',
    projectsEmpty: 'Projects are taking a nap — check back soon.',
    nowTitle: 'Now',
    nowNote: 'What I’m actually up to, right now.',
    now: [
      { k: 'Studying', v: 'EGEL Plus PSI (CENEVAL)' },
      { k: 'Training', v: 'Agility with Kenna' },
      { k: 'Building', v: 'MediaPipe Lab' },
      { k: 'Polishing', v: 'KYN Design System' },
    ],
    contactTitle: 'Let’s connect',
    contactCopy: 'Want to talk systems, dogs or design? Say hi on Instagram.',
    contactNote: 'Public Instagram only. No phone or work contact shared.',
    footer: 'Made by hand, with a spark of whimsy.',
  },
  es: {
    nav: { about: 'Sobre mí', skills: 'Skills', projects: 'Proyectos', now: 'Ahora', contact: 'Contacto' },
    heroEyebrow: 'Me gusta entender a la gente. Diseñar es mi excusa.',
    heroSpark: '¡hola!',
    headlineA: 'Entre el pixel',
    headlineB: 'y la persona',
    intro: ' uno que otro perr',
    ctaProjects: 'Ver el lab',
    ctaContact: 'Saluda',
    marquee: ['Arquitectura front-end', 'Design systems', 'Comportamiento humano', 'Visión por computadora', 'Diseño TDAH-friendly', 'Reconocimiento de patrones'],
    aboutTitle: 'Sobre mí',
    aboutSpark: 'sistemas',
    about1: 'Front-End Lead Developer y estudiante de psicología, explorando donde se cruzan la tecnología y el comportamiento humano.',
    about2: 'De día lidero proyectos front-end enfocados en rendimiento y arquitectura. De noche estudio cómo las mentes — incluida la mía — navegan la complejidad.',
    about3: 'Mi cerebro curioso con TDAH funciona con abstracción y reconocimiento de patrones. No veo caos; veo sistemas esperando ser comprendidos.',
    about4: 'Fuera de pantalla entreno a Kenna (Border Collie) y negocio límites creativos con Rodolfo (gato): prueba diaria de que la inteligencia tiene muchas formas.',
    expTitle: 'Experiencia',
    exp: [
      { role: 'Front-End Lead Developer', detail: 'Experiencias web de alto rendimiento: arquitectura escalable, alineación con design systems, componentes mantenibles.' },
      { role: 'Estudiante de Psicología', detail: 'Cognición, emoción y conducta — cómo procesamos información, decidimos y nos adaptamos a la complejidad.' },
    ],
    skillsTitle: 'Skills y stack',
    skillGroups: { build: 'Construyo con', systems: 'Pienso en', humans: 'Estudio', lab: 'Juego con' },
    projectsTitle: 'Proyectos',
    projectsPill: 'Visual Lab',
    projectsNote: 'Un laboratorio interno y juguetón — cada card es un experimento real y vivo.',
    projectOpen: 'Abrir',
    projectsLoading: 'Cargando proyectos…',
    projectsEmpty: 'Los proyectos están tomando una siesta — vuelve pronto.',
    nowTitle: 'Ahora',
    nowNote: 'En lo que ando justo ahora.',
    now: [
      { k: 'Estudiando', v: 'EGEL Plus PSI (CENEVAL)' },
      { k: 'Entrenando', v: 'Agility con Kenna' },
      { k: 'Construyendo', v: 'MediaPipe Lab' },
      { k: 'Puliendo', v: 'KYN Design System' },
    ],
    contactTitle: 'Conectemos',
    contactCopy: '¿Hablamos de sistemas, perros o diseño? Salúdame en Instagram.',
    contactNote: 'Solo Instagram público. Sin teléfono ni contacto laboral.',
    footer: 'Hecho a mano, con una chispa de whimsy.',
  },
  fr: {
    nav: { about: 'À propos', skills: 'Skills', projects: 'Projets', now: 'Maintenant', contact: 'Contact' },
    heroEyebrow: 'J’aime comprendre les gens. Le design est mon excuse.',
    heroSpark: 'salut !',
    headlineA: 'Entre le pixel',
    headlineB: 'et la personne',
    intro: 't un chien de temps en temp',
    ctaProjects: 'Voir le lab',
    ctaContact: 'Dire bonjour',
    marquee: ['Architecture front-end', 'Design systems', 'Comportement humain', 'Vision par ordinateur', 'Design TDAH-friendly', 'Reconnaissance de motifs'],
    aboutTitle: 'À propos',
    aboutSpark: 'systèmes',
    about1: 'Lead Front-End Developer et étudiante en psychologie, à l’intersection de la technologie et du comportement humain.',
    about2: 'Le jour, je dirige des projets front-end axés performance et architecture. La nuit, j’étudie comment les esprits — y compris le mien — naviguent la complexité.',
    about3: 'Mon esprit curieux avec TDAH carbure à l’abstraction et à la reconnaissance de motifs. Je ne vois pas du chaos ; je vois des systèmes à comprendre.',
    about4: 'Hors écran, j’entraîne Kenna (Border Collie) et je négocie avec Rodolfo (chat) — preuve quotidienne que l’intelligence a plusieurs formes.',
    expTitle: 'Expérience',
    exp: [
      { role: 'Front-End Lead Developer', detail: 'Expériences web performantes : architecture évolutive, alignement design system, composants maintenables.' },
      { role: 'Étudiante en psychologie', detail: 'Cognition, émotion et comportement — comment nous traitons l’information et nous adaptons à la complexité.' },
    ],
    skillsTitle: 'Compétences & stack',
    skillGroups: { build: 'Je construis avec', systems: 'Je pense en', humans: 'J’étudie', lab: 'Je joue avec' },
    projectsTitle: 'Projets',
    projectsPill: 'Visual Lab',
    projectsNote: 'Un laboratoire interne et ludique — chaque carte est une vraie expérimentation vivante.',
    projectOpen: 'Ouvrir',
    projectsLoading: 'Chargement des projets…',
    projectsEmpty: 'Les projets font la sieste — revenez bientôt.',
    nowTitle: 'Maintenant',
    nowNote: 'Ce que je fais, là, maintenant.',
    now: [
      { k: 'J’étudie', v: 'EGEL Plus PSI (CENEVAL)' },
      { k: 'J’entraîne', v: 'Agility avec Kenna' },
      { k: 'Je construis', v: 'MediaPipe Lab' },
      { k: 'Je peaufine', v: 'KYN Design System' },
    ],
    contactTitle: 'Connectons-nous',
    contactCopy: 'Envie de parler systèmes, chiens ou design ? Dites bonjour sur Instagram.',
    contactNote: 'Instagram public uniquement. Pas de téléphone ni contact pro.',
    footer: 'Fait main, avec une étincelle de whimsy.',
  },
  pt: {
    nav: { about: 'Sobre', skills: 'Skills', projects: 'Projetos', now: 'Agora', contact: 'Contato' },
    heroEyebrow: 'Gosto de entender as pessoas. Design é minha desculpa.',
    heroSpark: 'olá!',
    headlineA: 'Entre o pixel',
    headlineB: 'e a pessoa',
    intro: ' um ou outro cachorr',
    ctaProjects: 'Ver o lab',
    ctaContact: 'Diga oi',
    marquee: ['Arquitetura front-end', 'Design systems', 'Comportamento humano', 'Visão computacional', 'Design TDAH-friendly', 'Reconhecimento de padrões'],
    aboutTitle: 'Sobre',
    aboutSpark: 'sistemas',
    about1: 'Front-End Lead Developer e estudante de psicologia, explorando onde tecnologia e comportamento humano se cruzam.',
    about2: 'De dia lidero projetos front-end focados em performance e arquitetura. À noite estudo como mentes — inclusive a minha — navegam a complexidade.',
    about3: 'Meu cérebro curioso com TDAH funciona à base de abstração e reconhecimento de padrões. Não vejo caos; vejo sistemas esperando serem compreendidos.',
    about4: 'Fora da tela treino a Kenna (Border Collie) e negocio limites criativos com o Rodolfo (gato) — prova diária de que a inteligência tem muitas formas.',
    expTitle: 'Experiência',
    exp: [
      { role: 'Front-End Lead Developer', detail: 'Experiências web de alta performance: arquitetura escalável, alinhamento com design systems, componentes sustentáveis.' },
      { role: 'Estudante de Psicologia', detail: 'Cognição, emoção e comportamento — como processamos informação, decidimos e nos adaptamos à complexidade.' },
    ],
    skillsTitle: 'Habilidades & stack',
    skillGroups: { build: 'Construo com', systems: 'Penso em', humans: 'Estudo', lab: 'Brinco com' },
    projectsTitle: 'Projetos',
    projectsPill: 'Visual Lab',
    projectsNote: 'Um laboratório interno e lúdico — cada card é um experimento real e vivo.',
    projectOpen: 'Abrir',
    projectsLoading: 'Carregando projetos…',
    projectsEmpty: 'Os projetos estão tirando uma soneca — volte em breve.',
    nowTitle: 'Agora',
    nowNote: 'No que estou agora mesmo.',
    now: [
      { k: 'Estudando', v: 'EGEL Plus PSI (CENEVAL)' },
      { k: 'Treinando', v: 'Agility com a Kenna' },
      { k: 'Construindo', v: 'MediaPipe Lab' },
      { k: 'Polindo', v: 'KYN Design System' },
    ],
    contactTitle: 'Vamos conectar',
    contactCopy: 'Quer falar de sistemas, cachorros ou design? Me chama no Instagram.',
    contactNote: 'Apenas Instagram público. Sem telefone ou contato de trabalho.',
    footer: 'Feito à mão, com uma faísca de whimsy.',
  },
  de: {
    nav: { about: 'Über mich', skills: 'Skills', projects: 'Projekte', now: 'Jetzt', contact: 'Kontakt' },
    heroEyebrow: 'Ich verstehe gern Menschen. Design ist meine Ausrede.',
    heroSpark: 'hallo!',
    headlineA: 'Zwischen Pixel',
    headlineB: 'und Mensch',
    intro: 'nd der eine oder andere Hun',
    ctaProjects: 'Zum Lab',
    ctaContact: 'Sag hi',
    marquee: ['Front-End-Architektur', 'Design Systems', 'Menschliches Verhalten', 'Computer Vision', 'ADHS-freundliches Design', 'Mustererkennung'],
    aboutTitle: 'Über mich',
    aboutSpark: 'systeme',
    about1: 'Front-End Lead Developer und Psychologie-Studentin, an der Schnittstelle von Technologie und menschlichem Verhalten.',
    about2: 'Tagsüber leite ich Front-End-Projekte mit Fokus auf Performance und Architektur. Nachts studiere ich, wie Köpfe — auch meiner — mit Komplexität umgehen.',
    about3: 'Mein neugieriges ADHS-Gehirn läuft auf Abstraktion und Mustererkennung. Ich sehe kein Chaos; ich sehe Systeme, die verstanden werden wollen.',
    about4: 'Abseits des Bildschirms trainiere ich Kenna (Border Collie) und verhandle mit Rodolfo (Katze) — täglicher Beweis, dass Intelligenz viele Formen hat.',
    expTitle: 'Erfahrung',
    exp: [
      { role: 'Front-End Lead Developer', detail: 'Leistungsstarke Web-Erlebnisse: skalierbare Architektur, Design-System-Ausrichtung, wartbare Komponenten.' },
      { role: 'Psychologie-Studentin', detail: 'Kognition, Emotion und Verhalten — wie Menschen Informationen verarbeiten, entscheiden und sich anpassen.' },
    ],
    skillsTitle: 'Skills & Stack',
    skillGroups: { build: 'Ich baue mit', systems: 'Ich denke in', humans: 'Ich studiere', lab: 'Ich spiele mit' },
    projectsTitle: 'Projekte',
    projectsPill: 'Visual Lab',
    projectsNote: 'Ein verspieltes internes Lab — jede Karte ist ein echtes, lebendiges Experiment.',
    projectOpen: 'Öffnen',
    projectsLoading: 'Projekte werden geladen…',
    projectsEmpty: 'Die Projekte machen ein Nickerchen — schau bald wieder vorbei.',
    nowTitle: 'Jetzt',
    nowNote: 'Woran ich gerade wirklich arbeite.',
    now: [
      { k: 'Lernen', v: 'EGEL Plus PSI (CENEVAL)' },
      { k: 'Training', v: 'Agility mit Kenna' },
      { k: 'Bauen', v: 'MediaPipe Lab' },
      { k: 'Polieren', v: 'KYN Design System' },
    ],
    contactTitle: 'Lass uns connecten',
    contactCopy: 'Lust auf Systeme, Hunde oder Design? Sag hi auf Instagram.',
    contactNote: 'Nur öffentliches Instagram. Keine Telefonnummer oder Arbeitskontakte.',
    footer: 'Handgemacht, mit einem Funken Whimsy.',
  },
};

let currentLang = 'es';
let currentProjects = [];
let revealObserver = null;
let aboutTexts = [];
let aboutEls = [];
let twShown = -1;

function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && content[saved]) return saved;
  } catch (e) { /* localStorage unavailable */ }
  const browserLang = (navigator.language || 'en').slice(0, 2);
  return content[browserLang] ? browserLang : 'en';
}

function saveLanguage(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* localStorage unavailable */ }
}

function pickDescription(description, lang) {
  if (typeof description === 'string') return description;
  if (!description) return '';
  return description[lang] || description.en || Object.values(description)[0] || '';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}


function renderExpList(t) {
  const list = document.getElementById('exp-list');
  if (!list) return;
  list.innerHTML = t.exp
    .map(
      (job) => `
        <div class="exp-item">
          <span class="exp-item__dot" aria-hidden="true"></span>
          <div>
            <p class="exp-item__role">${job.role}</p>
            <p class="exp-item__detail">${job.detail}</p>
          </div>
        </div>`
    )
    .join('');
}

function renderSkills(t) {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;
  grid.innerHTML = skills
    .map(
      (group, index) => `
        <div class="skill-card" data-reveal style="--skill-accent: ${pastels[index % pastels.length]}; transition-delay: ${index * 80}ms">
          <div class="skill-card__swatch" aria-hidden="true"></div>
          <p class="skill-card__title">${t.skillGroups[group.key] || ''}</p>
          <div class="skill-card__chips">
            ${group.items.map((chip) => `<span class="chip">${chip}</span>`).join('')}
          </div>
        </div>`
    )
    .join('');
}

function renderNow(t) {
  const grid = document.getElementById('now-grid');
  if (!grid) return;
  grid.innerHTML = t.now
    .map(
      (item) => `
        <div class="now-tile">
          <p class="now-tile__key">${item.k}</p>
          <p class="now-tile__value">${item.v}</p>
        </div>`
    )
    .join('');
  setText('now-year', '· ' + new Date().getFullYear());
}

function renderMarquee(t) {
  const track = document.getElementById('marquee-track');
  if (!track) return;
  const words = t.marquee || [];
  const looped = words.length ? [...words, ...words, ...words] : [];
  track.innerHTML = looped
    .map(
      (word) => `
        <span class="marquee__word">${word}<svg viewBox="0 0 32 28" width="13" height="11" aria-hidden="true"><path d="M16 25.5C9.4 20 3.4 15 2.7 9.8 2.1 5.4 5.2 2.6 8.6 3.1c3 .4 5.4 2.7 7.4 5.4 2-2.7 4.4-5 7.4-5.4 3.4-.5 6.5 2.3 5.9 6.7C28.6 15 22.6 20 16 25.5Z" fill="none" stroke="#E85DA0" stroke-width="3" /></svg></span>`
    )
    .join('');
}

function renderProjects(t) {
  const list = document.getElementById('project-list');
  if (!list) return;
  if (!currentProjects.length) {
    list.innerHTML = `<p class="projects-empty">${(projectsReady ? t.projectsEmpty : t.projectsLoading) || ''}</p>`;
    return;
  }
  list.innerHTML = currentProjects
    .map((project, index) => {
      const isExternal = /^https?:\/\//i.test(project.url);
      const linkAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `
        <a class="project-card" data-reveal href="${project.url}"${linkAttrs} style="--project-accent: ${pastels[index % pastels.length]}; transition-delay: ${index * 80}ms">
          <span class="project-card__bar" aria-hidden="true"></span>
          <span class="project-card__top">
            <span class="project-card__type">${project.type || 'Project'}</span>
            <span class="project-card__index">${String(index + 1).padStart(2, '0')}</span>
          </span>
          <span class="project-card__title">${project.title}</span>
          <span class="project-card__desc">${pickDescription(project.description, currentLang)}</span>
          <span class="project-card__open">${t.projectOpen} <span aria-hidden="true">→</span></span>
        </a>`;
    })
    .join('');
}

let projectsReady = false;

async function loadProjects() {
  try {
    const response = await fetch('proyectos/projects.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Projects manifest failed: ${response.status}`);
    const manifest = await response.json();
    currentProjects = manifest.projects || [];
  } catch (error) {
    console.warn(error);
    currentProjects = [];
  } finally {
    projectsReady = true;
  }
}

function setupReveals() {
  if (revealObserver) revealObserver.disconnect();
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.remove('reveal-out-down', 'reveal-out-up'));
    return;
  }
  els.forEach((el) => el.classList.add('reveal-out-down'));
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-out-down', 'reveal-out-up');
        } else {
          const r = entry.boundingClientRect;
          if (r.top >= window.innerHeight) {
            entry.target.classList.remove('reveal-out-up');
            entry.target.classList.add('reveal-out-down');
          } else if (r.bottom <= 0) {
            entry.target.classList.remove('reveal-out-down');
            entry.target.classList.add('reveal-out-up');
          }
        }
      });
    },
    { threshold: 0.06 }
  );
  els.forEach((el) => revealObserver.observe(el));
}

function syncTypewriter() {
  aboutEls = ['about-p1', 'about-p2', 'about-p3', 'about-p4'].map((id) => document.getElementById(id));
  twShown = -1;
  updateTypewriter();
}

function updateTypewriter() {
  if (!aboutTexts.length) return;
  const sec = document.getElementById('about');
  if (!sec) return;
  const r = sec.getBoundingClientRect();
  const vh = window.innerHeight;
  const totalChars = aboutTexts.reduce((sum, text) => sum + text.length, 0);
  const progress = Math.max(0, Math.min(1, (vh * 0.86 - r.top) / (r.height * 0.85)));
  const n = Math.round(progress * totalChars);
  if (n === twShown) return;
  twShown = n;
  let offset = 0;
  aboutTexts.forEach((text, i) => {
    const el = aboutEls[i];
    offset += text.length;
    if (!el) return;
    const shown = Math.max(0, Math.min(text.length, n - (offset - text.length)));
    el.textContent = text.slice(0, shown);
    if (shown > 0 && shown < text.length) {
      const cursor = document.createElement('span');
      cursor.className = 'tw-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      el.appendChild(cursor);
    }
  });
}

function applyLanguage(lang) {
  const t = content[lang] || content.en;
  currentLang = content[lang] ? lang : 'en';

  setText('nav-about', t.nav.about);
  setText('nav-skills', t.nav.skills);
  setText('nav-projects', t.nav.projects);
  setText('nav-now', t.nav.now);
  setText('nav-contact', t.nav.contact);

  setText('hero-eyebrow', t.heroEyebrow);
  setText('headline-a', t.headlineA);
  setText('headline-b', t.headlineB);
  setText('hero-intro', t.intro);
  setText('cta-projects', t.ctaProjects);
  setText('cta-contact', t.ctaContact);
  setText('hero-spark', t.heroSpark);

  renderMarquee(t);

  setText('about-title', t.aboutTitle);
  setText('about-spark', t.aboutSpark);
  aboutTexts = [t.about1, t.about2, t.about3, t.about4];
  setText('exp-title', t.expTitle);
  renderExpList(t);

  setText('skills-title', t.skillsTitle);
  renderSkills(t);

  setText('projects-title', t.projectsTitle);
  setText('projects-pill', t.projectsPill);
  setText('projects-note', t.projectsNote);
  renderProjects(t);

  setText('now-title', t.nowTitle);
  setText('now-note', t.nowNote);
  renderNow(t);

  setText('contact-title', t.contactTitle);
  setText('contact-copy', t.contactCopy);
  setText('contact-note', t.contactNote);
  setText('footer-note', t.footer);

  document.documentElement.lang = currentLang;

  requestAnimationFrame(() => {
    setupReveals();
    syncTypewriter();
  });
}

const selector = document.getElementById('language-select');
const initialLanguage = detectLanguage();
selector.value = initialLanguage;

applyLanguage(initialLanguage);
loadProjects().then(() => {
  renderProjects(content[currentLang] || content.en);
  requestAnimationFrame(setupReveals);
});

selector.addEventListener('change', (event) => {
  saveLanguage(event.target.value);
  applyLanguage(event.target.value);
});

window.addEventListener('scroll', updateTypewriter, { passive: true });
window.addEventListener('resize', updateTypewriter, { passive: true });
