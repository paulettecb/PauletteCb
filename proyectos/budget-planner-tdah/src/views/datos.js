// Vista "Datos" de Cuentas Claras: ajustes personales, respaldo/exportación y zona de peligro.
//
// Contrato: export function render(el). main.js la llama en cada cambio de
// estado; se re-renderiza completa (el.innerHTML = ...) y los listeners se
// wirean SOLO en nodos recién creados (nunca en document/window/el).
// Todo el dinero viaja en centavos; se muestra con fmtMoney.

import * as store from '../store.js';
import * as notion from '../notion.js';
import {
  campoTexto, campoMonto, leerMonto, confirmar, toast, toastError,
  abrirModal, cerrarModal,
} from '../components.js';
import { hoyISO, escapeHtml, fechaCorta } from '../utils.js';

/* =========================================================================
   Render principal
   ========================================================================= */

export function render(el) {
  el.innerHTML = `
    <div class="seccion">${cardTu()}</div>
    <div class="seccion">${cardCodigo()}</div>
    <div class="seccion">${cardNotion()}</div>
    <div class="seccion">${cardRespaldo()}</div>
    <div class="seccion">${cardPeligro()}</div>
    <p class="nota-privacidad">
      Cuentas Claras ✨ · hechas con cariño · tus datos nunca salen de aquí<br />
      <a href="../../index.html">← volver a paulettecb</a>
    </p>`;

  wirearCardTu(el);
  wirearCardCodigo(el);
  wirearCardNotion(el);
  wirearCardRespaldo(el);
  wirearCardPeligro(el);
}

/* =========================================================================
   Card "conectar con Notion": espejo automático de movimientos y deudas
   ========================================================================= */

function cardNotion() {
  const cfg = store.getState().ajustes.notion;
  const ultima = store.getState().notionSync.ultimaSync;
  const conectada = notion.configurada();

  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">conectar con notion</h2>
        ${conectada
          ? '<span class="pill pill-ok">conectado</span>'
          : '<span class="pill pill-neutra">sin conectar</span>'}
      </div>
      <p class="texto-secundario">
        Espeja tus movimientos y deudas con tu página <strong>Cuentas Claras</strong> de Notion.
        La app <strong>manda</strong> a Notion, y con <em>traer de Notion</em> también
        <strong>trae</strong> las deudas que edites allá.
      </p>
      <details class="mt-1">
        <summary class="texto-suave" style="cursor:pointer">¿cómo lo conecto? (3 pasos)</summary>
        <ol class="texto-secundario" style="padding-left:1.2rem; margin-top:0.5rem">
          <li>En <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer">notion.so/my-integrations</a> crea una <strong>integración interna</strong> y copia su token (empieza con <code>ntn_</code>).</li>
          <li>En tu página "Cuentas Claras" de Notion: menú <strong>⋯ → Conexiones</strong> → agrega tu integración.</li>
          <li>Pega aquí el token, guarda y dale sincronizar. Las databases se crean solitas la primera vez.</li>
        </ol>
      </details>
      <form class="mt-2" data-form-notion>
        <div class="campo">
          <label for="campo-notion-token">Token de tu integración</label>
          <input id="campo-notion-token" name="token" type="password" autocomplete="off"
            placeholder="ntn_…" value="${escapeHtml(cfg.token)}" />
          <span class="ayuda">se guarda solo en este navegador (cifrado si tienes código)</span>
        </div>
        <div class="campo">
          <label for="campo-notion-pagina">Link o ID de tu página de Notion</label>
          <input id="campo-notion-pagina" name="pagina" type="text" autocomplete="off"
            value="${escapeHtml(cfg.paginaId)}" />
        </div>
        <label class="fila texto-secundario" style="cursor:pointer">
          <input type="checkbox" name="auto" ${cfg.auto ? 'checked' : ''} style="width:auto" />
          sincronizar solito después de cada cambio
        </label>
        <div class="fila mt-2" style="flex-wrap: wrap">
          <button type="submit" class="btn btn-suave">guardar conexión</button>
          <button type="button" class="btn btn-primario" data-sync-ahora ${conectada ? '' : 'disabled'}>⬆️ mandar a Notion</button>
          <button type="button" class="btn btn-suave" data-traer-notion ${conectada ? '' : 'disabled'}>⬇️ traer de Notion</button>
        </div>
      </form>
      ${ultima ? `<p class="texto-suave mt-1">última sincronización: ${escapeHtml(fechaCorta(ultima.slice(0, 10)))} a las ${escapeHtml(ultima.slice(11, 16))}</p>` : ''}
    </section>`;
}

function wirearCardNotion(el) {
  const form = el.querySelector('[data-form-notion]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = new FormData(form);
    const paginaId = notion.extraerPaginaId(datos.get('pagina'));
    if (datos.get('pagina') && !paginaId) {
      toastError('Ese link de Notion no trae un ID de página válido 😕');
      return;
    }
    store.setNotionConfig({
      token: String(datos.get('token') || '').trim(),
      paginaId,
      auto: datos.get('auto') != null,
    });
    toast('Conexión guardada ✓');
  });

  const btnSync = el.querySelector('[data-sync-ahora]');
  btnSync.addEventListener('click', async () => {
    btnSync.disabled = true;
    btnSync.textContent = 'mandando…';
    const r = await notion.sincronizar();
    if (r.ok) {
      toast(`Notion al día ✓ ${r.creados} nuevas · ${r.actualizados} actualizadas${r.archivados ? ` · ${r.archivados} archivadas` : ''}`);
    } else {
      toastError(r.error);
      // el re-render por setNotionSync ya restauró el botón; esto es por si no hubo commit
      btnSync.disabled = false;
      btnSync.textContent = '⬆️ mandar a Notion';
    }
  });

  const btnTraer = el.querySelector('[data-traer-notion]');
  if (btnTraer) {
    btnTraer.addEventListener('click', async () => {
      const seguro = await confirmar(
        'Trae tus deudas desde Notion: crea las que falten y actualiza las que ya tengas. ' +
        'Si cambiaste algo en la app más reciente que en Notion, eso NO se pisa. ¿Le entro?',
        { textoBoton: 'Sí, traer' },
      );
      if (!seguro) return;
      btnTraer.disabled = true;
      btnTraer.textContent = 'trayendo…';
      const r = await notion.traerDeNotion();
      if (r.ok) {
        const cola = r.omitidas ? ` · ${r.omitidas} sin traer (revisa Tipo/nombre en Notion)` : '';
        toast(`Traído de Notion ✓ ${r.traidas} ${r.traidas === 1 ? 'deuda' : 'deudas'}${cola}`);
      } else {
        toastError(r.error);
      }
      // Si hubo cambios, el re-render ya trae botón nuevo; esto cubre el resto.
      btnTraer.disabled = false;
      btnTraer.textContent = '⬇️ traer de Notion';
    });
  }
}

/* =========================================================================
   Card "código de acceso": cifrado local con candado
   ========================================================================= */

function cardCodigo() {
  const activo = store.tieneCodigo();
  return `
    <section class="card">
      <div class="card-encabezado">
        <h2 class="card-titulo">código de acceso</h2>
        ${activo ? '<span class="pill pill-ok">🔒 activado</span>' : '<span class="pill pill-neutra">apagado</span>'}
      </div>
      ${activo
        ? `
          <p class="texto-secundario">
            Tu información se guarda <strong>cifrada</strong> en este navegador: sin tu código, nadie la puede leer.
          </p>
          <div class="fila mt-2" style="flex-wrap: wrap">
            <button class="btn btn-primario" data-bloquear>🔒 bloquear ahora</button>
            <button class="btn btn-suave" data-cambiar-codigo>cambiar código</button>
            <button class="btn btn-fantasma" data-quitar-codigo>quitar código</button>
          </div>`
        : `
          <p class="texto-secundario">
            Ponle un código y tus datos se guardan <strong>cifrados</strong> (AES): aunque alguien use tu
            cel o tu compu, sin el código no ve nada.
          </p>
          <p class="texto-suave mt-1">
            ⚠️ Si lo olvidas y no tienes un respaldo JSON descargado, no hay forma de recuperar tus datos.
          </p>
          <button class="btn btn-primario mt-2" data-activar-codigo>🔒 activar código</button>`}
    </section>`;
}

function abrirModalCodigo({ cambiar = false } = {}) {
  abrirModal({
    titulo: cambiar ? 'Cambiar código' : 'Activar código',
    cuerpo: `
      <form data-form-codigo>
        <div class="campo">
          <label for="campo-codigo-nuevo">Código nuevo (mínimo 4)</label>
          <input id="campo-codigo-nuevo" name="codigo" type="password" inputmode="numeric"
            autocomplete="new-password" minlength="4" required />
        </div>
        <div class="campo">
          <label for="campo-codigo-repite">Repítelo</label>
          <input id="campo-codigo-repite" name="repite" type="password" inputmode="numeric"
            autocomplete="new-password" minlength="4" required />
        </div>
        <p class="texto-suave">
          ⚠️ Apúntalo donde no se pierda. Sin el código (y sin respaldo JSON) tus datos no se recuperan.
        </p>
        <button type="submit" class="btn btn-primario btn-bloque mt-1">Guardar código</button>
      </form>`,
    alAbrir(modal) {
      const form = modal.querySelector('[data-form-codigo]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const datos = new FormData(form);
        const codigo = String(datos.get('codigo') || '');
        if (codigo.length < 4) {
          toastError('El código necesita al menos 4 caracteres 🙏');
          return;
        }
        if (codigo !== String(datos.get('repite') || '')) {
          toastError('Los códigos no coinciden 😅');
          return;
        }
        const boton = form.querySelector('button[type="submit"]');
        boton.disabled = true;
        boton.textContent = 'Cifrando…';
        await store.activarCodigo(codigo);
        cerrarModal();
        toast(cambiar ? 'Código cambiado 🔒' : 'Listo, tus datos ya viajan cifrados 🔒');
      });
    },
  });
}

function wirearCardCodigo(el) {
  const btnActivar = el.querySelector('[data-activar-codigo]');
  if (btnActivar) btnActivar.addEventListener('click', () => abrirModalCodigo());

  const btnCambiar = el.querySelector('[data-cambiar-codigo]');
  if (btnCambiar) btnCambiar.addEventListener('click', () => abrirModalCodigo({ cambiar: true }));

  const btnBloquear = el.querySelector('[data-bloquear]');
  if (btnBloquear) btnBloquear.addEventListener('click', () => store.bloquear());

  const btnQuitar = el.querySelector('[data-quitar-codigo]');
  if (btnQuitar) {
    btnQuitar.addEventListener('click', async () => {
      const si = await confirmar(
        'Sin código, tus datos quedan guardados en claro en este navegador (como antes). ¿Lo quito?',
        { textoBoton: 'Sí, quitar código' },
      );
      if (si) {
        store.quitarCodigo();
        toast('Código quitado ✓');
      }
    });
  }
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
    descargar(`cuentas-claras-respaldo-${hoyISO()}.json`, store.exportarJSON(), 'application/json');
    toast('Respaldo descargado ✓ guárdalo bien');
  });

  // El CSV del store YA trae BOM para Excel; aquí no se agrega nada.
  el.querySelector('[data-descargar-csv]').addEventListener('click', () => {
    descargar('cuentas-claras-movimientos.csv', store.exportarCSV(null), 'text/csv;charset=utf-8');
    toast('Movimientos descargados ✓');
  });

  el.querySelector('[data-descargar-csv-mes]').addEventListener('click', () => {
    const mes = store.getMes();
    descargar(`cuentas-claras-movimientos-${mes}.csv`, store.exportarCSV(mes), 'text/csv;charset=utf-8');
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
      'Esto reemplaza TODO lo que hay ahorita en Cuentas Claras con lo que traiga el respaldo. ¿Lo importo?',
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
      'Vas a borrar TODO lo que Cuentas Claras tiene guardado: movimientos, deudas, presupuestos y tu nombre. No se puede recuperar. ¿De verdad quieres empezar de cero?',
      { textoBoton: 'Sí, borrar todo' },
    );
    if (!seguro) return;
    store.borrarTodo();
    toast('Todo borrado. Empezamos de cero ✨');
  });
}
