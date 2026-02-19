import './style.css';

const i18n = {
  en: {
    appTitle: 'Budget Planner · ADHD friendly',
    subtitle: 'Guided setup, color categories, visual reminders and 5-minute mode.',
    lang: 'Language',
    backHome: 'Back to main page',
    period: 'View',
    weekly: 'Weekly',
    monthly: 'Monthly',
    step: 'Step',
    next: 'Next',
    prev: 'Back',
    save: 'Save and finish',
    restart: 'Start over',
    income: 'Monthly income',
    fixed: 'Fixed expenses',
    variable: 'Variable expenses',
    goals: 'Savings goals & reminders',
    salary: 'Main income', rent: 'Rent + utilities', subs: 'Subscriptions', food: 'Food', transport: 'Transport', fun: 'Fun / extras',
    emergency: 'Emergency micro-goal', short: 'Short-term goal', reminder: 'Visual reminder',
    remPlaceholder: 'Example: check balance every Friday',
    summary: 'Summary',
    available: 'Available',
    savings: 'Savings progress',
    spent: 'Planned spending',
    alertBad: 'Alert: your planned expenses are above your income.',
    alertGood: 'Good balance. You still have margin to decide intentionally.',
    quickTitle: '5-minute mode',
    quickPlaceholder: 'Quick expense note',
    quickAdd: 'Add',
    quickEmpty: 'No quick notes yet.',
    days: ['M','T','W','T','F','S','S']
  },
  es: {
    appTitle: 'Budget Planner · amigable para TDAH',
    subtitle: 'Configuración guiada, categorías por color, recordatorios visuales y modo 5 minutos.',
    lang: 'Idioma',
    backHome: 'Volver a la página principal',
    period: 'Vista',
    weekly: 'Semanal',
    monthly: 'Mensual',
    step: 'Paso',
    next: 'Siguiente',
    prev: 'Atrás',
    save: 'Guardar y terminar',
    restart: 'Comenzar de nuevo',
    income: 'Ingresos mensuales',
    fixed: 'Gastos fijos',
    variable: 'Gastos variables',
    goals: 'Metas de ahorro y recordatorios',
    salary: 'Ingreso principal', rent: 'Renta + servicios', subs: 'Suscripciones', food: 'Comida', transport: 'Transporte', fun: 'Ocio / extras',
    emergency: 'Micro-meta de emergencia', short: 'Meta de corto plazo', reminder: 'Recordatorio visual',
    remPlaceholder: 'Ejemplo: revisar saldo cada viernes',
    summary: 'Resumen',
    available: 'Disponible',
    savings: 'Progreso de ahorro',
    spent: 'Gasto planeado',
    alertBad: 'Alerta: tus gastos planeados superan tus ingresos.',
    alertGood: 'Buen balance. Aún tienes margen para decidir con intención.',
    quickTitle: 'Modo 5 minutos',
    quickPlaceholder: 'Anota gasto rápido',
    quickAdd: 'Agregar',
    quickEmpty: 'Aún no hay notas rápidas.',
    days: ['L','M','M','J','V','S','D']
  }
};

const storageKey = 'budget-tdah-v1';
const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
state.lang ||= 'es';
state.step ||= 0;
state.period ||= 'monthly';
state.quick ||= [];
state.values ||= { salary: 0, rent: 0, subs: 0, food: 0, transport: 0, fun: 0, emergency: 0, short: 0, reminder: '' };

const steps = ['income', 'fixed', 'variable', 'goals'];

const app = document.querySelector('#app');

function money(n) {
  return new Intl.NumberFormat(state.lang === 'es' ? 'es-MX' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0);
}
function save() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function totalExpenses() { const v = state.values; return +v.rent + +v.subs + +v.food + +v.transport + +v.fun; }
function totalGoals() { const v = state.values; return +v.emergency + +v.short; }

function render() {
  const t = i18n[state.lang];
  const stepLabel = `${t.step} ${Math.min(state.step + 1, 4)}/4`;
  const progress = `${((Math.min(state.step, 4)) / 4) * 100}%`;
  const spentBase = totalExpenses();
  const spent = state.period === 'weekly' ? spentBase / 4 : spentBase;
  const income = state.period === 'weekly' ? (+state.values.salary / 4) : +state.values.salary;
  const available = income - spent - (state.period === 'weekly' ? totalGoals() / 4 : totalGoals());
  const goalProgress = Math.min(100, ((totalGoals() / Math.max(1, +state.values.salary)) * 100));
  const isBad = available < 0;

  app.innerHTML = `
    <main>
      <div class="top">
        <div>
          <h1>${t.appTitle}</h1>
          <p class="small">${t.subtitle}</p>
        </div>
        <div>
          <label>${t.lang}</label>
          <select id="lang"><option value="es">ES</option><option value="en">EN</option></select>
          <a class="small" href="../../index.html">${t.backHome}</a>
        </div>
      </div>
      <div class="layout">
        <section class="card panel">
          <div class="top" style="margin-bottom:0">
            <strong>${stepLabel}</strong>
            <div>
              <label>${t.period}</label>
              <select id="period"><option value="weekly">${t.weekly}</option><option value="monthly">${t.monthly}</option></select>
            </div>
          </div>
          <div class="progress"><span style="width:${progress}"></span></div>
          ${renderStep(t)}
          <div class="top" style="margin-top:.6rem">
            <button class="secondary" id="prev" ${state.step === 0 ? 'disabled' : ''}>${t.prev}</button>
            <div style="display:flex; gap:.45rem">
              <button class="secondary" id="restart">${t.restart}</button>
              <button id="next">${state.step >= 3 ? t.save : t.next}</button>
            </div>
          </div>
        </section>

        <aside class="card panel">
          <h3>${t.summary}</h3>
          <div class="metrics">
            <div class="metric">${t.available}<strong>${money(available)}</strong></div>
            <div class="metric">${t.spent}<strong>${money(spent)}</strong></div>
            <div class="metric">${t.savings}<strong>${goalProgress.toFixed(0)}%</strong></div>
            <div class="metric">${t.period}<strong>${state.period === 'weekly' ? t.weekly : t.monthly}</strong></div>
          </div>
          <div class="alert ${isBad ? 'warn' : 'ok'}">${isBad ? t.alertBad : t.alertGood}</div>
          <div class="timeline">${t.days.map((d) => `<div class="tick">${d}</div>`).join('')}</div>
          <div class="quick">
            <input id="quickInput" placeholder="${t.quickPlaceholder}" />
            <button id="quickAdd">${t.quickAdd}</button>
          </div>
          <h4 style="margin:.85rem 0 .4rem">${t.quickTitle}</h4>
          <ul>${state.quick.length ? state.quick.map((q) => `<li>${q}</li>`).join('') : `<li>${t.quickEmpty}</li>`}</ul>
        </aside>
      </div>
    </main>`;

  document.querySelector('#lang').value = state.lang;
  document.querySelector('#period').value = state.period;

  document.querySelectorAll('input[data-k]').forEach((input) => {
    input.addEventListener('input', (e) => {
      const k = e.target.dataset.k;
      state.values[k] = e.target.type === 'number' ? Number(e.target.value || 0) : e.target.value;
      save();
      render();
    });
  });

  document.querySelector('#lang').addEventListener('change', (e) => { state.lang = e.target.value; save(); render(); });
  document.querySelector('#period').addEventListener('change', (e) => { state.period = e.target.value; save(); render(); });
  document.querySelector('#prev').addEventListener('click', () => { state.step = Math.max(0, state.step - 1); save(); render(); });
  document.querySelector('#next').addEventListener('click', () => { state.step = Math.min(4, state.step + 1); save(); render(); });
  document.querySelector('#restart').addEventListener('click', () => {
    state.step = 0;
    state.values = { salary: 0, rent: 0, subs: 0, food: 0, transport: 0, fun: 0, emergency: 0, short: 0, reminder: '' };
    state.quick = [];
    save();
    render();
  });
  document.querySelector('#quickAdd').addEventListener('click', () => {
    const input = document.querySelector('#quickInput');
    if (!input.value.trim()) return;
    state.quick.unshift(input.value.trim());
    state.quick = state.quick.slice(0, 5);
    input.value = '';
    save();
    render();
  });
}

function renderStep(t) {
  const v = state.values;
  if (state.step >= 4) {
    return `<div class="category cat-goal"><strong>${t.summary}</strong><p>${t.alertGood}</p><p>${t.reminder}: ${v.reminder || '—'}</p></div>`;
  }
  const step = steps[state.step];
  if (step === 'income') return `<div class="category cat-income"><h3>${t.income}</h3><div class="field"><label>${t.salary}</label><input data-k="salary" type="number" value="${v.salary}" /></div></div>`;
  if (step === 'fixed') return `<div class="category cat-fixed"><h3>${t.fixed}</h3><div class="row"><div class="field"><label>${t.rent}</label><input data-k="rent" type="number" value="${v.rent}" /></div><div class="field"><label>${t.subs}</label><input data-k="subs" type="number" value="${v.subs}" /></div></div></div>`;
  if (step === 'variable') return `<div class="category cat-var"><h3>${t.variable}</h3><div class="row"><div class="field"><label>${t.food}</label><input data-k="food" type="number" value="${v.food}" /></div><div class="field"><label>${t.transport}</label><input data-k="transport" type="number" value="${v.transport}" /></div></div><div class="field"><label>${t.fun}</label><input data-k="fun" type="number" value="${v.fun}" /></div></div>`;
  return `<div class="category cat-goal"><h3>${t.goals}</h3><div class="row"><div class="field"><label>${t.emergency}</label><input data-k="emergency" type="number" value="${v.emergency}" /></div><div class="field"><label>${t.short}</label><input data-k="short" type="number" value="${v.short}" /></div></div><div class="field"><label>${t.reminder}</label><input data-k="reminder" value="${v.reminder}" placeholder="${t.remPlaceholder}" /></div></div>`;
}

render();
