---
description: Armar un mini libro estilo KYN sobre un tema (como el libro de agility)
---

Arma un **mini libro KYN** sobre: $ARGUMENTS

Sigue el patrón "mini libro KYN" documentado en el CLAUDE.md de este repo, con `proyectos/mediapipe-lab/libro-agility.html` como ejemplo canónico. En resumen:

1. **La hoja de hechos primero**: si Paulette aporta material fuente (temario, guía, apuntes — p. ej. para estudiar un examen como el CENEVAL), ese material ES la hoja de hechos y manda sobre cualquier conocimiento general. Si no hay material, investiga con agentes/web y arma la hoja verificada. Nada de cifras inventadas: lo que no esté verificado va como "aprox." o no va.
   - **Caso CENEVAL**: el material vive en `proyectos/ceneval/material/` (local, gitignored — no intentes commitearlo). Jerarquía: la **guía oficial** es la hoja de hechos y su temario define los capítulos; los **exámenes de práctica** dicen qué pesa más; los **libros** se consultan solo por tema, nunca enteros. Si la guía y un libro se contradicen, gana la guía. Detalles en `proyectos/ceneval/README.md`.
2. **Escribe por capítulos** (8–12), cada uno con su fact-check independiente contra la hoja antes de entrar al libro. Voz: español mexicano, tuteo, cálido, directo, escaneable, estilo "investigación de campo". Kenna puede aparecer cuando sume.
3. **Un solo archivo HTML** en `proyectos/<app-relacionada>/libro-<tema>.html` con los tokens KYN (periwinkle/pasteles, Friendship en títulos, Farmhouse en eyebrows/acentos, Hanken Grotesk como sans — títulos internos h3 SIEMPRE en mayúsculas weight 800): portada con chips, índice clickeable, cajas `.esencial` / `.nota-campo` / `.dato`, tablas en `.tabla-scroll`, glosario-chuleta al final, y **lectura por capítulo** (solo el capítulo activo visible, navegación anterior/índice/siguiente al pie, todos visibles al imprimir).
4. **Lector KYN**: copia el bloque de accesibilidad (lectura biónica + regla + tamaño de letra + modo mini ⚡) desde `libro-agility.html` — está marcado con comentarios `LECTOR KYN`.
5. **Integra y verifica**: agrega la copia a `scripts/build-all.mjs`, enlaza el libro desde la página que le corresponda, corre `npm run build` y verifica con Playwright (capítulos, fuentes, lector) revisando screenshots.
6. **Publica**: commit, push a la rama designada y PR en draft.
