# PauletteCb — memoria del repo

## Quién y cómo hablamos
- Paulette: mexicana, líder front-end y estudiante de psicología, con TDAH. Su Border Collie se llama Kenna.
- Responder en español mexicano, tuteo, cálido y directo. Contenido escaneable (TDAH-friendly): subtítulos, listas, cajas de resumen.

## Flujo de trabajo con issues y PRs (GitHub) — mantener el hilo
Paulette dice muchas ideas y no quiere perderlas: cada cosa se refleja en GitHub (`paulettecb/PauletteCb`).
- **Idea nueva que no se hace ya → issue**, con contexto suficiente para retomarla sola (síntoma, dónde, propuesta, casillas).
- **Al abrir/actualizar un PR**: vincularlo a su issue con `Closes #N` en el cuerpo, y dejar el estado real (qué se hizo, qué falta, cómo se verificó).
- **Al avanzar en un issue**: comentar el progreso y marcar casillas; cerrar solo cuando de verdad quedó (o vía `Closes #N` al mergear).
- Si un tema se atacó desde otra rama/sesión, **reconciliar y decirlo** en el issue/PR (no pisar trabajo ajeno).
- Todo issue/comentario en español mexicano, TDAH-friendly (escaneable).

## Cómo se construye y despliega
- `npm run build` corre `scripts/build-all.mjs`: build de Vite (raíz + MotionLab) + build propio de budget-planner-tdah + copia de estáticos (lsm, KYN Design System, libro-agility.html, projects.json). Netlify y GitHub Pages sirven ese mismo `dist/`.
- Todo archivo estático nuevo que la web enlace debe agregarse a la lista de copias de `build-all.mjs`, o no llegará al deploy.
- NUNCA re-ejecutar runs viejos del workflow "Deploy to Netlify" (los anteriores al fix del SITE_ID apuntaban al sitio de kyncost y lo sobreescriben).

## Design system KYN (fuente de verdad local)
- Tokens y fuentes: `proyectos/mediapipe-lab/src/styles.css` (paleta periwinkle/pasteles, `--font-display: Friendship`, `--font-accent: Farmhouse`) y `proyectos/KYN Design System/` (fuentes .otf en `assets/fonts/`).
- Cualquier página o documento nuevo debe usar estos tokens, no colores/fuentes ad hoc.

## Patrón "mini libro KYN" (así se arman los proyectos de estudio/documento)
Ejemplo canónico: `proyectos/mediapipe-lab/libro-agility.html`. Para repetirlo existe el comando `/mini-libro`. Las piezas:
1. **Un solo archivo HTML autocontenido** en `proyectos/<app>/libro-<tema>.html`: CSS inline con los tokens KYN, fuentes vía ruta relativa a `proyectos/KYN Design System/assets/fonts/`.
2. **Estructura fija**: portada (sello + h1 Friendship + subtítulo Farmhouse + chips pastel), índice clickeable, capítulos con eyebrow Farmhouse, y cierre con glosario/chuleta. **Lectura por capítulo**: solo se muestra el capítulo activo; anterior/siguiente aparecen solo vía los botones `.cap-nav` (al imprimir se muestran todos). **TODOS los tipos de título internos que no sean Friendship** (h3 de capítulo, títulos de tarjeta del hub, cualquier subtítulo) van en Hanken Grotesk (Google Fonts, la sans oficial de KYN) **Black (weight 900)** y SIEMPRE en MAYÚSCULAS — a Paulette solo le gustan así. Excepciones que se quedan como están: el h1/h2 Friendship (display) y el eyebrow Farmhouse (kicker "Capítulo N"). Cargar el 900 en el `<link>` de Hanken (`wght@…;900`).
3. **Cajas de contenido**: `.esencial` (⭐ resumen accionable, 1 por capítulo al final), `.nota-campo` (📝 observación vivida), `.dato` (💡 curiosidad), tablas dentro de `.tabla-scroll`.
4. **Contenido verificado**: cada capítulo se escribe contra una hoja de hechos verificados y pasa por un fact-checker independiente; los números que no estén en la hoja van como "aprox." o se omiten.
5. **Lector KYN obligatorio**: el bloque de accesibilidad de lectura (lectura biónica con 3 niveles, regla que sigue el cursor, tamaño A−/A+, localStorage, oculto en print, y modo mini: la barra se encoge a un botoncito ⚡ a los segundos de no usarla). Copiarlo desde `libro-agility.html` (bloques marcados `LECTOR KYN` en CSS y al final del body).
6. **Integración**: agregar la copia en `scripts/build-all.mjs`, enlazar desde la página de la app, y verificar con Playwright (capítulos renderizan, fuentes Friendship/Farmhouse cargadas, lector funciona) antes de commitear.

## Cuentas Claras — finanzas personales (proyectos/budget-planner-tdah)
- App de finanzas de Paulette (reemplazó al viejo budget planner en julio 2026; antes se llamó "Lana"): gastos, presupuesto, deudas (hipoteca/tarjetas/MSI/préstamos) y plan bola de nieve/avalancha. Es proyecto aparte de KYN aunque usa sus tokens.
- **Privacidad**: los datos viven SOLO en localStorage (`cuentasclaras.v1`), cifrables con código de acceso (AES-GCM) con export/import JSON y CSV. NUNCA commitear datos financieros reales ni telemetría. Única red permitida: el sync opcional a Notion que Paulette pidió (token suyo, vía función Netlify).
- Contrato interno: montos SIEMPRE en centavos (enteros); vistas exportan `render(el)` con re-render completo; el header de `src/store.js` documenta toda la API. Vanilla JS + Vite propio (ya orquestado en `build-all.mjs`, mismo folder de siempre).

## Gotchas técnicos de MotionLab (proyectos/mediapipe-lab)
- MediaPipe: usar `shallowRef` para landmarkers y resultados por frame (un `ref()` profundo rompe el estado interno del task). WASM se bundlea con imports `?url`, nunca CDN.
- Tests: motor de maniobras probado en Node con landmarks sintéticos; E2E con Playwright + cámara falsa (`--use-fake-device-for-media-stream`) y modelos .task servidos con `page.route`.
