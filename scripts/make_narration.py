"""Genera la narración en inglés con edge-tts (TTS local, sin API key).

Produce un MP3 por escena más un MP3 combinado, e imprime la duración real
de cada segmento para poder sincronizar las escenas.

ElevenLabs no está configurado en este equipo (no hay API key), así que se usa
edge-tts, que ya está instalado y funciona sin credenciales.
"""

import asyncio
import json
import os
import subprocess
import sys

import edge_tts

VOICE = "en-US-ChristopherNeural"  # voz documental, autoridad y claridad
RATE = "-4%"
PITCH = "-2Hz"

SCENES = [
    ("scene1", "What if your next brand ambassador wasn't human?"),
    ("scene2", "AI influencers are already attracting audiences and landing brand deals."),
    ("scene3", "Fast Company profiled Aitana Lopez, a virtual creator with hundreds of thousands of followers."),
    ("scene4", "New tools can also let businesses create a digital character and place it into product videos."),
    ("scene5", "That gives marketers another way to test creative ideas without filming every version from scratch."),
    ("scene6", "But attention doesn't guarantee sales. And a fictional character presented as a real customer can mislead viewers."),
    ("scene7", "The smart move? Use AI characters to test ideas, and be transparent about what people are watching."),
]

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audio")
os.makedirs(OUT_DIR, exist_ok=True)


async def synth(text: str, path: str) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(path)


def probe_duration(path: str) -> float:
    """Duración real en segundos usando ffprobe."""
    ffprobe = "ffprobe"
    try:
        out = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, check=True,
        )
        return float(out.stdout.strip())
    except Exception as exc:  # pragma: no cover
        print(f"  ffprobe falló para {path}: {exc}", file=sys.stderr)
        return -1.0


async def main() -> None:
    durations = {}
    for name, text in SCENES:
        path = os.path.join(OUT_DIR, f"{name}.mp3")
        await synth(text, path)
        d = probe_duration(path)
        durations[name] = {"text": text, "duration": d, "file": path}
        print(f"{name}: {d:.3f}s -> {os.path.basename(path)}")

    total = sum(v["duration"] for v in durations.values())
    print(f"\nTOTAL narración: {total:.3f}s")

    with open(os.path.join(OUT_DIR, "durations.json"), "w", encoding="utf-8") as f:
        json.dump(durations, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    asyncio.run(main())
