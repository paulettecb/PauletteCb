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

async function llamar(path, method, body, version) {
  const { token } = store.getState().ajustes.notion;
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path, method, body, version }),
    });
  } catch {
    throw new Error('No hay conexión (¿estás sin internet?).');
  }
  if (res.status === 404) {
    throw new Error('Este sitio no tiene funciones de Netlify; el sync solo corre en la versión de Netlify.');
  }
  // Lee el cuerpo como texto y trata de parsearlo: así, si Notion (o el proxy)
  // devuelve un 500 SIN JSON, igual mostramos el texto en vez de un "500" pelón.
  const textoResp = await res.text();
  let json = null;
  try { json = textoResp ? JSON.parse(textoResp) : null; } catch { json = null; }
  if (!res.ok) {
    if (res.status === 401) throw new Error('Notion rechazó el token. Revísalo en notion.so/my-integrations.');
    if (json?.code === 'object_not_found') {
      throw new Error('Notion no encuentra la página. ¿Ya la compartiste con tu integración? (⋯ → Conexiones)');
    }
    const detalle = json?.message || (textoResp ? textoResp.trim().slice(0, 180) : '');
    throw new Error(detalle ? `Notion respondió ${res.status}: ${detalle}` : `Notion respondió ${res.status}.`);
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

  // Antes de crear, reusa las databases que YA existan en la página compartida
  // (así no se duplican, y el "traer de Notion" encuentra lo que ya está ahí).
  const existentes = await buscarDatabases(cfg.paginaId);
  let dbMovId = cfg.dbMovimientos || existentes.Movimientos;
  let dbDeudasId = cfg.dbDeudas || existentes.Deudas;
  const parent = { type: 'page_id', page_id: cfg.paginaId };

  if (!dbMovId) {
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
        'Origen': { select: { options: [{ name: 'KYN', color: 'purple' }] } },
        'ID': { rich_text: {} },
      },
    });
    dbMovId = dbMovs.id;
    await pausa(PAUSA_MS);
  }

  if (!dbDeudasId) {
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
    dbDeudasId = dbDeudas.id;
    await pausa(PAUSA_MS);
  }

  store.setNotionConfig({ dbMovimientos: dbMovId, dbDeudas: dbDeudasId });
  return store.getState().ajustes.notion;
}

// Busca por título las databases "Movimientos"/"Deudas" que cuelgan de la página
// compartida, para reusarlas en vez de crear duplicados. Pagina el /v1/search y
// deja que un error de red/API se propague (fail-closed): mejor abortar que crear
// un duplicado por no haber "visto" la database que ya existía.
async function buscarDatabases(paginaId) {
  const res = { Movimientos: '', Deudas: '' };
  const objetivo = String(paginaId || '').replaceAll('-', '');
  if (!objetivo) return res;
  let cursor;
  do {
    const body = { filter: { value: 'database', property: 'object' }, page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const data = await llamar('/v1/search', 'POST', body);
    for (const db of data.results || []) {
      const padre = String(db.parent?.page_id || '').replaceAll('-', '');
      if (padre !== objetivo) continue;
      const titulo = (db.title || []).map((t) => t.plain_text || '').join('').trim();
      if (titulo === 'Movimientos' && !res.Movimientos) res.Movimientos = db.id;
      if (titulo === 'Deudas' && !res.Deudas) res.Deudas = db.id;
    }
    cursor = data.has_more ? data.next_cursor : null;
    if (cursor) await pausa(PAUSA_MS);
  } while (cursor);
  return res;
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
  [m.fecha, m.tipo, m.monto, info.titulo, info.categoria, info.deuda, m.origen || ''].join('|');

const propsMov = (m, info) => ({
  'Nota': { title: texto(info.titulo) },
  'Fecha': { date: { start: m.fecha } },
  'Tipo': { select: { name: m.tipo } },
  'Monto': { number: m.monto / 100 },
  'Categoría': { rich_text: info.categoria ? texto(info.categoria) : [] },
  'Deuda': { rich_text: info.deuda ? texto(info.deuda) : [] },
  'Origen': m.origen === 'kyn' ? { select: { name: 'KYN' } } : { select: null },
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
   Traer de Notion → app (el otro sentido: bidireccional para deudas)
   ========================================================================= */

// Normaliza para comparar tipos con tolerancia (minúsculas, sin acentos).
const normTexto = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Acepta tanto el nombre bonito ("Tarjeta de crédito") como la clave ("tarjeta"),
// con o sin acentos/mayúsculas, para no descartar filas por un typo del espejo.
const TIPO_POR_TEXTO = Object.fromEntries(
  Object.entries(store.TIPOS_DEUDA).flatMap(([clave, t]) => [
    [normTexto(t.nombre), clave],
    [normTexto(clave), clave],
  ]),
);
const tipoDesdeTexto = (txt) => TIPO_POR_TEXTO[normTexto(txt)] || null;

const textoProp = (p) => (p?.title || p?.rich_text || []).map((t) => t.plain_text || '').join('').trim();
const numeroProp = (p) => (typeof p?.number === 'number' ? p.number : null);
const pesosProp = (p) => { const n = numeroProp(p); return n == null ? null : Math.round(n * 100); };

// ¿La fila de Notion es más nueva que la última edición LOCAL de la deuda?
// Fail-safe: si hay una marca local legible y no podemos leer la de Notion,
// gana lo local (no pisamos un cambio fresco de la app con el espejo).
function esNotionMasReciente(existente, fila) {
  if (!existente || !existente.actualizadoEn) return true; // sin marca local → Notion manda
  const localMs = new Date(existente.actualizadoEn).getTime();
  if (Number.isNaN(localMs)) return true;
  const notionMs = fila?.last_edited_time ? new Date(fila.last_edited_time).getTime() : NaN;
  if (Number.isNaN(notionMs)) return false; // sin fecha de Notion → protege lo local
  return notionMs > localMs;
}

// Pagina un endpoint de query de Notion (mismo cuerpo/estructura para el clásico
// de database y el nuevo de data source) y devuelve TODAS las filas.
async function paginarQuery(path, version) {
  const filas = [];
  let cursor;
  do {
    const body = cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 };
    const data = await llamar(path, 'POST', body, version);
    filas.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
    if (cursor) await pausa(PAUSA_MS);
  } while (cursor);
  return filas;
}

// Descubre el "data source" de una database: Notion migró las databases a este
// modelo nuevo (una database puede tener varias fuentes). Se lee con la versión
// nueva de la API; si no aplica, devuelve null.
async function dataSourceDe(dbId) {
  const data = await llamar(`/v1/databases/${dbId}`, 'GET', null, '2025-09-03');
  return data?.data_sources?.[0]?.id || null;
}

// Trae TODAS las filas de la database Deudas (paginando).
// Notion migró las databases a "data sources" y en varias cuentas el endpoint
// clásico /v1/databases/{id}/query empezó a tronar con un 500. Por eso: intenta
// el clásico (lo que ya jalaba) y, si falla, cae al endpoint nuevo
// /v1/data_sources/{id}/query (versión 2025-09-03). Así el "traer de Notion"
// funciona tanto en cuentas viejas como en las ya migradas.
async function consultarFilas(dbId) {
  try {
    return await paginarQuery(`/v1/databases/${dbId}/query`, undefined);
  } catch (errClasico) {
    let dsId;
    try {
      dsId = await dataSourceDe(dbId);
    } catch {
      throw errClasico; // si ni descubrir el data source jala, reporta el error original
    }
    if (!dsId) throw errClasico;
    return await paginarQuery(`/v1/data_sources/${dsId}/query`, '2025-09-03');
  }
}

// Una fila de la database Deudas → { datos } listo para store.upsertDeuda, o
// { error } explicando por qué se omitió (para poder avisarle a Paulette).
// El espejo de Notion es simplificado, así que reconstruimos lo justo:
//   - Si la deuda YA existe, conservamos su estructura que Notion no refleja
//     (límite, día de corte, desglose de MSI) y su tipo.
//   - Solo pisamos los campos reflejados si la fila de Notion es MÁS NUEVA que
//     la última edición local (si no, se protege lo de la app).
//   - Un 0 en un monto NO borra un valor real existente (0 se trata como "vacío"
//     salvo en deudas nuevas); un null nunca pisa nada.
function deudaDesdeFila(fila) {
  const props = fila.properties || {};
  const id = textoProp(props['ID']);
  const nombre = textoProp(props['Nombre']);
  if (!id) return { error: 'sin ID' };
  if (!nombre) return { error: 'sin nombre' };

  const existente = store.deudaDe(id);
  const tipo = existente ? existente.tipo : tipoDesdeTexto(textoProp(props['Tipo']));
  if (!tipo) return { error: 'tipo no reconocido' };

  const nuevo = !existente;
  const manda = esNotionMasReciente(existente, fila); // ¿Notion pisa lo local?
  const pendiente = pesosProp(props['Pendiente']);
  const mensualidad = pesosProp(props['Mensualidad']);
  const tasa = numeroProp(props['Tasa anual %']);
  const dia = numeroProp(props['Día de pago']);

  // ponMonto: aplica un monto solo si Notion manda, no es null, y (es positivo o
  // la deuda es nueva) — así un 0 del espejo no borra una mensualidad real.
  const ponMonto = (v) => manda && v != null && (v > 0 || nuevo);
  const ponNum = (v) => manda && v != null; // tasa/día: 0 sí es un valor válido

  const base = { id, tipo };
  if (manda) base.nombre = nombre; // el nombre solo se refresca si Notion manda
  if (ponNum(dia)) base.diaPago = dia;

  if (tipo === 'tarjeta') {
    if (ponMonto(pendiente)) base.saldo = pendiente;
    if (ponMonto(mensualidad)) base.pagoMinimo = mensualidad;
    if (ponNum(tasa)) base.tasaAnual = tasa;
    if (existente) { base.limite = existente.limite; base.diaCorte = existente.diaCorte; }
  } else if (tipo === 'msi') {
    // MSI ya existente: no lo degrades; deja su montoTotal/meses/pagadas tal cual
    // (Notion no refleja el desglose y reconstruirlo lo corrompería).
    if (nuevo) {
      const total = pendiente ?? 0;
      const meses = mensualidad && mensualidad > 0 ? Math.max(1, Math.round(total / mensualidad)) : 1;
      base.montoTotal = total;
      base.meses = meses;
      base.mensualidadesPagadas = 0;
    }
  } else if (tipo === 'prestamo' || tipo === 'hipoteca') {
    if (ponMonto(pendiente)) { base.saldo = pendiente; base.montoOriginal = existente?.montoOriginal || pendiente; }
    if (ponMonto(mensualidad)) base.mensualidad = mensualidad;
    if (ponNum(tasa)) base.tasaAnual = tasa;
  } else if (tipo === 'persona') {
    if (ponMonto(pendiente)) base.saldo = pendiente;
    if (ponMonto(mensualidad)) base.mensualidad = mensualidad;
    base.tasaAnual = 0;
  }
  // aplico = tomamos los valores de Notion. Si es false (protegimos lo local),
  // el push debe volver a mandar lo local para corregir el espejo.
  return { datos: base, aplico: manda };
}

// Resuelve la database de Deudas SIN crear nada (traer es de solo lectura):
// usa la guardada en config o la busca en la página; si no existe, error claro.
async function resolverDbDeudas() {
  const cfg = store.getState().ajustes.notion;
  if (cfg.dbDeudas) return cfg.dbDeudas;
  const encontradas = await buscarDatabases(cfg.paginaId);
  if (encontradas.Deudas) {
    // Guárdala para que el próximo push la reuse (no re-descubrir cada vez).
    store.setNotionConfig({ dbDeudas: encontradas.Deudas });
    return encontradas.Deudas;
  }
  throw new Error('No encontré tu database de "Deudas" en esa página. Primero manda con ⬆️, o revisa que la página sea la correcta.');
}

// Lee la database Deudas de Notion y la vuelca a la app: crea las que falten y
// actualiza las que ya tengas SIN pisar cambios locales más nuevos ni degradar
// MSI. NO crea databases (es solo lectura). Registra el mapeo para que el push
// no duplique, y hace UN solo commit al final.
// → { ok, traidas, omitidas } | { ok: false, error }
export async function traerDeNotion() {
  if (enCurso) return { ok: false, error: 'Ya hay un sync corriendo, dale un momento.' };
  if (!configurada()) return { ok: false, error: 'Primero guarda tu token y tu página de Notion.' };

  enCurso = true;
  const sync = JSON.parse(JSON.stringify(store.getState().notionSync));
  let traidas = 0;
  let omitidas = 0;
  try {
    const dbDeudas = await resolverDbDeudas();
    const filas = await consultarFilas(dbDeudas);
    for (const fila of filas) {
      if (fila.archived) continue;
      const { datos, error, aplico } = deudaDesdeFila(fila);
      if (error) { omitidas += 1; continue; }
      const d = store.upsertDeuda(datos, { commit: false }); // commit único al final
      if (d) {
        sync.paginasDeudas[d.id] = fila.id;
        // Si tomamos los valores de Notion, el hash cuadra y el próximo push
        // no re-manda. Si protegimos lo local, borramos el hash para que el
        // push corrija el espejo con lo de la app.
        if (aplico) sync.hashesDeudas[d.id] = hashDeuda(d);
        else delete sync.hashesDeudas[d.id];
        traidas += 1;
      } else {
        omitidas += 1;
      }
    }
    sync.ultimaSync = new Date().toISOString();
    return { ok: true, traidas, omitidas };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    enCurso = false;
    // setNotionSync hace commit(): persiste de una vez las deudas traídas Y el mapeo.
    store.setNotionSync(sync);
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
