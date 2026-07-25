# CENEVAL — base de estudio 🎓

> **Meta**: testimonio sobresaliente → premio CENEVAL de desempeño. Tenemos ~2 semanas. Se puede.

## Qué es esta carpeta

Aquí vive todo lo del proyecto de estudio para el CENEVAL:

- **`material/`** → tus fuentes: guía oficial, libros completos, exámenes de práctica. **Solo local, nunca se sube** (está en `.gitignore`): el repo se publica en Netlify/GitHub Pages y los libros pesan y tienen derechos de autor. Arrastra ahí todos tus archivos y listo.
- **Lo que SÍ se commitea**: el mini libro HTML final, hojas de hechos destiladas (apuntes tuyos, chiquitos), chuletas por área, y el plan de estudio.

## Cómo arrancar (sesión local)

1. Abre **Claude Code en tu compu** (app de escritorio o CLI), parada en tu clon de este repo — así carga solito el `CLAUDE.md` y el comando `/mini-libro`.
2. Arrastra guía + libros + exámenes a `proyectos/ceneval/material/`.
3. Corre `/mini-libro guía ceneval` y di dónde está el material.

## Jerarquía de fuentes (quién manda)

| Prioridad | Fuente | Para qué |
|---|---|---|
| 🥇 | **Guía oficial CENEVAL** | ES la hoja de hechos. Su temario define el esqueleto del libro (capítulos = áreas/subáreas). |
| 🥈 | **Exámenes de práctica** | Dicen qué temas pesan más y qué estilo de pregunta cae. Priorizan el orden de estudio. |
| 🥉 | **Libros completos** | Consulta de profundidad por capítulo. NO se leen enteros: se abren solo para el tema en turno. |

Regla: si la guía y un libro se contradicen, **gana la guía** (el examen se califica contra ella).

## Herramientas del proyecto (además del libro)

- [x] **Mini libros por área** — `libro-area1-diagnostico.html`, `libro-area2-intervencion.html`, `libro-area3-investigacion.html` + hub `index.html`, con lector KYN.
- [x] **Simulacro interactivo KYN** — `simulacro.html` + `material/preguntas.json` (local, gitignored: 489 reactivos de los 5 exámenes de `guías/`, 224 con justificación; método en `material/extraccion-examenes/NOTAS.md`). Rondas por área, examen completo 140, transversal con textos, repaso de errores, export CSV para Anki. El código de la app sí se commitea; las preguntas no.
- [x] **Flashcards con repetición espaciada** — `flashcards.html` + `flashcards/area{1,2,3}-*.csv` (142 tarjetas destiladas de los glosarios de los libros; se commitean, son contenido propio). Estudio en el navegador o descarga a Anki. Además, los errores de cada simulacro exportan a CSV desde el propio simulacro.
- [x] **Encuentra tu prueba (Área 3)** — `area3-que-prueba-interactiva.html`: el árbol de decisión estadística convertido en herramienta. Contestas 2–4 preguntas (qué te pide el reactivo → cuántos grupos → relacionados/independientes → nivel de medición) y aterriza en una de las 20 pruebas, con su pista de examen, un visual (F, r², regresión lineal vs. logística) y las otras opciones del mismo caso para comparar. Sale del diseño hecho en Claude Design.
- [x] **Chuletas por área** — `chuletas.html`: 1 página imprimible por área (142 términos totales, tokens KYN, `@media print` con salto de página entre áreas), para el repaso de los últimos días.

## El plan

Ver [`plan-2-semanas.md`](./plan-2-semanas.md) — diagnóstico → ciclos por área débil → simulacros de control → repaso final. Sprint final día a día en [`plan-10-dias-bloques.md`](./plan-10-dias-bloques.md).

## Cómo aprende Paulette

Ver [`perfil-aprendizaje.md`](./perfil-aprendizaje.md) — SOP vivo del método de estudio (TDAH, altas capacidades, rasgos autistas: narrativa causal, no listas, conversación socrática). Se auto-actualiza con cada tema. `CLAUDE.md` lo carga automáticamente al abrir el proyecto.
