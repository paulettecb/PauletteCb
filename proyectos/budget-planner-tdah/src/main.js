// Shell de Cuentas Claras: arranque (con pantalla de código si los datos están
// cifrados), router por hash, encabezado con selector de mes, navegación y FAB
// de quick-add. Cada vista exporta render(el) y se re-renderiza completa cuando
// cambia el estado (los modales viven en otra capa, no se pierden).

import * as store from './store.js';
import * as notion from './notion.js';
import { abrirQuickAdd, confirmar } from './components.js';
import { nombreMes, sumarMeses, mesActualKey, escapeHtml } from './utils.js';

import * as resumen from './views/resumen.js';
import * as movimientos from './views/movimientos.js';
import * as presupuesto from './views/presupuesto.js';
import * as deudas from './views/deudas.js';
import * as calendario from './views/calendario.js';
import * as datos from './views/datos.js';

const RUTAS = {
  resumen:     { vista: resumen,     emoji: '🏡', nombre: 'Resumen',   conMes: true },
  movimientos: { vista: movimientos, emoji: '🧾', nombre: 'Movs',      conMes: true },
  presupuesto: { vista: presupuesto, emoji: '🎯', nombre: 'Plan',      conMes: true },
  deudas:      { vista: deudas,      emoji: '💪', nombre: 'Deudas',    conMes: false },
  calendario:  { vista: calendario,  emoji: '📅', nombre: 'Mes',       conMes: true },
  datos:       { vista: datos,       emoji: '⚙️', nombre: 'Datos',     conMes: false },
};

function rutaActual() {
  const hash = location.hash.replace(/^#\/?/, '');
  return RUTAS[hash] ? hash : 'resumen';
}

const app = document.getElementById('app');

/* =========================================================================
   Pantalla de código de acceso (solo si los datos están cifrados)
   ========================================================================= */

function renderPantallaCodigo({ error = false } = {}) {
  app.innerHTML = `
    <div class="candado">
      <div class="candado-caja">
        <div class="candado-logo">Cuentas Claras</div>
        <p class="eyebrow">tu dinero, claro</p>
        <p class="texto-secundario mt-2">🔒 Tu información está cifrada. Ponme tu código para abrir.</p>
        <form class="mt-2" data-form-codigo>
          <div class="campo campo-monto">
            <label for="campo-codigo">Código de acceso</label>
            <input id="campo-codigo" name="codigo" type="password" inputmode="numeric"
              autocomplete="current-password" autofocus />
          </div>
          ${error ? '<p class="candado-error">Ese código no es 😕 inténtalo otra vez</p>' : ''}
          <button type="submit" class="btn btn-primario btn-bloque">Abrir</button>
        </form>
        <button type="button" class="candado-olvide" data-olvide>¿Olvidaste tu código?</button>
      </div>
    </div>`;

  const form = app.querySelector('[data-form-codigo]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = String(new FormData(form).get('codigo') || '');
    if (!codigo) return;
    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Abriendo…';
    const r = await store.iniciar(codigo);
    if (r.ok) montarShell();
    else renderPantallaCodigo({ error: true });
  });

  app.querySelector('[data-olvide]').addEventListener('click', async () => {
    const seguro = await confirmar(
      'Sin tu código no hay forma de descifrar lo guardado. La única salida es borrar TODO y empezar de cero (o importar un respaldo JSON que hayas descargado antes). ¿Borramos todo?',
      { textoBoton: 'Sí, borrar todo' },
    );
    if (!seguro) return;
    const segurisimo = await confirmar(
      'Última confirmación: se borra todo lo guardado en este navegador y no se puede recuperar.',
      { textoBoton: 'Borrar y empezar de cero' },
    );
    if (!segurisimo) return;
    store.borrarTodo();
    montarShell();
  });
}

/* =========================================================================
   Shell principal
   ========================================================================= */

let shellMontado = false;

function montarShell() {
  if (shellMontado) return;
  shellMontado = true;

  app.innerHTML = `
    <div class="shell">
      <header class="encabezado">
        <div class="encabezado-inner">
          <a class="logo" href="#/resumen">Cuentas Claras <span class="eyebrow">tu dinero, claro</span></a>
          <div class="fila" data-zona-mes></div>
        </div>
      </header>
      <div>
        <nav class="tabbar" data-nav aria-label="Secciones"></nav>
        <main class="contenido">
          <div data-vista></div>
        </main>
      </div>
    </div>
    <button class="fab" data-fab aria-label="Agregar gasto, ingreso o pago">+</button>
  `;

  const zonaMes = app.querySelector('[data-zona-mes]');
  const nav = app.querySelector('[data-nav]');
  const contenedorVista = app.querySelector('[data-vista]');

  app.querySelector('[data-fab]').addEventListener('click', () => abrirQuickAdd('gasto'));

  zonaMes.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.mesAnterior != null) store.setMes(sumarMeses(store.getMes(), -1));
    if (btn.dataset.mesSiguiente != null) store.setMes(sumarMeses(store.getMes(), 1));
    if (btn.dataset.mesHoy != null) store.setMes(mesActualKey());
  });

  function renderZonaMes() {
    const ruta = RUTAS[rutaActual()];
    if (!ruta.conMes) {
      zonaMes.innerHTML = '';
      return;
    }
    zonaMes.innerHTML = `
      ${store.esMesActual() ? '' : '<button class="btn-hoy" data-mes-hoy>· hoy</button>'}
      <div class="selector-mes">
        <button data-mes-anterior aria-label="Mes anterior">‹</button>
        <span class="mes-actual">${escapeHtml(nombreMes(store.getMes()))}</span>
        <button data-mes-siguiente aria-label="Mes siguiente">›</button>
      </div>`;
  }

  function renderNav() {
    const actual = rutaActual();
    nav.innerHTML = Object.entries(RUTAS)
      .map(([id, r]) => `
        <a class="tab${id === actual ? ' activa' : ''}" href="#/${id}">
          <span class="tab-emoji" aria-hidden="true">${r.emoji}</span>
          <span>${r.nombre}</span>
        </a>`)
      .join('');
  }

  function renderVista() {
    renderZonaMes();
    renderNav();
    RUTAS[rutaActual()].vista.render(contenedorVista);
  }

  window.addEventListener('hashchange', () => {
    contenedorVista.scrollTop = 0;
    window.scrollTo(0, 0);
    renderVista();
  });

  store.suscribir(renderVista);
  store.suscribir(notion.alCambiarEstado);
  renderVista();
}

/* =========================================================================
   Arranque
   ========================================================================= */

(async () => {
  const r = await store.iniciar();
  if (r.ok) montarShell();
  else renderPantallaCodigo();
})();
