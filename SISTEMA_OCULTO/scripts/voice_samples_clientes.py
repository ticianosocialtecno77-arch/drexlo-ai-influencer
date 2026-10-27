"""Muestras de voz: la misma linea DREXLO con varias voces, para comparar.

Genera out/voice-tests/<voz>.mp3 con el gancho, a la misma prosodia, para poder
elegir la voz antes de re-renderizar el short entero.
"""
import asyncio
import os
import subprocess

import edge_tts

VOICES = {
    "01-andrew": "en-US-AndrewNeural",          # Warm, Confident, Authentic, Honest
    "02-brian": "en-US-BrianNeural",            # Approachable, Casual, Sincere
    "03-guy": "en-US-GuyNeural",                # Passion
    "04-roger": "en-US-RogerNeural",            # Lively
    "05-christopher-actual": "en-US-ChristopherNeural",
}

TEXT = "Your next client could be hiding in plain sight. ... AI can help you find them."
RATE = "+30%"
PITCH = "-7Hz"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "out", "voice-tests")


async def main():
    os.makedirs(OUT, exist_ok=True)
    for name, voice in VOICES.items():
        p = os.path.join(OUT, f"{name}.mp3")
        for attempt in range(5):
            try:
                await edge_tts.Communicate(TEXT, voice, rate=RATE, pitch=PITCH).save(p)
                if os.path.getsize(p) > 2000:
                    break
            except Exception as exc:
                print(f"  reintento {name}: {type(exc).__name__}", flush=True)
            await asyncio.sleep(2.0 + attempt * 3.0)
        await asyncio.sleep(0.6)
        d = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", p],
            capture_output=True, text=True, check=True).stdout.strip()
        print(f"{name:24s} {voice:28s} {float(d):5.2f}s")


if __name__ == "__main__":
    asyncio.run(main())
