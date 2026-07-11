// Vista 📅 calendario: el mes de un vistazo.
// Grid de días con la suma de gastos y los eventos de deuda (✂️ cortes y
// 💪 pagos), detalle por día en modal, y una lista escaneable de
// "lo que viene este mes" para quien prefiere leer en vez de ver cuadritos.

import * as store from '../store.js';
import { abrirModal, burbujaCat, vacio } from '../components.js';
import {
  fmtMoney, fmtMoneyCorto, escapeHtml, hoyISO, diaDe, mesKeyDe, diasEnMes,
  diaSemanaLunes0, fechaISO, fechaLarga, etiquetaRelativa, DIAS_SEMANA_CORTOS,
} from '../utils.js';
import './calendario.css';

/* =========================================================================
   Pedacitos de HTML
   ========================================================================= */

// Marcador chiquito dentro de la celda: ✂️ corte · 💪 pago (💪✓ si ya se pagó).
const marcadorEvento = (ev) =>
  `<span>${ev.clase === 'corte' ? '✂️' : ev.pagado ? '💪✓' : '💪'}</span>`;

function pillEstado(ev) {
  if (ev.clase !== 'pago') return '';
  if (ev.pagado) return '<span class="pill pill-ok">✓ ya pagado</span>';
  const clase = ev.fecha < hoyISO() ? 'pill-alerta' : 'pill-neutra';
  return `<span class="pill ${clase}">pendiente</span>`;
}

// Fila de evento para la lista "lo que viene" y para el modal del día.
function filaEvento(ev, { conFecha = true } = {}) {
  const burbuja = ev.clase === 'corte'
    ? '<span class="burbuja tono-sky">✂️</span>'
    : '<span class="burbuja tono-periwinkle">💪</span>';
  return `
    <div class="item-mov">
      ${burbuja}
      <div class="mov-info">
        <div class="mov-titulo">${escapeHtml(ev.etiqueta)}</div>
        ${conFecha ? `<div class="mov-detalle">${escapeHtml(etiquetaRelativa(ev.fecha))}</div>` : ''}
      </div>
      <div class="derecha">
        ${ev.monto != null ? `<div class="monto">${fmtMoney(ev.monto)}</div>` : ''}
        ${pillEstado(ev)}
      </div>
    </div>`;
}

// Mini fila de movimiento para el modal del día.
function filaMovMini(mov) {
  const esIngreso = mov.tipo === 'ingreso';
  const cat = store.categoriaDe(mov.categoriaId);
  const burbuja = esIngreso ? '<span class="burbuja tono-mint">💰</span>' : burbujaCat(cat);
  const titulo = mov.nota || (esIngreso ? 'Ingreso' : cat?.nombre || 'Gasto');
  const detalle = esIngreso ? '' : (cat?.nombre || 'Sin categoría');
  return `
    <div class="item-mov">
      ${burbuja}
      <div class="mov-info">
        <div class="mov-titulo">${escapeHtml(titulo)}</div>
        ${detalle ? `<div class="mov-detalle">${escapeHtml(detalle)}</div>` : ''}
      </div>
      <span class="monto${esIngreso ? ' positivo' : ''}">${esIngreso ? '+' : ''}${fmtMoney(mov.monto)}</span>
    </div>`;
}

/* =========================================================================
   Modal de detalle de un día
   ========================================================================= */

function abrirDetalleDia(fecha) {
  const mes = mesKeyDe(fecha);
  const eventos = store.eventosDelMes(mes).filter((e) => e.fecha === fecha);
  const movs = store.movimientosDelMes(mes).filter((m) => m.fecha === fecha);
  const gastoDia = movs
    .filter((m) => m.tipo === 'gasto')
    .reduce((suma, m) => suma + m.monto, 0);

  abrirModal({
    titulo: fechaLarga(fecha),
    cuerpo: `
      ${eventos.length ? `
        <div class="card-titulo">agenda del día</div>
        <div class="lista mt-1">${eventos.map((ev) => filaEvento(ev, { conFecha: false })).join('')}</div>` : ''}
      ${movs.length ? `
        <div class="card-titulo${eventos.length ? ' mt-2' : ''}">movimientos del día</div>
        <div class="lista mt-1">${movs.map(filaMovMini).join('')}</div>` : ''}
      ${gastoDia > 0 ? `
        <div class="fila-sep mt-2">
          <span class="texto-suave">gastaste este día</span>
          <span class="monto">${fmtMoney(gastoDia)}</span>
        </div>` : ''}
      ${!eventos.length && !movs.length
        ? '<p class="texto-suave centrado">día tranquilo, sin nada apuntado 😌</p>'
        : ''}`,
  });
}

/* =========================================================================
   Render
   ========================================================================= */

export function render(el) {
  const mes = store.getMes();
  const hoy = hoyISO();
  const totalDias = diasEnMes(mes);
  const offset = diaSemanaLunes0(`${mes}-01`);
  const eventos = store.eventosDelMes(mes);
  const movs = store.movimientosDelMes(mes);

  // Suma de gastos y presencia de movimientos, por día del mes.
  const gastosPorDia = new Map();
  const diasConMovs = new Set();
  for (const m of movs) {
    const d = diaDe(m.fecha);
    diasConMovs.add(d);
    if (m.tipo === 'gasto') gastosPorDia.set(d, (gastosPorDia.get(d) || 0) + m.monto);
  }

  // Eventos de deuda por día del mes.
  const eventosPorDia = new Map();
  for (const ev of eventos) {
    const d = diaDe(ev.fecha);
    if (!eventosPorDia.has(d)) eventosPorDia.set(d, []);
    eventosPorDia.get(d).push(ev);
  }

  // ---- Celdas del grid ----
  const celdas = [];
  for (let i = 0; i < offset; i += 1) {
    celdas.push('<div class="cal-celda fuera" aria-hidden="true"></div>');
  }
  for (let d = 1; d <= totalDias; d += 1) {
    const fecha = fechaISO(mes, d);
    const esHoy = fecha === hoy; // solo puede pasar en el mes actual
    const gasto = gastosPorDia.get(d) || 0;
    const evs = eventosPorDia.get(d) || [];
    const conContenido = gasto > 0 || evs.length > 0 || diasConMovs.has(d);

    // Máximo 3 marcadores visibles; el resto se asoma como "+N".
    const marcas = evs.slice(0, 3).map(marcadorEvento).join('')
      + (evs.length > 3 ? `<span class="cal-x-mas">+${evs.length - 3}</span>` : '');

    const cuerpo = `
      <span class="cal-num">${d}</span>
      ${gasto > 0 ? `<span class="cal-x-gasto texto-suave">${fmtMoneyCorto(gasto)}</span>` : ''}
      ${evs.length ? `<span class="cal-x-marcas">${marcas}</span>` : ''}`;

    if (conContenido) {
      const detalle = [
        gasto > 0 ? `Gastos: ${fmtMoney(gasto)}` : '',
        ...evs.map((ev) =>
          ev.etiqueta
          + (ev.monto != null ? ` (${fmtMoney(ev.monto)})` : '')
          + (ev.pagado ? ' ✓ ya pagado' : '')),
      ].filter(Boolean).join(' · ');
      celdas.push(`
        <button type="button" class="cal-celda cal-x-tap${esHoy ? ' hoy' : ''}"
          data-fecha="${fecha}" title="${escapeHtml(detalle)}"
          aria-label="Ver el detalle del ${escapeHtml(fechaLarga(fecha))}">${cuerpo}</button>`);
    } else {
      celdas.push(`<div class="cal-celda${esHoy ? ' hoy' : ''}">${cuerpo}</div>`);
    }
  }
  const sobrantes = (7 - ((offset + totalDias) % 7)) % 7;
  for (let i = 0; i < sobrantes; i += 1) {
    celdas.push('<div class="cal-celda fuera" aria-hidden="true"></div>');
  }

  // ---- Lista "lo que viene este mes" ----
  const listaEventos = eventos.length
    ? `<div class="lista">${eventos.map((ev) => filaEvento(ev)).join('')}</div>`
    : store.deudasActivas().length
      ? '<p class="texto-suave centrado">nada agendado este mes 🎉</p>'
      : vacio({
        emoji: '🗓️',
        titulo: 'sin fechas de pago aún',
        texto: 'Registra tus deudas y aquí verás sus cortes y días de pago, sin sorpresas.',
        boton: '<a class="btn btn-suave" href="#/deudas">💪 ir a deudas</a>',
      });

  el.innerHTML = `
    <section class="card cal-x-card">
      <div class="card-encabezado">
        <h2 class="card-titulo">tu mes de un vistazo</h2>
      </div>
      <div class="cal" data-cal-grid>
        ${DIAS_SEMANA_CORTOS.map((dia) => `<div class="cal-dia-nombre">${dia}</div>`).join('')}
        ${celdas.join('')}
      </div>
      <p class="cal-x-leyenda">✂️ corte de tarjeta · 💪 día de pago · ✓ ya pagado</p>
    </section>

    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">lo que viene este mes</h2>
      </div>
      ${listaEventos}
    </section>`;

  // Un solo listener delegado en el grid recién creado (nada en document/window).
  el.querySelector('[data-cal-grid]').addEventListener('click', (e) => {
    const celda = e.target.closest('[data-fecha]');
    if (celda) abrirDetalleDia(celda.dataset.fecha);
  });
}
