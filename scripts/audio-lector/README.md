# Audio lector — generación local con Chatterbox

Herramienta **offline**, para correr en tu Mac. No es parte del sitio (no la
copia `build-all.mjs`) — genera el mp3 una vez, y ese mp3 sí se sube junto
con el capítulo cuando esté listo. Ver issue [#207](https://github.com/paulettecb/PauletteCb/issues/207).

## Por qué existe
Probaste el demo genérico de Chatterbox y no te encantó: las siglas (WISC,
WAIS…) sonaron mal, y el ritmo/pausas se sentían de máquina. Este script
ataca las dos cosas:

1. **Siglas** → `lexico_pronunciacion.json` reemplaza cada término por su
   pronunciación antes de generar el audio.
2. **Ritmo/pausas** → genera oración por oración y las pega con un silencio
   fijo entre ellas (`--pausa-ms`, default 350ms) — no depende de que el
   modelo adivine bien dónde respirar.

## Instalación (una vez)
```bash
cd scripts/audio-lector
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
La primera vez que corras el script, descarga los pesos del modelo (varios
GB) desde Hugging Face — normal, tarda, solo pasa una vez.

## Probar ya (sin argumentos)
```bash
python generar_audio.py
```
Genera `salida.mp3` con el mismo párrafo del WISC/WAIS que ya escuchaste en
el demo — para comparar directo si esto sí mejoró.

## Con tu propio texto
```bash
python generar_audio.py --texto-file mi-capitulo.txt --out mi-capitulo.mp3
```

## Si todavía no te convence
- **¿Siguen sonando mal las siglas?** Abre `lexico_pronunciacion.json`, busca
  la entrada (todas las que dicen `"_revisar": true` son mi mejor intento,
  no una pronunciación confirmada) y corrige el campo `"reemplazo"`. Vuelve
  a correr el script.
- **¿El ritmo entre oraciones sigue mal?** Sube o baja `--pausa-ms`
  (ej. `--pausa-ms 500` para pausas más largas).
- **¿Suena artificial dentro de una misma oración (no entre oraciones)?**
  Juega con `--exaggeration` (expresividad — default 0.4, pruébale 0.2 y
  0.6) y `--cfg-weight` (default 0.4). No tengo valores "correctos"
  confirmados para estos dos — son los que Chatterbox documenta para
  controlar esto, hay que escuchar y ajustar.
- **¿Quieres tu propia voz o una voz de referencia distinta a la del
  modelo?** `--voz ruta/a/un/audio/de/unos/segundos.wav`.

## Nota sobre Apple Silicon
El script detecta solo `mps` (el acelerador de tu Mac) si está disponible,
si no cae a CPU — funciona en ambos, `mps` es más rápido. No hace falta GPU
externa.

## Lo que este script todavía NO hace
No saca los tiempos por palabra (necesarios para que el lector resalte
mientras suena) — eso es el siguiente paso, con alineamiento forzado
(ej. WhisperX) sobre el mp3 ya generado. No bloquea probar la voz primero.
