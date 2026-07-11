// Sync de Cuentas Claras hacia Notion (unidireccional: la app es la fuente de
// verdad, Notion es el espejo). Habla con /api/notion (función de Netlify que
// solo reenvía a api.notion.com, porque Notion no permite CORS del navegador).
//
// Diseño:
//   - La config vive en ajustes.notion { token, paginaId, dbMovimientos,
//     dbDeudas, auto } — cifrada junto con todo lo demás si hay código.
//   - La contabilidad del sync vive en notionSync { paginas, hashes,
//     paginasDeudas, hashesDeudas, ultimaSync }: solo se manda lo nuevo o lo
//     que cambió, y lo borrado en la app se archiva en Notion.
//   - Primera vez: la app crea las dos databases dentro de la página que
//     Paulette compartió con su integración.

import * as store from './store.js';

const ENDPOINT = '/api/notion';
const PAUSA_MS = 340; // Notion permite ~3 peticiones/seg

let enCurso = false;
let timerAuto = null;

export const sincronizando = () => enCurso;

export function configurada() {
  const n = store.getState().ajustes.notion;
  return Boolean(n.token && n.paginaId);
}

// Acepta el link completo de la página de Notion o el id pelón.
export function extraerPaginaId(texto) {
  const limpio = String(texto || '').replaceAll('-', '');
  const m = limpio.match(/[0-9a-f]{32}(?![0-9a-f])/i);
  return m ? m[0].toLowerCase() : '';
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function llamar(path, method, body) {
  const { token } = store.getState().ajustes.notion;
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path, method, body }),
    });
  } catch {
    throw new Error('No hay conexión (¿estás sin internet?).');
  }
  if (res.status === 404) {
    throw new Error('Este sitio no tiene funciones de Netlify; el sync solo corre en la versión de Netlify.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new Error('Notion rechazó el token. Revísalo en notion.so/my-integrations.');
    if (json?.code === 'object_not_found') {
      throw new Error('Notion no encuentra la página. ¿Ya la compartiste con tu integración? (⋯ → Conexiones)');
    }
    throw new Error(json?.message || `Notion respondió ${res.status}.`);
  }
  return json;
}

/* =========================================================================
   Databases: se crean una sola vez dentro de la página compartida
   ========================================================================= */

const texto = (contenido) => [{ type: 'text', text: { content: String(contenido).slice(0, 1900) } }];

async function asegurarDatabases() {
  const cfg = store.getState().ajustes.notion;
  if (cfg.dbMovimientos && cfg.dbDeudas) return cfg;

  const parent = { type: 'page_id', page_id: cfg.paginaId };

  const dbMovs = await llamar('/v1/databases', 'POST', {
    parent,
    icon: { type: 'emoji', emoji: '🧾' },
    title: texto('Movimientos'),
    properties: {
      'Nota': { title: {} },
      'Fecha': { date: {} },
      'Tipo': { select: { options: [
        { name: 'gasto', color: 'red' },
        { name: 'ingreso', color: 'green' },
      ] } },
      'Monto': { number: { format: 'mexican_peso' } },
      'Categoría': { rich_text: {} },
      'Deuda': { rich_text: {} },
      'ID': { rich_text: {} },
    },
  });
  await pausa(PAUSA_MS);

  const dbDeudas = await llamar('/v1/databases', 'POST', {
    parent,
    icon: { type: 'emoji', emoji: '💪' },
    title: texto('Deudas'),
    properties: {
      'Nombre': { title: {} },
      'Tipo': { rich_text: {} },
      'Pendiente': { number: { format: 'mexican_peso' } },
      'Mensualidad': { number: { format: 'mexican_peso' } },
      'Día de pago': { number: {} },
      'Tasa anual %': { number: {} },
      'Liquidada': { checkbox: {} },
      'ID': { rich_text: {} },
    },
  });
  await pausa(PAUSA_MS);

  store.setNotionConfig({ dbMovimientos: dbMovs.id, dbDeudas: dbDeudas.id });
  return store.getState().ajustes.notion;
}

/* =========================================================================
   Propiedades y hashes
   ========================================================================= */

function infoMov(m) {
  const cat = m.categoriaId ? store.categoriaDe(m.categoriaId) : null;
  const deuda = m.deudaId ? store.deudaDe(m.deudaId) : null;
  return {
    titulo: m.nota || cat?.nombre || (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'),
    categoria: cat?.nombre || '',
    deuda: deuda?.nombre || '',
  };
}

const hashMov = (m, info) =>
  [m.fecha, m.tipo, m.monto, info.titulo, info.categoria, info.deuda].join('|');

const propsMov = (m, info) => ({
  'Nota': { title: texto(info.titulo) },
  'Fecha': { date: { start: m.fecha } },
  'Tipo': { select: { name: m.tipo } },
  'Monto': { number: m.monto / 100 },
  'Categoría': { rich_text: info.categoria ? texto(info.categoria) : [] },
  'Deuda': { rich_text: info.deuda ? texto(info.deuda) : [] },
  'ID': { rich_text: texto(m.id) },
});

function hashDeuda(d) {
  return [d.nombre, d.tipo, store.saldoPendiente(d), store.mensualidadDe(d), d.diaPago ?? '', d.tasaAnual ?? ''].join('|');
}

const propsDeuda = (d) => ({
  'Nombre': { title: texto(d.nombre) },
  'Tipo': { rich_text: texto(store.TIPOS_DEUDA[d.tipo]?.nombre || d.tipo) },
  'Pendiente': { number: store.saldoPendiente(d) / 100 },
  'Mensualidad': { number: store.mensualidadDe(d) / 100 },
  'Día de pago': { number: d.diaPago ?? null },
  'Tasa anual %': { number: d.tasaAnual ?? 0 },
  'Liquidada': { checkbox: store.saldoPendiente(d) === 0 },
  'ID': { rich_text: texto(d.id) },
});

/* =========================================================================
   Sync
   ========================================================================= */

// Sincroniza una colección contra su database. Muta `mapas` (paginas/hashes).
async function sincronizarColeccion({ elementos, dbId, mapas, propsDe, hashDe }) {
  let creados = 0;
  let actualizados = 0;
  let archivados = 0;
  const vivos = new Set();

  for (const el of elementos) {
    vivos.add(el.id);
    const hash = hashDe(el);
    if (!mapas.paginas[el.id]) {
      const r = await llamar('/v1/pages', 'POST', {
        parent: { database_id: dbId },
        properties: propsDe(el),
      });
      mapas.paginas[el.id] = r.id;
      mapas.hashes[el.id] = hash;
      creados += 1;
      await pausa(PAUSA_MS);
    } else if (mapas.hashes[el.id] !== hash) {
      await llamar(`/v1/pages/${mapas.paginas[el.id]}`, 'PATCH', { properties: propsDe(el) });
      mapas.hashes[el.id] = hash;
      actualizados += 1;
      await pausa(PAUSA_MS);
    }
  }

  for (const id of Object.keys(mapas.paginas)) {
    if (vivos.has(id)) continue;
    await llamar(`/v1/pages/${mapas.paginas[id]}`, 'PATCH', { archived: true });
    delete mapas.paginas[id];
    delete mapas.hashes[id];
    archivados += 1;
    await pausa(PAUSA_MS);
  }

  return { creados, actualizados, archivados };
}

// → { ok, creados, actualizados, archivados } | { ok: false, error }
export async function sincronizar() {
  if (enCurso) return { ok: false, error: 'Ya hay un sync corriendo, dale un momento.' };
  if (!configurada()) return { ok: false, error: 'Primero guarda tu token y tu página de Notion.' };

  enCurso = true;
  const st = store.getState();
  // Copia de trabajo: si algo truena a medio camino, lo que sí se creó se
  // guarda igual (para no duplicar filas en el siguiente intento).
  const sync = JSON.parse(JSON.stringify(st.notionSync));
  const movs = { paginas: sync.paginas, hashes: sync.hashes };
  const deudas = { paginas: sync.paginasDeudas, hashes: sync.hashesDeudas };

  try {
    const cfg = await asegurarDatabases();
    const rMovs = await sincronizarColeccion({
      elementos: st.movimientos,
      dbId: cfg.dbMovimientos,
      mapas: movs,
      propsDe: (m) => propsMov(m, infoMov(m)),
      hashDe: (m) => hashMov(m, infoMov(m)),
    });
    const rDeudas = await sincronizarColeccion({
      elementos: st.deudas,
      dbId: cfg.dbDeudas,
      mapas: deudas,
      propsDe: propsDeuda,
      hashDe: hashDeuda,
    });
    sync.ultimaSync = new Date().toISOString();
    return {
      ok: true,
      creados: rMovs.creados + rDeudas.creados,
      actualizados: rMovs.actualizados + rDeudas.actualizados,
      archivados: rMovs.archivados + rDeudas.archivados,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    enCurso = false;
    store.setNotionSync(sync); // guarda también el progreso parcial
  }
}

/* =========================================================================
   Auto-sync (main.js lo llama en cada cambio del store)
   ========================================================================= */

// Solo se agenda un sync cuando cambian los DATOS (movimientos/deudas/
// categorías), no cuando cambia la contabilidad del propio sync — si no,
// el setNotionSync del final re-agendaría syncs por siempre.
let ultimaHuella = '';

export function alCambiarEstado() {
  const st = store.getState();
  const huella = JSON.stringify([st.movimientos, st.deudas, st.categorias]);
  if (huella === ultimaHuella) return;
  ultimaHuella = huella;

  const cfg = st.ajustes.notion;
  if (!cfg.auto || !configurada() || enCurso) return;
  clearTimeout(timerAuto);
  timerAuto = setTimeout(async () => {
    const r = await sincronizar();
    if (!r.ok) console.warn('Cuentas Claras: auto-sync a Notion falló —', r.error);
  }, 45000);
}
