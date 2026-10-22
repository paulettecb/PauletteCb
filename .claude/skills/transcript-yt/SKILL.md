---
name: transcript-yt
description: Baja la transcripción de uno o varios videos de YouTube y la deja en Markdown, agrupada por minuto y con cada marca de tiempo enlazada al momento exacto del video. Úsalo cuando Paulette pida bajar, sacar o conseguir el transcript / la transcripción / los subtítulos de un video, un canal o una playlist de YouTube — aunque no mencione esta skill. También cuando diga "pásame lo que dice ese video", "necesito el texto de este video" o quiera armar un corpus de videos para analizar.
---

# Bajar transcripciones de YouTube

Script: `bajar_transcript.py`, **en la misma carpeta que este SKILL.md**. Usa **yt-dlp** por debajo.

> **Para Claude:** resuelve la ruta del script contra la carpeta de esta skill, no contra el repo.
> Esta skill puede estar instalada como skill de cuenta (carpeta sincronizada) o dentro de un
> proyecto (`.claude/skills/transcript-yt/`). En los ejemplos de abajo, `$SKILL` es la carpeta
> donde está este archivo. Si no la sabes de cierto, encuéntrala:
> `find ~/.claude /workspace . -name bajar_transcript.py 2>/dev/null | head -1`

## Lo mínimo

```bash
python3 "$SKILL/bajar_transcript.py" "<URL del video>" --out <carpeta>
```

Deja un `.md` por video con este formato:

```markdown
---
titulo: "..."
canal: "..."
video_id: "..."
url: "https://www.youtube.com/watch?v=..."
publicado: "2026-07-15"
duracion: "01:02:05"
duracion_segundos: 3725
fuente: transcripción automática de YouTube (verificar contra audio antes de citar)
tags: [transcripcion]
---

# Título del video

> [!warning] Transcripción automática
> Generada por YouTube, no revisada por humanos. ...

**[00:00:00](https://www.youtube.com/watch?v=XXX&t=0s)**

Texto corrido de ese minuto...
```

Es el mismo formato del corpus Penitencia (el repo `paulettecb/PauletteCb`, en `proyectos/corpus-penitencia/`), para que todo lo que baje se vea igual y se pueda citar con minuto exacto.

## Opciones

| Opción | Para qué |
|---|---|
| `--out DIR` | Carpeta de salida (default `transcripciones/`) |
| `--lang` | Idiomas en orden de preferencia. Default `es.*,es,en.*,en` |
| `--nombre 001` | Nombre del archivo sin `.md`. Default: slug del título |
| `--tags a,b` | Tags del frontmatter |
| `--playlist` | La entrada es una playlist o un canal; numera `001.md`, `002.md`… |

Acepta URL completa, URL corta (`youtu.be/...`), `/shorts/`, `/live/` o el ID pelón.

## Ejemplos

```bash
# Un video, nombre automático
python3 "$SKILL/bajar_transcript.py" "https://www.youtube.com/watch?v=ABCdefGHIjk"

# Con nombre y carpeta propios
python3 "$SKILL/bajar_transcript.py" ABCdefGHIjk \
  --out ~/Desktop/transcripts --nombre entrevista-01

# Playlist completa, numerada
python3 "$SKILL/bajar_transcript.py" \
  "https://www.youtube.com/playlist?list=PLxxxx" --playlist --out corpus/

# Solo inglés
python3 "$SKILL/bajar_transcript.py" <URL> --lang "en.*,en"
```

## Requisito

**yt-dlp** en el PATH. Si no está, el script lo dice y no hace nada raro.

```bash
brew install yt-dlp     # macOS
pip install -U yt-dlp   # cualquier lado
```

Conviene actualizarlo de vez en cuando: YouTube cambia cosas y yt-dlp las persigue. Si un día falla con un error raro, **lo primero es `pip install -U yt-dlp`**.

## Qué hace por dentro (y por qué)

- **Pide `json3` antes que VTT.** Los subtítulos automáticos en VTT repiten cada línea (efecto karaoke) y hay que des-duplicarlos a mano. El `json3` viene limpio. Hay un parser de VTT de respaldo por si un video solo tiene ese.
- **Agrupa por minuto.** Un bloque por minuto con su enlace `&t=NNNs`, en vez de cientos de líneas sueltas. Así se lee y así se cita.
- **`[ __ ]` → `[censurado]`.** YouTube censura groserías así; el corpus Penitencia las guarda como `[censurado]` y se respeta esa convención.
- **Escapa comillas** en el frontmatter, porque muchos títulos de YouTube traen `"` y `|`.

## Cosas que vas a querer saber

- **Si un video no tiene subtítulos**, el script lo avisa y sigue con el siguiente (en playlist). No truena todo.
- **Las transcripciones automáticas tienen errores**, sobre todo con caló, nombres propios y palabras encimadas. Por eso el aviso va dentro del archivo: **verificar contra el audio antes de citar textual**.
- **Videos privados o con restricción de edad** no se pueden bajar sin credenciales. yt-dlp acepta `--cookies-from-browser`, pero eso no está puesto aquí a propósito.
- Para un corpus grande, bájalo en tandas y revisa que el conteo de archivos cuadre con el de videos.

## Cuando lo uses con Paulette

- Pregunta **dónde** quiere los archivos si no lo dijo; no asumas que van al repo.
- Si son muchos videos, dile **cuántos** salieron con transcripción y cuántos no, antes de seguir.
- Si el material es para una investigación, recuérdale (una vez, sin sermón) que las citas textuales hay que verificarlas contra el audio.
