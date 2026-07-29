// Registro de visitas de paulettecb.com — analítica propia, privada y sin terceros.
//
// Qué guarda: contadores agregados por día (visitas, personas distintas del día,
// páginas, de dónde llegaron, país y tipo de dispositivo) en Netlify Blobs, dentro
// del mismo sitio. Nada sale a otro servicio.
//
// Qué NO guarda: IPs, user-agents, cookies, ni identificadores que sobrevivan al día.
// Para contar "personas distintas" se calcula un hash irreversible de
// (IP + navegador + fecha + sal secreta). Como la fecha entra en el hash, el mismo
// visitante da un hash distinto cada día: es imposible seguirlo entre días.
//
// Endpoints (vía /api/visitas, ver netlify/_redirects):
//   POST  → registra una visita. Público, lo llama public/visitas.js. Responde 204 siempre.
//   GET   → devuelve los agregados para el panel. Exige el token de Paulette
//           (header `x-visitas-token`, variable de entorno VISITAS_TOKEN en Netlify).

import { getStore, getDeployStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

// Topes para que un bot o un troll no infle el blob con miles de llaves basura.
const MAX_LLAVES = { rutas: 300, referrers: 200, paises: 250, dispositivos: 8, idiomas: 40 };
const MAX_HASHES_POR_DIA = 20000;
const MAX_LARGO_TEXTO = 120;
const DIAS_POR_DEFECTO = 30;
const MAX_DIAS = 365;

const BOTS = /bot|crawler|spider|crawling|slurp|facebookexternalhit|preview|monitor|lighthouse|headless|curl|wget|python-requests|axios|node-fetch/i;

const json = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// Producción escribe en el almacén global (persiste entre deploys y no se borra
// solo). Los previews y las ramas escriben en su propio almacén del deploy, para
// que las pruebas no ensucien las cifras reales ni al revés.
const almacen = () =>
  process.env.CONTEXT === 'production'
    ? getStore({ name: 'visitas', consistency: 'strong' })
    : getDeployStore({ name: 'visitas', consistency: 'strong' });

const fechaISO = (d = new Date()) => d.toISOString().slice(0, 10);

const llaveDia = (fecha) => `dia/${fecha}`;

/** Recorta y limpia texto libre que viene del navegador. */
const limpiar = (valor, largo = MAX_LARGO_TEXTO) =>
  typeof valor === 'string' ? valor.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, largo) : '';

/**
 * Normaliza la ruta visitada: solo el path del sitio, sin query ni hash
 * (ahí es donde se cuelan tokens y datos personales de otras apps).
 */
function normalizarRuta(valor) {
  let ruta = limpiar(valor);
  if (!ruta.startsWith('/')) return null;
  ruta = ruta.split('?')[0].split('#')[0];
  if (ruta.length > 1 && ruta.endsWith('/index.html')) ruta = ruta.slice(0, -'index.html'.length);
  return ruta || '/';
}

/** Del referrer solo interesa el dominio; la URL completa es más info de la necesaria. */
function normalizarReferrer(valor, host) {
  const crudo = limpiar(valor, 300);
  if (!crudo) return '(directo)';
  try {
    const { hostname } = new URL(crudo);
    if (!hostname || hostname === host) return '(directo)';
    return hostname.replace(/^www\./, '').slice(0, MAX_LARGO_TEXTO);
  } catch {
    return '(directo)';
  }
}

function dispositivoPorAncho(ancho) {
  const n = Number(ancho);
  if (!Number.isFinite(n) || n <= 0) return 'desconocido';
  if (n < 768) return 'móvil';
  if (n < 1100) return 'tablet';
  return 'escritorio';
}

function normalizarIdioma(valor) {
  const idioma = limpiar(valor, 8).toLowerCase().split('-')[0];
  return /^[a-z]{2,3}$/.test(idioma) ? idioma : 'otro';
}

/** Suma 1 en un mapa de conteos, respetando el tope de llaves distintas. */
function sumar(mapa, llave, tope) {
  if (!llave) return;
  if (mapa[llave] === undefined) {
    if (Object.keys(mapa).length >= tope) {
      mapa['(otros)'] = (mapa['(otros)'] || 0) + 1;
      return;
    }
    mapa[llave] = 0;
  }
  mapa[llave] += 1;
}

function diaVacio(fecha) {
  return {
    fecha,
    visitas: 0,
    personas: 0,
    rutas: {},
    referrers: {},
    paises: {},
    dispositivos: {},
    idiomas: {},
    hashes: [],
  };
}

/**
 * Hash del visitante para contar personas distintas del día.
 * Irreversible y con la fecha adentro: no permite seguir a nadie entre días.
 */
function hashVisitante({ ip, ua, fecha, sal }) {
  return createHash('sha256').update(`${ip}|${ua}|${fecha}|${sal}`).digest('hex').slice(0, 16);
}

function tokenValido(recibido) {
  const esperado = process.env.VISITAS_TOKEN;
  if (!esperado) return false;
  const a = Buffer.from(String(recibido || ''));
  const b = Buffer.from(esperado);
  // timingSafeEqual exige mismo largo; el hash iguala largos sin filtrar el real.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

async function registrarVisita(req, context) {
  const ua = req.headers.get('user-agent') || '';
  // Los bots no son visitas: se descartan en silencio (204, igual que una visita real).
  if (!ua || BOTS.test(ua)) return new Response(null, { status: 204 });

  let cuerpo;
  try {
    cuerpo = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const ruta = normalizarRuta(cuerpo?.ruta);
  if (!ruta) return new Response(null, { status: 204 });

  const fecha = fechaISO();
  const host = req.headers.get('host') || '';
  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'sin-ip';
  const hash = hashVisitante({
    ip,
    ua,
    fecha,
    sal: process.env.VISITAS_SALT || 'kyn-sal-por-defecto',
  });

  const store = almacen();
  const llave = llaveDia(fecha);
  // Lectura-modificación-escritura: en un sitio personal el tráfico es bajo, así que
  // el riesgo real es perder alguna visita si dos caen en el mismo instante. Se
  // prefiere eso a la complejidad de escribir un blob por evento y agregarlos al leer.
  const dia = (await store.get(llave, { type: 'json' })) || diaVacio(fecha);

  dia.visitas += 1;
  if (!dia.hashes.includes(hash)) {
    dia.personas += 1;
    if (dia.hashes.length < MAX_HASHES_POR_DIA) dia.hashes.push(hash);
  }
  sumar(dia.rutas, ruta, MAX_LLAVES.rutas);
  sumar(dia.referrers, normalizarReferrer(cuerpo?.ref, host), MAX_LLAVES.referrers);
  sumar(dia.paises, context?.geo?.country?.code || '??', MAX_LLAVES.paises);
  sumar(dia.dispositivos, dispositivoPorAncho(cuerpo?.ancho), MAX_LLAVES.dispositivos);
  sumar(dia.idiomas, normalizarIdioma(cuerpo?.idioma), MAX_LLAVES.idiomas);

  await store.setJSON(llave, dia);
  return new Response(null, { status: 204 });
}

/** Une varios mapas de conteos en una lista ordenada de mayor a menor. */
function top(mapas, limite = 12) {
  const total = {};
  for (const mapa of mapas) {
    for (const [llave, valor] of Object.entries(mapa || {})) {
      total[llave] = (total[llave] || 0) + valor;
    }
  }
  return Object.entries(total)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([nombre, conteo]) => ({ nombre, conteo }));
}

async function leerEstadisticas(req) {
  if (!process.env.VISITAS_TOKEN) {
    return json(
      {
        message:
          'Falta la variable de entorno VISITAS_TOKEN en Netlify (Site configuration → Environment variables). Sin ella el panel queda cerrado.',
      },
      503,
    );
  }
  const token = req.headers.get('x-visitas-token') || new URL(req.url).searchParams.get('token');
  if (!tokenValido(token)) return json({ message: 'Token incorrecto' }, 401);

  const pedidos = Number(new URL(req.url).searchParams.get('dias'));
  const dias = Math.min(Math.max(Number.isFinite(pedidos) ? pedidos : DIAS_POR_DEFECTO, 1), MAX_DIAS);

  const store = almacen();
  const hoy = new Date();
  const fechas = Array.from({ length: dias }, (_, i) => {
    const d = new Date(hoy);
    d.setUTCDate(d.getUTCDate() - (dias - 1 - i));
    return fechaISO(d);
  });

  const registros = await Promise.all(
    fechas.map(async (fecha) => (await store.get(llaveDia(fecha), { type: 'json' })) || diaVacio(fecha)),
  );

  // Los hashes nunca salen de la función: al panel solo va el conteo.
  const serie = registros.map(({ fecha, visitas, personas }) => ({ fecha, visitas, personas }));
  const totalVisitas = serie.reduce((suma, d) => suma + d.visitas, 0);
  const totalPersonas = serie.reduce((suma, d) => suma + d.personas, 0);

  return json({
    dias,
    desde: fechas[0],
    hasta: fechas[fechas.length - 1],
    totales: { visitas: totalVisitas, personasPorDia: totalPersonas },
    serie,
    rutas: top(registros.map((d) => d.rutas)),
    referrers: top(registros.map((d) => d.referrers)),
    paises: top(registros.map((d) => d.paises)),
    dispositivos: top(registros.map((d) => d.dispositivos), 6),
    idiomas: top(registros.map((d) => d.idiomas), 8),
  });
}

export default async (req, context) => {
  if (req.method === 'POST') return registrarVisita(req, context);
  if (req.method === 'GET') return leerEstadisticas(req);
  return json({ message: 'Solo GET o POST' }, 405);
};
