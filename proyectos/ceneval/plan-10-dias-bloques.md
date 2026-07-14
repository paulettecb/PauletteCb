# Plan de 10 días — sprint final por bloques

> 10 días exactos, 10 categorías, 1 por día. Mecánica: tú estudias el tema del día → me avisas → te paso el bloque de reactivos de ese tema (del banco de 495 en `material/preguntas.json`) → los respondes → te doy feedback → pasamos al día siguiente.

## Las 10 categorías — qué leer cada día (esto es lo importante, no las subáreas)

Nota importante: **las subáreas del temario oficial (1.1, 1.2, 2.1…) NO son capítulos de libro.** Son solo la forma en que CENEVAL pesa el examen. Lo que sí tienes que abrir para estudiar son los capítulos de tus mini libros, listados abajo — ya hice esa traducción por ti para los 10 días, no hace falta que la hagas tú.

| Día | Categoría | Libro a abrir | Capítulos a leer (por número del índice) |
|---|---|---|---|
| 1 | Instrumentos: propiedades y uso | `libro-area1-diagnostico.html` | **04, 05** y la parte de entrevista/observación/escalas del **12** |
| 2 | Instrumentos: interpretación + evaluación psicológica | `libro-area1-diagnostico.html` | **01, 02, 03, 06, 07, 08, 09, 10, 11**, la parte de proceso diagnóstico del **12**, y **13** |
| 3 | Intervención: psicoanálisis + conductual/cognitivo-conductual | `libro-area2-intervencion.html` | **03 al 11** |
| 4 | Intervención: humanista, sistémico, contemporáneas | `libro-area2-intervencion.html` | **12 al 15** |
| 5 | Intervención: técnicas/herramientas + propósito, contextos y ética | `libro-area2-intervencion.html` | **01, 02**, y **16 al 28** (día largo — son 15 caps, si hace falta lo partimos en dos sesiones) |
| 6 | Investigación: fundamentos + epistemología | `libro-area3-investigacion.html` | **01 al 06** |
| 7 | Investigación: ruta cuantitativa | `libro-area3-investigacion.html` | **07 al 17** (también es día largo, 11 caps) |
| 8 | Investigación: cualitativa/mixta + evaluación de resultados | `libro-area3-investigacion.html` | **18 al 26** |
| 9 | Comprensión lectora | *(no hay libro — es habilidad, no contenido)* | practica directo en `simulacro.html` (modo transversal, trae los textos) + los 3 ejemplos oficiales de la guía |
| 10 | Redacción indirecta | *(no hay libro — es habilidad, no contenido)* | practica directo en `simulacro.html` (modo solo redacción) + los 3 ejemplos oficiales de la guía |

En todos los libros, el capítulo final (Glosario-chuleta) sirve de repaso rápido cualquier día que toque ese libro.

Orden = el mismo de la guía oficial (Área 1 → 2 → 3 → transversal). Si a medio sprint sientes que un día te costó muchísimo más que otro, lo movemos — el orden no es sagrado, la cobertura de las 10 categorías sí.

---

## DÍA 1 — Propiedades y uso de instrumentos psicológicos

### 📖 Qué leer hoy (nada más que esto)

Abre `libro-area1-diagnostico.html` y lee **solo estos 3 capítulos**:
- **Capítulo 04 — Psicometría: historia de la medición**
- **Capítulo 05 — Confiabilidad, validez y normas**
- **Capítulo 12 — Herramientas de evaluación psicológica** (nada más la parte de entrevista, observación y escalas de actitud; el resto de ese capítulo es de Día 2)

No leas los demás capítulos hoy (01, 02, 03, 06-11, 13) — esos son de Día 2, ya quedaron anotados ahí para no perderlos.

### Qué necesitas poder responder con los ojos cerrados al terminar

### Confiabilidad (que la medida sea consistente)
- **Test-retest** (estabilidad): mismo instrumento, dos aplicaciones, se espera r cercana a 1.
- **Consistencia interna** (una sola aplicación): **por mitades partidas** (pares vs. nones, se corrige con Spearman-Brown o Kuder-Richardson) y **Alfa de Cronbach** (promedio de todas las mitades posibles; detecta reactivos que no correlacionan con el resto).
- **Inter-jueces/inter-observador**: acuerdo entre dos evaluadores.
- Teoría Clásica de los Tests (Spearman, 1904): **X = V + e** (puntaje observado = verdadero + error). Error aleatorio (se cancela al promediar) vs. error sistemático/sesgo (no se cancela, arruina la medición).

### Validez (que la medida mida lo que dice medir) — la confiabilidad es necesaria pero NO suficiente para la validez
- **De contenido**: los reactivos son muestra representativa del dominio — se valida por **juicio de expertos**, no estadística.
- **De criterio**: correlaciona con un criterio externo — puede ser **concurrente** (criterio medido al mismo tiempo) o **predictiva** (criterio a futuro).
- **De constructo**: valida el rasgo teórico y la teoría detrás.
- **Convergente**: correlaciona ALTO con otras medidas del MISMO constructo.
- **Divergente/discriminante**: correlaciona BAJO con constructos DISTINTOS.
- **De facies (aparente)**: qué tanto la prueba "parece" medir lo que dice — la más débil, no es evidencia estadística real. (Estas tres últimas son del nivel Sobresaliente — la guía oficial las marca explícitamente, cuidado porque suelen ser trampa en reactivos.)

### Escalas de medición (Stevens, 1946)
Nominal (solo clasifica) → Ordinal (ordena, sin distancia igual — ej. percentiles) → Intervalo (distancias iguales, sin cero absoluto — ej. CI) → Razón (cero absoluto real — ej. tiempo, peso).

### Normas y puntuaciones
- Referidas a la **norma** (comparación con grupo normativo) vs. referidas al **criterio** (comparación con estándar fijo).
- Puntajes: **Z** (media 0, DE 1), **CI** (media 100, DE 15), **T** (media 50, DE 10), decatipos/estenes (media 5.5, DE 2), eneatipos/estaninas (media 5, DE 2).
- **Percentiles**: escala ordinal de 100 partes — percentil 85 = superó al 85% del grupo normativo (NO significa 85% de aciertos).
- En una curva normal, ±1 DE contiene el 68.26% de la población.

### Tipos de instrumentos y su uso
- **Psicométricos** (estandarizados, cuantitativos: inventarios, cuestionarios, escalas) vs. **Proyectivos** (estímulo ambiguo, interpretación cualitativa: Rorschach, TAT/CAT, H-T-P, Machover).
- **Entrevista**: por estructura (estructurada / semiestructurada / abierta) y por dirección (directiva / no directiva-rogeriana).
- **Observación**: sistemática vs. asistemática; participante vs. no participante; natural vs. análoga. Sesgos clásicos: reactividad y expectativa del observador.
- **Escalas de actitud**: Likert (sumativa), Thurstone (jueces, intervalos aparentemente iguales), Guttman (escalograma acumulativo), Osgood (diferencial semántico).
- Cuestionario (autoaplicable) vs. Inventario (estandarizado de personalidad/síntomas) vs. Encuesta (descriptiva poblacional).
- Selección del instrumento según **objetivo, contexto** (clínico, educativo, organizacional, social/comunitario) y **etapa del ciclo vital** del evaluado, con consentimiento informado.

### Coeficientes de acuerdo entre jueces (nivel Sobresaliente, menos frecuente pero cae)
CVR de Lawshe, IVC de Lynn, V de Aiken — todos miden qué tanto los expertos coinciden en que un reactivo es relevante/representativo.

**Fuentes para profundizar si algo no te queda claro:** `libro-area1-diagnostico.html` (capítulos "Psicometría", "Confiabilidad, validez y normas" y "Herramientas de evaluación psicológica") y `chuletas.html` (hoja imprimible de Área 1).

⚠️ **Ojo:** los capítulos del libro (01, 02, 03…) NO son lo mismo que las subáreas del temario (1.1, 1.2…) — son dos numeraciones distintas. Para Día 1 lee del índice del libro **solo los caps. 04, 05 y 12** (marcados abajo). El resto (caps. 01-03, 06-11, 13) es contenido de Día 2.

| Día | Caps. del libro `libro-area1-diagnostico.html` a leer |
|---|---|
| **1** | 04 Psicometría · 05 Confiabilidad, validez y normas · 12 Herramientas de evaluación (solo la parte de tipos de entrevista/observación/escalas) |
| **2** | 01 Bases biológicas · 02 Neurona, sinapsis y neurotransmisores · 03 Neuroanatomía · 06 Metodología de la investigación · 07 Psicodiagnóstico infantil y proyectivas · 08 Inteligencia y neuropsicología · 09 Trastornos neurocognitivos (DSM-5) · 10 Trastornos de la personalidad · 11 CONOCER · 12 (la parte de proceso diagnóstico) · 13 Desarrollo y ciclo vital |
| 14 Glosario-chuleta | repaso rápido, útil cualquier día |

Cuando estudies esto y me avises, te paso el bloque de reactivos del Día 1 sacados del banco real (de los 105 de Área 1) para que los respondas sin apuntes.

---

## Flashcards ya alineadas a estas 10 categorías

`flashcards.html` ahora tiene una sección **"Mazos por día"** además de la de por área — 142 tarjetas reclasificadas card por card a las categorías de este plan (no solo re-etiquetadas por bloque de origen: varias que estaban mal ubicadas por área, como las de investigación cualitativa que vivían en el CSV de Área 1, se movieron a su día correcto). Quedaron así:

| Día | Tarjetas |
|---|---|
| 1 | 10 |
| 2 | 25 |
| 3 | 20 |
| 4 | 8 |
| 5 | 21 |
| 6 | 15 |
| 7 | 23 |
| 8 | 20 |
| 9 (comprensión lectora) | 0 — no existen todavía, es habilidad no dato duro; repásalo con el modo transversal de `simulacro.html` |
| 10 (redacción indirecta) | 0 — mismo caso |

Los CSV nuevos viven en `flashcards/por-dia/diaNN-*.csv` (con etiqueta `CENEVAL::DiaNN` para Anki). Los 3 CSV originales por área se quedaron intactos, sin tocar.

Flujo sugerido por día: estudias el tema → repasas el mazo de ese día en `flashcards.html` → me avisas → te paso el bloque de reactivos → feedback.
