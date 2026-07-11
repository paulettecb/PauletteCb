// Vista "Datos" de Lana: ajustes personales, respaldo/exportación y zona de peligro.
//
// Contrato: export function render(el). main.js la llama en cada cambio de
// estado; se re-renderiza completa (el.innerHTML = ...) y los listeners se
// wirean SOLO en nodos recién creados (nunca en document/window/el).
// Todo el dinero viaja en centavos; se muestra con fmtMoney.

import * as store from '../store.js';
import {
  campoTexto, campoMonto, leerMonto, confirmar, toast, toastError,
} from '../components.js';
import { hoyISO } from '../utils.js';

/* =========================================================================
   Render principal
   ========================================================================= */

export function render(el) {
  el.innerHTML = `
    <div class="seccion">${cardTu()}</div>
    <div class="seccion">${cardRespaldo()}</div>
    <div class="seccion">${cardPeligro()}</div>
    <p class="nota-privacidad">
      Lana 🐑 · hecha con cariño · tus datos nunca salen de aquí<br />
      <a href="../../index.html">← volver a paulettecb</a>
    </p>`;

  wirearCardTu(el);
  wirearCardRespaldo(el);
  wirearCardPeligro(el);
}

/* =========================================================================
   1. Card "tú": nombre + ingreso mensual planeado
   ========================================================================= */

function cardTu() {
  const ajustes = store.getState().ajustes;
  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">tú</h2>
      </div>
      <form data-form-tu>
        ${campoTexto('nombre', {
          valor: ajustes.nombre,
          etiqueta: 'Tu nombre',
          placeholder: 'para saludarte',
        })}
        ${campoMonto('ingreso', {
          valor: ajustes.ingresoPlaneado > 0 ? ajustes.ingresoPlaneado : null,
          etiqueta: 'Ingreso mensual planeado',
          ayuda: 'se usa mientras no registres ingresos reales en el mes',
        })}
        <button class="btn btn-primario" type="submit">guardar</button>
      </form>
    </section>`;
}

function wirearCardTu(el) {
  const form = el.querySelector('[data-form-tu]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Leemos TODO antes de mutar: cada set* dispara commit → re-render y
    // este form queda huérfano.
    const nombre = String(new FormData(form).get('nombre') || '').trim();
    const ingreso = leerMonto(form, 'ingreso');
    store.setNombre(nombre);
    store.setIngresoPlaneado(ingreso ?? 0);
    toast('Listo, guardado ✓');
  });
}

/* =========================================================================
   2. Card "tu información es tuya": exportar / importar respaldo
   ========================================================================= */

function cardRespaldo() {
  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">tu información es tuya</h2>
      </div>
      <p class="texto-secundario">
        Todo vive SOLO en este navegador: nada viaja a internet, nadie más lo ve.
        Eso sí — descarga tu respaldo seguido, es tu única copia.
      </p>
      <div class="fila mt-2" style="flex-wrap: wrap">
        <button class="btn btn-primario" data-descargar-json>⬇️ descargar respaldo (.json)</button>
        <button class="btn btn-suave" data-descargar-csv>📄 descargar movimientos (.csv)</button>
        <button class="btn btn-fantasma btn-chico" data-descargar-csv-mes>solo este mes</button>
      </div>
      <hr class="separador" />
      <p class="texto-suave">
        ¿Vienes de otro navegador o celular? Trae tu archivo .json y sigue donde ibas.
      </p>
      <button class="btn btn-fantasma mt-1" data-importar>📥 importar respaldo</button>
      <input type="file" accept=".json,application/json" class="oculto" data-file-respaldo
        aria-label="Elegir archivo de respaldo" />
    </section>`;
}

function wirearCardRespaldo(el) {
  el.querySelector('[data-descargar-json]').addEventListener('click', () => {
    descargar(`lana-respaldo-${hoyISO()}.json`, store.exportarJSON(), 'application/json');
    toast('Respaldo descargado ✓ guárdalo bien');
  });

  // El CSV del store YA trae BOM para Excel; aquí no se agrega nada.
  el.querySelector('[data-descargar-csv]').addEventListener('click', () => {
    descargar('lana-movimientos.csv', store.exportarCSV(null), 'text/csv;charset=utf-8');
    toast('Movimientos descargados ✓');
  });

  el.querySelector('[data-descargar-csv-mes]').addEventListener('click', () => {
    const mes = store.getMes();
    descargar(`lana-movimientos-${mes}.csv`, store.exportarCSV(mes), 'text/csv;charset=utf-8');
    toast('Movimientos del mes descargados ✓');
  });

  const inputFile = el.querySelector('[data-file-respaldo]');
  el.querySelector('[data-importar]').addEventListener('click', () => inputFile.click());

  inputFile.addEventListener('change', async () => {
    const archivo = inputFile.files && inputFile.files[0];
    // Se limpia para que elegir el mismo archivo otra vez vuelva a disparar change.
    inputFile.value = '';
    if (!archivo) return;
    const seguro = await confirmar(
      'Esto reemplaza TODO lo que hay ahorita en Lana con lo que traiga el respaldo. ¿Lo importo?',
      { textoBoton: 'Sí, importar' },
    );
    if (!seguro) return;
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = store.importarJSON(String(lector.result));
      if (resultado.ok) toast('Respaldo importado ✓ ya estás al día');
      else toastError(resultado.error);
    };
    lector.onerror = () => toastError('No pude leer el archivo 😕 inténtalo de nuevo');
    lector.readAsText(archivo);
  });
}

// Descarga un archivo generado en memoria vía Blob + <a download>.
function descargar(nombreArchivo, contenido, mime) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================================
   3. Card zona de peligro: borrar todo
   ========================================================================= */

function cardPeligro() {
  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">zona de peligro</h2>
      </div>
      <p class="texto-secundario">
        Esto borra movimientos, deudas, presupuestos y tus ajustes. No hay deshacer:
        si tienes tantita duda, primero descarga tu respaldo.
      </p>
      <button class="btn btn-peligro mt-2" data-borrar-todo>🗑️ borrar todo</button>
    </section>`;
}

function wirearCardPeligro(el) {
  el.querySelector('[data-borrar-todo]').addEventListener('click', async () => {
    const seguro = await confirmar(
      'Vas a borrar TODO lo que Lana tiene guardado: movimientos, deudas, presupuestos y tu nombre. No se puede recuperar. ¿De verdad quieres empezar de cero?',
      { textoBoton: 'Sí, borrar todo' },
    );
    if (!seguro) return;
    store.borrarTodo();
    toast('Todo borrado. Empezamos de cero 🐑');
  });
}
