# Letras en CarPlay · dopaminique_

App personal para ver la letra de lo que suena en Apple Music en la pantalla de CarPlay, **para quien va de copiloto**. Estilo: design system de dopaminique_.

> Mockup de las 4 pantallas: artifact "Letras en CarPlay · dopaminique_" (privado, en claude.ai).

## Cómo funciona (resumen)

| Pieza | Cómo |
|---|---|
| Qué suena | `MPMusicPlayerController.systemMusicPlayer`: canción, duración y segundo actual de Apple Music |
| La letra | [LRCLIB](https://lrclib.net) (`/api/get`), formato LRC sincronizado |
| Cómo llega al coche | **Live Activity** (iOS 26 la muestra en el Dashboard de CarPlay; el widget de CarPlay también depende de ella desde iOS 26.2) |
| El límite | Desde iOS 18 la Live Activity acepta actualizaciones cada ~5–15 s |

### La idea de los bloques
En vez de mandar línea por línea, se manda un **bloque** de varias líneas. Cada línea viaja con su **inicio y fin como fechas reales**, y el widget usa piezas que el sistema anima solo (`ProgressView(timerInterval:)`, `Text(timerInterval:)`), así que dentro del bloque se ve avanzar línea por línea sin gastar actualizaciones.

## `LetrasCore/` (Swift, sin UI)
- `LRC.swift`: lee LRC (`[mm:ss.xx] texto`), varias marcas por línea, silencios.
- `Bloques.swift`: divide la letra en bloques (mínimo entre actualizaciones + máximo de líneas), y `anclado(posicion:ahora:)` pasa un bloque a fechas reales. Marca **bloques densos** (más cortos que el mínimo).
- `LRCLIB.swift`: modelo de la respuesta y regla de "misma versión" (duración ±3 s).
- `letras-analiza`: herramienta de línea de comandos para ver cómo queda una canción en bloques.

```bash
cd proyectos/letras-carplay/LetrasCore
swift test
curl -s "https://lrclib.net/api/get?track_name=…&artist_name=…" > /tmp/cancion.json
swift run letras-analiza /tmp/cancion.json 15 4   # mínimo 15 s, máximo 4 líneas
```

**Nunca commitear letras reales** (derechos de autor): los tests usan una letra inventada.

## Primer dato real
*Don't Speak* (No Doubt) con mínimo 15 s y máximo 4 líneas: **10 de 17 bloques salen densos** (el más corto, 9.3 s). Con 5 líneas bajan a 3 de 15. → La tarjeta de letra necesita caber **5 líneas** o aceptar ~10 s entre actualizaciones (hay que medir qué tanto aguanta iOS en el iPhone real).

## Falta
- [ ] Medir en iPhone real cada cuánto acepta iOS 26 actualizar la Live Activity
- [ ] Confirmar que `ProgressView(timerInterval:)` con inicio en el futuro se queda vacío hasta que le toca
- [ ] App de iPhone + Widget Extension (Xcode, en la Mac)
- [ ] Mantener la app viva en segundo plano (solo uso personal)
- [ ] Ajustar el mockup a "estrofa + barrita por línea"
