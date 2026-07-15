// Store de Cuentas Claras: estado, persistencia en localStorage y toda la lógica de dinero.
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
//   Gráfica:     serieDeuda() → {historia, proyeccion, totalHoy, alcanzable}
//   Datos:       exportarJSON(), importarJSON(str), exportarCSV(mes|null), borrarTodo(),
//                setIngresoPlaneado, setNombre
//   Candado:     await iniciar(codigo?) — ANTES de montar el shell —, tieneCodigo(),
//                await activarCodigo(codigo), quitarCodigo(), bloquear()
//
// Regla de oro: TODOS los montos son centavos (enteros). Ver utils.js.

import {
  uid, hoyISO, mesActualKey, mesKeyDe, clampDia, fechaISO,
  sumarMeses, diasEnMes, fmtMoney,
} from './utils.js';
import { nuevoSalt, derivarLlave, cifrar, descifrar } from './crypto.js';

const KEY = 'cuentasclaras.v1';
const KEY_ANTERIOR = 'lana.v1'; // nombre viejo de la app; se migra al cargar
const VERSION = 1;

/* =========================================================================
   Catálogos
   ========================================================================= */

export const TIPOS_DEUDA = {
  tarjeta:  { emoji: '💳', nombre: 'Tarjeta de crédito' },
  msi:      { emoji: '🛍️', nombre: 'Meses sin intereses' },
  prestamo: { emoji: '🏦', nombre: 'Préstamo' },
  hipoteca: { emoji: '🏠', nombre: 'Hipoteca' },
  persona:  { emoji: '🤝', nombre: 'Deuda con persona' },
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

// Página "Cuentas Claras" en el Notion de Paulette (creada de fábrica); solo
// sirve si su integración tiene acceso a ella, así que no es ningún secreto.
const NOTION_PAGINA_DEFAULT = '39a9be0259d181a6ad3ed9efe9aa38cd';

function notionBase() {
  return { token: '', paginaId: NOTION_PAGINA_DEFAULT, dbMovimientos: '', dbDeudas: '', auto: false };
}

function estadoBase() {
  return {
    version: VERSION,
    ajustes: { nombre: '', ingresoPlaneado: 0, notion: notionBase() },
    // Contabilidad del sync a Notion: id local → página de Notion / hash enviado.
    notionSync: { paginas: {}, hashes: {}, paginasDeudas: {}, hashesDeudas: {}, ultimaSync: '' },
    categorias: JSON.parse(JSON.stringify(CATEGORIAS_BASE)),
    // movimiento: { id, tipo:'gasto'|'ingreso', fecha:'YYYY-MM-DD', monto,
    //               categoriaId|null, nota, deudaId|null, creadoEn }
    movimientos: [],
    // deuda común: { id, tipo, nombre, creadoEn, actualizadoEn }
    //   actualizadoEn = ISO de la última edición LOCAL (pago, ajuste, editar).
    //   Sirve para que "traer de Notion" no pise un cambio fresco de la app con
    //   un valor viejo del espejo (ver notion.js → esNotionMasReciente).
    //   tarjeta:  + { saldo, limite, tasaAnual, diaCorte, diaPago, pagoMinimo }
    //   msi:      + { montoTotal, meses, mensualidadesPagadas, diaPago }
    //   prestamo|hipoteca: + { saldo, montoOriginal, mensualidad, tasaAnual, diaPago }
    deudas: [],
    // presupuesto mensual por categoría: { [categoriaId]: centavos }
    presupuesto: {},
    // foto mensual de la deuda total: [{ mesKey:'YYYY-MM', total }] (para la gráfica)
    historialDeuda: [],
  };
}

// Lee el almacén crudo. Formatos posibles:
//   { cifrado: true, salt, iv, blob }  ← con código de acceso
//   { cifrado: false, datos }          ← formato actual sin código
//   estado plano con .movimientos      ← formatos viejos (lana.v1 / pre-cifrado)
function leerAlmacen() {
  try {
    const crudo = localStorage.getItem(KEY) ?? localStorage.getItem(KEY_ANTERIOR);
    if (!crudo) return null;
    const parseado = JSON.parse(crudo);
    if (parseado && typeof parseado === 'object' && 'cifrado' in parseado) return parseado;
    return { cifrado: false, datos: parseado };
  } catch {
    return null;
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
      notion: saneaNotion(datos.ajustes?.notion),
    },
    notionSync: saneaNotionSync(datos.notionSync),
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
        // De dónde vino el dinero (por ahora solo se distingue KYN).
        origen: m.origen === 'kyn' ? 'kyn' : null,
        creadoEn: m.creadoEn || '',
      })),
    deudas: (Array.isArray(datos.deudas) ? datos.deudas : [])
      .filter((d) => d && d.id && TIPOS_DEUDA[d.tipo] && d.nombre)
      .map((d) => {
        // Las deudas con personas pueden no tener día de abono (diaPago null);
        // el resto de los tipos siempre traen día (los formularios lo exigen).
        const sinDia = d.tipo === 'persona' && !Number(d.diaPago);
        const comun = {
          id: String(d.id), tipo: d.tipo, nombre: String(d.nombre).slice(0, 60),
          creadoEn: d.creadoEn || '', diaPago: sinDia ? null : clampDiaLibre(d.diaPago),
          actualizadoEn: str(d.actualizadoEn, 40),
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
          // Con personas no corren intereses formales.
          tasaAnual: d.tipo === 'persona' ? 0 : Math.max(0, num(d.tasaAnual)),
        };
      }),
    presupuesto: {},
    historialDeuda: saneaHistorial(datos.historialDeuda),
  };
  if (datos.presupuesto && typeof datos.presupuesto === 'object') {
    for (const [catId, monto] of Object.entries(datos.presupuesto)) {
      if (['__proto__', 'constructor', 'prototype'].includes(catId)) continue;
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

// Marca de tiempo de la última edición local (para el sync con Notion).
const ahoraISO = () => new Date().toISOString();

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

function saneaNotion(crudo) {
  const base = notionBase();
  if (!crudo || typeof crudo !== 'object') return base;
  return {
    token: str(crudo.token, 300),
    paginaId: str(crudo.paginaId, 64) || base.paginaId,
    dbMovimientos: str(crudo.dbMovimientos, 64),
    dbDeudas: str(crudo.dbDeudas, 64),
    auto: Boolean(crudo.auto),
  };
}

function saneaMapa(crudo) {
  const mapa = {};
  if (!crudo || typeof crudo !== 'object') return mapa;
  for (const [k, v] of Object.entries(crudo)) {
    if (['__proto__', 'constructor', 'prototype'].includes(k)) continue;
    if (typeof v === 'string' || typeof v === 'number') mapa[String(k)] = String(v);
  }
  return mapa;
}

function saneaNotionSync(crudo) {
  return {
    paginas: saneaMapa(crudo?.paginas),
    hashes: saneaMapa(crudo?.hashes),
    paginasDeudas: saneaMapa(crudo?.paginasDeudas),
    hashesDeudas: saneaMapa(crudo?.hashesDeudas),
    ultimaSync: str(crudo?.ultimaSync, 40),
  };
}

function saneaHistorial(crudo) {
  if (!Array.isArray(crudo)) return [];
  return crudo
    .filter((p) => p && /^\d{4}-\d{2}$/.test(p.mesKey) && Number.isFinite(Number(p.total)))
    .map((p) => ({ mesKey: p.mesKey, total: Math.max(0, Math.round(Number(p.total))) }))
    .slice(-120); // guarda a lo mucho 10 años de fotos mensuales
}

let state = estadoBase(); // se hidrata en iniciar()

// Candado: la llave AES vive SOLO en memoria mientras la sesión está abierta.
let llaveCifrado = null;
let saltActual = null;
let seqEscritura = 0; // los cifrados son async; solo aterriza el más reciente

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

function guardarCrudo(objeto) {
  try {
    localStorage.setItem(KEY, JSON.stringify(objeto));
  } catch (e) {
    console.error('Cuentas Claras: no se pudo guardar', e);
  }
}

function persistir() {
  if (llaveCifrado) {
    const token = ++seqEscritura;
    cifrar(JSON.stringify(state), llaveCifrado)
      .then((c) => {
        if (token !== seqEscritura) return; // ya hay una escritura más nueva
        guardarCrudo({ cifrado: true, salt: saltActual, iv: c.iv, blob: c.blob });
      })
      .catch((e) => console.error('Cuentas Claras: no se pudo cifrar', e));
  } else {
    guardarCrudo({ cifrado: false, datos: state });
  }
}

// Foto de la deuda total del mes actual: congela los meses pasados y mantiene
// el mes en curso en vivo. Solo empieza a guardar cuando ha habido deuda alguna
// vez (así quien nunca usa deudas no acumula ceros).
function snapshotDeuda() {
  const total = state.deudas.reduce((s, d) => s + saldoPendiente(d), 0);
  const hist = state.historialDeuda;
  if (total === 0 && hist.length === 0) return;
  const mes = mesActualKey();
  const ult = hist[hist.length - 1];
  if (ult && ult.mesKey === mes) ult.total = total;
  else hist.push({ mesKey: mes, total });
  if (hist.length > 120) state.historialDeuda = hist.slice(-120);
}

function commit() {
  snapshotDeuda();
  persistir();
  notificar();
}

/* =========================================================================
   Arranque y código de acceso
   ========================================================================= */

// main.js llama esto ANTES de montar el shell (y otra vez con el código si
// está bloqueado). → { ok: true } | { ok: false, bloqueado: true, codigoMalo? }
export async function iniciar(codigo = null) {
  const crudo = leerAlmacen();
  if (!crudo) {
    state = estadoBase();
    return { ok: true };
  }
  if (!crudo.cifrado) {
    state = normalizar(crudo.datos);
    return { ok: true };
  }
  if (codigo == null) return { ok: false, bloqueado: true };
  try {
    const llave = await derivarLlave(codigo, crudo.salt);
    state = normalizar(JSON.parse(await descifrar(crudo, llave)));
    llaveCifrado = llave;
    saltActual = crudo.salt;
    return { ok: true };
  } catch {
    return { ok: false, bloqueado: true, codigoMalo: true };
  }
}

export const tieneCodigo = () => llaveCifrado != null;

// Activa el código (o lo cambia: re-deriva con salt nuevo) y re-guarda cifrado.
export async function activarCodigo(codigo) {
  saltActual = nuevoSalt();
  llaveCifrado = await derivarLlave(codigo, saltActual);
  persistir();
  notificar();
}

// Quita el código (la sesión ya está abierta) y re-guarda en claro.
export function quitarCodigo() {
  llaveCifrado = null;
  saltActual = null;
  persistir();
  notificar();
}

// Suelta la llave y recarga: la app queda en la pantalla de código.
export function bloquear() {
  llaveCifrado = null;
  location.reload();
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

export function agregarMovimiento({ tipo, fecha, monto, categoriaId = null, nota = '', deudaId = null, origen = null }) {
  const mov = {
    id: uid(),
    tipo: tipo === 'ingreso' ? 'ingreso' : 'gasto',
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') ? fecha : hoyISO(),
    monto: Math.max(0, Math.round(monto || 0)),
    categoriaId,
    nota: (nota || '').slice(0, 200),
    deudaId,
    origen: origen === 'kyn' ? 'kyn' : null,
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
  // Los MSI no se tocan: su avance se mide en mensualidades, no en pesos.
  if (mov.deudaId && montoNuevo !== mov.monto && deudaDe(mov.deudaId)?.tipo !== 'msi') {
    aplicarEfectoPago(mov.deudaId, -mov.monto);
    aplicarEfectoPago(mov.deudaId, montoNuevo);
  }
  if (cambios.fecha && /^\d{4}-\d{2}-\d{2}$/.test(cambios.fecha)) mov.fecha = cambios.fecha;
  if (cambios.nota != null) mov.nota = String(cambios.nota).slice(0, 200);
  if (cambios.categoriaId !== undefined && !mov.deudaId) mov.categoriaId = cambios.categoriaId;
  if (cambios.origen !== undefined) mov.origen = cambios.origen === 'kyn' ? 'kyn' : null;
  mov.monto = montoNuevo;
  commit();
}

// Ingresos del mes por origen: cuánto puso KYN. → { total, kyn, pctKyn }
export function origenIngresos(mes = ui.mes) {
  let total = 0;
  let kyn = 0;
  for (const m of state.movimientos) {
    if (m.tipo !== 'ingreso' || mesKeyDe(m.fecha) !== mes) continue;
    total += m.monto;
    if (m.origen === 'kyn') kyn += m.monto;
  }
  return { total, kyn, pctKyn: total > 0 ? Math.round((kyn / total) * 100) : 0 };
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

export function setNotionConfig(cambios) {
  const anterior = state.ajustes.notion;
  const fusion = { ...anterior, ...cambios };
  // Si cambió la página, las databases descubiertas antes ya no cuelgan de ahí:
  // se limpian para re-descubrirlas/crearlas y no apuntar a otra página.
  if (cambios.paginaId !== undefined && cambios.paginaId !== anterior.paginaId) {
    fusion.dbMovimientos = '';
    fusion.dbDeudas = '';
  }
  state.ajustes.notion = saneaNotion(fusion);
  commit();
}

export function setNotionSync(sync) {
  state.notionSync = saneaNotionSync(sync);
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
    // Con todas las mensualidades dadas la deuda está saldada, aunque el
    // redondeo de montoTotal/meses deje centavos huérfanos.
    if (deuda.mensualidadesPagadas >= deuda.meses) return 0;
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
  const deuda = normalizar({ deudas: [{ ...datos, id: `deuda-${uid()}`, creadoEn: hoyISO(), actualizadoEn: ahoraISO() }] }).deudas[0];
  if (!deuda) return null;
  state.deudas.push(deuda);
  commit();
  return deuda;
}

export function editarDeuda(id, cambios) {
  const idx = state.deudas.findIndex((d) => d.id === id);
  if (idx === -1) return;
  const fusion = { ...state.deudas[idx], ...cambios, id, tipo: state.deudas[idx].tipo, actualizadoEn: ahoraISO() };
  const limpia = normalizar({ deudas: [fusion] }).deudas[0];
  if (limpia) state.deudas[idx] = limpia;
  commit();
}

// Inserta o mezcla una deuda por id (para traerla desde Notion). Si ya existe,
// respeta su tipo y conserva los campos que Notion NO refleja (límite, día de
// corte, estructura de MSI): solo pisa lo que venga en `datos`. NO estampa
// actualizadoEn: un "traer" no es una edición local (esa marca protege lo local).
// Con { commit:false } muta el estado pero no persiste: quien trae en lote
// hace un solo commit al final (evita N escrituras y N auto-syncs).
export function upsertDeuda(datos, { commit: hacerCommit = true } = {}) {
  if (!datos || !datos.id) return null;
  const idx = state.deudas.findIndex((d) => d.id === datos.id);
  if (idx === -1) {
    const nueva = normalizar({ deudas: [{ ...datos, creadoEn: hoyISO() }] }).deudas[0];
    if (!nueva) return null;
    state.deudas.push(nueva);
  } else {
    const fusion = { ...state.deudas[idx], ...datos, id: datos.id, tipo: state.deudas[idx].tipo };
    const limpia = normalizar({ deudas: [fusion] }).deudas[0];
    if (limpia) state.deudas[idx] = limpia;
  }
  if (hacerCommit) commit();
  return state.deudas.find((d) => d.id === datos.id) || null;
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
  deuda.actualizadoEn = ahoraISO();
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
  deuda.actualizadoEn = ahoraISO();
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
    origen: null,
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

// Serie para la gráfica "así va tu deuda":
//   historia    = fotos mensuales REALES (pueden subir); el mes actual siempre
//                 refleja el total en vivo, aunque commit aún no lo haya escrito.
//   proyeccion  = si sigues pagando lo de siempre, cómo baja la deuda hasta 0
//                 (todas las deudas activas, sin extra). Vacía si no es alcanzable
//                 o si tomaría más de 10 años (ahí mejor manda el plan, no la gráfica).
// → { historia:[{mesKey,total}], proyeccion:[{mesKey,total}], totalHoy, alcanzable }
export function serieDeuda() {
  const historia = state.historialDeuda.map((p) => ({ ...p }));
  const totalHoy = state.deudas.reduce((s, d) => s + saldoPendiente(d), 0);
  const mesHoy = mesActualKey();
  const ult = historia[historia.length - 1];
  if (ult && ult.mesKey === mesHoy) ult.total = totalHoy;
  else if (totalHoy > 0 || historia.length) historia.push({ mesKey: mesHoy, total: totalHoy });

  let proyeccion = [];
  let alcanzable = true;
  if (deudasActivas().length) {
    const plan = planDePagos({ estrategia: 'avalancha', extraMensual: 0, incluirIds: null });
    alcanzable = plan.alcanzable;
    if (plan.alcanzable && plan.linea.length > 1 && plan.meses <= 120) {
      proyeccion = plan.linea.map((p) => ({ ...p }));
    }
  }
  return { historia, proyeccion, totalHoy, alcanzable };
}

// Pago base con el que la deuda entra al simulador.
function pagoBaseSim(d) {
  if (d.tipo === 'msi') return Math.min(mensualidadDe(d), saldoPendiente(d));
  if (d.tipo === 'tarjeta') {
    // Sin pago mínimo capturado: aprox. 3% del saldo, mínimo $200.
    return d.pagoMinimo || Math.max(20000, Math.round(saldoPendiente(d) * 0.03));
  }
  if (d.tipo === 'persona' && !d.mensualidad) {
    // Sin abono acordado: supone 5% del saldo, mínimo $200, para poder planear.
    return Math.max(20000, Math.round(saldoPendiente(d) * 0.05));
  }
  return d.mensualidad || 0;
}

/* =========================================================================
   Exportar / importar / borrar
   ========================================================================= */

export function exportarJSON() {
  return JSON.stringify(
    { app: 'cuentas-claras', version: VERSION, exportadoEl: hoyISO(), datos: state },
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
  const esPropio = crudo?.app === 'cuentas-claras' || crudo?.app === 'lana';
  const datos = esPropio ? crudo.datos : crudo;
  if (!datos || typeof datos !== 'object' || (!Array.isArray(datos.movimientos) && !Array.isArray(datos.deudas))) {
    return { ok: false, error: 'El archivo no parece un respaldo de Cuentas Claras.' };
  }
  if (esPropio && Number(crudo.version) > VERSION) {
    return { ok: false, error: 'Este respaldo es de una versión más nueva de Cuentas Claras.' };
  }
  state = normalizar(datos);
  commit();
  return { ok: true };
}

// CSV de movimientos (mes 'YYYY-MM' o null = todos), listo para Excel (BOM UTF-8).
export function exportarCSV(mes = null) {
  const filas = [['fecha', 'tipo', 'monto', 'categoria', 'nota', 'deuda', 'origen']];
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
      m.origen === 'kyn' ? 'KYN' : '',
    ]);
  }
  const esc = (v) => {
    let s = String(v ?? '');
    // Anti-inyección de fórmulas: Excel ejecuta celdas que empiezan con = + - @.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return '\ufeff' + filas.map((f) => f.map(esc).join(',')).join('\n');
}

// Borra datos Y código de acceso (sirve también como salida de emergencia
// desde la pantalla de bloqueo cuando el código se olvidó).
export function borrarTodo() {
  llaveCifrado = null;
  saltActual = null;
  state = estadoBase();
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_ANTERIOR);
  } catch { /* sin almacenamiento no hay nada que borrar */ }
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
