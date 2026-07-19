# Cuentas Claras — memoria / bitácora

> **Para cualquier chat que retome esto (aunque sea otra sesión):** léeme primero.
> Aquí vive el contexto para no empezar de cero cada vez. Paulette tiene TDAH y no
> quiere saturar un solo chat, así que este archivo es la continuidad.
>
> **Regla dura:** aquí NO se escriben cifras/saldos reales de Paulette (eso es
> privado y va contra las reglas del repo). Los números reales viven en su app
> (localStorage) y en su Notion. Este archivo guarda el *contexto y el cómo*, no
> el *cuánto*.

## Qué es
App de finanzas personales de Paulette (`proyectos/budget-planner-tdah`). Antes se
llamó "Lana"; reemplazó al viejo budget planner en julio 2026. Es proyecto aparte
de KYN aunque usa sus tokens. Vanilla JS + Vite propio, orquestado por
`scripts/build-all.mjs`. Contrato interno: el dinero SIEMPRE en centavos (enteros);
las vistas exportan `render(el)` con re-render completo; el header de `src/store.js`
documenta la API.

## Estado actual (lo que YA existe y está en `main`)
- **6 vistas**: resumen, movimientos, presupuesto (topes por categoría), deudas,
  calendario del mes, datos/ajustes.
- **Deudas** por tipo: tarjeta, MSI, préstamo, hipoteca y **persona** (a quién le
  debes, sin intereses — p. ej. a su papá).
- **Plan de escape** con **3 canastas** (🔴 atacar / 🔒 fijas / 🟢 a 0%) + **motor
  KYN** (ventas × ganancia se suman como extra al plan) y estrategias avalancha /
  bola de nieve.
- **Gráfica "así va tu deuda"**: línea real (puede subir) + proyección punteada a $0.
- **Ingresos con origen KYN**: chip "✨ es de KYN" + % del mes que vino de KYN.
- **Código de acceso** con cifrado real (AES-GCM + PBKDF2); pantalla de candado.
- **Sync con Notion de dos vías** (manda y trae) vía función de Netlify
  (`netlify/functions/notion-proxy.mjs`, servida en `/api/notion` por
  `dist/_redirects`). El "traer de Notion" es **conservador con deudas**: no
  reconstruye la estructura que Notion no refleja (límite, día de corte, desglose
  MSI) para no corromperla; conflictos = lo más reciente gana.

## Dónde viven los datos reales de Paulette
- **App**: `localStorage`, llave `cuentasclaras.v1` (cifrada si activó código).
- **Notion**: su página **"Cuentas Claras"** con dos databases (Movimientos y Deudas).
  - Página: `39a9be0259d181a6ad3ed9efe9aa38cd`
  - Data source Movimientos: `39a9be02-59d1-8182-8c0f-000bf7a1b683`
  - Data source Deudas: `39a9be02-59d1-81e1-af6b-000b0c3cbad9`
  - **Para ver su estado actual**, lee su Notion con las tools MCP de Notion (en su
    sesión la integración tiene acceso). Ahí están sus números reales al día.

## Su situación (contexto, SIN montos)
- Está financiando todo ella por ahora, incluido KYN → por eso los ingresos de KYN
  se etiquetan pero no se separan aún (meta: ver qué % viene de KYN y motivarse).
- Tiene una **tarjeta BBVA Platinum** con dos partes: compras regulares (con interés)
  y una parte grande a **meses sin intereses (MSI)**. Corte y fecha límite de pago
  mensuales.
- Le debe a **su papá** (deuda tipo persona, sin intereses).
- Quiere salir de deudas; le motiva ver la gráfica bajar y la fecha de "libre".

## Playbook: cuando Paulette traiga un estado de cuenta (BBVA u otro)
1. **Léelo** (si el lector de PDF del entorno falla por `cryptography` roto, usa
   `pip install pymupdf` y `fitz` — trae su propio motor).
2. **Extrae** y dile los campos, y cómo mapean a la app:
   - Saldo deudor total · desglose **regular (con interés)** vs **MSI** · límite ·
     crédito disponible · **día de corte** · **día límite de pago** · pago mínimo ·
     pago para no generar intereses · tasa de interés / CAT.
3. **Modela la tarjeta como DOS piezas** para que el plan sea real:
   - Tarjeta = solo la parte **regular** (la que genera interés) con su tasa.
   - MSI aparte (saldo restante, mensualidad ≈ pago a meses del estado de cuenta,
     meses restantes ≈ saldo/mensualidad). Los MSI no llevan interés.
4. **Compara contra el mes pasado** (usa su Notion / la gráfica): si el estado de
   cuenta es después del corte, aclara qué movimientos ya entraron y cuáles no.
5. Ofrece **armarle un archivo JSON para importar** (Datos → importar) con la
   tarjeta ya cargada, avisando que reemplaza lo que tenga (mejor si empieza de cero).
6. **Nunca** guardes esas cifras en el repo ni en este archivo.

## Cómo trabajamos (además de lo de CLAUDE.md)
- Español mexicano, tuteo, cálido, TDAH-friendly (escaneable, lo importante primero).
- Ideas nuevas → **issues** en `paulettecb/PauletteCb`; PRs con `Closes #N`; si otro
  chat/rama ya atacó algo, **reconciliar y decirlo** (ver la sección de flujo en
  CLAUDE.md). Varias sesiones tocan Cuentas Claras — revisar `main` antes de construir.

## Pendientes / ideas sobre la mesa
- **Cierre de mes**: resumen que celebra lo que bajó la deuda, cuánto entró, % KYN.
- **Movimientos recurrentes** (renta, sueldo, suscripciones) con "repetir el del
  mes pasado" — menos fricción.
- Traer de Notion también para **movimientos** (hoy el traer es sólido para deudas).

## Gotchas
- El sync con Notion **solo corre en el sitio de Netlify** (la función `/api/notion`);
  en `file://` o GitHub Pages no hay función y avisa con un error claro.
- Hubo un intento de sync (esta sesión) que agregó columnas `Datos`/`Editado` a las
  tablas de Notion; se descartó (se adoptó el sync de `main`) y esas columnas ya se
  quitaron. Quedó una página suelta "PRUEBA sync dos vías (borrar)" bajo Cuentas
  Claras que Paulette puede borrar cuando quiera.
- `npm run build` corre `build-all.mjs`; el sub-build de esta app ya está incluido.

## Bitácora (lo más nuevo arriba)
- **2026-07**: reconciliación — la gráfica de deuda (esta sesión) y el sync
  bidireccional + plan de 3 canastas + fix de la función Netlify (otra sesión)
  quedaron juntos en `main`. Se creó este archivo de memoria.
- **2026-07**: ingresos con origen KYN (% del mes).
- **2026-07**: gráfica "así va tu deuda" (historial real + proyección).
- **2026-07**: rename Lana → Cuentas Claras; deuda tipo persona; código cifrado;
  primer sync a Notion; favicons/webapp.
