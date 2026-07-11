// movimientos.js — el diario de dinero de Lana 🧾
// Contrato: export function render(el). main.js re-renderiza la vista completa
// en cada cambio de estado o de mes. Los filtros viven en variables de módulo
// para sobrevivir esos re-renders; la búsqueda re-pinta SOLO la lista para no
// perder el foco del input mientras escribes.

import * as store from '../store.js';
import {
  abrirModal, cerrarModal, confirmar, toast, toastError, abrirQuickAdd,
  campoMonto, leerMonto, campoFecha, campoTexto,
  chipsCategorias, wirearChips, chipSeleccionado, burbujaCat, vacio,
} from '../components.js';
import { fmtMoney, escapeHtml, etiquetaRelativa } from '../utils.js';

/* =========================================================================
   Estado de UI (variables de módulo: sobreviven re-renders)
   ========================================================================= */

let filtroTipo = 'todos'; // 'todos' | 'gastos' | 'ingresos'
let textoBusqueda = '';

const SEGMENTOS = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'gastos', etiqueta: '💸 Gastos' },
  { id: 'ingresos', etiqueta: '💰 Ingresos' },
];

/* =========================================================================
   Render principal
   ========================================================================= */

export function render(el) {
  const movsDelMes = store.movimientosDelMes();

  // Vacío total del mes: invitación amable, sin números en cero.
  if (!movsDelMes.length) {
    el.innerHTML = `
      <section class="seccion">
        ${vacio({
          emoji: '🌱',
          titulo: 'aún no apuntas nada este mes',
          texto: 'Apunta tu primer gasto o ingreso y aquí se va armando tu diario de dinero.',
          boton: '<button type="button" class="btn btn-primario" data-vacio-add>＋ apuntar mi primero</button>',
        })}
      </section>`;
    el.querySelector('[data-vacio-add]').addEventListener('click', () => abrirQuickAdd('gasto'));
    return;
  }

  const { ingresos, gastos, balance } = store.totalesDelMes();
  const claseBalance = balance < 0 ? 'negativo' : balance > 0 ? 'positivo' : 'neutro';

  el.innerHTML = `
    <section class="seccion">
      <div class="card">
        <h2 class="card-titulo">tu mes en números</h2>
        <div class="grid-3 mt-1">
          <div>
            <div class="card-titulo">entró</div>
            <div class="monto-grande">${fmtMoney(ingresos)}</div>
          </div>
          <div>
            <div class="card-titulo">salió</div>
            <div class="monto-grande">${fmtMoney(gastos)}</div>
          </div>
          <div>
            <div class="card-titulo">balance</div>
            <div class="monto-grande ${claseBalance}">${balance > 0 ? '+' : ''}${fmtMoney(balance)}</div>
          </div>
        </div>
        <div class="fila mt-2">
          <button type="button" class="btn btn-suave" data-add-gasto>＋ gasto</button>
          <button type="button" class="btn btn-suave" data-add-ingreso>＋ ingreso</button>
        </div>
      </div>

      <div class="card">
        <div class="card-encabezado">
          <h2 class="card-titulo">tu diario de dinero</h2>
        </div>
        <div class="segmentos" data-filtros>
          ${SEGMENTOS.map((s) => `
            <button type="button" class="segmento${filtroTipo === s.id ? ' activa' : ''}"
              data-filtro="${s.id}">${s.etiqueta}</button>`).join('')}
        </div>
        <div class="campo mt-2">
          <label for="mov-busqueda">buscar</label>
          <input id="mov-busqueda" type="search" data-busqueda
            value="${escapeHtml(textoBusqueda)}"
            placeholder="nota o categoría, ej. café" autocomplete="off" />
        </div>
        <div data-lista>${htmlLista()}</div>
      </div>
    </section>`;

  // Listeners SOLO en nodos recién creados (nada en document/window/el).
  el.querySelector('[data-add-gasto]').addEventListener('click', () => abrirQuickAdd('gasto'));
  el.querySelector('[data-add-ingreso]').addEventListener('click', () => abrirQuickAdd('ingreso'));

  el.querySelector('[data-filtros]').addEventListener('click', (e) => {
    const seg = e.target.closest('[data-filtro]');
    if (!seg) return;
    filtroTipo = seg.dataset.filtro;
    render(el);
  });

  // Búsqueda en vivo: guarda el texto y re-pinta SOLO la lista (el listener de
  // la lista es delegado en su contenedor, así que sobrevive al repintado).
  const inputBusqueda = el.querySelector('[data-busqueda]');
  inputBusqueda.addEventListener('input', () => {
    textoBusqueda = inputBusqueda.value;
    el.querySelector('[data-lista]').innerHTML = htmlLista();
  });

  el.querySelector('[data-lista]').addEventListener('click', (e) => {
    if (e.target.closest('[data-limpiar]')) {
      filtroTipo = 'todos';
      textoBusqueda = '';
      render(el);
      return;
    }
    const fila = e.target.closest('[data-mov-id]');
    if (fila) abrirEdicion(fila.dataset.movId);
  });
}

/* =========================================================================
   Lista agrupada por fecha
   ========================================================================= */

function movimientosFiltrados() {
  let movs = store.movimientosDelMes();
  if (filtroTipo === 'gastos') movs = movs.filter((m) => m.tipo === 'gasto');
  if (filtroTipo === 'ingresos') movs = movs.filter((m) => m.tipo === 'ingreso');
  const q = textoBusqueda.trim().toLowerCase();
  if (q) {
    movs = movs.filter((m) => {
      const cat = m.categoriaId ? store.categoriaDe(m.categoriaId) : null;
      return (m.nota || '').toLowerCase().includes(q)
        || (cat?.nombre || '').toLowerCase().includes(q);
    });
  }
  return movs;
}

function htmlLista() {
  const movs = movimientosFiltrados();

  if (!movs.length) {
    // Hay movimientos en el mes, pero el filtro no encontró nada.
    return `<div class="mt-2">${vacio({
      emoji: '🔍',
      titulo: 'no encontré nada',
      texto: 'Prueba con otra palabra o quita los filtros.',
      boton: '<button type="button" class="btn btn-fantasma btn-chico" data-limpiar>limpiar filtros</button>',
    })}</div>`;
  }

  // Agrupar por fecha conservando el orden (ya vienen ordenados desc).
  const grupos = [];
  for (const m of movs) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === m.fecha) ultimo.movs.push(m);
    else grupos.push({ fecha: m.fecha, movs: [m] });
  }

  return grupos.map((g) => `
    <div class="fecha-grupo">${escapeHtml(etiquetaRelativa(g.fecha))}</div>
    <div class="lista">${g.movs.map(filaMov).join('')}</div>`).join('');
}

function filaMov(m) {
  const esIngreso = m.tipo === 'ingreso';
  const cat = m.categoriaId ? store.categoriaDe(m.categoriaId) : null;
  const deuda = m.deudaId ? store.deudaDe(m.deudaId) : null;
  const nombreCat = cat ? cat.nombre : 'Sin categoría';

  const burbuja = esIngreso
    ? '<span class="burbuja tono-mint">💰</span>'
    : burbujaCat(cat); // pagos de deuda ya traen la categoría fija 💪

  let titulo;
  const partesDetalle = [];
  if (esIngreso) {
    titulo = m.nota || 'Ingreso';
    if (m.nota) partesDetalle.push('Ingreso');
  } else {
    titulo = m.nota || nombreCat;
    if (m.nota) partesDetalle.push(nombreCat);
    if (deuda) partesDetalle.push(deuda.nombre);
  }
  const detalle = partesDetalle.join(' · ');

  const monto = esIngreso
    ? `<span class="monto positivo">+${fmtMoney(m.monto)}</span>`
    : `<span class="monto">${fmtMoney(m.monto)}</span>`;

  return `
    <button type="button" class="item-mov" data-mov-id="${escapeHtml(m.id)}">
      ${burbuja}
      <span class="mov-info">
        <span class="mov-titulo" style="display:block">${escapeHtml(titulo)}</span>
        ${detalle ? `<span class="mov-detalle" style="display:block">${escapeHtml(detalle)}</span>` : ''}
      </span>
      ${monto}
    </button>`;
}

/* =========================================================================
   Modal de edición
   ========================================================================= */

function abrirEdicion(id) {
  const mov = store.getState().movimientos.find((m) => m.id === id);
  if (!mov) return;

  const esIngreso = mov.tipo === 'ingreso';
  const deuda = mov.deudaId ? store.deudaDe(mov.deudaId) : null;
  const nombreDeuda = deuda ? deuda.nombre : 'tu deuda';

  abrirModal({
    titulo: mov.deudaId ? 'Editar pago de deuda' : esIngreso ? 'Editar ingreso' : 'Editar gasto',
    cuerpo: `
      <form data-form-editar>
        ${campoMonto('monto', { valor: mov.monto, autofocus: true })}
        <div class="form-fila">
          ${campoFecha('fecha', { valor: mov.fecha })}
          ${campoTexto('nota', { valor: mov.nota, placeholder: 'opcional' })}
        </div>
        ${mov.deudaId
          ? `<p class="texto-suave">💪 Este pago está ligado a <strong>${escapeHtml(nombreDeuda)}</strong>; si cambias el monto, el saldo se ajusta solo.</p>`
          : `<div class="campo">
               <label>Categoría</label>
               ${chipsCategorias(mov.categoriaId)}
             </div>`}
        <div class="fila mt-2" style="justify-content: space-between">
          <button type="button" class="btn btn-peligro" data-borrar>🗑 Borrar</button>
          <button type="submit" class="btn btn-primario">Guardar</button>
        </div>
      </form>`,
    alAbrir(modal) {
      const form = modal.querySelector('[data-form-editar]');
      const chips = form.querySelector('[data-chips-categorias]');
      if (chips) wirearChips(chips);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = leerMonto(form, 'monto');
        if (!monto || monto <= 0) {
          toastError('Ponle un monto válido 🙏');
          return;
        }
        const datos = new FormData(form);
        const cambios = {
          monto,
          fecha: datos.get('fecha') || mov.fecha,
          nota: datos.get('nota') || '',
        };
        if (chips) cambios.categoriaId = chipSeleccionado(chips);
        store.editarMovimiento(mov.id, cambios);
        cerrarModal();
        toast('Cambios guardados ✓');
      });

      modal.querySelector('[data-borrar]').addEventListener('click', async () => {
        const mensaje = mov.deudaId
          ? `¿Borramos este pago? Se revierte su efecto: el saldo de ${nombreDeuda} vuelve a subir, como si el pago nunca hubiera pasado.`
          : '¿Borramos este movimiento? Esto no se puede deshacer.';
        const si = await confirmar(mensaje, { textoBoton: 'Sí, bórralo' });
        if (si) {
          store.borrarMovimiento(mov.id);
          toast('Movimiento borrado 🗑');
        } else {
          // "Mejor no": reabrimos la edición para no perder el contexto.
          abrirEdicion(mov.id);
        }
      });
    },
  });
}
