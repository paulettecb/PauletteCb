# Lana 🐑 · Tu dinero del mes

App de finanzas personales: gastos e ingresos del mes, presupuesto por categoría,
control de deudas (hipoteca, tarjetas de crédito, MSI y préstamos) y un plan para
salir de deudas con estrategias bola de nieve / avalancha.

Reemplazó al viejo "Budget Planner TDAH" (julio 2026). Es un proyecto aparte de KYN,
aunque usa los tokens del design system (periwinkle, Friendship, Farmhouse, Hanken Grotesk).

## Privacidad

- **Los datos viven SOLO en el navegador** (`localStorage`, llave `lana.v1`).
  Nada viaja a internet y nada se commitea al repo.
- Respaldo: exportar/importar JSON completo y exportar movimientos a CSV (con BOM,
  listo para Excel) desde la sección **Datos**.

## Arquitectura

Vanilla JS + Vite (build propio, lo orquesta `scripts/build-all.mjs` desde la raíz).

- `src/store.js` — estado, persistencia y toda la lógica de dinero (el header documenta
  el contrato completo). **Regla de oro: los montos siempre son centavos (enteros).**
- `src/utils.js` — formato de dinero (es-MX), fechas como strings locales `YYYY-MM-DD`.
- `src/components.js` — modal, toast, confirmación y el quick-add (gasto/ingreso/pago).
- `src/main.js` — shell: router por hash, selector de mes global, tabbar y FAB.
- `src/views/*.js` — cada vista exporta `render(el)` y se re-renderiza completa al
  cambiar el estado; los modales viven en otra capa y sobreviven al re-render.
- `src/styles.css` — tokens KYN + todos los componentes visuales.

## Uso local

Desde la raíz del repo:

```bash
npx vite proyectos/budget-planner-tdah
```

O el build completo del sitio: `npm run build` (genera `dist/proyectos/budget-planner-tdah/`).
