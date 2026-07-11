// deudas.js — el módulo pesado de Cuentas Claras: control de deudas + plan de escape 💪
// Contrato: export function render(el). main.js re-renderiza la vista completa
// en cada cambio de estado. El estado del simulador (estrategia, extra, deudas
// incluidas) vive en variables de módulo para sobrevivir esos re-renders.
// Los modales viven en #modales y no se destruyen al re-renderizar: mutamos el
// store, cerramos con cerrarModal() y el re-render hace el resto.

import './deudas.css';

import * as store from '../store.js';
import {
  abrirModal, cerrarModal, confirmar, toast, toastError,
  campoMonto, leerMonto, campoFecha, campoTexto,
  barra, vacio, emojiDeuda, nombreTipoDeuda,
} from '../components.js';
import {
  fmtMoney, fmtMoneyCorto, escapeHtml, nombreMes, mesActualKey, plural, hoyISO,
} from '../utils.js';

/* =========================================================================
   Estado de UI del plan (variables de módulo: sobreviven re-renders)
   ========================================================================= */

let planEstrategia = 'avalancha'; // 'avalancha' | 'bolaDeNieve'
let planExtra = 0; // centavos
let planIncluidas = new Set(); // ids de deudas que entran al plan
let planVistas = new Set(); // ids que ya pasaron por el default (para no re-marcar)
let planCalculado = false; // si ya se pidió el plan, se recalcula en cada render

const DESCRIPCION_ESTRATEGIA = {
  avalancha: '🏔️ primero la tasa más alta — pagas menos intereses',
  bolaDeNieve: '⚪ primero la más chica — victorias rápidas',
};

// Mantiene el set de incluidas al día: las deudas nuevas entran solas
// (excepto hipoteca, que suele ir aparte) y las liquidadas/borradas salen.
function sincronizarPlan() {
  const activas = store.deudasActivas();
  const idsActivos = new Set(activas.map((d) => d.id));
  for (const d of activas) {
    if (!planVistas.has(d.id)) {
      planVistas.add(d.id);
      if (d.tipo !== 'hipoteca') planIncluidas.add(d.id);
    }
  }
  for (const id of [...planIncluidas]) {
    if (!idsActivos.has(id)) planIncluidas.delete(id);
  }
  return activas;
}

/* =========================================================================
   Render principal
   ========================================================================= */

export function render(el) {
  const deudas = store.getState().deudas;

  // Vacío inicial: sin números en cero, pura invitación.
  if (!deudas.length) {
    el.innerHTML = `
      <section class="seccion">
        ${vacio({
          emoji: '💪',
          titulo: 'registra tus deudas para armar tu plan de escape 💪',
          texto: 'Tarjetas, meses sin intereses, préstamos, hipoteca… apúntalas y te digo cuándo quedas libre.',
          boton: '<button type="button" class="btn btn-primario" data-nueva-deuda>＋ nueva deuda</button>',
        })}
      </section>`;
    el.querySelector('[data-nueva-deuda]').addEventListener('click', () => abrirFormDeuda());
    return;
  }

  const activas = sincronizarPlan();
  const { total } = store.totalDeudas();
  const comprometido = store.comprometidoMensual().total;

  el.innerHTML = `
    <section class="seccion">
      <div class="card">
        <h2 class="card-titulo">debes en total</h2>
        <div class="monto-hero${total === 0 ? ' positivo' : ''}">${fmtMoneyCorto(total)}</div>
        <p class="texto-suave mt-1">${total === 0
          ? '🎉 nada pendiente: todo lo que registraste ya está liquidado'
          : `cada mes comprometes <strong class="monto">${fmtMoney(comprometido)}</strong> en pagos`}</p>
        <div class="mt-2">
          <button type="button" class="btn btn-primario" data-nueva-deuda>＋ nueva deuda</button>
        </div>
      </div>

      <div class="deu-lista" data-lista-deudas>
        ${deudas.map(cardDeuda).join('')}
      </div>

      ${activas.length ? htmlPlanCard(activas) : htmlPlanLiquidado()}
    </section>`;

  // Listeners SOLO en nodos recién creados (nada en document/window/el).
  el.querySelector('[data-nueva-deuda]').addEventListener('click', () => abrirFormDeuda());

  el.querySelector('[data-lista-deudas]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const deuda = store.deudaDe(btn.closest('[data-deuda-id]')?.dataset.deudaId);
    if (!deuda) return;
    if (btn.dataset.accion === 'pago') abrirRegistrarPago(deuda);
    else if (btn.dataset.accion === 'editar') abrirFormDeuda(deuda);
    else if (btn.dataset.accion === 'ajustar') abrirAjustarSaldo(deuda);
    else if (btn.dataset.accion === 'borrar') confirmarBorrarDeuda(deuda);
  });

  // --- Plan de escape ---
  el.querySelector('[data-plan-estrategia]')?.addEventListener('click', (e) => {
    const seg = e.target.closest('[data-estrategia]');
    if (!seg) return;
    planEstrategia = seg.dataset.estrategia;
    render(el);
  });

  el.querySelector('[data-plan-deudas]')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-plan-deuda]');
    if (!chip) return;
    const id = chip.dataset.planDeuda;
    if (planIncluidas.has(id)) planIncluidas.delete(id);
    else planIncluidas.add(id);
    render(el);
  });

  const formPlan = el.querySelector('[data-form-plan]');
  if (formPlan) {
    // Guardar el extra al salir del input, para que sobreviva re-renders ajenos.
    formPlan.querySelector('input[name="extra"]').addEventListener('change', () => {
      planExtra = Math.max(0, leerMonto(formPlan, 'extra') || 0);
    });
    formPlan.addEventListener('submit', (e) => {
      e.preventDefault();
      planExtra = Math.max(0, leerMonto(formPlan, 'extra') || 0);
      if (!planIncluidas.size) {
        toastError('Elige al menos una deuda para tu plan 🙏');
        return;
      }
      planCalculado = true;
      render(el);
    });
  }
}

/* =========================================================================
   Card de cada deuda
   ========================================================================= */

// Barra de avance "vas bien" (siempre verde: aquí más lleno = mejor).
function barraProgreso(pctNum) {
  const ancho = Math.max(0, Math.min(100, pctNum));
  return `<div class="barra ok"><span style="width:${ancho}%"></span></div>`;
}

function cardDeuda(d) {
  const pendiente = store.saldoPendiente(d);
  const liquidada = pendiente <= 0;
  const yaPagoEsteMes = store.pagosDeDeudaEnMes(d.id, mesActualKey()).length > 0;

  let progresoHtml = '';
  let datos = '';

  if (d.tipo === 'msi') {
    const pctPag = Math.round((d.mensualidadesPagadas / d.meses) * 100);
    const faltan = Math.max(0, d.meses - d.mensualidadesPagadas);
    progresoHtml = `
      <div class="deu-progreso">
        <span class="deu-progreso-texto">va ${d.mensualidadesPagadas} de ${d.meses}</span>
        ${barraProgreso(pctPag)}
      </div>`;
    datos = `mensualidad ${fmtMoney(store.mensualidadDe(d))} · te ${plural(faltan, 'falta', 'faltan')} ${faltan} ${plural(faltan, 'mes', 'meses')}`;
  } else if (d.tipo === 'tarjeta') {
    if (d.limite > 0) {
      const uso = Math.round((d.saldo / d.limite) * 100);
      progresoHtml = `
        <div class="deu-progreso">
          <span class="deu-progreso-texto">usas ${uso}% de tu límite</span>
          ${barra(uso)}
        </div>`;
    }
    datos = `corte día ${d.diaCorte} · paga antes del día ${d.diaPago} · tasa ${d.tasaAnual}%`;
  } else {
    // prestamo | hipoteca | persona
    if (d.montoOriginal > 0) {
      const pagado = Math.max(0, d.montoOriginal - d.saldo);
      const pctPag = Math.round((pagado / d.montoOriginal) * 100);
      progresoHtml = `
        <div class="deu-progreso">
          <span class="deu-progreso-texto">ya pagaste ${pctPag}%</span>
          ${barraProgreso(pctPag)}
        </div>`;
    }
    if (d.tipo === 'persona') {
      datos = d.mensualidad > 0
        ? `abono ${fmtMoney(d.mensualidad)}${d.diaPago ? ` · el día ${d.diaPago}` : ''} · sin intereses 💛`
        : 'sin abono fijo — tú decides cuánto y cuándo 💛';
    } else {
      datos = `mensualidad ${fmtMoney(d.mensualidad)} · tasa ${d.tasaAnual}% · pago el día ${d.diaPago}`;
    }
  }

  const pillEstado = liquidada
    ? '<span class="pill pill-ok">🎉 liquidada</span>'
    : yaPagoEsteMes
      ? '<span class="pill pill-ok">✓ ya pagaste este mes</span>'
      : '';

  return `
    <article class="card deuda-card deuda-tipo-${escapeHtml(d.tipo)}" data-deuda-id="${escapeHtml(d.id)}">
      <div class="card-encabezado">
        <div class="deu-nombre-zona">
          <span class="deu-emoji" aria-hidden="true">${emojiDeuda(d.tipo)}</span>
          <h3 class="titulo deu-nombre">${escapeHtml(d.nombre)}</h3>
        </div>
        <span class="pill pill-neutra">${escapeHtml(nombreTipoDeuda(d.tipo))}</span>
      </div>
      <div class="fila-sep">
        <div>
          <div class="card-titulo">te falta</div>
          <div class="monto-grande">${fmtMoney(pendiente)}</div>
        </div>
        ${pillEstado}
      </div>
      ${progresoHtml}
      <p class="deu-datos">${datos}</p>
      <div class="deu-acciones">
        ${liquidada ? '' : '<button type="button" class="btn btn-primario btn-chico" data-accion="pago">💪 registrar pago</button>'}
        <button type="button" class="btn btn-fantasma btn-chico" data-accion="editar">✏️ editar</button>
        ${d.tipo !== 'msi' ? '<button type="button" class="btn btn-fantasma btn-chico" data-accion="ajustar">⚖️ ajustar saldo</button>' : ''}
        <button type="button" class="btn btn-peligro btn-chico" data-accion="borrar">🗑 borrar</button>
      </div>
    </article>`;
}

/* =========================================================================
   Modal nueva / editar deuda
   ========================================================================= */

// Campo numérico con el mismo look que los de components (tasa, días, meses).
function campoNumero(nombre, {
  etiqueta = '', valor = '', min = null, max = null, step = null,
  ayuda = '', placeholder = '', decimal = false,
} = {}) {
  const attrs = [
    min != null ? `min="${min}"` : '',
    max != null ? `max="${max}"` : '',
    step != null ? `step="${step}"` : '',
  ].filter(Boolean).join(' ');
  const v = valor === 0 || valor ? String(valor) : '';
  return `
    <div class="campo">
      <label for="campo-${nombre}">${escapeHtml(etiqueta)}</label>
      <input id="campo-${nombre}" name="${nombre}" type="number" ${attrs}
        inputmode="${decimal ? 'decimal' : 'numeric'}" value="${escapeHtml(v)}"
        placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
      ${ayuda ? `<span class="ayuda">${escapeHtml(ayuda)}</span>` : ''}
    </div>`;
}

// Campos del formulario según el tipo (d = deuda existente para prellenar).
function formCampos(tipo, d = null) {
  if (tipo === 'tarjeta') {
    return `
      ${campoTexto('nombre', { etiqueta: '¿Cómo se llama?', valor: d?.nombre || '', placeholder: 'ej. tarjeta azul' })}
      <div class="form-fila">
        ${campoMonto('saldo', { etiqueta: 'Saldo actual', valor: d ? d.saldo : null })}
        ${campoMonto('limite', { etiqueta: 'Límite de crédito', valor: d ? d.limite : null })}
      </div>
      <div class="form-fila">
        ${campoNumero('diaCorte', { etiqueta: 'Día de corte', valor: d?.diaCorte ?? '', min: 1, max: 31, step: 1, placeholder: '1–31' })}
        ${campoNumero('diaPago', { etiqueta: 'Día límite de pago', valor: d?.diaPago ?? '', min: 1, max: 31, step: 1, placeholder: '1–31' })}
      </div>
      <div class="form-fila">
        ${campoNumero('tasa', { etiqueta: 'Tasa anual %', valor: d?.tasaAnual ?? '', min: 0, step: 0.1, decimal: true, placeholder: 'ej. 36.5' })}
        ${campoMonto('pagoMinimo', { etiqueta: 'Pago mínimo', valor: d ? d.pagoMinimo : null, ayuda: 'viene en tu estado de cuenta' })}
      </div>`;
  }
  if (tipo === 'msi') {
    return `
      ${campoTexto('nombre', { etiqueta: '¿Qué compraste?', valor: d?.nombre || '', placeholder: 'ej. lavadora, celu…' })}
      ${campoMonto('montoTotal', { etiqueta: 'Monto total', valor: d ? d.montoTotal : null })}
      <div class="form-fila">
        ${campoNumero('meses', { etiqueta: '¿A cuántos meses?', valor: d?.meses ?? '', min: 1, max: 120, step: 1, placeholder: 'ej. 12' })}
        ${campoNumero('pagadas', { etiqueta: 'Ya pagaste', valor: d ? d.mensualidadesPagadas : 0, min: 0, step: 1, ayuda: 'mensualidades que ya diste' })}
      </div>
      ${campoNumero('diaPago', { etiqueta: 'Día de pago', valor: d?.diaPago ?? '', min: 1, max: 31, step: 1, placeholder: '1–31' })}`;
  }
  if (tipo === 'persona') {
    return `
      ${campoTexto('nombre', { etiqueta: '¿A quién le debes?', valor: d?.nombre || '', placeholder: 'ej. papá 💛' })}
      ${campoMonto('saldo', { etiqueta: '¿Cuánto le debes?', valor: d ? d.saldo : null })}
      <div class="form-fila">
        ${campoMonto('mensualidad', { etiqueta: 'Abono mensual', valor: d?.mensualidad ? d.mensualidad : null, ayuda: 'si acordaron un fijo; si no, déjalo vacío' })}
        ${campoNumero('diaPago', { etiqueta: 'Día de abono', valor: d?.diaPago ?? '', min: 1, max: 31, step: 1, placeholder: 'opcional' })}
      </div>`;
  }
  // prestamo | hipoteca
  return `
    ${campoTexto('nombre', { etiqueta: '¿Cómo se llama?', valor: d?.nombre || '', placeholder: tipo === 'hipoteca' ? 'ej. la casita' : 'ej. préstamo del banco' })}
    <div class="form-fila">
      ${campoMonto('saldo', { etiqueta: 'Saldo pendiente', valor: d ? d.saldo : null })}
      ${campoMonto('montoOriginal', { etiqueta: 'Monto original', valor: d ? d.montoOriginal : null, ayuda: 'si lo dejas vacío, uso el saldo' })}
    </div>
    ${campoMonto('mensualidad', { etiqueta: 'Mensualidad', valor: d ? d.mensualidad : null })}
    <div class="form-fila">
      ${campoNumero('tasa', { etiqueta: 'Tasa anual %', valor: d?.tasaAnual ?? '', min: 0, step: 0.1, decimal: true, placeholder: 'ej. 12.5' })}
      ${campoNumero('diaPago', { etiqueta: 'Día de pago', valor: d?.diaPago ?? '', min: 1, max: 31, step: 1, placeholder: '1–31' })}
    </div>`;
}

// Lee y valida el formulario. → objeto listo para el store, o null si faltó algo
// (ya avisó con toastError). Montos en centavos; tasa y días como number.
function leerDatosDeuda(tipo, form) {
  const fd = new FormData(form);
  const nombre = String(fd.get('nombre') || '').trim();
  const numero = (n, def = 0) => {
    const crudo = fd.get(n);
    const v = Number(crudo);
    return crudo !== null && crudo !== '' && Number.isFinite(v) ? v : def;
  };

  if (tipo === 'tarjeta') {
    if (!nombre) { toastError('Ponle nombre a la tarjeta 🙏'); return null; }
    return {
      nombre,
      saldo: leerMonto(form, 'saldo') || 0,
      limite: leerMonto(form, 'limite') || 0,
      tasaAnual: numero('tasa'),
      diaCorte: numero('diaCorte', 1),
      diaPago: numero('diaPago', 1),
      pagoMinimo: leerMonto(form, 'pagoMinimo') || 0,
    };
  }

  if (tipo === 'msi') {
    if (!nombre) { toastError('Cuéntame qué compraste 🙏'); return null; }
    const montoTotal = leerMonto(form, 'montoTotal');
    if (!montoTotal || montoTotal <= 0) { toastError('Necesito el monto total de la compra 🙏'); return null; }
    const meses = Math.round(numero('meses'));
    if (!meses || meses < 1) { toastError('¿A cuántos meses fue? Ponme el número 🙏'); return null; }
    return {
      nombre,
      montoTotal,
      meses,
      mensualidadesPagadas: Math.max(0, Math.round(numero('pagadas'))),
      diaPago: numero('diaPago', 1),
    };
  }

  if (tipo === 'persona') {
    if (!nombre) { toastError('Cuéntame a quién le debes 🙏'); return null; }
    const saldoPersona = leerMonto(form, 'saldo');
    if (!saldoPersona || saldoPersona <= 0) { toastError('Necesito cuánto le debes 🙏'); return null; }
    return {
      nombre,
      saldo: saldoPersona,
      mensualidad: leerMonto(form, 'mensualidad') || 0,
      tasaAnual: 0,
      diaPago: numero('diaPago', 0) || null,
    };
  }

  // prestamo | hipoteca
  if (!nombre) { toastError('Ponle nombre para ubicarla 🙏'); return null; }
  const saldo = leerMonto(form, 'saldo');
  if (!saldo || saldo <= 0) { toastError('Necesito el saldo pendiente 🙏'); return null; }
  const mensualidad = leerMonto(form, 'mensualidad');
  if (!mensualidad || mensualidad <= 0) { toastError('Necesito la mensualidad 🙏'); return null; }
  const montoOriginal = leerMonto(form, 'montoOriginal');
  return {
    nombre,
    saldo,
    montoOriginal: montoOriginal != null && montoOriginal > 0 ? montoOriginal : saldo,
    mensualidad,
    tasaAnual: numero('tasa'),
    diaPago: numero('diaPago', 1),
  };
}

// existente = deuda a editar (tipo fijo) o null para nueva (chips de tipo).
function abrirFormDeuda(existente = null) {
  let tipo = existente ? existente.tipo : null;

  const htmlCuerpoForm = () => (tipo
    ? `${formCampos(tipo, existente)}
       <button type="submit" class="btn btn-primario btn-bloque mt-1">${existente ? 'Guardar cambios' : 'Guardar deuda'}</button>`
    : '<p class="texto-suave centrado">elige arriba qué tipo de deuda es y te pido los datos 👆</p>');

  const htmlTipo = existente
    ? `<p class="texto-suave">${emojiDeuda(tipo)} ${escapeHtml(nombreTipoDeuda(tipo))} · el tipo no se cambia</p>`
    : `<div class="chips" data-chips-tipo>
        ${Object.entries(store.TIPOS_DEUDA).map(([id, t]) => `
          <button type="button" class="chip${tipo === id ? ' activa' : ''}" data-tipo="${escapeHtml(id)}" aria-pressed="${tipo === id}">
            ${t.emoji} ${escapeHtml(t.nombre)}
          </button>`).join('')}
      </div>`;

  abrirModal({
    titulo: existente ? 'Editar deuda' : 'Nueva deuda',
    cuerpo: `
      ${htmlTipo}
      <form class="mt-2" data-form-deuda>
        <div data-cuerpo-form>${htmlCuerpoForm()}</div>
      </form>`,
    alAbrir(modal) {
      const form = modal.querySelector('[data-form-deuda]');
      const cuerpoForm = modal.querySelector('[data-cuerpo-form]');

      const chipsTipo = modal.querySelector('[data-chips-tipo]');
      if (chipsTipo) {
        chipsTipo.addEventListener('click', (e) => {
          const chip = e.target.closest('[data-tipo]');
          if (!chip) return;
          tipo = chip.dataset.tipo;
          chipsTipo.querySelectorAll('.chip').forEach((c) => {
            c.classList.toggle('activa', c === chip);
            c.setAttribute('aria-pressed', String(c === chip));
          });
          cuerpoForm.innerHTML = htmlCuerpoForm();
          const primero = cuerpoForm.querySelector('input');
          if (primero) setTimeout(() => primero.focus(), 60);
        });
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!tipo) {
          toastError('Primero elige el tipo de deuda 👆');
          return;
        }
        const datos = leerDatosDeuda(tipo, form);
        if (!datos) return;
        if (existente) {
          store.editarDeuda(existente.id, datos);
          toast('Deuda actualizada ✓');
        } else {
          store.agregarDeuda({ tipo, ...datos });
          toast('Deuda registrada 💪');
        }
        cerrarModal();
      });
    },
  });
}

/* =========================================================================
   Modales de pago, ajuste de saldo y borrado
   ========================================================================= */

function abrirRegistrarPago(deuda) {
  const pendiente = store.saldoPendiente(deuda);
  const sugerida = store.mensualidadDe(deuda);
  const prellenado = sugerida > 0 ? Math.min(sugerida, pendiente) : null;

  abrirModal({
    titulo: `Pago · ${deuda.nombre}`,
    cuerpo: `
      <form data-form-pago>
        ${campoMonto('monto', { valor: prellenado, autofocus: true, ayuda: `te falta ${fmtMoney(pendiente)} en total` })}
        ${campoFecha('fecha')}
        <button type="submit" class="btn btn-primario btn-bloque mt-1">💪 registrar pago</button>
      </form>`,
    alAbrir(modal) {
      const form = modal.querySelector('[data-form-pago]');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = leerMonto(form, 'monto');
        if (!monto || monto <= 0) {
          toastError('Ponle un monto válido 🙏');
          return;
        }
        const fecha = new FormData(form).get('fecha') || hoyISO();
        store.registrarPagoDeuda(deuda.id, { monto, fecha });
        cerrarModal();
        toast('Pago registrado 💪');
      });
    },
  });
}

// Solo tarjeta / préstamo / hipoteca (los MSI se mueven con sus mensualidades).
function abrirAjustarSaldo(deuda) {
  abrirModal({
    titulo: `Ajustar saldo · ${deuda.nombre}`,
    cuerpo: `
      <p class="texto-suave">¿Llegó el estado de cuenta y el número no cuadra? Corrígelo aquí; tus movimientos no se tocan.</p>
      <form class="mt-1" data-form-ajuste>
        ${campoMonto('saldo', { etiqueta: 'Nuevo saldo', valor: deuda.saldo, autofocus: true })}
        <button type="submit" class="btn btn-primario btn-bloque mt-1">Guardar saldo</button>
      </form>`,
    alAbrir(modal) {
      const form = modal.querySelector('[data-form-ajuste]');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const saldo = leerMonto(form, 'saldo');
        if (saldo == null || saldo < 0) {
          toastError('Ponme un saldo válido (puede ser $0) 🙏');
          return;
        }
        store.ajustarSaldoDeuda(deuda.id, saldo);
        cerrarModal();
        toast('Saldo actualizado ✓');
      });
    },
  });
}

async function confirmarBorrarDeuda(deuda) {
  const si = await confirmar(
    `¿Borramos "${deuda.nombre}"? Sus pagos se quedan en tu historial como gastos normales, pero la deuda y su plan desaparecen.`,
    { textoBoton: 'Sí, bórrala' },
  );
  if (si) {
    store.borrarDeuda(deuda.id);
    toast('Deuda borrada 🗑');
  }
}

/* =========================================================================
   Plan para salir de deudas (el corazón 💜)
   ========================================================================= */

function htmlPlanCard(activas) {
  const hayHipoteca = activas.some((d) => d.tipo === 'hipoteca');
  return `
    <div class="card mt-2">
      <div class="card-encabezado">
        <h2 class="card-titulo">plan para salir de deudas</h2>
        <span class="pill pill-brand">simulador</span>
      </div>
      <div class="segmentos" data-plan-estrategia>
        <button type="button" class="segmento${planEstrategia === 'avalancha' ? ' activa' : ''}" data-estrategia="avalancha">🏔️ Avalancha</button>
        <button type="button" class="segmento${planEstrategia === 'bolaDeNieve' ? ' activa' : ''}" data-estrategia="bolaDeNieve">⚪ Bola de nieve</button>
      </div>
      <p class="texto-suave centrado mt-1">${DESCRIPCION_ESTRATEGIA[planEstrategia]}</p>
      <form class="mt-2" data-form-plan>
        ${campoMonto('extra', { etiqueta: 'Extra al mes', valor: planExtra > 0 ? planExtra : null, ayuda: 'lo que puedas sumar a tus pagos; con $0 igual sale tu plan' })}
        <div class="campo">
          <label>¿Cuáles entran al plan?</label>
          <div class="chips" data-plan-deudas>
            ${activas.map((d) => `
              <button type="button" class="chip${planIncluidas.has(d.id) ? ' activa' : ''}"
                data-plan-deuda="${escapeHtml(d.id)}" aria-pressed="${planIncluidas.has(d.id)}">
                ${emojiDeuda(d.tipo)} ${escapeHtml(d.nombre)}
              </button>`).join('')}
          </div>
          ${hayHipoteca ? '<span class="ayuda">🏠 la hipoteca suele ir aparte; por eso viene desmarcada</span>' : ''}
        </div>
        <button type="submit" class="btn btn-primario btn-bloque">🧮 calcular mi plan</button>
      </form>
      <div data-plan-resultado>${planCalculado ? htmlResultadoPlan() : ''}</div>
    </div>`;
}

function htmlPlanLiquidado() {
  return `
    <div class="card mt-2 centrado">
      <h2 class="card-titulo">plan para salir de deudas</h2>
      <p class="texto-suave mt-1">Nada activo que planear: ya liquidaste todo 🎉 Si registras una deuda nueva, aquí armamos tu plan de escape.</p>
    </div>`;
}

function htmlResultadoPlan() {
  const incluirIds = [...planIncluidas];
  if (!incluirIds.length) {
    return '<p class="texto-suave centrado mt-2">elige al menos una deuda y vuelve a calcular 🙏</p>';
  }

  const plan = store.planDePagos({
    estrategia: planEstrategia,
    extraMensual: planExtra,
    incluirIds,
  });

  if (!plan.alcanzable) {
    return `
      <hr class="separador" />
      <div class="deu-problema">
        <strong>Así como va, ${escapeHtml(plan.deudaProblema.nombre)} no baja 😮‍💨</strong>
        <span>Los intereses se comen el pago completito. Necesitas pagarle al menos
          <strong>${fmtMoney(plan.pagoNecesario)}</strong> al mes para que empiece a bajar.</span>
        <span>Tip: sube su ${plan.deudaProblema.tipo === 'tarjeta' ? 'pago mínimo' : 'mensualidad'} con ✏️ editar, o agrega un extra al plan.</span>
      </div>`;
  }

  // Presumir el ahorro: mismo plan pero sin extra, para comparar.
  let ahorroHtml = '';
  if (planExtra > 0) {
    const planSinExtra = store.planDePagos({
      estrategia: planEstrategia,
      extraMensual: 0,
      incluirIds,
    });
    if (planSinExtra.alcanzable) {
      const ahorro = Math.max(0, planSinExtra.interesTotal - plan.interesTotal);
      const antes = Math.max(0, planSinExtra.meses - plan.meses);
      const logros = [];
      if (ahorro > 0) logros.push(`te ahorras <strong>${fmtMoney(ahorro)}</strong> de intereses`);
      if (antes > 0) logros.push(`sales <strong>${antes} ${plural(antes, 'mes', 'meses')} antes</strong>`);
      if (logros.length) {
        ahorroHtml = `<div class="deu-ahorro">🚀 Con tu extra de ${fmtMoney(planExtra)} ${logros.join(' y ')}.</div>`;
      }
    }
  }

  return `
    <hr class="separador" />
    <div class="centrado">
      <div class="card-titulo">quedas libre en</div>
      <div class="deu-plan-fecha">${escapeHtml(nombreMes(plan.fechaLibre))}</div>
      <p class="texto-suave">o sea, en ${plan.meses} ${plural(plan.meses, 'mes', 'meses')} 🎉</p>
    </div>
    <div class="grid-2 mt-2">
      <div>
        <div class="card-titulo">intereses que vas a pagar</div>
        <div class="monto-grande">${fmtMoney(plan.interesTotal)}</div>
      </div>
      <div>
        <div class="card-titulo">pago mensual del plan</div>
        <div class="monto-grande">${fmtMoney(plan.pagoMensualTotal)}</div>
      </div>
    </div>
    ${ahorroHtml}
    ${plan.orden.length ? `
      <div class="mt-2">
        <div class="card-titulo">vas a tachar en este orden</div>
        <ol class="deu-orden">
          ${plan.orden.map((o) => `
            <li>
              <span class="deu-orden-nombre">${emojiDeuda(o.deuda.tipo)} ${escapeHtml(o.deuda.nombre)}</span>
              <span class="texto-suave">${escapeHtml(nombreMes(o.mesKey))}</span>
            </li>`).join('')}
        </ol>
      </div>` : ''}`;
}
