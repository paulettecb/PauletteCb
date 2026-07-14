# Plan de 10 días — sprint final por bloques

> 10 días exactos, 10 categorías, 1 por día. Mecánica: tú estudias el tema del día → me avisas → te paso el bloque de reactivos de ese tema (del banco de 495 en `material/preguntas.json`) → los respondes → te doy feedback → pasamos al día siguiente.

## Las 10 categorías (cubren el examen completo: 140 disciplinar + 60 transversal = 200 reactivos oficiales)

| Día | Categoría | Reactivos oficiales | Banco disponible para practicar |
|---|---|---|---|
| 1 | **Área 1** — Propiedades y uso de instrumentos psicológicos (1.1+1.2) | 22 | de los 105 de Área 1 |
| 2 | **Área 1** — Interpretación de instrumentos + evaluación psicológica (1.3+1.4) | 27 | de los 105 de Área 1 |
| 3 | **Área 2** — Intervención: psicoanálisis/psicodinámico + conductual/cognitivo-conductual | ~parte de 22 | de los 151 de Área 2 |
| 4 | **Área 2** — Intervención: humanista, sistémico y contemporáneas basadas en evidencia | ~parte de 22 | de los 151 de Área 2 |
| 5 | **Área 2** — Técnicas/herramientas de intervención + propósito, contextos y ética (2.2+2.3) | 28 | de los 151 de Área 2 |
| 6 | **Área 3** — Fundamentos de la ciencia + epistemología + arranque de la ruta cuantitativa (3.1) | 12+ | de los 113 de Área 3 |
| 7 | **Área 3** — Ruta cuantitativa: diseños, validez interna/externa, estadística (parte de 3.2) | ~ | de los 113 de Área 3 |
| 8 | **Área 3** — Ruta cualitativa/mixta + evaluación de resultados de investigación (parte de 3.2+3.3) | ~ | de los 113 de Área 3 |
| 9 | **Transversal T1** — Comprensión lectora | 30 | de los 126 transversales |
| 10 | **Transversal T2** — Redacción indirecta | 30 | de los 126 transversales |

Orden = el mismo de la guía oficial (Área 1 → 2 → 3 → transversal). Si a medio sprint sientes que un día te costó muchísimo más que otro, lo movemos — el orden no es sagrado, la cobertura de las 10 categorías sí.

Fuente de la categorización: `temario.md` (desglose oficial por subárea) + los mini libros (`libro-area1/2/3-*.html`) ya construidos en este proyecto a partir de la guía CENEVAL.

---

## DÍA 1 — Propiedades y uso de instrumentos psicológicos

Esto es lo que necesitas poder responder con los ojos cerrados:

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
