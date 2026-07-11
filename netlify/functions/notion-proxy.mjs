// Proxy mínimo hacia api.notion.com para el sync de Cuentas Claras.
// Existe solo porque la API de Notion no permite CORS desde el navegador.
// NO guarda nada ni conoce ningún secreto: el token viaja en cada petición
// desde el navegador de Paulette (donde vive cifrado con su código de acceso)
// y aquí solo se reenvía. Únicamente se permiten los endpoints que usa la app.

const RUTAS_PERMITIDAS = [
  /^\/v1\/pages$/,                          // crear página (fila) en una database
  /^\/v1\/pages\/[0-9a-f-]{32,36}$/,        // actualizar / archivar una fila
  /^\/v1\/databases$/,                      // crear las databases la primera vez
  /^\/v1\/databases\/[0-9a-f-]{32,36}\/query$/, // consultar (verificación)
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

  const { token, path, method = 'POST', body = null } = peticion || {};
  if (typeof token !== 'string' || !/^(secret_|ntn_)[A-Za-z0-9_-]{20,}$/.test(token)) {
    return json({ message: 'Token de Notion inválido' }, 400);
  }
  if (typeof path !== 'string' || !RUTAS_PERMITIDAS.some((r) => r.test(path))) {
    return json({ message: 'Ruta no permitida' }, 400);
  }
  if (!['POST', 'PATCH'].includes(method)) {
    return json({ message: 'Método no permitido' }, 400);
  }

  const respuesta = await fetch(`https://api.notion.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return new Response(await respuesta.text(), {
    status: respuesta.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = { path: '/api/notion' };
