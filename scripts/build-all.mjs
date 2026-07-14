import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

// El repo mezcla una app principal (Vite, raíz + MediaPipe Lab) con
// sub-proyectos independientes: algunos tienen su propio build de Vite
// (budget-planner-tdah), otros son HTML/CSS estático plano (lsm, KYN
// Design System). Vite solo empaqueta lo que está en rollupOptions.input,
// así que este script arma un dist/ completo copiando/compilando todo lo
// que el sitio realmente enlaza, para que Netlify y GitHub Pages sirvan
// exactamente lo mismo.

const root = process.cwd();
const dist = path.join(root, 'dist');
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: root });

const copy = (from, to) => {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
};

console.log('▶ Regenerando proyectos/projects.json desde projects.config.json');
run('npm run projects:manifest');

console.log('▶ Build principal (raíz + MediaPipe Lab)');
rmSync(dist, { recursive: true, force: true });
run('npx vite build');

console.log('▶ Copiando styles.css plano (lo referencian lsm/rescate directo, sin bundle)');
copy(path.join(root, 'styles.css'), path.join(dist, 'styles.css'));

console.log('▶ Build de budget-planner-tdah (Vite propio, base relativa)');
const budgetOut = path.join(dist, 'proyectos', 'budget-planner-tdah');
run(`npx vite build proyectos/budget-planner-tdah --base ./ --outDir "${budgetOut}" --emptyOutDir`);

console.log('▶ Copiando sub-proyectos estáticos (lsm, KYN Design System, libro de agility) y projects.json');
copy(path.join(root, 'proyectos/mediapipe-lab/libro-agility.html'), path.join(dist, 'proyectos/mediapipe-lab/libro-agility.html'));

// CENEVAL: solo los HTML (hub + mini libros por área). NUNCA copiar material/
// (guía, libros con derechos y exámenes) — es local y gitignored.
copy(path.join(root, 'proyectos/ceneval/index.html'), path.join(dist, 'proyectos/ceneval/index.html'));
copy(path.join(root, 'proyectos/ceneval/libro-area1-diagnostico.html'), path.join(dist, 'proyectos/ceneval/libro-area1-diagnostico.html'));
copy(path.join(root, 'proyectos/ceneval/libro-area2-intervencion.html'), path.join(dist, 'proyectos/ceneval/libro-area2-intervencion.html'));
copy(path.join(root, 'proyectos/ceneval/libro-area3-investigacion.html'), path.join(dist, 'proyectos/ceneval/libro-area3-investigacion.html'));
copy(path.join(root, 'proyectos/ceneval/simulacro.html'), path.join(dist, 'proyectos/ceneval/simulacro.html'));
copy(path.join(root, 'proyectos/ceneval/flashcards.html'), path.join(dist, 'proyectos/ceneval/flashcards.html'));
copy(path.join(root, 'proyectos/ceneval/chuletas.html'), path.join(dist, 'proyectos/ceneval/chuletas.html'));
copy(path.join(root, 'proyectos/ceneval/plan-10-dias.html'), path.join(dist, 'proyectos/ceneval/plan-10-dias.html'));
// Los CSV de flashcards SÍ se publican: son contenido propio destilado de los libros KYN.
copy(path.join(root, 'proyectos/ceneval/flashcards'), path.join(dist, 'proyectos/ceneval/flashcards'));
copy(path.join(root, 'proyectos/lsm/index.html'), path.join(dist, 'proyectos/lsm/index.html'));
copy(path.join(root, 'proyectos/lsm/rescate'), path.join(dist, 'proyectos/lsm/rescate'));
copy(path.join(root, 'proyectos/KYN Design System'), path.join(dist, 'proyectos/KYN Design System'));
// Packages compartidos: módulos que las herramientas enlazan (hoy: lector-kyn,
// con su vendor de MediaPipe). Se copia entero para que el WASM y el bundle
// lleguen al deploy.
copy(path.join(root, 'proyectos/packages/lector-kyn'), path.join(dist, 'proyectos/packages/lector-kyn'));
copy(path.join(root, 'proyectos/projects.json'), path.join(dist, 'proyectos/projects.json'));

console.log('✅ dist/ unificado listo (Netlify y GitHub Pages sirven el mismo contenido).');
