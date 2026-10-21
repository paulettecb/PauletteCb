# Corpus Penitencia — memoria del proyecto

> **Léeme al retomar.** Esta investigación se armó a lo largo de varias sesiones y su
> historia estaba repartida entre el proyecto de Claude Design, unos PDFs sueltos y la
> cabeza de Paulette. Este archivo es el único lugar del repo donde vive el contexto.
>
> Última actualización: 2026-08-12.

---

## Qué es

**"Del daño temprano al castigo"** — investigación de licenciatura en psicología sobre
**trauma infantil y conducta delictiva adulta**, a partir de los testimonios del canal
de YouTube **Penitencia** (Saskia Niño de Rivera).

Equipo: Cambron Barrales Anna Paulette · Hernández García Carolina Graciela ·
Rodriguez Miranda Lissette Araceli · Ruiz Myers Ana Sarahi · Sepulveda Valencia Yaneth.

La vista pública vive en `proyectos/corpus-penitencia/index.html` (portafolio, tarjeta
pública). Se importó desde un proyecto de Claude Design y se reconectó al design system
KYN local.

---

## El diseño, en una frase

**Es cualitativo por el método, no por la entrevista.** Análisis de contenido cualitativo
(Krippendorff, 2019) sobre testimonios que **ya estaban grabados y publicados**. El canal
entrevistó; este proyecto interpreta la transcripción.

Los números que aparecen **no son un segundo enfoque**: son el control de calidad del
propio instrumento. Se usaron para medir cuánto erraba la herramienta y corregirla.

### El sesgo que se declara de frente
El canal decidió qué preguntar, qué grabar y qué publicar. No es un registro neutro.
Lo que se lee es una **doble narrativa**: la de quien cuenta su historia y la de quien
la interpreta.

---

## El instrumento

No hay guía de entrevista. Hay un **libro de códigos**:

- **13 categorías** tomadas del Estudio ACE (Felitti et al., 1998; Anda et al., 2006).
  Ninguna inventada.
- **4 valores posibles** por categoría:
  | Valor | Significa |
  |---|---|
  | `E` | Explícito — lo dice con esas palabras o su equivalente directo |
  | `I` | Inferido — el contexto lo sostiene con claridad |
  | `NM` | No mencionado — la entrevista no fue por ahí |
  | `NO` | Negado explícitamente — se tocó el tema y dijo que no |
- **Cada celda afirmada (`E` o `I`) tiene una cita textual con minuto exacto.**
- Cada celda marcada `I` tiene además su razonamiento escrito, caso por caso.

### La regla que sostiene todo
**El silencio no es un dato negativo.** Una categoría en `NM` no dice que la adversidad
no ocurrió; dice que la entrevista no fue por ahí. Por eso `NM` y `NO` son valores
distintos y nunca se colapsan.

---

## El hallazgo sobre el propio instrumento

El primer filtro fue un **cribado léxico**: listas de palabras clave por categoría,
pasadas por todas las transcripciones con dos programas en Python.

**Falló, y el fallo es el hallazgo.** Buscaba el vocabulario clínico de las ACE, pero la
gente no habla así. Dice *"me tiró como perro"* en vez de *"me abandonó"*; *"me encadenó
con el perro"* en vez de *"me pegaba"*; *"me cogía el güey ese"* en vez de *"abusó de mí"*.

Usando como patrón de comparación los casos que ya se habían leído completos —donde la
respuesta correcta era conocida— se midió el error y se reescribieron los patrones con
el habla real de los testimonios:

| Métrica | Antes | Después |
|---|---|---|
| Sensibilidad (de las adversidades realmente dichas, cuántas ve) | 39 % | **97 %** |
| Precisión (de lo que marca, cuánto resulta real al leer) | 63 % | **71 %** |

**La regla que quedó:** el cribado **ordena la fila de lectura, no decide la muestra**.
Un índice bajo significa "revisar después", nunca "descartar".

---

## Cómo se codificó (el proceso real)

Documentado lote por lote en el proyecto de Claude Design, `datos/progreso.md`:

1. **Piloto** (casos 001–003) codificado y revisado a mano antes de escalar.
2. **Lotes de 20**, mediante el workflow `codificar-lote-penitencia`.
3. **Validación mecánica** por lote (`validar.py`): verifica que **cada cita sea literal**
   contra la transcripción original. Encontró y corrigió citas no literales en 011, 012,
   062, 075, 093, comillas mal escapadas en 097, y citas excedentes en 030.
4. **QC periódico**: se compara el conteo de `E` contra `I` para detectar sobre-inferencia,
   y se revisan a fondo los casos con `I > E` (044, 071, 081 — los tres salieron limpios).
5. **Casos revisados a fondo** cuando algo no cuadraba: el 014 tenía una `I` apoyada en un
   pasaje mal transcrito → corregida a `NM`; quedó como caso legítimo de 13/13 `NM`.

> ⚠️ **Pendiente de precisar en la redacción del reporte.** La bitácora describe la
> codificación como asistida por agentes con validación mecánica y QC humano. Es un
> método legítimo y defendible, pero **hay que describirlo así**, no como "leímos y
> clasificamos a mano los 239". Si en los hechos hubo lectura humana completa además de
> eso, conviene dejarlo escrito aquí para poder sostenerlo.

### Casos atípicos documentados
- **093** — no es testimonio: es un mensaje de recaudación de fondos.
- **075** — no es testimonio individual: es un resumen del año con fragmentos de 14 personas.
  Codificado 13/13 `NM` por protocolo, pero sus citas sí tienen contenido ACE real.
- **Multipersona** (026, 045, 051, 103, 115) — campos mixtos aplanados a `NM`, con el
  detalle por persona preservado aparte.

---

## ⚠️ El embudo del corpus — verificado, y no cierra

Esto se revisó contra los datos el 2026-08-12. **Es lo más frágil del relato actual** y
conviene tenerlo claro antes de que alguien pregunte.

Lo que dicen los archivos, contado:

| Archivo | Filas | Detalle |
|---|---|---|
| `datos/cribado.csv` | **239** | 234 marcadas `excluido=no`, 5 marcadas `excluido=sí` |
| `datos/codificacion.csv` | **239** | todas codificadas |
| `datos/citas.csv` | **2 057** | citas con minuto exacto |

**El problema:** esos dos "239" **no son el mismo conjunto**. Se traslapan en **231**.

- **8 están en el cribado pero no codificados:** los 5 de *Volver a Empezar*
  (007, 010, 013, 016, 022 — excluidos correctamente por tipo) más **126, 226 y 234**,
  que están marcados como aptos pero nunca se codificaron.
- **8 están codificados pero no en el cribado:** 080 (Renata), 083 (Michael),
  097 (Jafet Sainz), 102 (Sebastián Marroquín), 103 (Ale, Gustavo y Felipe),
  174 (Elizabeth), 193 (José Luis), 194 (Omar "Gato" Ortiz) — varios entraron ad hoc,
  fuera del orden de lotes.

**Lo que NO se pudo verificar:** la cifra de **248 episodios** que aparece en la
presentación. `cribado.csv` tiene 239 filas, así que si el filtro corrió sobre 248, los
9 descartados ya no están en el archivo. Tampoco reconcilia con `datos/excluidos.md`,
que lista **28** episodios excluidos por tipo (11 de experto, 11 de la serie
*Sobrevivientes*, 6 de *Volver a Empezar*), no 9.

**Qué sí se puede afirmar sin riesgo:**
- ✅ "239 testimonios codificados, cada uno con las 13 categorías resueltas."
- ✅ "El criterio de exclusión es por **tipo de episodio**: se excluye lo que no es
  testimonio en primera persona de una persona privada de la libertad — episodios de
  experto, la serie *Sobrevivientes* y la serie coral *Volver a Empezar*. Sí se incluyen
  Topo Chico e Inimputables, porque ahí sí habla la persona."
- ⚠️ Evitar "de 248 quitamos 9 y quedaron los 239 que leímos" hasta reconciliar el conteo.

---

## Los datos, dónde están y qué tienen

Todo en `proyectos/corpus-penitencia/datos/`:

- **`cribado.csv`** — una fila por episodio cribado. Índice léxico, amplitud, tasa de
  señales, densidad de relato de infancia, y el conteo de marcadores por categoría.
  Incluye `preseleccion` y `nota_presel` (Beto, Hello Kitty, Calcetitas rojas · Pichardo).
- **`codificacion.csv`** — una fila por caso codificado. 32 columnas: ficha
  sociodemográfica y penal + las 13 `aceNN` con su valor `E`/`I`/`NM`/`NO`.
- **`citas.csv`** — 2 057 citas con `categoria`, `minuto`, texto y `url_timestamp`.
  **Ojo:** 177 categorías distintas, y las más numerosas **no son ACE**: falla
  institucional (338), debut delictivo (260), tortura en detención (194).

### Gotcha de datos ya corregido
La fila **032** (Francisco "El trece") venía sin el campo `url`, lo que recorría todas
sus columnas y perdía `ace13`. Corregido el 2026-08-12. **Si vuelves a generar los CSV,
verifica el conteo de campos por fila** — un solo campo faltante corre toda la fila en
silencio.

---

## Decisiones metodológicas que ya se tomaron (no re-litigar)

**No se grafica salud mental de la persona entrevistada.** La categoría 10 mide
*enfermedad mental o discapacidad en el hogar* — el entorno de crianza, no a la persona.
Hay 19 citas con lenguaje de salud mental repartidas en otras categorías, pero contarlas
sería *contar palabras en vez de codificar evidencia*: exactamente el error que se le
encontró al cribado. Además, nadie del corpus fue evaluado clínicamente; graficar
diagnósticos desde una entrevista de YouTube sería psicopatologizar sin instrumento.

**Frase para cuando pregunten:** *"No lo codificamos, y por eso no lo graficamos."*

---

## Estado de la vista pública

`index.html` es un documento autocontenido con runtime propio (`support.js`) que carga
React/ReactDOM/Babel desde unpkg. Navegación por pestañas:

| Pestaña | Contiene |
|---|---|
| Resumen | Glosario de estados + los tres preseleccionados |
| Distribución | Histograma del índice de cribado |
| Solapamiento | Prevalencia, composición, pares y matriz de co-ocurrencia |
| Corpus | Tabla paginada de los episodios con sus 13 celdas |
| Geografía | Origen por estado, desplegable a ciudad |
| Hallazgos | Los patrones y las ausencias |

### Gotchas técnicos
- **No abrir como `file://`.** El runtime necesita http — usar `npm run dev` o un
  servidor estático. Para probar: servir `proyectos/` y abrir la ruta.
- **`build-all.mjs` ya copia la carpeta completa** al `dist/`. Si se agrega un archivo
  nuevo que la página enlace, hay que verificar que caiga dentro de esa copia.
- **El campo `origen` es texto libre** (~80 variantes de escritura). Se normaliza con
  `ORIGEN_MAP` dentro del `index.html`. Si llegan casos nuevos con formas no vistas,
  caen silenciosamente en "sin dato" — hay que agregarlas al mapa.

---

## Dónde vive el resto del contexto

Este repo tiene la vista y los datos. **El proceso vive en el proyecto de Claude Design**
*"Trauma infantil y conducta delictiva"*:

| Archivo | Qué guarda |
|---|---|
| `datos/progreso.md` | Bitácora de codificación: lotes, pausas, errores, QC |
| `datos/notas-inferencia.md` | Cada celda `I` justificada, con cita y razonamiento |
| `datos/excluidos.md` | Criterio de exclusión y los 28 episodios excluidos por tipo |
| `datos/patrones-v2.js` | Los patrones léxicos reescritos con habla real |
| `uploads/` | Entregas: inventario de fuentes, matriz, ficha por caso, informes v2–v4 |
| `transcripciones/` | Las transcripciones minuto a minuto |

Y en presentaciones sueltas: *Instrumentos y técnicas de análisis* (el deck de exposición)
y *Qué podemos graficar y qué no* (el anexo metodológico sobre salud mental, consumo y
tortura).
