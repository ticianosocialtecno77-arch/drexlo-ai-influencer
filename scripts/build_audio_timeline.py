"""Combina la narración en una sola pista y calcula los tiempos exactos de escena.

Lee audio/sceneN.mp3 (generados por make_narration.py), añade una pausa breve
entre escenas, concatena en audio/drexlo_narration.mp3 y escribe
audio/timeline.json con los límites reales de cada escena en segundos.

La composición de Remotion importa timeline.json para que las transiciones
queden sincronizadas con la narración real (nunca cortando una frase).
"""

import json
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")

# Pausa entre escenas (segundos). Da aire narrativo sin alargar demasiado.
GAP = 0.45
# Cola final para que la última frase respire antes de terminar el vídeo.
TAIL = 0.9

SCENE_ORDER = [f"scene{i}" for i in range(1, 8)]


def ffprobe_duration(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def main() -> None:
    durations = {}
    for name in SCENE_ORDER:
        p = os.path.join(AUDIO, f"{name}.mp3")
        if not os.path.exists(p):
            print(f"FALTA {p}", file=sys.stderr)
            sys.exit(1)
        durations[name] = ffprobe_duration(p)

    # Construir lista de concatenación para ffmpeg
    concat_txt = os.path.join(AUDIO, "_concat.txt")
    silence = os.path.join(AUDIO, "_gap.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i",
         f"anullsrc=r=24000:cl=mono", "-t", str(GAP),
         "-c:a", "libmp3lame", "-b:a", "48k", silence],
        capture_output=True, check=True,
    )

    with open(concat_txt, "w", encoding="utf-8") as f:
        for i, name in enumerate(SCENE_ORDER):
            f.write(f"file '{os.path.join(AUDIO, name + '.mp3')}'\n")
            if i < len(SCENE_ORDER) - 1:
                f.write(f"file '{silence}'\n")

    combined = os.path.join(AUDIO, "drexlo_narration.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt,
         "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", combined],
        capture_output=True, check=True,
    )

    # Calcular límites de escena en la línea de tiempo combinada
    timeline = []
    t = 0.0
    for i, name in enumerate(SCENE_ORDER):
        start = t
        end = t + durations[name]
        timeline.append({"id": name, "start": round(start, 3), "end": round(end, 3)})
        t = end + (GAP if i < len(SCENE_ORDER) - 1 else 0.0)

    total = t + TAIL
    payload = {
        "gap": GAP,
        "tail": TAIL,
        "totalSeconds": round(total, 3),
        "scenes": timeline,
        "audio": "audio/drexlo_narration.mp3",
    }
    with open(os.path.join(AUDIO, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    combined_dur = ffprobe_duration(combined)
    print(f"combinado: {combined_dur:.3f}s -> {os.path.basename(combined)}")
    for s in timeline:
        print(f"  {s['id']}: {s['start']:.2f}s -> {s['end']:.2f}s")
    print(f"TOTAL con cola: {total:.3f}s")

    # limpiar temporales
    for tmp in (concat_txt, silence):
        try:
            os.remove(tmp)
        except OSError:
            pass


if __name__ == "__main__":
    main()
