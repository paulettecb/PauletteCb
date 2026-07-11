// Componentes compartidos de Lana: modal, confirmación, toast, quick-add y
// pedacitos de HTML que usan todas las vistas.
//
// CONTRATO PARA LAS VISTAS:
//   abrirModal({ titulo, cuerpo, alAbrir }) / cerrarModal()
//   confirmar(mensaje, { textoBoton }) → Promise<boolean>
//   toast(mensaje), toastError(mensaje)
//   abrirQuickAdd(tipoInicial)      ← el FAB y los botones "agregar" llaman esto
//   campoMonto(nombre, { valor, etiqueta, autofocus }) + leerMonto(form, nombre)
//   barra(pctNum, umbrales) · burbujaCat(cat) · chipsCategorias(catSel)
//   vacio({ emoji, titulo, texto, boton })
//   emojiDeuda(tipo) · nombreTipoDeuda(tipo)

import * as store from './store.js';
import {
  fmtMoney, parseMoney, hoyISO, escapeHtml, pct as pctUtil,
} from './utils.js';

/* =========================================================================
   Modal
   ========================================================================= */

let modalAbierto = null;

export function cerrarModal() {
  if (!modalAbierto) return;
  modalAbierto.remove();
  modalAbierto = null;
  document.removeEventListener('keydown', alTeclearEsc);
}

function alTeclearEsc(e) {
  if (e.key === 'Escape') cerrarModal();
}

// cuerpo: string HTML. alAbrir(el) recibe el nodo del modal para wirear eventos.
export function abrirModal({ titulo, cuerpo, alAbrir }) {
  cerrarModal();
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(titulo)}">
      <div class="modal-encabezado">
        <div class="modal-titulo">${escapeHtml(titulo)}</div>
        <button class="btn-icono" data-cerrar aria-label="Cerrar">✕</button>
      </div>
      <div class="modal-cuerpo">${cuerpo}</div>
    </div>`;
  fondo.addEventListener('click', (e) => {
    if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrarModal();
  });
  document.getElementById('modales').appendChild(fondo);
  document.addEventListener('keydown', alTeclearEsc);
  modalAbierto = fondo;
  const primerInput = fondo.querySelector('input, select, textarea');
  if (primerInput) setTimeout(() => primerInput.focus(), 60);
  if (alAbrir) alAbrir(fondo.querySelector('.modal'));
  return fondo;
}

export function confirmar(mensaje, { textoBoton = 'Sí, seguro' } = {}) {
  return new Promise((resolver) => {
    abrirModal({
      titulo: 'Un momento',
      cuerpo: `
        <p class="texto-secundario">${escapeHtml(mensaje)}</p>
        <div class="fila mt-2" style="justify-content: flex-end">
          <button class="btn btn-fantasma" data-no>Mejor no</button>
          <button class="btn btn-peligro" data-si>${escapeHtml(textoBoton)}</button>
        </div>`,
      alAbrir(el) {
        el.querySelector('[data-no]').addEventListener('click', () => { cerrarModal(); resolver(false); });
        el.querySelector('[data-si]').addEventListener('click', () => { cerrarModal(); resolver(true); });
      },
    });
  });
}

/* =========================================================================
   Toast
   ========================================================================= */

export function toast(mensaje, tipo = 'ok') {
  const nodo = document.createElement('div');
  nodo.className = `toast${tipo === 'error' ? ' toast-error' : ''}`;
  nodo.textContent = mensaje;
  document.getElementById('toasts').appendChild(nodo);
  setTimeout(() => {
    nodo.style.opacity = '0';
    nodo.style.transition = 'opacity 300ms';
    setTimeout(() => nodo.remove(), 320);
  }, 2400);
}

export const toastError = (m) => toast(m, 'error');

/* =========================================================================
   Piezas de HTML
   ========================================================================= */

export function campoMonto(nombre, { valor = null, etiqueta = 'Monto', autofocus = false, ayuda = '' } = {}) {
  const v = valor != null ? (valor / 100).toFixed(2).replace(/\.00$/, '') : '';
  return `
    <div class="campo campo-monto">
      <label for="campo-${nombre}">${escapeHtml(etiqueta)}</label>
      <input id="campo-${nombre}" name="${nombre}" type="text" inputmode="decimal"
        placeholder="$0.00" value="${escapeHtml(v)}" ${autofocus ? 'autofocus' : ''}
        autocomplete="off" />
      ${ayuda ? `<span class="ayuda">${escapeHtml(ayuda)}</span>` : ''}
    </div>`;
}

// Lee un campo de monto de un <form>. → centavos o null si está vacío/inválido.
export function leerMonto(form, nombre) {
  return parseMoney(new FormData(form).get(nombre));
}

export function campoFecha(nombre, { valor = hoyISO(), etiqueta = 'Fecha' } = {}) {
  return `
    <div class="campo">
      <label for="campo-${nombre}">${escapeHtml(etiqueta)}</label>
      <input id="campo-${nombre}" name="${nombre}" type="date" value="${escapeHtml(valor)}" />
    </div>`;
}

export function campoTexto(nombre, { valor = '', etiqueta = 'Nota', placeholder = '' } = {}) {
  return `
    <div class="campo">
      <label for="campo-${nombre}">${escapeHtml(etiqueta)}</label>
      <input id="campo-${nombre}" name="${nombre}" type="text" value="${escapeHtml(valor)}"
        placeholder="${escapeHtml(placeholder)}" maxlength="200" autocomplete="off" />
    </div>`;
}

// Barra de progreso con semáforo automático: <80 ok, 80–100 alerta, >100 peligro.
export function barra(pctNum, { semaforo = true } = {}) {
  const clase = !semaforo ? '' : pctNum > 100 ? ' peligro' : pctNum >= 80 ? ' alerta' : ' ok';
  const ancho = Math.max(0, Math.min(100, pctNum));
  return `<div class="barra${clase}"><span style="width:${ancho}%"></span></div>`;
}

export function burbujaCat(cat) {
  const c = cat || { emoji: '❔', color: 'mint' };
  return `<span class="burbuja tono-${escapeHtml(c.color)}">${escapeHtml(c.emoji)}</span>`;
}

// Chips seleccionables de categorías (para formularios). data-cat-id en cada chip.
export function chipsCategorias(catSeleccionada = null, { incluirDeudas = false } = {}) {
  const cats = store.getState().categorias.filter((c) => incluirDeudas || !c.fija);
  return `
    <div class="chips" data-chips-categorias>
      ${cats.map((c) => `
        <button type="button" class="chip${c.id === catSeleccionada ? ' activa' : ''}" data-cat-id="${escapeHtml(c.id)}">
          ${escapeHtml(c.emoji)} ${escapeHtml(c.nombre)}
        </button>`).join('')}
    </div>`;
}

// Activa el comportamiento de selección única en un contenedor de chips.
export function wirearChips(contenedor) {
  contenedor.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    contenedor.querySelectorAll('.chip').forEach((c) => c.classList.remove('activa'));
    chip.classList.add('activa');
  });
}

export function chipSeleccionado(contenedor) {
  return contenedor.querySelector('.chip.activa')?.dataset.catId || null;
}

export function vacio({ emoji, titulo, texto, boton = '' }) {
  return `
    <div class="vacio">
      <span class="vacio-emoji">${emoji}</span>
      <span class="vacio-titulo">${escapeHtml(titulo)}</span>
      <p>${escapeHtml(texto)}</p>
      ${boton}
    </div>`;
}

export const emojiDeuda = (tipo) => store.TIPOS_DEUDA[tipo]?.emoji || '💳';
export const nombreTipoDeuda = (tipo) => store.TIPOS_DEUDA[tipo]?.nombre || tipo;

/* =========================================================================
   Quick-add: la puerta de entrada de casi todos los datos
   ========================================================================= */

// tipoInicial: 'gasto' | 'ingreso' | 'pago'
export function abrirQuickAdd(tipoInicial = 'gasto') {
  let tipo = tipoInicial;
  const deudas = store.deudasActivas();
  if (tipo === 'pago' && !deudas.length) tipo = 'gasto';

  const cuerpoPara = (t) => {
    if (t === 'pago') {
      return `
        ${campoMonto('monto', { autofocus: true })}
        <div class="campo">
          <label for="campo-deuda">¿A cuál deuda?</label>
          <select id="campo-deuda" name="deudaId">
            ${deudas.map((d) => `
              <option value="${escapeHtml(d.id)}">
                ${emojiDeuda(d.tipo)} ${escapeHtml(d.nombre)} · debe ${fmtMoney(store.saldoPendiente(d))}
              </option>`).join('')}
          </select>
        </div>
        <div class="form-fila">${campoFecha('fecha')}${campoTexto('nota', { placeholder: 'opcional' })}</div>`;
    }
    if (t === 'ingreso') {
      return `
        ${campoMonto('monto', { autofocus: true })}
        <div class="form-fila">${campoFecha('fecha')}${campoTexto('nota', { etiqueta: 'De dónde', placeholder: 'sueldo, venta…' })}</div>`;
    }
    return `
      ${campoMonto('monto', { autofocus: true })}
      <div class="campo">
        <label>Categoría</label>
        ${chipsCategorias('cat-comida')}
      </div>
      <div class="form-fila">${campoFecha('fecha')}${campoTexto('nota', { placeholder: 'opcional' })}</div>`;
  };

  abrirModal({
    titulo: 'Agregar',
    cuerpo: `
      <div class="segmentos" data-tipos>
        <button type="button" class="segmento${tipo === 'gasto' ? ' activa' : ''}" data-tipo="gasto">💸 Gasto</button>
        <button type="button" class="segmento${tipo === 'ingreso' ? ' activa' : ''}" data-tipo="ingreso">💰 Ingreso</button>
        ${deudas.length ? `<button type="button" class="segmento${tipo === 'pago' ? ' activa' : ''}" data-tipo="pago">💪 Pago deuda</button>` : ''}
      </div>
      <form class="mt-2" data-form-quickadd>
        <div data-cuerpo-form>${cuerpoPara(tipo)}</div>
        <button class="btn btn-primario btn-bloque mt-1" type="submit">Guardar</button>
      </form>`,
    alAbrir(el) {
      const form = el.querySelector('[data-form-quickadd]');
      const cuerpoForm = el.querySelector('[data-cuerpo-form]');
      const wirear = () => {
        const chips = cuerpoForm.querySelector('[data-chips-categorias]');
        if (chips) wirearChips(chips);
        const inputMonto = cuerpoForm.querySelector('input[name="monto"]');
        if (inputMonto) setTimeout(() => inputMonto.focus(), 60);
      };
      wirear();

      el.querySelector('[data-tipos]').addEventListener('click', (e) => {
        const seg = e.target.closest('[data-tipo]');
        if (!seg) return;
        tipo = seg.dataset.tipo;
        el.querySelectorAll('[data-tipo]').forEach((s) => s.classList.toggle('activa', s === seg));
        cuerpoForm.innerHTML = cuerpoPara(tipo);
        wirear();
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = leerMonto(form, 'monto');
        if (!monto || monto <= 0) {
          toastError('Ponle un monto válido 🙏');
          return;
        }
        const datos = new FormData(form);
        const fecha = datos.get('fecha') || hoyISO();
        const nota = datos.get('nota') || '';
        if (tipo === 'pago') {
          const pago = store.registrarPagoDeuda(datos.get('deudaId'), { monto, fecha, nota });
          if (!pago) {
            toastError('Esa deuda ya no existe 😅 refresca e intenta de nuevo');
            return;
          }
          toast('Pago registrado 💪');
        } else if (tipo === 'ingreso') {
          store.agregarMovimiento({ tipo: 'ingreso', monto, fecha, nota });
          toast('Ingreso guardado 💰');
        } else {
          const chips = cuerpoForm.querySelector('[data-chips-categorias]');
          store.agregarMovimiento({
            tipo: 'gasto', monto, fecha, nota,
            categoriaId: chips ? chipSeleccionado(chips) : null,
          });
          toast('Gasto guardado ✓');
        }
        cerrarModal();
      });
    },
  });
}
