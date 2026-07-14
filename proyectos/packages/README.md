# proyectos/packages — módulos compartidos

Casa de **módulos reutilizables** que varias herramientas del sitio importan sin
copiar-pegar. Cada carpeta es un package auto-contenido; se enlaza con rutas
relativas (el sitio es estático, todo vive en el mismo `dist/`).

## Packages
- **`lector-kyn/`** — Lector KYN: accesibilidad de lectura (biónica + regla +
  tamaño) y regla con la mirada (webcam/iris). Ver su `README.md`.

## Cómo se agrega uno nuevo
1. Crea `proyectos/packages/<nombre>/` con un entry ESM auto-contenido.
2. Agrégalo a la lista de copias de `scripts/build-all.mjs` (si no, no llega al
   deploy — regla del `CLAUDE.md`).
3. Enlázalo desde las herramientas con `<script type="module" src="../packages/<nombre>/…">`.
4. Resuelve tus assets internos con `new URL('./…', import.meta.url)` para no
   depender de dónde viva la herramienta que lo importa.

> No entran en `projects.config.json`/`projects.json`: son infraestructura, no
> páginas visitables del sitio.
