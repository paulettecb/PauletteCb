const i18n = {
  en: {
    appTitle: 'Budget Planner · ADHD friendly',
    subtitle: 'Clear dashboard, visual focus and guided setup.',
    lang: 'Language',
    backHome: 'Back to main page',
    period: 'View',
    weekly: 'Weekly',
    monthly: 'Monthly',
    step: 'Step',
    next: 'Next',
    prev: 'Back',
    save: 'Save period',
    restart: 'Reset',
    income: 'Monthly income',
    fixed: 'Fixed expenses',
    variable: 'Variable expenses',
    goals: 'Savings goals & reminder',
    salary: 'Main income', rent: 'Rent + utilities', subs: 'Subscriptions', food: 'Food', transport: 'Transport', fun: 'Fun / extras',
    emergency: 'Emergency goal', short: 'Short goal', reminder: 'Visual reminder',
    remPlaceholder: 'Example: Friday review 6pm',
    available: 'Available', spent: 'Planned spending',
    compare: 'vs last close',
    charts: 'Visuals',
    simulator: 'Scenario simulator',
    simulatorHint: 'Cut fun % and preview available amount',
    report: 'Condensed report',
    theories: 'Collective theories',
    c1: 'Systems theory: tiny changes rebalance the whole flow.',
    c2: 'Behavioral economics: defaults reduce impulsive friction.',
    c3: 'Cognitive load: one decision at a time sustains focus.',
    quickTitle: '5-minute mode', quickPlaceholder: 'Quick note', quickAdd: 'Add', quickEmpty: 'No quick notes yet.',
    alertBad: 'Alert: expenses are above income.',
    alertGood: 'Healthy balance for intentional decisions.',
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  },
  es: {
    appTitle: 'Budget Planner · amigable para TDAH',
    subtitle: 'Dashboard claro, foco visual y configuración guiada.',
    lang: 'Idioma',
    backHome: 'Volver a la página principal',
    period: 'Vista',
    weekly: 'Semanal',
    monthly: 'Mensual',
    step: 'Paso',
    next: 'Siguiente',
    prev: 'Atrás',
    save: 'Guardar periodo',
    restart: 'Reiniciar',
    income: 'Ingresos mensuales',
    fixed: 'Gastos fijos',
    variable: 'Gastos variables',
    goals: 'Metas de ahorro y recordatorio',
    salary: 'Ingreso principal', rent: 'Renta + servicios', subs: 'Suscripciones', food: 'Comida', transport: 'Transporte', fun: 'Ocio / extras',
    emergency: 'Meta de emergencia', short: 'Meta corta', reminder: 'Recordatorio visual',
    remPlaceholder: 'Ejemplo: revisión viernes 6pm',
    available: 'Disponible', spent: 'Gasto planeado',
    compare: 'vs cierre anterior',
    charts: 'Visuales',
    simulator: 'Simulador de escenarios',
    simulatorHint: 'Reduce % ocio y previsualiza el disponible',
    report: 'Reporte condensado',
    theories: 'Teorías colectivas',
    c1: 'Teoría de sistemas: cambios pequeños reequilibran todo el flujo.',
    c2: 'Economía conductual: defaults reducen fricción impulsiva.',
    c3: 'Carga cognitiva: una decisión a la vez sostiene el foco.',
    quickTitle: 'Modo 5 minutos', quickPlaceholder: 'Nota rápida', quickAdd: 'Agregar', quickEmpty: 'Aún no hay notas rápidas.',
    alertBad: 'Alerta: los gastos superan el ingreso.',
    alertGood: 'Balance sano para decisiones con intención.',
    days: ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  }
};

const storageKey = 'budget-tdah-v3';
const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
state.lang ||= 'es';
state.step ||= 0;
state.period ||= 'monthly';
state.quick ||= [];
state.history ||= [];
state.scenarioCut ||= 10;
state.values ||= { salary: 0, rent: 0, subs: 0, food: 0, transport: 0, fun: 0, emergency: 0, short: 0, reminder: '' };

const steps = ['income', 'fixed', 'variable', 'goals'];
const app = document.querySelector('#app');

const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
const money = (n) => new Intl.NumberFormat(state.lang === 'es' ? 'es-MX' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0);
const totalExpenses = (v = state.values) => +v.rent + +v.subs + +v.food + +v.transport + +v.fun;
const totalGoals = (v = state.values) => +v.emergency + +v.short;

function closePeriod() {
  const v = state.values;
  state.history.unshift({ ts: Date.now(), available: +v.salary - totalExpenses(v) - totalGoals(v) });
  state.history = state.history.slice(0, 12);
}

function renderStep(t) {
  const v = state.values;
  if (state.step >= 4) return `<div class="step-block done"><p>${t.alertGood}</p><p>${t.reminder}: <strong>${v.reminder || '—'}</strong></p></div>`;
  const current = steps[state.step];
  if (current === 'income') return `<div class="step-block income"><h3>${t.income}</h3><label>${t.salary}</label><input data-k="salary" type="number" value="${v.salary}" /></div>`;
  if (current === 'fixed') return `<div class="step-block fixed"><h3>${t.fixed}</h3><div class="row"><div><label>${t.rent}</label><input data-k="rent" type="number" value="${v.rent}" /></div><div><label>${t.subs}</label><input data-k="subs" type="number" value="${v.subs}" /></div></div></div>`;
  if (current === 'variable') return `<div class="step-block variable"><h3>${t.variable}</h3><div class="row"><div><label>${t.food}</label><input data-k="food" type="number" value="${v.food}" /></div><div><label>${t.transport}</label><input data-k="transport" type="number" value="${v.transport}" /></div></div><label>${t.fun}</label><input data-k="fun" type="number" value="${v.fun}" /></div>`;
  return `<div class="step-block goal"><h3>${t.goals}</h3><div class="row"><div><label>${t.emergency}</label><input data-k="emergency" type="number" value="${v.emergency}" /></div><div><label>${t.short}</label><input data-k="short" type="number" value="${v.short}" /></div></div><label>${t.reminder}</label><input data-k="reminder" value="${v.reminder}" placeholder="${t.remPlaceholder}" /></div>`;
}

function render() {
  const t = i18n[state.lang];
  const v = state.values;
  const spentBase = totalExpenses();
  const periodDivisor = state.period === 'weekly' ? 4 : 1;
  const income = +v.salary / periodDivisor;
  const spent = spentBase / periodDivisor;
  const available = income - spent - totalGoals() / periodDivisor;
  const previous = state.history[0]?.available ?? available;
  const diff = available - previous;
  const d1 = +v.rent + +v.subs;
  const d2 = +v.food + +v.transport + +v.fun;
  const d3 = totalGoals();
  const dTotal = Math.max(1, d1 + d2 + d3);
  const p1 = (d1 / dTotal) * 100;
  const p2 = (d2 / dTotal) * 100;
  const scenarioGain = (+v.fun * state.scenarioCut) / 100 / periodDivisor;

  app.innerHTML = `
  <main>
    <header class="top-nav glassy">
      <div class="nav-pill">
        <span>Dashboard</span><span>Budget</span><span>Focus</span><span>Insights</span>
      </div>
      <div class="actions">
        <label>${t.lang}</label>
        <select id="lang"><option value="es">ES</option><option value="en">EN</option></select>
      </div>
    </header>

    <section class="hero glassy">
      <div>
        <h1>${t.appTitle}</h1>
        <p>${t.subtitle}</p>
      </div>
      <div class="hero-actions">
        <select id="period"><option value="weekly">${t.weekly}</option><option value="monthly">${t.monthly}</option></select>
        <a href="../../index.html">${t.backHome}</a>
      </div>
    </section>

    <section class="dashboard-grid">
      <article class="card light revenue">
        <h3>${t.charts}</h3>
        <div class="kpi-row">
          <div class="kpi"><small>${t.income}</small><strong>${money(income)}</strong></div>
          <div class="kpi dark"><small>${t.spent}</small><strong>${money(spent)}</strong></div>
        </div>
        <div class="bars">${[15,38,52,60,42,55,35,44,30,26].map((h, i) => `<span style="height:${Math.max(10, h - i)}%"></span>`).join('')}</div>
      </article>

      <article class="card dark savings">
        <h3>Savings</h3>
        <div class="savings-row">
          <div class="tile purple"><small>${t.available}</small><strong>${money(available)}</strong></div>
          <div class="tile mint"><small>${t.compare}</small><strong class="${diff >= 0 ? 'good' : 'bad'}">${diff >= 0 ? '+' : ''}${money(diff)}</strong></div>
        </div>
        <p class="alert-text ${available < 0 ? 'bad' : 'good'}">${available < 0 ? t.alertBad : t.alertGood}</p>
      </article>

      <article class="card dark donut-card">
        <h3>Spending by category</h3>
        <div class="donut" style="--d:conic-gradient(#6ec9ff 0 ${p1}%, #6ad9b8 ${p1}% ${p1 + p2}%, #a79bff ${p1 + p2}% 100%)"></div>
        <div class="legend"><span>Fijos</span><span>Variables</span><span>Metas</span></div>
      </article>

      <article class="card light report-card">
        <h3>${t.report}</h3>
        <div class="report-mini"><strong>Flow</strong><p>${money(income)} → ${money(spent)} → ${money(available)}</p></div>
        <div class="report-mini"><strong>${t.simulator}</strong><input id="cut" type="range" min="0" max="60" step="5" value="${state.scenarioCut}" /><p>${t.simulatorHint}: <strong>${money(available + scenarioGain)}</strong></p></div>
        <div class="quick"><input id="quickInput" placeholder="${t.quickPlaceholder}" /><button id="quickAdd">${t.quickAdd}</button></div>
        <ul>${state.quick.length ? state.quick.map((q) => `<li>${q}</li>`).join('') : `<li>${t.quickEmpty}</li>`}</ul>
      </article>
    </section>

    <section class="bottom-grid">
      <article class="card light">
        <div class="step-top">
          <strong>${t.step} ${Math.min(state.step + 1, 4)}/4</strong>
          <div><button class="secondary" id="prev" ${state.step === 0 ? 'disabled' : ''}>${t.prev}</button><button class="secondary" id="restart">${t.restart}</button><button id="next">${state.step >= 3 ? t.save : t.next}</button></div>
        </div>
        ${renderStep(t)}
      </article>
      <article class="card light theories">
        <h3>${t.theories}</h3>
        <p>${t.c1}</p>
        <p>${t.c2}</p>
        <p>${t.c3}</p>
        <div class="timeline">${t.days.map((d) => `<span>${d}</span>`).join('')}</div>
      </article>
    </section>
  </main>`;

  document.querySelector('#lang').value = state.lang;
  document.querySelector('#period').value = state.period;

  document.querySelectorAll('input[data-k]').forEach((input) => input.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    state.values[k] = e.target.type === 'number' ? Number(e.target.value || 0) : e.target.value;
    save();
    render();
  }));

  document.querySelector('#lang').addEventListener('change', (e) => { state.lang = e.target.value; save(); render(); });
  document.querySelector('#period').addEventListener('change', (e) => { state.period = e.target.value; save(); render(); });
  document.querySelector('#cut').addEventListener('input', (e) => { state.scenarioCut = Number(e.target.value); save(); render(); });
  document.querySelector('#quickAdd').addEventListener('click', () => {
    const input = document.querySelector('#quickInput');
    if (!input.value.trim()) return;
    state.quick.unshift(input.value.trim());
    state.quick = state.quick.slice(0, 6);
    input.value = '';
    save();
    render();
  });

  document.querySelector('#prev').addEventListener('click', () => { state.step = Math.max(0, state.step - 1); save(); render(); });
  document.querySelector('#next').addEventListener('click', () => {
    if (state.step >= 3) { closePeriod(); state.step = 4; } else { state.step += 1; }
    save();
    render();
  });
  document.querySelector('#restart').addEventListener('click', () => {
    state.step = 0;
    state.values = { salary: 0, rent: 0, subs: 0, food: 0, transport: 0, fun: 0, emergency: 0, short: 0, reminder: '' };
    state.quick = [];
    save();
    render();
  });
}

render();
