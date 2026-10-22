#!/usr/bin/env python3
"""
Baja la transcripción de un video de YouTube y la deja en Markdown,
agrupada por minuto y con cada marca de tiempo enlazada al momento exacto.

Formato de salida: el mismo del corpus Penitencia (frontmatter + aviso +
bloques por minuto), para que todo lo que baje Paulette se vea igual.

Uso:
    python3 bajar_transcript.py <URL o ID> [--out DIR] [--lang es] [--nombre 001]
    python3 bajar_transcript.py <URL de playlist> --playlist --out DIR

Requiere: yt-dlp en el PATH (pip install yt-dlp, o brew install yt-dlp).
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

# YouTube marca las groserías en los subtítulos automáticos como "[ __ ]".
# El corpus Penitencia las guarda como "[censurado]", así que normalizamos igual.
RE_BIP = re.compile(r"\[\s*_+\s*\]")
RE_ESPACIOS = re.compile(r"[ \t]+")


def falta_ytdlp():
    if shutil.which("yt-dlp"):
        return None
    return (
        "No encontré yt-dlp en el PATH.\n"
        "  macOS:  brew install yt-dlp\n"
        "  pip:    pip install -U yt-dlp\n"
        "  (o descarga el binario de github.com/yt-dlp/yt-dlp/releases)"
    )


def correr(cmd):
    """Corre un comando y devuelve stdout; si falla, muestra el error real de yt-dlp."""
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        err = (p.stderr or p.stdout or "").strip()
        raise SystemExit(f"yt-dlp falló:\n{err}")
    return p.stdout


def normaliza_id(entrada):
    """Acepta URL completa, URL corta, o el ID pelón."""
    entrada = entrada.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", entrada):
        return entrada
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})", entrada)
    if m:
        return m.group(1)
    raise SystemExit(f"No pude sacar el ID del video de: {entrada!r}")


def metadatos(video_id):
    out = correr([
        "yt-dlp", "--skip-download", "--dump-single-json",
        "--no-warnings", f"https://www.youtube.com/watch?v={video_id}",
    ])
    return json.loads(out)


def baja_subs(video_id, langs, destino):
    """
    Pide los subtítulos a yt-dlp en json3 (limpio, sin los duplicados rodantes
    del VTT). Primero intenta los subtítulos reales y luego los automáticos.
    Devuelve la ruta del archivo descargado, o None si el video no tiene.
    """
    plantilla = os.path.join(destino, "%(id)s.%(ext)s")
    correr([
        "yt-dlp", "--skip-download",
        "--write-subs", "--write-auto-subs",
        "--sub-langs", langs,
        "--sub-format", "json3/vtt",
        "--no-warnings",
        "-o", plantilla,
        f"https://www.youtube.com/watch?v={video_id}",
    ])
    archivos = [f for f in os.listdir(destino) if f.endswith((".json3", ".vtt"))]
    if not archivos:
        return None
    # json3 primero: es el que no trae líneas repetidas.
    archivos.sort(key=lambda f: (not f.endswith(".json3"), f))
    return os.path.join(destino, archivos[0])


def lee_json3(ruta):
    """Devuelve [(segundos, texto), ...] desde el formato json3 de YouTube."""
    with open(ruta, encoding="utf-8") as fh:
        data = json.load(fh)
    piezas = []
    for evento in data.get("events") or []:
        segs = evento.get("segs")
        if not segs:
            continue
        texto = "".join(s.get("utf8", "") for s in segs)
        if not texto.strip():
            continue
        piezas.append((int(evento.get("tStartMs", 0)) // 1000, texto))
    return piezas


def lee_vtt(ruta):
    """
    Respaldo por si YouTube solo entrega VTT. Los subtítulos automáticos en VTT
    repiten cada línea (efecto karaoke), así que vamos quitando lo ya visto.
    """
    with open(ruta, encoding="utf-8") as fh:
        crudo = fh.read()

    bloques = re.split(r"\n\s*\n", crudo)
    piezas = []
    previo = ""
    for bloque in bloques:
        m = re.search(r"(\d{2}):(\d{2}):(\d{2})\.\d{3}\s+-->", bloque)
        if not m:
            continue
        h, mi, s = (int(x) for x in m.groups())
        segundos = h * 3600 + mi * 60 + s

        lineas = []
        for linea in bloque.splitlines():
            if "-->" in linea or linea.strip().upper().startswith(("WEBVTT", "KIND:", "LANGUAGE:")):
                continue
            linea = re.sub(r"<[^>]+>", "", linea).strip()
            if linea:
                lineas.append(linea)
        texto = " ".join(lineas).strip()
        if not texto:
            continue

        # Quita el prefijo que ya veníamos arrastrando del bloque anterior.
        if previo and texto.startswith(previo):
            nuevo = texto[len(previo):].strip()
        elif texto == previo:
            nuevo = ""
        else:
            nuevo = texto
        previo = texto
        if nuevo:
            piezas.append((segundos, nuevo))
    return piezas


def agrupa_por_minuto(piezas):
    """{minuto: 'texto corrido de ese minuto'} — así se lee el corpus Penitencia."""
    por_minuto = {}
    for segundos, texto in piezas:
        minuto = segundos // 60
        por_minuto.setdefault(minuto, []).append(texto.strip())
    salida = {}
    for minuto, trozos in por_minuto.items():
        texto = " ".join(trozos)
        texto = RE_BIP.sub("[censurado]", texto)
        texto = RE_ESPACIOS.sub(" ", texto).replace(" \n", "\n").strip()
        if texto:
            salida[minuto] = texto
    return salida


def hhmmss(segundos):
    return f"{segundos // 3600:02d}:{(segundos % 3600) // 60:02d}:{segundos % 60:02d}"


def comillas(valor):
    """Escapa para meterlo en el frontmatter YAML entre comillas dobles."""
    return str(valor or "").replace("\\", "\\\\").replace('"', '\\"')


def arma_markdown(meta, por_minuto, tags):
    video_id = meta.get("id", "")
    url = f"https://www.youtube.com/watch?v={video_id}"
    titulo = meta.get("title") or "(sin título)"
    canal = meta.get("uploader") or meta.get("channel") or ""
    dur = int(meta.get("duration") or 0)

    subido = meta.get("upload_date") or ""
    if re.fullmatch(r"\d{8}", subido):
        subido = f"{subido[:4]}-{subido[4:6]}-{subido[6:]}"

    lineas = [
        "---",
        f'titulo: "{comillas(titulo)}"',
        f'canal: "{comillas(canal)}"',
        f'video_id: "{comillas(video_id)}"',
        f'url: "{url}"',
        f'publicado: "{subido}"',
        f'duracion: "{hhmmss(dur)}"',
        f"duracion_segundos: {dur}",
        "fuente: transcripción automática de YouTube (verificar contra audio antes de citar)",
        f"tags: [{', '.join(tags)}]",
        "---",
        "",
        f"# {titulo}",
        "",
        "> [!warning] Transcripción automática",
        "> Generada por YouTube, no revisada por humanos. Verifica cualquier cita textual"
        " contra el audio antes de usarla. Cada marca de tiempo es un enlace directo a ese"
        " momento del video.",
        "",
    ]

    for minuto in sorted(por_minuto):
        segundos = minuto * 60
        lineas.append(f"**[{hhmmss(segundos)}]({url}&t={segundos}s)**")
        lineas.append("")
        lineas.append(por_minuto[minuto])
        lineas.append("")

    return "\n".join(lineas).rstrip() + "\n"


def slug(texto, tope=60):
    texto = re.sub(r"[^\w\s-]", "", texto, flags=re.UNICODE).strip().lower()
    texto = re.sub(r"[\s_-]+", "-", texto)
    return texto[:tope].strip("-") or "video"


def una(video_id, args):
    meta = metadatos(video_id)

    with tempfile.TemporaryDirectory() as tmp:
        ruta = baja_subs(video_id, args.lang, tmp)
        if not ruta:
            print(f"  ⚠️  {video_id}: sin subtítulos en «{args.lang}». "
                  f"Prueba --lang en, o --lang \"es.*,en.*\"", file=sys.stderr)
            return None
        piezas = lee_json3(ruta) if ruta.endswith(".json3") else lee_vtt(ruta)

    if not piezas:
        print(f"  ⚠️  {video_id}: el archivo de subtítulos vino vacío.", file=sys.stderr)
        return None

    por_minuto = agrupa_por_minuto(piezas)
    md = arma_markdown(meta, por_minuto, args.tags.split(",") if args.tags else ["transcripcion"])

    nombre = args.nombre or slug(meta.get("title") or video_id)
    destino = os.path.join(args.out, f"{nombre}.md")
    os.makedirs(args.out, exist_ok=True)
    with open(destino, "w", encoding="utf-8") as fh:
        fh.write(md)

    palabras = sum(len(t.split()) for t in por_minuto.values())
    print(f"  ✅ {destino}  ({len(por_minuto)} min · ~{palabras:,} palabras)")
    return destino


def main():
    ap = argparse.ArgumentParser(description="Baja transcripciones de YouTube a Markdown.")
    ap.add_argument("entrada", help="URL del video, ID, o URL de playlist (con --playlist)")
    ap.add_argument("--out", default="transcripciones", help="carpeta de salida")
    ap.add_argument("--lang", default="es.*,es,en.*,en",
                    help='idiomas en orden de preferencia (default: "es.*,es,en.*,en")')
    ap.add_argument("--nombre", default=None,
                    help="nombre del archivo sin .md (default: slug del título). Solo para un video.")
    ap.add_argument("--tags", default="transcripcion", help="tags del frontmatter, separados por coma")
    ap.add_argument("--playlist", action="store_true", help="la entrada es una playlist o canal")
    args = ap.parse_args()

    problema = falta_ytdlp()
    if problema:
        raise SystemExit(problema)

    if args.playlist:
        out = correr(["yt-dlp", "--flat-playlist", "--print", "%(id)s",
                      "--no-warnings", args.entrada])
        ids = [l.strip() for l in out.splitlines() if l.strip()]
        if not ids:
            raise SystemExit("No encontré videos en esa playlist.")
        print(f"📋 {len(ids)} videos en la playlist\n")
        hechos = 0
        for i, vid in enumerate(ids, 1):
            print(f"[{i}/{len(ids)}] {vid}")
            args.nombre = f"{i:03d}"
            if una(vid, args):
                hechos += 1
        print(f"\n🎉 {hechos} de {len(ids)} con transcripción, en {args.out}/")
    else:
        vid = normaliza_id(args.entrada)
        print(f"🎬 {vid}")
        if not una(vid, args):
            raise SystemExit(1)


if __name__ == "__main__":
    main()
