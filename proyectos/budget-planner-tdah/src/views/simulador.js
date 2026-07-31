// simulador.js — la tabla del "¿qué pasa si…?" 🔮
// Contrato: export function render(el). main.js re-renderiza la vista completa
// en cada cambio de estado, así que el estado de la simulación (ingreso, gastos,
// pagos que fijaste a mano, compras nuevas) vive en variables de módulo.
//
// Diferencia con el plan de escape: allá decides UN extra mensual y la app
// reparte. Aquí decides mes por mes y deuda por deuda, y ves el efecto en vivo.

import './simulador.css';

import * as store from '../store.js';
import {
  abrirModal, cerrarModal, campoMonto, leerMonto, emojiDeuda, vacio,
} from '../components.js';
import {
  fmtMoney, fmtMoneyCorto, escapeHtml, nombreMes, plural, parseMoney,
} from '../utils.js';

/* =========================================================================
   Estado de UI (sobrevive re-renders; se reinicia al recargar la página)
   ========================================================================= */

let ingreso = null;        // centavos; null = aún no se toca, se usa el ingreso planeado
let gastosVida = 0;        // centavos que NO son deuda
let estrategia = 'avalancha';
let conIva = true;
let horizonte = 24;
let pagosManual = {};      // { 'YYYY-MM': { [deudaId]: centavos } }
let cargos = {};           // { 'YYYY-MM': { [deudaId]: centavos } }

const ESTRATEGIAS = {
  avalancha: '🏔️ la tasa más alta primero — pagas menos intereses',
  bolaDeNieve: '⚪ la más chica primero — victorias rápidas',
};

function ingresoEfectivo() {
  if (ingreso != null) return ingreso;
  return store.getState().ajustes.ingresoPlaneado || 0;
}

function contarAjustes() {
  const p = Object.values(pagosManual).reduce((s, m) => s + Object.keys(m).length, 0);
  const c = Object.values(cargos).reduce((s, m) => s + Object.keys(m).length, 0);
  return { pagos: p, cargos: c };
}

/* =========================================================================
   Render
   ========================================================================= */

export function render(el) {
  const deudas = store.deudasActivas();

  if (!deudas.length) {
    el.innerHTML = `<section class="card">${vacio({
      emoji: '🔮',
      titulo: 'Aquí vas a poder jugar con tus pagos',
      texto: 'Primero agrega tus deudas en la pestaña 💪 Deudas.',
    })}</section>`;
    return;
  }

  const sim = store.simular({
    meses: horizonte,
    ingreso: ingresoEfectivo(),
    gastosVida,
    estrategia,
    conIva,
    pagos: pagosManual,
    cargos,
  });

  const disponible = Math.max(0, ingresoEfectivo() - gastosVida);
  const ajustes = contarAjustes();

  el.innerHTML = `
    ${controlesHTML(disponible, ajustes)}
    ${resumenHTML(sim, deudas)}
    ${tablaHTML(sim, deudas)}
    <p class="sim-nota">
      Lo que escribas aquí <strong>no toca tus deudas reales</strong> — es solo un ensayo.
      Se borra si recargas la página.
    </p>`;

  wirear(el, deudas);
}

function controlesHTML(disponible, ajustes) {
  return `
    <section class="card sim-controles">
      <div class="card-encabezado">
        <h2 class="card-titulo">🔮 ¿Qué pasa si…?</h2>
        ${ajustes.pagos || ajustes.cargos
          ? '<button class="btn btn-chico btn-fantasma" data-limpiar>↺ empezar de cero</button>'
          : ''}
      </div>

      <div class="sim-campos">
        <div class="campo">
          <label for="sim-ingreso">Lo que te entra al mes</label>
          <input id="sim-ingreso" type="text" inputmode="decimal" data-ingreso
            value="${valorMonto(ingresoEfectivo())}" placeholder="0.00" />
        </div>
        <div class="campo">
          <label for="sim-gastos">Lo que gastas en vivir</label>
          <input id="sim-gastos" type="text" inputmode="decimal" data-gastos
            value="${valorMonto(gastosVida)}" placeholder="0.00" />
        </div>
      </div>

      <p class="sim-disponible">
        Te quedan <strong class="${disponible > 0 ? 'positivo' : 'negativo'}">${fmtMoney(disponible)}</strong> al mes para deudas
      </p>

      <div class="chips mt-2">
        ${Object.entries(ESTRATEGIAS).map(([id, txt]) => `
          <button class="chip${id === estrategia ? ' activo' : ''}" data-estrategia="${id}">
            ${escapeHtml(txt)}
          </button>`).join('')}
      </div>

      <div class="sim-fila-extra">
        <label class="sim-check">
          <input type="checkbox" data-iva ${conIva ? 'checked' : ''} />
          <span>Cobrar IVA sobre intereses (así lo hace tu banco)</span>
        </label>
        <label class="sim-check">
          <span>Ver</span>
          <select data-horizonte>
            ${[12, 24, 36, 60].map((n) => `
              <option value="${n}"${n === horizonte ? ' selected' : ''}>${n} meses</option>`).join('')}
          </select>
        </label>
      </div>
    </section>`;
}

function resumenHTML(sim, deudas) {
  const hoy = deudas.reduce((s, d) => s + store.saldoPendiente(d), 0);
  const ultimo = sim.filas[sim.filas.length - 1];

  return `
    <section class="card sim-resumen">
      <div class="sim-resumen-grid">
        <div>
          <p class="eyebrow">debes hoy</p>
          <p class="monto-grande">${fmtMoney(hoy)}</p>
        </div>
        <div>
          <p class="eyebrow">${sim.alcanzable ? 'quedas libre' : `en ${sim.mesesUsados} meses aún debes`}</p>
          <p class="monto-grande ${sim.alcanzable ? 'positivo' : 'negativo'}">
            ${sim.alcanzable ? escapeHtml(nombreMes(ultimo.mesKey)) : fmtMoney(ultimo.total)}
          </p>
        </div>
        <div>
          <p class="eyebrow">intereses</p>
          <p class="monto-grande negativo">${fmtMoney(sim.interesTotal)}</p>
        </div>
        <div>
          <p class="eyebrow">vas a pagar</p>
          <p class="monto-grande">${fmtMoney(sim.pagadoTotal)}</p>
        </div>
      </div>

      ${sim.alcanzable ? '' : `
        <p class="sim-alerta">
          Con este pago no alcanzas a liquidar en ${sim.mesesUsados} ${plural(sim.mesesUsados, 'mes', 'meses')}.
          Súbele a lo que te entra, bájale a lo que gastas, o alarga el horizonte.
        </p>`}

      <ul class="sim-libres">
        ${deudas.map((d) => {
          const mes = sim.liquidadas[d.id];
          return `
            <li>
              <span>${emojiDeuda(d.tipo)} ${escapeHtml(d.nombre)}</span>
              <strong class="${mes ? 'positivo' : 'neutro'}">
                ${mes ? escapeHtml(nombreMes(mes)) : 'no alcanza'}
              </strong>
            </li>`;
        }).join('')}
      </ul>
    </section>`;
}

function tablaHTML(sim, deudas) {
  return `
    <section class="card sim-tabla-card">
      <div class="card-encabezado">
        <h2 class="card-titulo">Mes por mes</h2>
        <p class="texto-secundario">Cambia cualquier pago y todo se recalcula</p>
      </div>

      <div class="sim-scroll">
        <table class="sim-tabla">
          <thead>
            <tr>
              <th class="sim-col-mes">Mes</th>
              ${deudas.map((d) => `
                <th colspan="2" class="sim-th-deuda" title="${escapeHtml(d.nombre)}">
                  ${emojiDeuda(d.tipo)} ${escapeHtml(d.nombre)}
                </th>`).join('')}
              <th>Pagas</th>
              <th>Sobra</th>
              <th>Debes</th>
              <th></th>
            </tr>
            <tr class="sim-subhead">
              <th class="sim-col-mes"></th>
              ${deudas.map(() => '<th>pago</th><th>queda</th>').join('')}
              <th></th><th></th><th></th><th></th>
            </tr>
          </thead>
          <tbody>
            ${sim.filas.map((f) => filaHTML(f, deudas)).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

function filaHTML(fila, deudas) {
  const porId = Object.fromEntries(fila.deudas.map((d) => [d.id, d]));
  return `
    <tr>
      <th class="sim-col-mes">${escapeHtml(nombreMes(fila.mesKey))}</th>
      ${deudas.map((d) => {
        const x = porId[d.id] || { pago: 0, saldo: 0, cargo: 0, manual: false };
        return `
          <td class="sim-celda-pago">
            <input type="text" inputmode="decimal" class="sim-input${x.manual ? ' manual' : ''}"
              data-pago data-mes="${fila.mesKey}" data-deuda="${d.id}"
              value="${valorMonto(x.pago)}" aria-label="Pago a ${escapeHtml(d.nombre)} en ${escapeHtml(nombreMes(fila.mesKey))}" />
            ${x.cargo ? `<span class="sim-cargo" title="compra nueva">+${fmtMoneyCorto(x.cargo)}</span>` : ''}
          </td>
          <td class="sim-saldo ${x.saldo <= 0 ? 'positivo' : ''}">${x.saldo <= 0 ? '✅' : fmtMoneyCorto(x.saldo)}</td>`;
      }).join('')}
      <td class="sim-total">${fmtMoneyCorto(fila.pagoTotal)}</td>
      <td class="${fila.sobra < 0 ? 'negativo' : 'neutro'}">${fmtMoneyCorto(fila.sobra)}</td>
      <td class="sim-total">${fmtMoneyCorto(fila.total)}</td>
      <td>
        <button class="btn-icono sim-mas" data-cargo-mes="${fila.mesKey}"
          title="Agregar una compra nueva en ${escapeHtml(nombreMes(fila.mesKey))}"
          aria-label="Agregar compra en ${escapeHtml(nombreMes(fila.mesKey))}">+</button>
      </td>
    </tr>`;
}

const valorMonto = (centavos) => (centavos ? (centavos / 100).toFixed(2) : '');

/* =========================================================================
   Eventos
   ========================================================================= */

function wirear(el, deudas) {
  const refresca = () => render(el);

  el.querySelector('[data-ingreso]')?.addEventListener('change', (e) => {
    ingreso = parseMoney(e.target.value);
    refresca();
  });
  el.querySelector('[data-gastos]')?.addEventListener('change', (e) => {
    gastosVida = parseMoney(e.target.value);
    refresca();
  });
  el.querySelector('[data-iva]')?.addEventListener('change', (e) => {
    conIva = e.target.checked;
    refresca();
  });
  el.querySelector('[data-horizonte]')?.addEventListener('change', (e) => {
    horizonte = Number(e.target.value) || 24;
    refresca();
  });
  el.querySelector('[data-limpiar]')?.addEventListener('click', () => {
    pagosManual = {};
    cargos = {};
    refresca();
  });

  el.querySelectorAll('[data-estrategia]').forEach((b) => {
    b.addEventListener('click', () => {
      estrategia = b.dataset.estrategia;
      refresca();
    });
  });

  // Fijar el pago de una deuda en un mes: se respeta tal cual y los demás se acomodan.
  // Vaciar la celda la devuelve al reparto automático.
  el.querySelectorAll('[data-pago]').forEach((input) => {
    input.addEventListener('change', () => {
      const { mes, deuda } = input.dataset;
      const txt = input.value.trim();
      if (!txt) {
        if (pagosManual[mes]) {
          delete pagosManual[mes][deuda];
          if (!Object.keys(pagosManual[mes]).length) delete pagosManual[mes];
        }
      } else {
        pagosManual[mes] = pagosManual[mes] || {};
        pagosManual[mes][deuda] = Math.max(0, parseMoney(txt));
      }
      refresca();
    });
  });

  el.querySelectorAll('[data-cargo-mes]').forEach((b) => {
    b.addEventListener('click', () => abrirCargo(b.dataset.cargoMes, deudas, refresca));
  });
}

// Modal de "compra nueva": simula que ese mes gastas algo con una tarjeta.
function abrirCargo(mesKey, deudas, refresca) {
  const previo = cargos[mesKey] || {};
  abrirModal({
    titulo: `Compra nueva en ${nombreMes(mesKey)}`,
    cuerpo: `
      <form data-form-cargo>
        <p class="texto-secundario">Para ver qué pasa si ese mes le cargas algo a una tarjeta.</p>
        <div class="campo mt-2">
          <label for="campo-deuda-cargo">¿A cuál?</label>
          <select id="campo-deuda-cargo" name="deuda">
            ${deudas.map((d) => `
              <option value="${d.id}">${emojiDeuda(d.tipo)} ${escapeHtml(d.nombre)}</option>`).join('')}
          </select>
        </div>
        ${campoMonto('monto', { etiqueta: '¿De cuánto?', autofocus: true })}
        <div class="form-fila mt-2">
          <button type="submit" class="btn btn-primario btn-bloque">Agregar</button>
        </div>
        ${Object.keys(previo).length ? `
          <button type="button" class="btn btn-chico btn-fantasma mt-2" data-quitar-cargos>
            Quitar las compras de este mes
          </button>` : ''}
      </form>`,
    alAbrir(caja) {
      const form = caja.querySelector('[data-form-cargo]');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = leerMonto(form, 'monto');
        const deudaId = String(new FormData(form).get('deuda') || '');
        if (!monto || !deudaId) return;
        cargos[mesKey] = cargos[mesKey] || {};
        cargos[mesKey][deudaId] = (cargos[mesKey][deudaId] || 0) + monto;
        cerrarModal();
        refresca();
      });
      form.querySelector('[data-quitar-cargos]')?.addEventListener('click', () => {
        delete cargos[mesKey];
        cerrarModal();
        refresca();
      });
    },
  });
}
