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
- [ ] **Flashcards con repetición espaciada** — generar un mazo importable a Anki (CSV) desde las hojas de hechos: los errores de cada simulacro se vuelven tarjetas.
- [ ] **Chuletas por área** — 1 página imprimible por área con tokens KYN, para el repaso de los últimos días.

## El plan

Ver [`plan-2-semanas.md`](./plan-2-semanas.md) — diagnóstico → ciclos por área débil → simulacros de control → repaso final.
