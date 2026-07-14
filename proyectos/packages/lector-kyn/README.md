# Lector KYN

Módulo compartido de **accesibilidad de lectura** para TDAH / dislexia. Se
auto-inyecta una barra flotante con:

- **⚡ Biónica** — engrosa el inicio de cada palabra (3 niveles de fijación).
- **📏 Regla** — una banda que sigue tu **cursor**, con grosor ajustable
  (línea / fina / media / ancha).
- **👁️ Mirada** *(opt-in)* — la regla sigue tus **ojos** por webcam (iris,
  MediaPipe FaceLandmarker). Todo el procesamiento es **local**; nada de video
  sale del navegador.
- **A− / A+** — tamaño de letra.
- Preferencias en `localStorage` (`lector-kyn`) y **modo mini** (la barra se
  encoge a un botoncito ⚡).

## Cómo se importa (2 líneas)
```html
<script>
  window.LECTOR_KYN_CONFIG = {
    textSelector: '.capitulo p:not(.eyebrow), .capitulo li, .capitulo td, .glos-item span',
    containerSelector: null,   // null ⇒ escala <html>; o pon un selector de contenedor
    // side: 'left',           // 'left' (default) | 'right' — esquina de la barra/panel
    // modelUrl: '...'         // opcional: override del modelo de cara
  };
</script>
<script type="module" src="../packages/lector-kyn/lector-kyn.js"></script>
```
El módulo resuelve su CSS, el WASM y el bundle de MediaPipe vía `import.meta.url`,
así que **da igual dónde viva la herramienta** que lo importa.

## Requisitos
- **http(s) o servidor local.** Al ser módulo ESM + WASM, abrir el HTML como
  `file://` (doble clic) **no** carga el lector. Se ve en el sitio publicado o
  con `npm run dev` / un servidor local.
- La **mirada** además pide permiso de **cámara** (solo al prenderla).

## La mirada (calibración)
- Al prender 👁️ se calibra: miras unos puntos y sostienes la vista.
  - **Máxima (3×5 = 15 puntos)** — grid completo (izq/der + arriba/abajo), la
    más precisa; corrige el "ladeo" que mete la posición horizontal en el eje
    vertical.
  - **Rápida (5 puntos)** — solo vertical, para cuando tienes prisa.
- Es webcam: la precisión vertical es aproximada por límite físico de la cámara
  (mejor entre renglones que pixel exacto). Anti-parpadeo + suavizado adaptativo
  para que la regla no se caiga ni tiemble.

## Estructura
```
lector-kyn.js        entry ESM auto-inyectable
lector-kyn.css       estilos (con fallbacks de tokens KYN)
gaze/gaze-math.js    mate pura (testeable en Node) — FUENTE ÚNICA, la comparte el componente Vue de Motion Lab
gaze/gaze-reader.js  loop de cámara + calibración (browser)
gaze/mediapipe-face.js  carga FaceLandmarker (WASM vendorizado + modelo por CDN)
vendor/              runtime de @mediapipe/tasks-vision (WASM local)
```

## Mantenimiento
- El WASM (`vendor/`) es un snapshot de `@mediapipe/tasks-vision`. Tras un
  `npm i` que suba esa versión, re-emparejar JS+WASM con:
  `node scripts/vendor-lector-kyn.mjs`.
- Tests de la mate: `node --test proyectos/mediapipe-lab/tests/gaze-math.test.mjs`.
