// Tests del registro de visitas (netlify/functions/visitas.mjs) con un
// Netlify Blobs falso en memoria, para no tocar la nube.
// Correr: node --test --experimental-test-module-mocks netlify/functions/tests/visitas.test.mjs
import test, { mock, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Dos almacenes falsos: el global (producción) y el del deploy (previews y ramas).
const guardado = new Map();
const guardadoDeploy = new Map();

const storeFalso = (mapa) => ({
  async get(llave, opciones) {
    const valor = mapa.get(llave);
    if (valor === undefined) return null;
    return opciones?.type === 'json' ? JSON.parse(valor) : valor;
  },
  async setJSON(llave, valor) {
    mapa.set(llave, JSON.stringify(valor));
  },
});

let visitas;

before(async () => {
  mock.module('@netlify/blobs', {
    namedExports: {
      getStore: () => storeFalso(guardado),
      getDeployStore: () => storeFalso(guardadoDeploy),
    },
  });
  visitas = (await import('../visitas.mjs')).default;
});

beforeEach(() => {
  guardado.clear();
  guardadoDeploy.clear();
  process.env.VISITAS_TOKEN = 'token-de-prueba';
  process.env.VISITAS_SALT = 'sal-de-prueba';
  process.env.CONTEXT = 'production';
});

const UA_HUMANO =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1';

function peticionPost(cuerpo, { ua = UA_HUMANO, ip = '203.0.113.7' } = {}) {
  return new Request('https://paulettecb.com/api/visitas', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': ua,
      'x-nf-client-connection-ip': ip,
      host: 'paulettecb.com',
    },
    body: JSON.stringify(cuerpo),
  });
}

const contexto = { geo: { country: { code: 'MX' } } };

function peticionGet({ token = 'token-de-prueba', dias = 30 } = {}) {
  return new Request(`https://paulettecb.com/api/visitas?dias=${dias}`, {
    headers: token ? { 'x-visitas-token': token } : {},
  });
}

const diaDeHoy = () => JSON.parse(guardado.get(`dia/${new Date().toISOString().slice(0, 10)}`));

test('registra una visita y la deja contada en el día', async () => {
  const res = await visitas(peticionPost({ ruta: '/', ref: 'https://www.instagram.com/paulettecb', idioma: 'es-MX', ancho: 390 }), contexto);
  assert.equal(res.status, 204);

  const dia = diaDeHoy();
  assert.equal(dia.visitas, 1);
  assert.equal(dia.personas, 1);
  assert.equal(dia.rutas['/'], 1);
  assert.equal(dia.referrers['instagram.com'], 1, 'del referrer solo se guarda el dominio, sin www');
  assert.equal(dia.paises.MX, 1);
  assert.equal(dia.dispositivos['móvil'], 1);
  assert.equal(dia.idiomas.es, 1);
});

test('la misma persona en el mismo día suma visita pero no persona', async () => {
  await visitas(peticionPost({ ruta: '/', ancho: 1400 }), contexto);
  await visitas(peticionPost({ ruta: '/proyectos/ceneval/', ancho: 1400 }), contexto);

  const dia = diaDeHoy();
  assert.equal(dia.visitas, 2);
  assert.equal(dia.personas, 1);
  assert.equal(dia.rutas['/proyectos/ceneval/'], 1);
});

test('dos personas distintas cuentan como dos', async () => {
  await visitas(peticionPost({ ruta: '/' }, { ip: '203.0.113.7' }), contexto);
  await visitas(peticionPost({ ruta: '/' }, { ip: '198.51.100.4' }), contexto);
  assert.equal(diaDeHoy().personas, 2);
});

test('la ruta se normaliza: se tira query y hash, e index.html', async () => {
  await visitas(peticionPost({ ruta: '/proyectos/ceneval/index.html?token=secreto#top' }), contexto);
  const rutas = Object.keys(diaDeHoy().rutas);
  assert.deepEqual(rutas, ['/proyectos/ceneval/']);
  assert.ok(!rutas.join(' ').includes('secreto'), 'nunca se guarda el query string');
});

test('sin referrer (o desde el propio sitio) cuenta como directo', async () => {
  await visitas(peticionPost({ ruta: '/', ref: '' }), contexto);
  await visitas(peticionPost({ ruta: '/', ref: 'https://paulettecb.com/proyectos/' }, { ip: '198.51.100.9' }), contexto);
  assert.equal(diaDeHoy().referrers['(directo)'], 2);
});

test('los bots no se cuentan', async () => {
  const res = await visitas(peticionPost({ ruta: '/' }, { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }), contexto);
  assert.equal(res.status, 204, 'responde igual que a un humano, sin delatar el filtro');
  assert.equal(guardado.size, 0);
});

test('una ruta que no es del sitio se ignora', async () => {
  await visitas(peticionPost({ ruta: 'https://otro-sitio.com/espia' }), contexto);
  assert.equal(guardado.size, 0);
});

test('el panel exige token', async () => {
  const sinToken = await visitas(peticionGet({ token: '' }), contexto);
  assert.equal(sinToken.status, 401);

  const malToken = await visitas(peticionGet({ token: 'no-es' }), contexto);
  assert.equal(malToken.status, 401);
});

test('sin VISITAS_TOKEN configurado el panel queda cerrado y lo explica', async () => {
  delete process.env.VISITAS_TOKEN;
  const res = await visitas(peticionGet(), contexto);
  assert.equal(res.status, 503);
  assert.match((await res.json()).message, /VISITAS_TOKEN/);
});

test('con token devuelve agregados y nunca los hashes', async () => {
  await visitas(peticionPost({ ruta: '/', ancho: 1400, idioma: 'en-US' }), contexto);
  await visitas(peticionPost({ ruta: '/', ancho: 390 }, { ip: '198.51.100.4' }), contexto);

  const res = await visitas(peticionGet({ dias: 7 }), contexto);
  assert.equal(res.status, 200);
  const datos = await res.json();

  assert.equal(datos.dias, 7);
  assert.equal(datos.serie.length, 7);
  assert.equal(datos.totales.visitas, 2);
  assert.equal(datos.totales.personasPorDia, 2);
  assert.deepEqual(datos.rutas, [{ nombre: '/', conteo: 2 }]);
  assert.ok(!JSON.stringify(datos).includes('hashes'), 'los hashes se quedan en el servidor');
  assert.equal(datos.serie[datos.serie.length - 1].fecha, new Date().toISOString().slice(0, 10));
});

test('los días sin visitas salen en cero, no huecos', async () => {
  const res = await visitas(peticionGet({ dias: 3 }), contexto);
  const datos = await res.json();
  assert.deepEqual(
    datos.serie.map((d) => d.visitas),
    [0, 0, 0],
  );
});

test('un preview NO escribe en las cifras reales de producción', async () => {
  process.env.CONTEXT = 'deploy-preview';
  await visitas(peticionPost({ ruta: '/' }), contexto);

  assert.equal(guardado.size, 0, 'el almacén de producción queda intacto');
  assert.equal(guardadoDeploy.size, 1, 'la visita de prueba se queda en el almacén del preview');
});

test('otros métodos se rechazan', async () => {
  const res = await visitas(new Request('https://paulettecb.com/api/visitas', { method: 'DELETE' }), contexto);
  assert.equal(res.status, 405);
});
