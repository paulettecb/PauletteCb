// presupuesto.js — el plan de gasto mensual de Cuentas Claras 🎯
// Contrato: export function render(el). main.js re-renderiza la vista completa
// en cada cambio de estado o de mes; los listeners se wirean SOLO en nodos
// recién creados. Los modales viven en #modales: después de mutar el store se
// cierra con cerrarModal() y el re-render hace el resto. Dinero en centavos.

import * as store from '../store.js';
import {
  abrirModal, cerrarModal, confirmar, toast, toastError,
  campoMonto, leerMonto, campoTexto, barra, burbujaCat, vacio, wirearChips,
} from '../components.js';
import { fmtMoney, fmtMoneyCorto, escapeHtml } from '../utils.js';

// Los 6 tonos pastel para categorías propias (el periwinkle es de la fija).
const TONOS = [
  { id: 'blush',  nombre: 'rosita' },
  { id: 'peach',  nombre: 'durazno' },
  { id: 'butter', nombre: 'vainilla' },
  { id: 'mint',   nombre: 'menta' },
  { id: 'sky',    nombre: 'cielito' },
  { id: 'lilac',  nombre: 'lila' },
];

/* =========================================================================
   Render principal
   ========================================================================= */

export function render(el) {
  const topeTotal = store.presupuestoTotal();
  const { gastos } = store.totalesDelMes();
  const { ingresoBase } = store.resumenDelMes();

  // gasto del mes por categoría: Map catId → centavos
  const gastoMap = new Map(store.gastoPorCategoria().map((f) => [f.categoria.id, f.monto]));

  el.innerHTML = `
    <div data-vista-pre>
      <div class="seccion">
        ${topeTotal > 0 ? cardResumen(topeTotal, gastos, ingresoBase) : vacioSinTopes()}
      </div>
      <div class="seccion">${cardTopes(gastoMap)}</div>
      <div class="seccion">${cardCategorias()}</div>
    </div>`;

  // Un solo listener delegado en el nodo raíz recién creado
  // (nunca en document/window/el, que sobreviven al re-render).
  el.querySelector('[data-vista-pre]').addEventListener('click', (e) => {
    const fila = e.target.closest('[data-tope-cat]');
    if (fila) {
      abrirModalTope(fila.dataset.topeCat);
      return;
    }
    const cta = e.target.closest('[data-cta-tope]');
    if (cta) {
      abrirModalTope(cta.dataset.ctaTope);
      return;
    }
    if (e.target.closest('[data-nueva-cat]')) {
      abrirModalCategoria(null);
      return;
    }
    const editar = e.target.closest('[data-editar-cat]');
    if (editar) {
      abrirModalCategoria(editar.dataset.editarCat);
      return;
    }
    const borrar = e.target.closest('[data-borrar-cat]');
    if (borrar) pedirBorrarCategoria(borrar.dataset.borrarCat);
  });
}

/* =========================================================================
   1. Card resumen: tope total vs gastado vs lo que entra
   ========================================================================= */

function cardResumen(topeTotal, gastos, ingresoBase) {
  const pctGlobal = Math.round((gastos / topeTotal) * 100);

  let pill = '<span class="pill pill-ok">dentro del plan 💚</span>';
  if (pctGlobal > 100) pill = '<span class="pill pill-peligro">te pasaste 😵</span>';
  else if (pctGlobal >= 80) pill = '<span class="pill pill-alerta">al límite 👀</span>';

  const lectura = pctGlobal <= 100
    ? `llevas el ${pctGlobal}% de tu tope · te quedan ${fmtMoney(topeTotal - gastos)} del plan`
    : `te pasaste del plan por ${fmtMoney(gastos - topeTotal)}`;

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">tu plan del mes</h2>
        ${pill}
      </div>
      <div class="grid-3">
        <div>
          <div class="card-titulo">tu tope total</div>
          <div class="monto-grande">${fmtMoneyCorto(topeTotal)}</div>
        </div>
        <div>
          <div class="card-titulo">gastado</div>
          <div class="monto-grande">${fmtMoneyCorto(gastos)}</div>
        </div>
        <div>
          <div class="card-titulo">entró</div>
          <div class="monto-grande">${fmtMoneyCorto(ingresoBase)}</div>
        </div>
      </div>
      <div class="mt-2">
        ${barra(pctGlobal)}
        <p class="texto-suave mt-1">${lectura}</p>
      </div>
      ${topeTotal > ingresoBase && ingresoBase > 0
        ? '<p class="texto-suave mt-1">ojo 👀 tu tope total es más de lo que entra al mes</p>'
        : ''}
    </section>`;
}

// 4. Vacío: aún no hay ningún tope puesto.
function vacioSinTopes() {
  const cat = categoriaDondeMasGasta();
  const boton = cat
    ? `<button type="button" class="btn btn-primario" data-cta-tope="${escapeHtml(cat.id)}">
         🎯 ponerle tope a ${escapeHtml(`${cat.emoji} ${cat.nombre}`)}
       </button>`
    : '';
  return vacio({
    emoji: '🎯',
    titulo: 'aún no tienes topes',
    texto: 'Un tope es lo máximo que quieres gastar en una categoría cada mes; yo te voy avisando con semáforo cómo vas.',
    boton,
  });
}

// La categoría (no fija) donde más se gasta este mes; si no hay gasto,
// la primera categoría propia disponible.
function categoriaDondeMasGasta() {
  const fila = store.gastoPorCategoria().find((f) => {
    const cat = store.categoriaDe(f.categoria.id);
    return cat && !cat.fija;
  });
  if (fila) return fila.categoria;
  return store.getState().categorias.find((c) => !c.fija) || null;
}

/* =========================================================================
   2. Card "topes por categoría"
   ========================================================================= */

function cardTopes(gastoMap) {
  const cats = store.getState().categorias;
  const presupuesto = store.getState().presupuesto;
  const noFijas = cats.filter((c) => !c.fija);

  let cuerpo;
  if (!noFijas.length) {
    cuerpo = vacio({
      emoji: '🏷️',
      titulo: 'sin categorías todavía',
      texto: 'Crea tu primera categoría y luego ponle su tope del mes.',
      boton: '<button type="button" class="btn btn-primario" data-nueva-cat>＋ nueva categoría</button>',
    });
  } else {
    // Primero donde ya hay gasto (de mayor a menor), luego el resto.
    const conGasto = noFijas
      .filter((c) => (gastoMap.get(c.id) || 0) > 0)
      .sort((a, b) => (gastoMap.get(b.id) || 0) - (gastoMap.get(a.id) || 0));
    const sinGasto = noFijas.filter((c) => !((gastoMap.get(c.id) || 0) > 0));

    const filas = [...conGasto, ...sinGasto]
      .map((c) => filaTope(c, gastoMap.get(c.id) || 0, presupuesto[c.id] || 0));

    // La fija (pagos de deuda) solo en lectura, y solo si tiene gasto este mes.
    const fija = cats.find((c) => c.fija);
    if (fija && (gastoMap.get(fija.id) || 0) > 0) {
      filas.push(filaFija(fija, gastoMap.get(fija.id)));
    }

    cuerpo = `<div class="lista">${filas.join('')}</div>`;
  }

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">topes por categoría</h2>
        <span class="texto-suave">toca una para ponerle tope</span>
      </div>
      ${cuerpo}
    </section>`;
}

function filaTope(cat, gastado, tope) {
  const pctTope = tope > 0 ? Math.round((gastado / tope) * 100) : 0;

  const derecha = tope > 0
    ? `<span class="derecha">
         <span class="monto">${fmtMoney(tope)}</span>
         <span class="texto-suave" style="display:block">${pctTope}% usado</span>
       </span>`
    : '<span class="pill pill-neutra">sin tope</span>';

  return `
    <button type="button" class="item-mov" data-tope-cat="${escapeHtml(cat.id)}"
      aria-label="Ponerle tope a ${escapeHtml(cat.nombre)}">
      ${burbujaCat(cat)}
      <span class="mov-info">
        <span class="mov-titulo" style="display:block">${escapeHtml(cat.nombre)}</span>
        <span class="mov-detalle" style="display:block">gastado ${fmtMoney(gastado)} este mes</span>
        ${tope > 0 ? `<span class="mt-1" style="display:block">${barra(pctTope)}</span>` : ''}
      </span>
      ${derecha}
      <span aria-hidden="true">✏️</span>
    </button>`;
}

// La categoría fija de pagos de deuda: solo lectura, su plan vive en #/deudas.
function filaFija(cat, gastado) {
  return `
    <div class="item-mov">
      ${burbujaCat(cat)}
      <span class="mov-info">
        <span class="mov-titulo" style="display:block">${escapeHtml(cat.nombre)}</span>
        <span class="mov-detalle" style="display:block">se planea desde <a href="#/deudas">deudas</a>, no con tope</span>
      </span>
      <span class="monto">${fmtMoney(gastado)}</span>
    </div>`;
}

/* =========================================================================
   Modal: fijar / quitar tope
   ========================================================================= */

function abrirModalTope(catId) {
  const cat = store.categoriaDe(catId);
  if (!cat || cat.fija) return;

  const topeActual = store.getState().presupuesto[catId] || 0;
  const gastado = store.gastoPorCategoria().find((f) => f.categoria.id === catId)?.monto || 0;

  abrirModal({
    titulo: `Tope para ${cat.emoji} ${cat.nombre}`,
    cuerpo: `
      <form data-form-tope>
        <p class="texto-secundario">
          Llevas gastado <strong class="monto">${fmtMoney(gastado)}</strong> este mes en
          ${escapeHtml(cat.nombre)}.
        </p>
        ${campoMonto('tope', {
          valor: topeActual || null,
          etiqueta: 'Tope mensual',
          autofocus: true,
          ayuda: 'Este tope aplica cada mes; déjalo vacío para quitarlo.',
        })}
        <div class="fila" style="justify-content: space-between">
          ${topeActual > 0
            ? '<button type="button" class="btn btn-peligro" data-quitar-tope>Quitar tope</button>'
            : '<span></span>'}
          <button type="submit" class="btn btn-primario">Guardar tope</button>
        </div>
      </form>`,
    alAbrir(modal) {
      const form = modal.querySelector('[data-form-tope]');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = leerMonto(form, 'tope');
        if (monto != null && monto > 0) {
          store.setPresupuesto(catId, monto);
          cerrarModal();
          toast('Tope guardado 🎯');
          return;
        }
        if (topeActual > 0) {
          store.setPresupuesto(catId, 0);
          cerrarModal();
          toast('Tope quitado ✓');
          return;
        }
        toastError('Ponle un monto para fijar el tope 🙏');
      });

      const btnQuitar = modal.querySelector('[data-quitar-tope]');
      if (btnQuitar) {
        btnQuitar.addEventListener('click', () => {
          store.setPresupuesto(catId, 0);
          cerrarModal();
          toast('Tope quitado ✓');
        });
      }
    },
  });
}

/* =========================================================================
   3. Card "tus categorías": agregar / editar / borrar
   ========================================================================= */

function cardCategorias() {
  const cats = store.getState().categorias;

  const filas = cats.map((c) => {
    const botones = c.fija
      ? '<span class="pill pill-brand">fija</span>'
      : `<button type="button" class="btn-icono" data-editar-cat="${escapeHtml(c.id)}"
           aria-label="Editar ${escapeHtml(c.nombre)}">✏️</button>
         <button type="button" class="btn-icono" data-borrar-cat="${escapeHtml(c.id)}"
           aria-label="Borrar ${escapeHtml(c.nombre)}">🗑</button>`;
    return `
      <div class="item-mov">
        ${burbujaCat(c)}
        <span class="mov-info">
          <span class="mov-titulo" style="display:block">${escapeHtml(c.nombre)}</span>
        </span>
        ${botones}
      </div>`;
  }).join('');

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">tus categorías</h2>
        <button type="button" class="btn btn-suave btn-chico" data-nueva-cat>＋ nueva</button>
      </div>
      <div class="lista">${filas}</div>
    </section>`;
}

// Modal compartido para crear (catId null) y editar categoría.
function abrirModalCategoria(catId) {
  const cat = catId ? store.categoriaDe(catId) : null;
  if (catId && (!cat || cat.fija)) return;

  const tonoInicial = cat && TONOS.some((t) => t.id === cat.color) ? cat.color : 'mint';

  abrirModal({
    titulo: cat ? 'Editar categoría' : 'Nueva categoría',
    cuerpo: `
      <form data-form-cat>
        <div class="form-fila" style="grid-template-columns: 1fr 96px">
          ${campoTexto('nombre', {
            valor: cat?.nombre || '',
            etiqueta: 'Nombre',
            placeholder: 'ej. Cafecitos',
          })}
          <div class="campo">
            <label for="campo-emoji">Emoji</label>
            <input id="campo-emoji" name="emoji" type="text" maxlength="8" autocomplete="off"
              value="${escapeHtml(cat?.emoji || '')}" placeholder="🏷️"
              style="text-align: center; font-size: 1.2rem" />
          </div>
        </div>
        <div class="campo">
          <label>Tono</label>
          <div class="chips" data-chips-tono>
            ${TONOS.map((t) => `
              <button type="button" class="chip${t.id === tonoInicial ? ' activa' : ''}" data-tono="${t.id}">
                <span class="burbuja tono-${t.id}" style="width:18px;height:18px;min-width:18px"></span>
                ${t.nombre}
              </button>`).join('')}
          </div>
        </div>
        <button type="submit" class="btn btn-primario btn-bloque mt-1">
          ${cat ? 'Guardar cambios' : 'Crear categoría'}
        </button>
      </form>`,
    alAbrir(modal) {
      const form = modal.querySelector('[data-form-cat]');
      const chipsTono = modal.querySelector('[data-chips-tono]');
      wirearChips(chipsTono);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const datos = new FormData(form);
        const nombre = String(datos.get('nombre') || '').trim();
        if (!nombre) {
          toastError('Ponle nombre a tu categoría 🙏');
          return;
        }
        const emoji = String(datos.get('emoji') || '').trim() || '🏷️';
        const color = chipsTono.querySelector('.chip.activa')?.dataset.tono || 'mint';

        if (cat) {
          store.editarCategoria(cat.id, { nombre, emoji, color });
          toast('Categoría actualizada ✓');
        } else {
          store.agregarCategoria({ nombre, emoji, color });
          toast(`Lista tu categoría ${emoji} ✓`);
        }
        cerrarModal();
      });
    },
  });
}

async function pedirBorrarCategoria(catId) {
  const cat = store.categoriaDe(catId);
  if (!cat || cat.fija) return;
  const si = await confirmar(
    `¿Borramos "${cat.nombre}"? Sus movimientos no se pierden: se quedan como "sin categoría", y su tope se quita.`,
    { textoBoton: 'Sí, bórrala' },
  );
  if (si) {
    store.borrarCategoria(catId);
    toast('Categoría borrada 🗑');
  }
}
