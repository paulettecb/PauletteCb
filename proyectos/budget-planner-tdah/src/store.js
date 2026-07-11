// Store de Lana: estado, persistencia en localStorage y toda la lógica de dinero.
//
// CONTRATO (las vistas solo usan esto, nunca tocan localStorage directo):
//   Estado:      getState(), suscribir(fn) → unsub
//   Mes activo:  getMes(), setMes(mesKey), esMesActual()
//   Movimientos: agregarMovimiento, editarMovimiento, borrarMovimiento,
//                movimientosDelMes(mes), totalesDelMes(mes), gastoPorCategoria(mes)
//   Categorías:  agregarCategoria, editarCategoria, borrarCategoria, categoriaDe(id)
//   Presupuesto: setPresupuesto(catId, centavos|null), presupuestoTotal()
//   Deudas:      agregarDeuda, editarDeuda, borrarDeuda, deudaDe(id), deudasActivas(),
//                registrarPagoDeuda, ajustarSaldoDeuda, saldoPendiente(deuda),
//                mensualidadDe(deuda), totalDeudas(), comprometidoMensual(),
//                pagosDeDeudaEnMes(deudaId, mes), proximosEventos(dias)
//   Plan:        planDePagos({estrategia, extraMensual, incluirIds})
//   Datos:       exportarJSON(), importarJSON(str), exportarCSV(mes|null), borrarTodo(),
//                setIngresoPlaneado, setNombre
//
// Regla de oro: TODOS los montos son centavos (enteros). Ver utils.js.

import {
  uid, hoyISO, mesActualKey, mesKeyDe, clampDia, fechaISO,
  sumarMeses, diasEnMes, fmtMoney,
} from './utils.js';

const KEY = 'lana.v1';
const VERSION = 1;

/* =========================================================================
   Catálogos
   ========================================================================= */

export const TIPOS_DEUDA = {
  tarjeta:  { emoji: '💳', nombre: 'Tarjeta de crédito' },
  msi:      { emoji: '🛍️', nombre: 'Meses sin intereses' },
  prestamo: { emoji: '🏦', nombre: 'Préstamo' },
  hipoteca: { emoji: '🏠', nombre: 'Hipoteca' },
};

// color = sufijo de las clases .tono-* definidas en styles.css
const CATEGORIAS_BASE = [
  { id: 'cat-comida',     nombre: 'Comida',           emoji: '🍽️', color: 'peach' },
  { id: 'cat-super',      nombre: 'Súper',            emoji: '🛒', color: 'butter' },
  { id: 'cat-casa',       nombre: 'Casa y servicios', emoji: '🏠', color: 'sky' },
  { id: 'cat-transporte', nombre: 'Transporte',       emoji: '🚗', color: 'mint' },
  { id: 'cat-kenna',      nombre: 'Kenna',            emoji: '🐾', color: 'lilac' },
  { id: 'cat-salud',      nombre: 'Salud',            emoji: '💊', color: 'blush' },
  { id: 'cat-escuela',    nombre: 'Escuela',          emoji: '📚', color: 'sky' },
  { id: 'cat-ocio',       nombre: 'Ocio',             emoji: '✨', color: 'lilac' },
  { id: 'cat-subs',       nombre: 'Suscripciones',    emoji: '📺', color: 'butter' },
  { id: 'cat-deudas',     nombre: 'Pagos de deuda',   emoji: '💪', color: 'periwinkle', fija: true },
  { id: 'cat-otros',      nombre: 'Otros',            emoji: '🌀', color: 'mint' },
];

export const CATEGORIA_DEUDAS = 'cat-deudas';

/* =========================================================================
   Estado + persistencia
   ========================================================================= */

function estadoBase() {
  return {
    version: VERSION,
    ajustes: { nombre: '', ingresoPlaneado: 0 },
    categorias: JSON.parse(JSON.stringify(CATEGORIAS_BASE)),
    // movimiento: { id, tipo:'gasto'|'ingreso', fecha:'YYYY-MM-DD', monto,
    //               categoriaId|null, nota, deudaId|null, creadoEn }
    movimientos: [],
    // deuda común: { id, tipo, nombre, creadoEn }
    //   tarjeta:  + { saldo, limite, tasaAnual, diaCorte, diaPago, pagoMinimo }
    //   msi:      + { montoTotal, meses, mensualidadesPagadas, diaPago }
    //   prestamo|hipoteca: + { saldo, montoOriginal, mensualidad, tasaAnual, diaPago }
    deudas: [],
    // presupuesto mensual por categoría: { [categoriaId]: centavos }
    presupuesto: {},
  };
}

function cargar() {
  try {
    const crudo = localStorage.getItem(KEY);
    if (!crudo) return estadoBase();
    const datos = JSON.parse(crudo);
    return normalizar(datos);
  } catch {
    return estadoBase();
  }
}

// Rellena defaults y sanea tipos; también valida lo que llega por importarJSON.
function normalizar(datos) {
  const base = estadoBase();
  if (!datos || typeof datos !== 'object') return base;
  const n = Math.round;
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

  const st = {
    version: VERSION,
    ajustes: {
      nombre: typeof datos.ajustes?.nombre === 'string' ? datos.ajustes.nombre.slice(0, 60) : '',
      ingresoPlaneado: Math.max(0, n(num(datos.ajustes?.ingresoPlaneado))),
    },
    categorias: Array.isArray(datos.categorias) && datos.categorias.length
      ? datos.categorias
          .filter((c) => c && c.id && c.nombre)
          .map((c) => ({
            id: String(c.id), nombre: String(c.nombre).slice(0, 40),
            emoji: String(c.emoji || '🏷️').slice(0, 8), color: String(c.color || 'mint'),
            ...(c.fija ? { fija: true } : {}),
          }))
      : base.categorias,
    movimientos: (Array.isArray(datos.movimientos) ? datos.movimientos : [])
      .filter((m) => m && m.id && /^\d{4}-\d{2}-\d{2}$/.test(m.fecha || '') && Number.isFinite(Number(m.monto)))
      .map((m) => ({
        id: String(m.id),
        tipo: m.tipo === 'ingreso' ? 'ingreso' : 'gasto',
        fecha: m.fecha,
        monto: Math.max(0, n(num(m.monto))),
        categoriaId: m.categoriaId ? String(m.categoriaId) : null,
        nota: typeof m.nota === 'string' ? m.nota.slice(0, 200) : '',
        deudaId: m.deudaId ? String(m.deudaId) : null,
        creadoEn: m.creadoEn || '',
      })),
    deudas: (Array.isArray(datos.deudas) ? datos.deudas : [])
      .filter((d) => d && d.id && TIPOS_DEUDA[d.tipo] && d.nombre)
      .map((d) => {
        const comun = {
          id: String(d.id), tipo: d.tipo, nombre: String(d.nombre).slice(0, 60),
          creadoEn: d.creadoEn || '', diaPago: clampDiaLibre(d.diaPago),
        };
        if (d.tipo === 'tarjeta') {
          return {
            ...comun,
            saldo: Math.max(0, n(num(d.saldo))), limite: Math.max(0, n(num(d.limite))),
            tasaAnual: Math.max(0, num(d.tasaAnual)), diaCorte: clampDiaLibre(d.diaCorte),
            pagoMinimo: Math.max(0, n(num(d.pagoMinimo))),
          };
        }
        if (d.tipo === 'msi') {
          const meses = Math.max(1, n(num(d.meses, 1)));
          return {
            ...comun,
            montoTotal: Math.max(0, n(num(d.montoTotal))), meses,
            mensualidadesPagadas: Math.max(0, Math.min(meses, n(num(d.mensualidadesPagadas)))),
          };
        }
        return {
          ...comun,
          saldo: Math.max(0, n(num(d.saldo))),
          montoOriginal: Math.max(0, n(num(d.montoOriginal ?? d.saldo))),
          mensualidad: Math.max(0, n(num(d.mensualidad))),
          tasaAnual: Math.max(0, num(d.tasaAnual)),
        };
      }),
    presupuesto: {},
  };
  if (datos.presupuesto && typeof datos.presupuesto === 'object') {
    for (const [catId, monto] of Object.entries(datos.presupuesto)) {
      const v = Math.max(0, n(num(monto)));
      if (v > 0) st.presupuesto[String(catId)] = v;
    }
  }
  // La categoría fija de deudas siempre existe (los pagos de deuda apuntan a ella).
  if (!st.categorias.some((c) => c.id === CATEGORIA_DEUDAS)) {
    st.categorias.push({ ...CATEGORIAS_BASE.find((c) => c.id === CATEGORIA_DEUDAS) });
  }
  return st;
}

function clampDiaLibre(dia) {
  return Math.max(1, Math.min(31, Math.round(Number(dia)) || 1));
}

let state = cargar();

// Estado de UI (no se persiste): mes que se está viendo.
const ui = { mes: mesActualKey() };

const subs = new Set();
export function suscribir(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
function notificar() {
  for (const fn of subs) fn();
}
function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Lana: no se pudo guardar', e);
  }
  notificar();
}

export const getState = () => state;
export const getMes = () => ui.mes;
export const esMesActual = () => ui.mes === mesActualKey();
export function setMes(mesKey) {
  if (!/^\d{4}-\d{2}$/.test(mesKey)) return;
  ui.mes = mesKey;
  notificar();
}

/* =========================================================================
   Movimientos
   ========================================================================= */

export function agregarMovimiento({ tipo, fecha, monto, categoriaId = null, nota = '', deudaId = null }) {
  const mov = {
    id: uid(),
    tipo: tipo === 'ingreso' ? 'ingreso' : 'gasto',
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') ? fecha : hoyISO(),
    monto: Math.max(0, Math.round(monto || 0)),
    categoriaId,
    nota: (nota || '').slice(0, 200),
    deudaId,
    creadoEn: new Date().toISOString(),
  };
  state.movimientos.push(mov);
  commit();
  return mov;
}

export function editarMovimiento(id, cambios) {
  const mov = state.movimientos.find((m) => m.id === id);
  if (!mov) return;
  const montoNuevo = cambios.monto != null ? Math.max(0, Math.round(cambios.monto)) : mov.monto;
  // Si es un pago de deuda y cambió el monto, el saldo de la deuda se corrige.
  if (mov.deudaId && montoNuevo !== mov.monto) {
    aplicarEfectoPago(mov.deudaId, -mov.monto);
    aplicarEfectoPago(mov.deudaId, montoNuevo);
  }
  if (cambios.fecha && /^\d{4}-\d{2}-\d{2}$/.test(cambios.fecha)) mov.fecha = cambios.fecha;
  if (cambios.nota != null) mov.nota = String(cambios.nota).slice(0, 200);
  if (cambios.categoriaId !== undefined && !mov.deudaId) mov.categoriaId = cambios.categoriaId;
  mov.monto = montoNuevo;
  commit();
}

export function borrarMovimiento(id) {
  const mov = state.movimientos.find((m) => m.id === id);
  if (!mov) return;
  // Borrar un pago de deuda revierte su efecto (el saldo vuelve a subir / MSI resta un mes).
  if (mov.deudaId) {
    aplicarEfectoPago(mov.deudaId, -mov.monto, { revertirMsi: true });
  }
  state.movimientos = state.movimientos.filter((m) => m.id !== id);
  commit();
}

export function movimientosDelMes(mes = ui.mes) {
  return state.movimientos
    .filter((m) => mesKeyDe(m.fecha) === mes)
    .sort((a, b) => (b.fecha + (b.creadoEn || '')).localeCompare(a.fecha + (a.creadoEn || '')));
}

export function totalesDelMes(mes = ui.mes) {
  let ingresos = 0;
  let gastos = 0;
  for (const m of state.movimientos) {
    if (mesKeyDe(m.fecha) !== mes) continue;
    if (m.tipo === 'ingreso') ingresos += m.monto;
    else gastos += m.monto;
  }
  return { ingresos, gastos, balance: ingresos - gastos };
}

// → [{ categoria, monto, presupuesto, pct }] ordenado por gasto desc.
//   pct es contra presupuesto si existe (puede pasar de 100); si no, 0.
export function gastoPorCategoria(mes = ui.mes) {
  const porCat = new Map();
  for (const m of state.movimientos) {
    if (m.tipo !== 'gasto' || mesKeyDe(m.fecha) !== mes) continue;
    const key = m.categoriaId || 'sin-categoria';
    porCat.set(key, (porCat.get(key) || 0) + m.monto);
  }
  const filas = [];
  for (const [catId, monto] of porCat) {
    const categoria = categoriaDe(catId) || { id: catId, nombre: 'Sin categoría', emoji: '❔', color: 'mint' };
    const presupuesto = state.presupuesto[catId] || 0;
    filas.push({
      categoria, monto, presupuesto,
      pct: presupuesto > 0 ? Math.round((monto / presupuesto) * 100) : 0,
    });
  }
  return filas.sort((a, b) => b.monto - a.monto);
}

/* =========================================================================
   Categorías + presupuesto
   ========================================================================= */

export const categoriaDe = (id) => state.categorias.find((c) => c.id === id) || null;

export function agregarCategoria({ nombre, emoji = '🏷️', color = 'mint' }) {
  const cat = { id: `cat-${uid()}`, nombre: (nombre || '').slice(0, 40), emoji: emoji.slice(0, 8), color };
  state.categorias.push(cat);
  commit();
  return cat;
}

export function editarCategoria(id, cambios) {
  const cat = categoriaDe(id);
  if (!cat) return;
  if (cambios.nombre) cat.nombre = String(cambios.nombre).slice(0, 40);
  if (cambios.emoji) cat.emoji = String(cambios.emoji).slice(0, 8);
  if (cambios.color) cat.color = String(cambios.color);
  commit();
}

// Las categorías fijas (pagos de deuda) no se pueden borrar.
// Los movimientos que la usaban quedan "sin categoría".
export function borrarCategoria(id) {
  const cat = categoriaDe(id);
  if (!cat || cat.fija) return;
  state.categorias = state.categorias.filter((c) => c.id !== id);
  for (const m of state.movimientos) if (m.categoriaId === id) m.categoriaId = null;
  delete state.presupuesto[id];
  commit();
}

export function setPresupuesto(catId, centavos) {
  const v = Math.max(0, Math.round(centavos || 0));
  if (v > 0) state.presupuesto[catId] = v;
  else delete state.presupuesto[catId];
  commit();
}

export function presupuestoTotal() {
  return Object.values(state.presupuesto).reduce((s, v) => s + v, 0);
}

export function setIngresoPlaneado(centavos) {
  state.ajustes.ingresoPlaneado = Math.max(0, Math.round(centavos || 0));
  commit();
}

export function setNombre(nombre) {
  state.ajustes.nombre = String(nombre || '').slice(0, 60);
  commit();
}

/* =========================================================================
   Deudas
   ========================================================================= */

export const deudaDe = (id) => state.deudas.find((d) => d.id === id) || null;

export function deudasActivas() {
  return state.deudas.filter((d) => saldoPendiente(d) > 0);
}

// Lo que falta por pagar de una deuda, en centavos.
export function saldoPendiente(deuda) {
  if (!deuda) return 0;
  if (deuda.tipo === 'msi') {
    const mensualidad = mensualidadDe(deuda);
    return Math.max(0, deuda.montoTotal - deuda.mensualidadesPagadas * mensualidad);
  }
  return Math.max(0, deuda.saldo || 0);
}

// Mensualidad "natural" de la deuda (para MSI se deriva; tarjeta usa pagoMinimo).
export function mensualidadDe(deuda) {
  if (!deuda) return 0;
  if (deuda.tipo === 'msi') return Math.round(deuda.montoTotal / deuda.meses);
  if (deuda.tipo === 'tarjeta') return deuda.pagoMinimo || 0;
  return deuda.mensualidad || 0;
}

export function agregarDeuda(datos) {
  const deuda = normalizar({ deudas: [{ ...datos, id: `deuda-${uid()}`, creadoEn: hoyISO() }] }).deudas[0];
  if (!deuda) return null;
  state.deudas.push(deuda);
  commit();
  return deuda;
}

export function editarDeuda(id, cambios) {
  const idx = state.deudas.findIndex((d) => d.id === id);
  if (idx === -1) return;
  const fusion = { ...state.deudas[idx], ...cambios, id, tipo: state.deudas[idx].tipo };
  const limpia = normalizar({ deudas: [fusion] }).deudas[0];
  if (limpia) state.deudas[idx] = limpia;
  commit();
}

// Borra la deuda; sus movimientos de pago se conservan como historial (pierden el vínculo).
export function borrarDeuda(id) {
  state.deudas = state.deudas.filter((d) => d.id !== id);
  for (const m of state.movimientos) if (m.deudaId === id) m.deudaId = null;
  commit();
}

// Corrección manual de saldo (p. ej. llegó el estado de cuenta de la tarjeta).
export function ajustarSaldoDeuda(id, nuevoSaldo) {
  const deuda = deudaDe(id);
  if (!deuda || deuda.tipo === 'msi') return;
  deuda.saldo = Math.max(0, Math.round(nuevoSaldo || 0));
  commit();
}

// deltaMonto positivo = se pagó; negativo = se revierte un pago.
function aplicarEfectoPago(deudaId, deltaMonto, { revertirMsi = false } = {}) {
  const deuda = deudaDe(deudaId);
  if (!deuda) return;
  if (deuda.tipo === 'msi') {
    if (deltaMonto > 0) {
      deuda.mensualidadesPagadas = Math.min(deuda.meses, deuda.mensualidadesPagadas + 1);
    } else if (revertirMsi) {
      deuda.mensualidadesPagadas = Math.max(0, deuda.mensualidadesPagadas - 1);
    }
  } else {
    deuda.saldo = Math.max(0, (deuda.saldo || 0) - deltaMonto);
  }
}

// Crea el movimiento de gasto Y actualiza la deuda, en una sola operación.
export function registrarPagoDeuda(deudaId, { monto, fecha = hoyISO(), nota = '' }) {
  const deuda = deudaDe(deudaId);
  if (!deuda || !monto || monto <= 0) return null;
  const mov = {
    id: uid(),
    tipo: 'gasto',
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : hoyISO(),
    monto: Math.round(monto),
    categoriaId: CATEGORIA_DEUDAS,
    nota: nota || `Pago · ${deuda.nombre}`,
    deudaId,
    creadoEn: new Date().toISOString(),
  };
  state.movimientos.push(mov);
  aplicarEfectoPago(deudaId, mov.monto);
  commit();
  return mov;
}

export function pagosDeDeudaEnMes(deudaId, mes = ui.mes) {
  return state.movimientos.filter((m) => m.deudaId === deudaId && mesKeyDe(m.fecha) === mes);
}

// → { total, porTipo: { tarjeta, msi, prestamo, hipoteca } } (solo lo pendiente)
export function totalDeudas() {
  const porTipo = { tarjeta: 0, msi: 0, prestamo: 0, hipoteca: 0 };
  let total = 0;
  for (const d of state.deudas) {
    const pendiente = saldoPendiente(d);
    porTipo[d.tipo] += pendiente;
    total += pendiente;
  }
  return { total, porTipo };
}

// Suma de mensualidades comprometidas cada mes (MSI + préstamos + hipoteca +
// pago mínimo de tarjetas con saldo). → { total, detalle: [{deuda, monto}] }
export function comprometidoMensual() {
  const detalle = [];
  for (const d of deudasActivas()) {
    const monto = d.tipo === 'msi'
      ? Math.min(mensualidadDe(d), saldoPendiente(d))
      : mensualidadDe(d);
    if (monto > 0) detalle.push({ deuda: d, monto });
  }
  return { total: detalle.reduce((s, x) => s + x.monto, 0), detalle };
}

// Eventos de deuda de hoy en adelante (cortes y fechas de pago), hasta `dias`.
// → [{ fecha:'YYYY-MM-DD', clase:'corte'|'pago', deuda, etiqueta, monto|null, pagado }]
export function proximosEventos(dias = 14) {
  const hoy = hoyISO();
  const limite = sumarMesesFecha(hoy, dias);
  const eventos = [];
  const meses = [mesKeyDe(hoy), sumarMeses(mesKeyDe(hoy), 1), sumarMeses(mesKeyDe(hoy), 2)];
  for (const d of deudasActivas()) {
    for (const mes of meses) {
      if (d.tipo === 'tarjeta' && d.diaCorte) {
        eventos.push({
          fecha: fechaISO(mes, d.diaCorte), clase: 'corte', deuda: d,
          etiqueta: `Corte · ${d.nombre}`, monto: null, pagado: false,
        });
      }
      if (d.diaPago) {
        const monto = d.tipo === 'tarjeta' ? (d.pagoMinimo || null)
          : d.tipo === 'msi' ? Math.min(mensualidadDe(d), saldoPendiente(d))
          : d.mensualidad;
        eventos.push({
          fecha: fechaISO(mes, d.diaPago), clase: 'pago', deuda: d,
          etiqueta: `Pago · ${d.nombre}`, monto,
          pagado: pagosDeDeudaEnMes(d.id, mes).length > 0,
        });
      }
    }
  }
  return eventos
    .filter((e) => e.fecha >= hoy && e.fecha <= limite)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function sumarMesesFecha(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(a, m - 1, d + dias);
  const pad = (n) => String(n).padStart(2, '0');
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
}

// Eventos de deuda que caen dentro de un mes dado (para el calendario).
export function eventosDelMes(mes = ui.mes) {
  const eventos = [];
  for (const d of deudasActivas()) {
    if (d.tipo === 'tarjeta' && d.diaCorte) {
      eventos.push({
        fecha: fechaISO(mes, d.diaCorte), clase: 'corte', deuda: d,
        etiqueta: `Corte · ${d.nombre}`, monto: null, pagado: false,
      });
    }
    if (d.diaPago) {
      const monto = d.tipo === 'tarjeta' ? (d.pagoMinimo || null)
        : d.tipo === 'msi' ? Math.min(mensualidadDe(d), saldoPendiente(d))
        : d.mensualidad;
      eventos.push({
        fecha: fechaISO(mes, d.diaPago), clase: 'pago', deuda: d,
        etiqueta: `Pago · ${d.nombre}`, monto,
        pagado: pagosDeDeudaEnMes(d.id, mes).length > 0,
      });
    }
  }
  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* =========================================================================
   Plan de pagos (simulador bola de nieve / avalancha)
   ========================================================================= */

// Simula pagar todas las deudas con presupuesto fijo mensual:
//   presupuesto = suma de pagos base + extraMensual. Al liquidarse una deuda,
//   su pago base se recorre a la siguiente (efecto bola de nieve).
//   - estrategia 'avalancha': el extra ataca la tasa más alta.
//   - estrategia 'bolaDeNieve': el extra ataca el saldo más chico.
//   - incluirIds: limita qué deudas participan (p. ej. excluir hipoteca).
// → { alcanzable, meses, fechaLibre, interesTotal, pagoMensualTotal,
//     orden: [{deuda, mes, mesKey}], linea: [{mesKey, total}] }
//   o { alcanzable:false, deudaProblema, pagoNecesario } si el pago base no cubre intereses.
export function planDePagos({ estrategia = 'avalancha', extraMensual = 0, incluirIds = null } = {}) {
  const candidatas = deudasActivas().filter((d) => !incluirIds || incluirIds.includes(d.id));
  const sims = candidatas.map((d) => ({
    deuda: d,
    saldo: saldoPendiente(d),
    tasaMensual: (d.tasaAnual || 0) / 100 / 12,
    pagoBase: pagoBaseSim(d),
  }));
  if (!sims.length) {
    return { alcanzable: true, meses: 0, fechaLibre: mesActualKey(), interesTotal: 0, pagoMensualTotal: 0, orden: [], linea: [] };
  }

  // Chequeo de viabilidad: el pago base de cada deuda debe superar su interés mensual.
  for (const s of sims) {
    const interesMes = Math.round(s.saldo * s.tasaMensual);
    if (s.pagoBase <= interesMes && s.tasaMensual > 0) {
      return {
        alcanzable: false,
        deudaProblema: s.deuda,
        pagoNecesario: interesMes + Math.max(1, Math.round(s.saldo * 0.01)),
      };
    }
  }

  const presupuesto = sims.reduce((s, x) => s + x.pagoBase, 0) + Math.max(0, Math.round(extraMensual));
  const prioridad = (a, b) =>
    estrategia === 'bolaDeNieve'
      ? a.saldo - b.saldo || b.tasaMensual - a.tasaMensual
      : b.tasaMensual - a.tasaMensual || a.saldo - b.saldo;

  let mes = 0;
  let interesTotal = 0;
  const orden = [];
  const linea = [{ mesKey: mesActualKey(), total: sims.reduce((s, x) => s + x.saldo, 0) }];

  while (sims.some((s) => s.saldo > 0) && mes < 600) {
    mes += 1;
    let disponible = presupuesto;
    // 1) intereses del mes
    for (const s of sims) {
      if (s.saldo <= 0) continue;
      const interes = Math.round(s.saldo * s.tasaMensual);
      s.saldo += interes;
      interesTotal += interes;
    }
    // 2) pago base de cada deuda viva
    for (const s of sims) {
      if (s.saldo <= 0) continue;
      const pago = Math.min(s.pagoBase, s.saldo, disponible);
      s.saldo -= pago;
      disponible -= pago;
    }
    // 3) lo que sobra ataca por prioridad
    const vivas = () => sims.filter((s) => s.saldo > 0).sort(prioridad);
    let objetivo = vivas()[0];
    while (disponible > 0 && objetivo) {
      const pago = Math.min(disponible, objetivo.saldo);
      objetivo.saldo -= pago;
      disponible -= pago;
      objetivo = vivas()[0];
    }
    const mesKey = sumarMeses(mesActualKey(), mes);
    for (const s of sims) {
      if (s.saldo <= 0 && !orden.some((o) => o.deuda.id === s.deuda.id)) {
        orden.push({ deuda: s.deuda, mes, mesKey });
      }
    }
    linea.push({ mesKey, total: sims.reduce((sum, x) => sum + Math.max(0, x.saldo), 0) });
  }

  const alcanzable = sims.every((s) => s.saldo <= 0);
  return {
    alcanzable,
    meses: mes,
    fechaLibre: sumarMeses(mesActualKey(), mes),
    interesTotal,
    pagoMensualTotal: presupuesto,
    orden,
    linea,
  };
}

// Pago base con el que la deuda entra al simulador.
function pagoBaseSim(d) {
  if (d.tipo === 'msi') return Math.min(mensualidadDe(d), saldoPendiente(d));
  if (d.tipo === 'tarjeta') {
    // Sin pago mínimo capturado: aprox. 3% del saldo, mínimo $200.
    return d.pagoMinimo || Math.max(20000, Math.round(saldoPendiente(d) * 0.03));
  }
  return d.mensualidad || 0;
}

/* =========================================================================
   Exportar / importar / borrar
   ========================================================================= */

export function exportarJSON() {
  return JSON.stringify(
    { app: 'lana', version: VERSION, exportadoEl: hoyISO(), datos: state },
    null,
    2,
  );
}

// → { ok: true } o { ok: false, error: 'mensaje legible' }
export function importarJSON(texto) {
  let crudo;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  const datos = crudo?.app === 'lana' ? crudo.datos : crudo;
  if (!datos || typeof datos !== 'object' || (!Array.isArray(datos.movimientos) && !Array.isArray(datos.deudas))) {
    return { ok: false, error: 'El archivo no parece un respaldo de Lana.' };
  }
  if (crudo?.app === 'lana' && Number(crudo.version) > VERSION) {
    return { ok: false, error: 'Este respaldo es de una versión más nueva de Lana.' };
  }
  state = normalizar(datos);
  commit();
  return { ok: true };
}

// CSV de movimientos (mes 'YYYY-MM' o null = todos), listo para Excel (BOM UTF-8).
export function exportarCSV(mes = null) {
  const filas = [['fecha', 'tipo', 'monto', 'categoria', 'nota', 'deuda']];
  const movs = (mes ? state.movimientos.filter((m) => mesKeyDe(m.fecha) === mes) : state.movimientos)
    .slice()
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  for (const m of movs) {
    filas.push([
      m.fecha,
      m.tipo,
      (m.monto / 100).toFixed(2),
      m.categoriaId ? (categoriaDe(m.categoriaId)?.nombre || '') : '',
      m.nota || '',
      m.deudaId ? (deudaDe(m.deudaId)?.nombre || '') : '',
    ]);
  }
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return '\ufeff' + filas.map((f) => f.map(esc).join(',')).join('\n');
}

export function borrarTodo() {
  state = estadoBase();
  commit();
}

/* =========================================================================
   Resumen del mes (para el dashboard)
   ========================================================================= */

// Fotografía del mes activo: cuánto entró (real o planeado), cuánto se ha
// gastado, compromisos de deuda y cuánto queda "libre".
// → { ingresoBase, usaPlaneado, gastos, comprometido, comprometidoPagado,
//     libre, pctGastado }
export function resumenDelMes(mes = ui.mes) {
  const { ingresos, gastos } = totalesDelMes(mes);
  const usaPlaneado = ingresos === 0 && state.ajustes.ingresoPlaneado > 0;
  const ingresoBase = usaPlaneado ? state.ajustes.ingresoPlaneado : ingresos;
  const comp = comprometidoMensual();
  const comprometidoPagado = comp.detalle.reduce(
    (s, x) => s + Math.min(x.monto, pagosDeDeudaEnMes(x.deuda.id, mes).reduce((t, m) => t + m.monto, 0)),
    0,
  );
  const comprometidoPendiente = Math.max(0, comp.total - comprometidoPagado);
  const libre = ingresoBase - gastos - comprometidoPendiente;
  return {
    ingresoBase,
    usaPlaneado,
    gastos,
    comprometido: comp.total,
    comprometidoPagado,
    comprometidoPendiente,
    libre,
    pctGastado: ingresoBase > 0 ? Math.round((gastos / ingresoBase) * 100) : 0,
  };
}
