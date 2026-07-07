---
description: Armar un mini libro estilo KYN sobre un tema (como el libro de agility)
---

Arma un **mini libro KYN** sobre: $ARGUMENTS

Sigue el patrón "mini libro KYN" documentado en el CLAUDE.md de este repo, con `proyectos/mediapipe-lab/libro-agility.html` como ejemplo canónico. En resumen:

1. **Investiga primero**: arma una hoja de hechos verificados sobre el tema (investiga con agentes/web si hace falta). Nada de cifras inventadas: lo que no esté verificado va como "aprox." o no va.
2. **Escribe por capítulos** (8–12), cada uno con su fact-check independiente antes de entrar al libro. Voz: español mexicano, tuteo, cálido, directo, escaneable, estilo "investigación de campo". Kenna puede aparecer cuando sume.
3. **Un solo archivo HTML autocontenido** en `proyectos/<app-relacionada>/libro-<tema>.html` con los tokens KYN (periwinkle/pasteles, Friendship en títulos, Farmhouse en eyebrows/acentos): portada con chips, índice clickeable, cajas `.esencial` / `.nota-campo` / `.dato`, tablas en `.tabla-scroll`, glosario-chuleta al final.
4. **Lector KYN**: copia el bloque de accesibilidad (lectura biónica + regla + tamaño de letra) desde `libro-agility.html` — está marcado con comentarios `LECTOR KYN`.
5. **Integra y verifica**: agrega la copia a `scripts/build-all.mjs`, enlaza el libro desde la página que le corresponda, corre `npm run build` y verifica con Playwright (capítulos, fuentes, lector) revisando screenshots.
6. **Publica**: commit, push a la rama designada y PR en draft.
