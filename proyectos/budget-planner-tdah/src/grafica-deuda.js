// Gráfica "así va tu deuda" — SVG inline, sin librerías (regla del repo: cero deps).
// Es UNA sola cantidad (tu deuda total) en el tiempo, partida en dos tramos:
//   · lo REAL: línea sólida periwinkle (puede subir — así es la vida)
//   · la PROYECCIÓN: línea punteada, si sigues pagando lo de siempre, hasta $0
// Un solo tono (periwinkle) + estilo de línea como segunda codificación; nada de
// arcoíris. Los textos van en tinta, nunca del color de la serie.

import { fmtMoney, fmtMoneyCorto, nombreMes, escapeHtml } from './utils.js';

const mesIdx = (k) => {
  const [a, m] = k.split('-').map(Number);
  return a * 12 + (m - 1);
};

// 'jul 26' para las marcas del eje (compacto para móvil de 360px)
const MESES_MINI = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function mesEje(k) {
  const [a, m] = k.split('-').map(Number);
  return `${MESES_MINI[m - 1]} ${String(a).slice(2)}`;
}

// Lienzo (viewBox fijo; el SVG escala al 100% del ancho del contenedor).
const W = 340;
const H = 188;
const PAD = { l: 12, r: 12, t: 24, b: 26 };
const PW = W - PAD.l - PAD.r;
const PH = H - PAD.t - PAD.b;
const BASE_Y = PAD.t + PH;
const r2 = (n) => Math.round(n * 10) / 10;

// serie: { historia:[{mesKey,total}], proyeccion:[{mesKey,total}], totalHoy, alcanzable }
export function graficaDeudaHTML(serie) {
  const { historia, proyeccion, totalHoy, alcanzable } = serie;

  // Punto único y sin proyección: aún no hay tramo que dibujar.
  const dibujable = historia.length >= 2 || proyeccion.length >= 2;
  if (!dibujable) {
    return `
      <div class="gd-vacio">
        <div class="card-titulo">hoy debes</div>
        <div class="monto-grande">${fmtMoney(totalHoy)}</div>
        <p class="texto-suave mt-1">
          Aquí vas a ver tu deuda mes a mes. ${alcanzable
            ? 'Vuelve el próximo mes para el primer tramo 📈'
            : 'Cuando tu plan sea alcanzable, aquí verás la bajada.'}
        </p>
      </div>`;
  }

  const todos = historia.concat(proyeccion);
  const idxs = todos.map((p) => mesIdx(p.mesKey));
  const xMin = Math.min(...idxs);
  const xMax = Math.max(...idxs);
  const yMax = Math.max(...todos.map((p) => p.total), 1) * 1.12;

  const x = (k) => (xMax === xMin ? PAD.l + PW / 2 : PAD.l + ((mesIdx(k) - xMin) / (xMax - xMin)) * PW);
  const y = (v) => PAD.t + (1 - v / yMax) * PH;
  const XY = (p) => `${r2(x(p.mesKey))},${r2(y(p.total))}`;

  // --- Tramo real: área suave + línea sólida ---
  let areaReal = '';
  let lineaReal = '';
  if (historia.length >= 1) {
    const pts = historia.map(XY).join(' ');
    if (historia.length >= 2) {
      const x0 = r2(x(historia[0].mesKey));
      const xN = r2(x(historia[historia.length - 1].mesKey));
      areaReal = `<path class="gd-area" d="M ${x0},${BASE_Y} L ${historia.map(XY).join(' L ')} L ${xN},${BASE_Y} Z" />`;
      lineaReal = `<polyline class="gd-linea-real" points="${pts}" />`;
    }
  }

  // --- Tramo proyección: línea punteada (arranca donde termina lo real) ---
  const lineaProy = proyeccion.length >= 2
    ? `<polyline class="gd-linea-proy" points="${proyeccion.map(XY).join(' ')}" />`
    : '';

  // Ancla un texto según qué tan cerca esté de los bordes (para no cortarse).
  const anclaEn = (px) => (px < 44 ? 'start' : px > W - 44 ? 'end' : 'middle');

  // --- Marcadores clave: "hoy" y la fecha de libertad ---
  const hoyP = historia[historia.length - 1];
  const hoyX = x(hoyP.mesKey);
  const marcaHoy = `
    <circle class="gd-marca gd-marca-hoy" cx="${r2(hoyX)}" cy="${r2(y(hoyP.total))}" r="4.5" />
    <text class="gd-valor-hoy" x="${r2(hoyX)}" y="${r2(y(hoyP.total)) - 9}"
      text-anchor="${anclaEn(hoyX)}">${escapeHtml(fmtMoneyCorto(hoyP.total))}</text>`;

  let marcaLibre = '';
  if (proyeccion.length >= 2) {
    const fin = proyeccion[proyeccion.length - 1];
    marcaLibre = `
      <circle class="gd-marca gd-marca-libre" cx="${r2(x(fin.mesKey))}" cy="${r2(y(fin.total))}" r="4.5" />
      <text class="gd-libre" x="${r2(x(fin.mesKey))}" y="${r2(y(fin.total)) - 9}" text-anchor="end">✓ libre</text>`;
  }

  // --- Marcas del eje X con anti-colisión ---
  // Cuando la proyección es larga, el historial real queda comprimido a la
  // izquierda y sus etiquetas se encalladan. Prioridad: fin > hoy > inicio;
  // se salta la que caiga a menos de 48 unidades de una ya puesta.
  const ticks = [];
  const finProy = proyeccion.length >= 2 ? proyeccion[proyeccion.length - 1] : null;
  const candidatos = [];
  if (finProy) candidatos.push(finProy);
  if (historia.length >= 2) candidatos.push(hoyP);
  candidatos.push(historia[0]);
  const colocadosX = [];
  for (const p of candidatos) {
    const px = x(p.mesKey);
    if (colocadosX.some((qx) => Math.abs(qx - px) < 48)) continue;
    colocadosX.push(px);
    ticks.push(`<text class="gd-eje" x="${r2(px)}" y="${H - 8}" text-anchor="${anclaEn(px)}">${escapeHtml(mesEje(p.mesKey))}</text>`);
  }

  // --- Puntos "sensibles" para el tooltip (invisibles, hit grande) ---
  const hits = todos
    .map((p, i) => `<circle class="gd-hit" cx="${r2(x(p.mesKey))}" cy="${r2(y(p.total))}" r="10"
      data-mes="${escapeHtml(p.mesKey)}" data-total="${p.total}" data-proy="${i >= historia.length ? '1' : '0'}" tabindex="0" />`)
    .join('');

  // --- Accesibilidad: resumen + tabla de números ---
  const primerReal = historia[0];
  const resumen = `Tu deuda: ${fmtMoney(primerReal.total)} en ${nombreMes(primerReal.mesKey)}, `
    + `${fmtMoney(totalHoy)} hoy`
    + (finProy ? `; si sigues tu plan, $0 en ${nombreMes(finProy.mesKey)}.` : '.');

  const filasTabla = historia.map((p) => `<tr><td>${escapeHtml(nombreMes(p.mesKey))}</td><td>${escapeHtml(fmtMoney(p.total))}</td><td>real</td></tr>`)
    .concat(proyeccion.slice(1).map((p) => `<tr><td>${escapeHtml(nombreMes(p.mesKey))}</td><td>${escapeHtml(fmtMoney(p.total))}</td><td>proyección</td></tr>`))
    .join('');

  return `
    <div class="gd">
      <div class="gd-leyenda">
        <span class="gd-leg"><span class="gd-sw gd-sw-real"></span>lo real</span>
        <span class="gd-leg"><span class="gd-sw gd-sw-proy"></span>si sigues tu plan</span>
      </div>
      <svg class="gd-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(resumen)}" preserveAspectRatio="xMidYMid meet">
        <line class="gd-base" x1="${PAD.l}" y1="${BASE_Y}" x2="${W - PAD.r}" y2="${BASE_Y}" />
        ${areaReal}
        ${lineaProy}
        ${lineaReal}
        ${marcaLibre}
        ${marcaHoy}
        ${ticks.join('')}
        ${hits}
      </svg>
      <p class="gd-cap texto-suave" data-gd-cap aria-live="polite">Toca un punto para ver su mes 👆</p>
      <details class="gd-tabla-wrap">
        <summary class="texto-suave">ver los números</summary>
        <div class="tabla-scroll mt-1">
          <table class="tabla">
            <thead><tr><th>mes</th><th>deuda</th><th>tipo</th></tr></thead>
            <tbody>${filasTabla}</tbody>
          </table>
        </div>
      </details>
    </div>`;
}

// Enchufa el tooltip: al tocar/enfocar un punto, la caption dice mes + monto.
export function wirearGrafica(contenedor) {
  const cap = contenedor.querySelector('[data-gd-cap]');
  if (!cap) return;
  const svg = contenedor.querySelector('.gd-svg');
  if (!svg) return;

  const mostrar = (hit) => {
    const mes = hit.getAttribute('data-mes');
    const total = Number(hit.getAttribute('data-total'));
    const esProy = hit.getAttribute('data-proy') === '1';
    cap.textContent = `${nombreMes(mes)} · ${fmtMoney(total)}${esProy ? ' (proyección)' : ''}`;
    svg.querySelectorAll('.gd-hit-activo').forEach((h) => h.classList.remove('gd-hit-activo'));
    hit.classList.add('gd-hit-activo');
  };

  svg.addEventListener('pointerover', (e) => {
    const hit = e.target.closest('.gd-hit');
    if (hit) mostrar(hit);
  });
  svg.addEventListener('click', (e) => {
    const hit = e.target.closest('.gd-hit');
    if (hit) mostrar(hit);
  });
  svg.addEventListener('focusin', (e) => {
    const hit = e.target.closest('.gd-hit');
    if (hit) mostrar(hit);
  });
}
