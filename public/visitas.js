// Tracker del registro de visitas (ver netlify/functions/visitas.mjs).
// Manda UN aviso por carga de página a tu propia función de Netlify: ruta,
// dominio de referencia, idioma y ancho de pantalla. Sin cookies, sin IDs y
// sin terceros. Si algo falla, falla en silencio: nunca rompe la página.
(() => {
  const host = location.hostname;

  // GitHub Pages sirve el mismo dist/ pero no corre funciones: ahí no hay a quién avisar.
  const sinFunciones = host.endsWith('github.io');
  const enLocal = ['localhost', '127.0.0.1', '0.0.0.0', ''].includes(host) || host.endsWith('.local');
  const noRastrear = navigator.doNotTrack === '1' || window.doNotTrack === '1';

  let optOut = false;
  try {
    // Paulette prende esto desde /visitas.html para no contarse a sí misma.
    optOut = localStorage.getItem('visitas-optout') === '1';
  } catch {
    /* modo privado sin localStorage: se cuenta normal */
  }

  if (sinFunciones || enLocal || noRastrear || optOut) return;

  const datos = JSON.stringify({
    ruta: location.pathname,
    ref: document.referrer,
    idioma: navigator.language,
    ancho: window.innerWidth,
  });

  try {
    const blob = new Blob([datos], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/visitas', blob)) return;
    fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: datos,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* si el navegador no deja mandar nada, no pasa nada */
  }
})();
