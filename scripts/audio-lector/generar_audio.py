#!/usr/bin/env python3
"""Genera audio narrado en español con Chatterbox Multilingual, aplicando
el léxico de pronunciación antes de sintetizar y controlando la pausa entre
oraciones de forma determinista (no depende de que el modelo "adivine" bien
el ritmo).

Corre LOCAL, en tu Mac — no hay servidor ni costo por uso.

Uso más simple (usa el párrafo de prueba WISC/WAIS embebido abajo):
    python generar_audio.py

Con tu propio texto:
    python generar_audio.py --texto-file mi-capitulo.txt --out mi-capitulo.mp3

Ver README.md en esta misma carpeta para instalación y qué parámetros
mover si el ritmo/expresividad todavía no convence.
"""

import argparse
import json
import re
import sys
from pathlib import Path

CARPETA = Path(__file__).parent
LEXICO_PATH = CARPETA / "lexico_pronunciacion.json"

# El mismo párrafo que Paulette ya escuchó en el demo genérico de Chatterbox,
# para poder comparar directo: ¿mejoró con el léxico + los parámetros, o no?
TEXTO_PRUEBA = (
    "La WISC-IV da un CI Total más 4 índices. Con mucha dispersión entre "
    "índices se usa el IAG, Índice de Aptitud General, en vez del CIT. "
    "Ojo: el WISC-V renombró IRP a Visoespacial más Razonamiento Fluido, "
    "no confundir versiones."
)


def cargar_lexico() -> dict:
    data = json.loads(LEXICO_PATH.read_text(encoding="utf-8"))
    return {k: v["reemplazo"] for k, v in data.items() if not k.startswith("_")}


def aplicar_lexico(texto: str, lexico: dict) -> str:
    """Reemplaza cada término del léxico por su pronunciación, respetando
    límites de palabra. Los términos más largos van primero (p. ej.
    'WISC-IV' antes que 'WISC') para que no se partan mal."""
    for termino in sorted(lexico, key=len, reverse=True):
        patron = r"\b" + re.escape(termino) + r"\b"
        texto = re.sub(patron, lexico[termino], texto)
    return texto


def partir_oraciones(texto: str) -> list[str]:
    """División simple por punto/signo de cierre. No es perfecta (no sabe de
    abreviaturas), pero para texto de estudio ya redactado alcanza — revisar
    a mano si algo se corta raro."""
    partes = re.split(r"(?<=[.!?])\s+", texto.strip())
    return [p for p in partes if p]


LATAM_REPO = "ResembleAI/Chatterbox-Multilingual-es-mx-latam"


def cargar_modelo_latam(device):
    """Carga el finetune específico de español latino/mexicano en vez del
    modelo multilingüe general (que por default sale con acento de España —
    bug conocido y reportado, no es cosa nuestra). EXPERIMENTAL: solo
    reemplaza los pesos de T3 y S3Gen (las partes que sí cambian entre
    idiomas) y reusa el voice-encoder/tokenizer del modelo general (son
    infraestructura compartida). No hay garantía de que encaje sin ajustes
    — si truena, el error va a decir exactamente qué archivo/formato no
    cuadró, y de ahí seguimos."""
    from huggingface_hub import hf_hub_download, snapshot_download
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS, REPO_ID

    base_dir = Path(snapshot_download(
        repo_id=REPO_ID,
        repo_type="model",
        revision="main",
        allow_patterns=["ve.pt", "grapheme_mtl_merged_expanded_v1.json", "conds.pt", "Cangjie5_TC.json"],
    ))

    carpeta = CARPETA / ".modelo-latam"
    carpeta.mkdir(exist_ok=True)
    for nombre in ("ve.pt", "grapheme_mtl_merged_expanded_v1.json", "conds.pt"):
        origen = base_dir / nombre
        destino = carpeta / nombre
        if origen.exists() and not destino.exists():
            destino.symlink_to(origen)

    # Estos dos SÍ son el finetune LATAM — nombres distintos a los que espera
    # from_local(), por eso el symlink los renombra al vuelo.
    renombres = {
        "t3_es_mx_latam.safetensors": "t3_mtl23ls_v2.safetensors",
        "s3gen_v3.pt": "s3gen.pt",
    }
    for nombre_remoto, nombre_local in renombres.items():
        destino = carpeta / nombre_local
        if not destino.exists():
            origen = hf_hub_download(repo_id=LATAM_REPO, filename=nombre_remoto)
            destino.symlink_to(origen)

    # No usamos ChatterboxMultilingualTTS.from_local() aquí a propósito: el
    # checkpoint S3Gen del finetune latino ("v3") no trae 2 buffers internos
    # (tokenizer._mel_filters, tokenizer.window — pinta a cálculo fijo de
    # filtros mel/ventana, no pesos aprendidos) y from_local() carga con
    # strict=True, así que truena. Replicamos su misma lógica de carga pero
    # con strict=False solo para S3Gen. Si el chatterbox instalado cambia
    # from_local(), hay que revisar que esto siga en sync.
    import torch
    from safetensors.torch import load_file as load_safetensors
    from chatterbox.mtl_tts import VoiceEncoder, T3, T3Config, S3Gen, MTLTokenizer, Conditionals

    map_location = torch.device("cpu") if device in ("cpu", "mps") else None

    ve = VoiceEncoder()
    ve.load_state_dict(torch.load(carpeta / "ve.pt", map_location=map_location, weights_only=True))
    ve.to(device).eval()

    t3 = T3(T3Config.multilingual())
    t3_state = load_safetensors(carpeta / "t3_mtl23ls_v2.safetensors")
    if "model" in t3_state.keys():
        t3_state = t3_state["model"][0]
    t3.load_state_dict(t3_state)
    t3.to(device).eval()

    s3gen = S3Gen()
    s3gen_state = torch.load(carpeta / "s3gen.pt", map_location=map_location, weights_only=True)
    faltantes, sobrantes = s3gen.load_state_dict(s3gen_state, strict=False)
    if faltantes:
        print(f"Aviso: al checkpoint latino le faltan estas claves (se quedan con su valor default): {faltantes}")
    if sobrantes:
        print(f"Aviso: el checkpoint latino trae claves extra que se ignoraron: {sobrantes}")
    s3gen.to(device).eval()

    tokenizer = MTLTokenizer(str(carpeta / "grapheme_mtl_merged_expanded_v1.json"))

    conds = None
    builtin_voice = carpeta / "conds.pt"
    if builtin_voice.exists():
        conds = Conditionals.load(builtin_voice, map_location=map_location).to(device)

    return ChatterboxMultilingualTTS(t3, s3gen, ve, tokenizer, device, conds=conds)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--texto-file", type=Path, help="Archivo .txt con el texto a narrar. Si no se pasa, usa el párrafo de prueba WISC/WAIS.")
    ap.add_argument("--out", type=Path, default=CARPETA / "salida.mp3", help="Ruta del mp3 de salida (default: salida.mp3 en esta carpeta).")
    ap.add_argument("--idioma", default="es", help="Código de idioma para Chatterbox Multilingual (default: es).")
    ap.add_argument("--modelo", choices=["general", "latam"], default="general", help="'general' = modelo multilingüe (default, salió con acento de España). 'latam' = finetune de español latino/mexicano (experimental, descarga ~1GB extra la primera vez).")
    ap.add_argument("--voz", type=Path, default=None, help="WAV de referencia (unos segundos) para clonar una voz específica. Si se omite, usa la voz por defecto del modelo.")
    ap.add_argument("--exaggeration", type=float, default=0.5, help="Expresividad (default 0.5, el estándar de Chatterbox). Valores más bajos (probamos 0.4) generaron audio inestable — repeticiones y cortes forzados. Experimenta con cuidado.")
    ap.add_argument("--cfg-weight", type=float, default=0.5, help="Qué tanto se apega el modelo al texto vs. suena natural (default 0.5, el estándar). Igual que exaggeration: bajarlo mucho generó inestabilidad en la prueba.")
    ap.add_argument("--pausa-ms", type=int, default=350, help="Silencio insertado entre oraciones, en milisegundos (default 350). Este es el control real y confiable del ritmo entre frases — no depende del modelo.")
    ap.add_argument("--device", default=None, help="cuda / mps / cpu. Si se omite, se detecta solo (mps en Apple Silicon si está disponible).")
    args = ap.parse_args()

    try:
        import torch
        import torchaudio as ta
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    except ImportError as e:
        sys.exit(
            f"Falta instalar dependencias ({e}).\n"
            "Corre primero:  pip install -r requirements.txt\n"
            "Ver README.md de esta carpeta si el nombre del paquete cambió — "
            "Chatterbox se mueve rápido y esta ruta de import puede haber cambiado."
        )

    device = args.device or ("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
    print(f"Cargando Chatterbox Multilingual ({args.modelo}) en device={device} (la primera vez descarga varios GB de pesos, tarda)…")
    modelo = cargar_modelo_latam(device) if args.modelo == "latam" else ChatterboxMultilingualTTS.from_pretrained(device=device)

    texto_crudo = args.texto_file.read_text(encoding="utf-8") if args.texto_file else TEXTO_PRUEBA
    lexico = cargar_lexico()
    oraciones = [aplicar_lexico(o, lexico) for o in partir_oraciones(texto_crudo)]
    print(f"{len(oraciones)} oración(es) tras aplicar el léxico:")
    for o in oraciones:
        print(f"  · {o}")

    silencio = torch.zeros(1, int(modelo.sr * args.pausa_ms / 1000))
    trozos = []
    for i, oracion in enumerate(oraciones, 1):
        print(f"Generando {i}/{len(oraciones)}…")
        wav = modelo.generate(
            oracion,
            language_id=args.idioma,
            audio_prompt_path=str(args.voz) if args.voz else None,
            exaggeration=args.exaggeration,
            cfg_weight=args.cfg_weight,
        )
        trozos.append(wav)
        if i < len(oraciones):
            trozos.append(silencio)

    audio_final = torch.cat(trozos, dim=1)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    ta.save(str(args.out), audio_final, modelo.sr)
    print(f"Listo: {args.out}")
    print(
        "Entradas del léxico marcadas '_revisar: true' en lexico_pronunciacion.json "
        "son mi mejor intento, no una pronunciación confirmada — si algo sigue "
        "sonando mal, corrige el 'reemplazo' de esa entrada y vuelve a correr."
    )


if __name__ == "__main__":
    main()
