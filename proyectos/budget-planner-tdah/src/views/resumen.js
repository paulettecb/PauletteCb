// Vista "Resumen" de Cuentas Claras: el "¿cómo voy?" en 5 segundos.
//
// Contrato: export function render(el). main.js la llama en cada cambio de
// estado y de mes; se re-renderiza completa (el.innerHTML = ...) y los
// listeners se wirean SOLO en nodos recién creados. El mes activo siempre
// llega implícito por store.getMes() (los helpers del store ya lo usan).

import * as store from '../store.js';
import { abrirQuickAdd, barra, burbujaCat, vacio } from '../components.js';
import { fmtMoney, fmtMoneyCorto, escapeHtml, etiquetaRelativa } from '../utils.js';

/* =========================================================================
   Render principal
   ========================================================================= */

export function render(el) {
  const resumen = store.resumenDelMes();
  const movs = store.movimientosDelMes();
  const hayDeudas = store.getState().deudas.length > 0;
  const bienvenida = resumen.ingresoBase === 0 && movs.length === 0;

  const bloques = [];
  bloques.push(bienvenida ? cardBienvenida() : cardHero(resumen));
  // En la bienvenida pura no saturamos con cards vacías; si ya hay deudas,
  // sus cards sí aportan información real.
  if (!bienvenida || hayDeudas) bloques.push(cardProximosPagos(hayDeudas));
  const mitades = [cardEnQueSeVa(), hayDeudas ? cardDeudas() : ''].filter(Boolean);
  if (mitades.length) bloques.push(`<div class="grid-2">${mitades.join('')}</div>`);
  if (!bienvenida) bloques.push(cardUltimosMovimientos(movs));

  el.innerHTML = bloques.map((b) => `<div class="seccion">${b}</div>`).join('');

  // Listeners SOLO en los nodos recién creados (nunca en document/window/el).
  const btnIngreso = el.querySelector('[data-accion="quickadd-ingreso"]');
  if (btnIngreso) btnIngreso.addEventListener('click', () => abrirQuickAdd('ingreso'));
  const btnGasto = el.querySelector('[data-accion="quickadd-gasto"]');
  if (btnGasto) btnGasto.addEventListener('click', () => abrirQuickAdd('gasto'));
  el.querySelectorAll('[data-accion="quickadd-pago"]').forEach((btn) => {
    btn.addEventListener('click', () => abrirQuickAdd('pago'));
  });
}

/* =========================================================================
   1. Card hero: "te queda libre este mes"
   ========================================================================= */

function cardHero(r) {
  const nombre = store.getState().ajustes.nombre;

  // Semáforo del monto libre.
  let claseLibre = 'positivo';
  let pillEstado = '<span class="pill pill-ok">vas bien 💚</span>';
  if (r.libre < 0) {
    claseLibre = 'negativo';
    pillEstado = '<span class="pill pill-peligro">te pasaste 😵</span>';
  } else if (r.libre < r.ingresoBase * 0.15) {
    claseLibre = 'semaforo-alerta';
    pillEstado = '<span class="pill pill-alerta">vas justita 👀</span>';
  }

  // Desglose chiquito: entró / gastado / pendiente de deudas.
  // OJO: etiquetaHtml es HTML de confianza; los datos de usuario van escapados antes.
  const filaStat = (etiquetaHtml, valorHtml) => `
    <div class="fila-sep mt-1">
      <span class="texto-suave">${etiquetaHtml}</span>
      ${valorHtml}
    </div>`;

  const filas = [
    filaStat(
      r.usaPlaneado ? 'entró · <a href="#/datos">según tu ingreso planeado</a>' : 'entró',
      `<span class="monto">${fmtMoney(r.ingresoBase)}</span>`,
    ),
  ];
  // El pedacito motivador: cuánto de lo que entró lo puso KYN.
  const origen = store.origenIngresos();
  if (origen.kyn > 0) {
    filas.push(filaStat(
      '✨ de eso vino de KYN',
      `<span class="monto">${fmtMoney(origen.kyn)}</span> <span class="pill pill-brand">${origen.pctKyn}%</span>`,
    ));
  }
  filas.push(filaStat('gastado', `<span class="monto">${fmtMoney(r.gastos)}</span>`));
  if (r.comprometido > 0) {
    filas.push(filaStat(
      'de deudas te falta pagar',
      r.comprometidoPendiente > 0
        ? `<span class="monto">${fmtMoney(r.comprometidoPendiente)}</span>`
        : '<span class="pill pill-ok">✓ al corriente</span>',
    ));
  }

  const bloqueBarra = r.ingresoBase > 0
    ? `<div class="mt-2">
        ${barra(r.pctGastado)}
        <p class="texto-suave mt-1">ya se fue el ${r.pctGastado}% de lo que entró</p>
      </div>`
    : `<p class="texto-suave mt-2">
        aún no apuntas ingresos este mes · <a href="#/datos">ponle tu ingreso planeado</a>
      </p>`;

  return `
    <section class="card">
      ${nombre ? `<p class="eyebrow">hola, ${escapeHtml(nombre)}</p>` : ''}
      <div class="card-encabezado">
        <h2 class="card-titulo">te queda libre este mes</h2>
        ${pillEstado}
      </div>
      <div class="monto-hero ${claseLibre}">${fmtMoneyCorto(r.libre)}</div>
      <div class="mt-2">${filas.join('')}</div>
      ${bloqueBarra}
    </section>`;
}

// Estado vacío de bienvenida: primera vez, sin ingreso base ni movimientos.
function cardBienvenida() {
  return vacio({
    emoji: '✨',
    titulo: '¡bienvenida a Cuentas Claras!',
    texto: 'Apunta lo que entra y lo que sale, y yo te digo cómo vas — clarito y sin regaños.',
    boton: `
      <div class="fila" style="justify-content: center; flex-wrap: wrap">
        <button class="btn btn-primario" data-accion="quickadd-ingreso">💰 apuntar mi primer ingreso</button>
        <a class="btn btn-fantasma" href="#/datos">fijar mi ingreso planeado</a>
      </div>`,
  });
}

/* =========================================================================
   2. Card "próximos pagos" (siguientes 14 días)
   ========================================================================= */

function cardProximosPagos(hayDeudas) {
  const eventos = store.proximosEventos(14);

  let cuerpo;
  if (!hayDeudas) {
    cuerpo = vacio({
      emoji: '💪',
      titulo: 'sin pagos en el radar',
      texto: '¿Tienes tarjetas, MSI o préstamos? Regístralos y aquí te aviso cuándo toca pagar.',
      boton: '<a class="btn btn-suave" href="#/deudas">registrar mis deudas</a>',
    });
  } else if (!eventos.length) {
    cuerpo = '<p class="texto-secundario centrado mt-1">nada urgente 🎉 tus siguientes dos semanas vienen tranquilas</p>';
  } else {
    cuerpo = `<div class="lista">${eventos.map(filaEvento).join('')}</div>`;
  }

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">próximos pagos</h2>
        <span class="texto-suave">14 días</span>
      </div>
      ${cuerpo}
    </section>`;
}

function filaEvento(e) {
  const etiquetaFecha = etiquetaRelativa(e.fecha);
  const emoji = e.clase === 'corte' ? '✂️' : '💪';
  const derecha = e.pagado
    ? '<span class="pill pill-ok">✓ ya pagado</span>'
    : e.clase === 'pago'
      ? '<button class="btn btn-suave btn-chico" data-accion="quickadd-pago">registrar</button>'
      : '';
  return `
    <div class="item-mov">
      <span class="pill ${etiquetaFecha === 'hoy' ? 'pill-alerta' : 'pill-neutra'}">${escapeHtml(etiquetaFecha)}</span>
      <div class="mov-info">
        <div class="mov-titulo">${emoji} ${escapeHtml(e.etiqueta)}</div>
      </div>
      ${e.monto ? `<span class="monto">${fmtMoney(e.monto)}</span>` : ''}
      ${derecha}
    </div>`;
}

/* =========================================================================
   3. Card "en qué se va": top 5 de gasto por categoría
   ========================================================================= */

function cardEnQueSeVa() {
  const top = store.gastoPorCategoria().slice(0, 5);
  if (!top.length) return '';

  const filas = top.map((f) => `
    <div class="item-mov">
      ${burbujaCat(f.categoria)}
      <div class="mov-info">
        <div class="mov-titulo">${escapeHtml(f.categoria.nombre)}</div>
        ${f.presupuesto > 0 ? `<div class="mt-1">${barra(f.pct)}</div>` : ''}
      </div>
      <div class="derecha">
        <span class="monto">${fmtMoney(f.monto)}</span>
        ${f.presupuesto > 0 ? `<div class="texto-suave">${f.pct}% del tope</div>` : ''}
      </div>
    </div>`).join('');

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">en qué se va</h2>
        <a class="btn btn-suave btn-chico" href="#/presupuesto">ver plan completo</a>
      </div>
      <div class="lista">${filas}</div>
    </section>`;
}

/* =========================================================================
   4. Card mini de deudas
   ========================================================================= */

function cardDeudas() {
  const { total } = store.totalDeudas();
  const comprometido = store.comprometidoMensual().total;

  const cuerpo = total > 0
    ? `
      <div class="monto-grande">${fmtMoneyCorto(total)}</div>
      <p class="texto-suave">debes en total</p>
      <p class="texto-secundario mt-1">cada mes comprometes <span class="monto">${fmtMoney(comprometido)}</span></p>`
    : '<p class="texto-secundario mt-1">¡ya no debes nada! 🎉 qué orgullo</p>';

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">tus deudas</h2>
        <a class="btn btn-suave btn-chico" href="#/deudas">ver deudas</a>
      </div>
      ${cuerpo}
    </section>`;
}

/* =========================================================================
   5. Card "últimos movimientos" (máx 5)
   ========================================================================= */

function cardUltimosMovimientos(movs) {
  const ultimos = movs.slice(0, 5);

  const cuerpo = ultimos.length
    ? `<div class="lista">${ultimos.map(filaMov).join('')}</div>`
    : vacio({
        emoji: '🧾',
        titulo: 'nada apuntado este mes',
        texto: 'Con el primer gasto que apuntes, aquí empieza tu historia del mes.',
        boton: '<button class="btn btn-primario" data-accion="quickadd-gasto">＋ apuntar un gasto</button>',
      });

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">últimos movimientos</h2>
        <a class="btn btn-suave btn-chico" href="#/movimientos">ver todos</a>
      </div>
      ${cuerpo}
    </section>`;
}

function filaMov(m) {
  const esIngreso = m.tipo === 'ingreso';
  const cat = m.categoriaId ? store.categoriaDe(m.categoriaId) : null;
  const burbuja = esIngreso ? '<span class="burbuja tono-mint">💰</span>' : burbujaCat(cat);
  const titulo = m.nota || (esIngreso ? 'Ingreso' : (cat?.nombre || 'Sin categoría'));

  const detalle = [etiquetaRelativa(m.fecha)];
  if (!esIngreso) detalle.push(cat ? cat.nombre : 'Sin categoría');
  if (esIngreso && m.origen === 'kyn') detalle.push('✨ KYN');
  if (m.deudaId) {
    const deuda = store.deudaDe(m.deudaId);
    if (deuda) detalle.push(deuda.nombre);
  }

  return `
    <div class="item-mov">
      ${burbuja}
      <div class="mov-info">
        <div class="mov-titulo">${escapeHtml(titulo)}</div>
        <div class="mov-detalle">${escapeHtml(detalle.join(' · '))}</div>
      </div>
      <span class="monto${esIngreso ? ' positivo' : ''}">${esIngreso ? '+' : ''}${fmtMoney(m.monto)}</span>
    </div>`;
}
