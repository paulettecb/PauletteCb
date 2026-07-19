// Proxy mínimo hacia api.notion.com para el sync de Cuentas Claras.
// Existe solo porque la API de Notion no permite CORS desde el navegador.
// NO guarda nada ni conoce ningún secreto: el token viaja en cada petición
// desde el navegador de Paulette (donde vive cifrado con su código de acceso)
// y aquí solo se reenvía. Únicamente se permiten los endpoints que usa la app.

const RUTAS_PERMITIDAS = [
  /^\/v1\/pages$/,                          // crear página (fila) en una database
  /^\/v1\/pages\/[0-9a-f-]{32,36}$/,        // actualizar / archivar una fila
  /^\/v1\/databases$/,                      // crear las databases la primera vez
  /^\/v1\/databases\/[0-9a-f-]{32,36}$/,    // leer la database (para descubrir su data source)
  /^\/v1\/databases\/[0-9a-f-]{32,36}\/query$/, // consultar filas (endpoint clásico)
  /^\/v1\/data_sources\/[0-9a-f-]{32,36}\/query$/, // consultar por data source (Notion nuevo)
  /^\/v1\/search$/,                         // descubrir databases existentes (push y traer)
];

const json = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json({ message: 'Solo POST' }, 405);

  let peticion;
  try {
    peticion = await req.json();
  } catch {
    return json({ message: 'Cuerpo inválido' }, 400);
  }

  const { token, path, method = 'POST', body = null, version } = peticion || {};
  if (typeof token !== 'string' || !/^(secret_|ntn_)[A-Za-z0-9_-]{20,}$/.test(token)) {
    return json({ message: 'Token de Notion inválido' }, 400);
  }
  if (typeof path !== 'string' || !RUTAS_PERMITIDAS.some((r) => r.test(path))) {
    return json({ message: 'Ruta no permitida' }, 400);
  }
  if (!['GET', 'POST', 'PATCH'].includes(method)) {
    return json({ message: 'Método no permitido' }, 400);
  }
  // La versión de la API se puede pedir por request (los endpoints de "data
  // source" necesitan una versión nueva); por defecto la clásica que ya funciona.
  const notionVersion = typeof version === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(version)
    ? version : '2022-06-28';

  // Envolvemos en try/catch para que si la función se cae al hablar con Notion,
  // la app reciba un mensaje legible en vez de un 500 pelón sin pista.
  try {
    const respuesta = await fetch(`https://api.notion.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': notionVersion,
        'Content-Type': 'application/json',
      },
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });
    return new Response(await respuesta.text(), {
      status: respuesta.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return json({ message: `El proxy no pudo hablar con Notion: ${e?.message || e}` }, 502);
  }
};

// Se sirve en el path por defecto (/.netlify/functions/notion-proxy) y la app le
// pega vía /api/notion gracias al rewrite de dist/_redirects. Antes esto usaba
// `config.path`, pero el deploy no publicaba las funciones, así que /api/notion
// caía en 404 ("este sitio no tiene funciones de Netlify").
