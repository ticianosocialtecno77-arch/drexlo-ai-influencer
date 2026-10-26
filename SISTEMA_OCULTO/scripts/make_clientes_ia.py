"""Genera la narracion de "AI Can Find Clients" y el timeline real.

Reutiliza el flujo del proyecto base (edge-tts + ffprobe + ffmpeg), pero agrega
silencio-deteccion real (-35dB, d=0.2) para sincronizar escenas, subtitulos y
cifras con la voz.

Salidas:
  audio/clientes_ia/sN.mp3        voz por escena
  audio/clientes_ia_voice.mp3     voz combinada (pista final del video)
  src/clientesTimeline.ts         tiempos reales (escenas + frases + palabras)
"""
import asyncio
import json
import os
import re
import subprocess
import sys

import edge_tts

VOICE = "en-US-ChristopherNeural"
PITCH = "-2Hz"
BASE_RATE = 38          # %
MIN_RATE, MAX_RATE = 0, 50
TARGET_END = 44.4       # segundos: fin de la ultima escena (deja cola hasta 45.0)
GAP = 0.32              # silencio entre escenas
TAIL = 0.6              # cola final

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(BASE, "audio")
OUTDIR = os.path.join(AUDIO, "clientes_ia")
SRC = os.path.join(BASE, "src")

# El texto es el guion del usuario, palabra por palabra, con "..." en cada revelado.
SEGMENTS = [
    ("hook", "HOOK",
     "Your next client could be hiding in plain sight. ... AI can help you find them."),
    ("step1", "STEP 1",
     "First, ... pick a niche. ... Dentists, gyms, real estate agents. ... Focus on one type of business."),
    ("step2", "STEP 2",
     "Next, ... research public business listings and websites. ... Use AI to identify potential problems, like confusing booking systems ... or weak website copy."),
    ("step3", "STEP 3",
     "Find one real problem you can solve. ... Maybe you can automate appointment reminders, ... improve their website, ... or help them follow up with leads."),
    ("step4", "STEP 4",
     "Now, ... ask AI to write a short, personalized message explaining the problem ... and offering a useful solution. ... Check the facts before sending it."),
    ("ending", "ENDING",
     "Don't spam hundreds of businesses. ... Find the right businesses, ... solve real problems, ... and make a relevant offer. ... Follow Drexlo to learn how to use AI to get more clients."),
]

REVEAL_PREFIX = {
    "hook": "",
    "step1": "Step 1",
    "step2": "Step 2",
    "step3": "Step 3",
    "step4": "Step 4",
    "ending": "The right way",
}


def ffprobe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def run_silencedetect(path):
    """Devuelve [(start, end), ...] de los silencios detectados."""
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af",
         "silencedetect=noise=-35dB:d=0.2", "-f", "null", "-"],
        capture_output=True, text=True)
    log = p.stderr
    sil = []
    cur = None
    for line in log.splitlines():
        m = re.search(r"silence_start: ([0-9.]+)", line)
        if m:
            cur = float(m.group(1))
        m = re.search(r"silence_end: ([0-9.]+)", line)
        if m and cur is not None:
            sil.append((cur, float(m.group(1))))
            cur = None
    return sil


def make_silence(path, seconds):
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
         "-t", f"{seconds:.3f}", "-c:a", "libmp3lame", "-b:a", "48k", path],
        capture_output=True, check=True)


async def synth_all(rate):
    os.makedirs(OUTDIR, exist_ok=True)
    paths = []
    for sid, _label, text in SEGMENTS:
        p = os.path.join(OUTDIR, f"{sid}.mp3")
        await edge_tts.Communicate(text, VOICE, rate=f"+{rate}%", pitch=PITCH).save(p)
        paths.append(p)
    return paths


def concat(paths, gap_file, dest):
    txt = os.path.join(OUTDIR, "_concat.txt")
    with open(txt, "w", encoding="utf-8") as f:
        for i, p in enumerate(paths):
            f.write(f"file '{p}'\n")
            if i < len(paths) - 1:
                f.write(f"file '{gap_file}'\n")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", txt,
         "-c:a", "libmp3lame", "-b:a", "160k", "-ar", "44100", dest],
        capture_output=True, check=True)
    os.remove(txt)


def phrases_of(text):
    return [s.strip() for s in text.split("...") if s.strip()]


def distribute(seg_text, t0, t1):
    """Reparte las palabras de un tramo proporcionalmente a su longitud."""
    ws = seg_text.split()
    weights = [len(w) + 2 for w in ws]
    tot = float(sum(weights))
    out = []
    t = t0
    for w, wt in zip(ws, weights):
        d = (wt / tot) * (t1 - t0)
        out.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def build(rate):
    paths = asyncio.run(synth_all(rate))
    gap_file = os.path.join(OUTDIR, "_gap.mp3")
    make_silence(gap_file, GAP)
    combined = os.path.join(AUDIO, "clientes_ia_voice.mp3")
    concat(paths, gap_file, combined)

    durations = [ffprobe_duration(p) for p in paths]
    silences = run_silencedetect(combined)

    scenes, words = [], []
    t = 0.0
    for i, ((sid, label, text), dur) in enumerate(zip(SEGMENTS, durations)):
        start, end = round(t, 3), round(t + dur, 3)
        # silencios dentro de la ventana de la escena
        inside = [(max(a, start), min(b, end)) for a, b in silences if b > start and a < end]
        inside = [(a, b) for a, b in inside if b - a >= 0.12]
        # tramos con voz = complemento
        voiced, cur = [], start
        for a, b in inside:
            if a - cur >= 0.10:
                voiced.append((cur, a))
            cur = max(cur, b)
        if end - cur >= 0.10:
            voiced.append((cur, end))
        ph = phrases_of(text)
        phrase_rows = []
        if len(voiced) == len(ph):
            for txt, (a, b) in zip(ph, voiced):
                phrase_rows.append({"text": txt, "start": round(a, 3), "end": round(b, 3)})
        else:
            # reparto proporcional sobre el tramo con voz completo
            a = voiced[0][0] if voiced else start
            b = voiced[-1][1] if voiced else end
            widths = [len(x) for x in ph]
            totw = float(sum(widths))
            tc = a
            for txt, wd in zip(ph, widths):
                span = (wd / totw) * (b - a)
                phrase_rows.append({"text": txt, "start": round(tc, 3), "end": round(tc + span, 3)})
                tc += span
        for row in phrase_rows:
            words.extend(distribute(row["text"], row["start"], row["end"]))
        scenes.append({
            "id": sid,
            "label": label,
            "revealLabel": REVEAL_PREFIX[sid],
            "start": start,
            "end": end,
            "phrases": phrase_rows,
        })
        t = end + GAP

    for w in words:
        w["scene"] = next(s["id"] for s in scenes if s["start"] - 0.001 <= w["start"] < s["end"] + GAP)

    total = round(scenes[-1]["end"] + TAIL, 3)
    return combined, scenes, words, total, durations, silences


def write_ts(scenes, words, total, combined_name, rate):
    lines = []
    lines.append("// GENERADO AUTOMATICAMENTE por scripts/make_clientes_ia.py")
    lines.append("// Tiempos reales medidos con ffmpeg silencedetect (-35dB, d=0.2).")
    lines.append("// No editar a mano: volver a correr el script.")
    lines.append("")
    lines.append("export const CIA_FPS = 30;")
    lines.append(f"export const CIA_TTS_RATE = {rate};")
    lines.append(f"export const CIA_AUDIO = {json.dumps(combined_name)};")
    lines.append(f"export const CIA_TOTAL_SECONDS = {total};")
    lines.append(f"export const CIA_TOTAL_FRAMES = Math.round(CIA_TOTAL_SECONDS * CIA_FPS);")
    lines.append("")
    lines.append("export type Phrase = { text: string; start: number; end: number };")
    lines.append("export type SceneTiming = {")
    lines.append("  id: string; label: string; revealLabel: string;")
    lines.append("  start: number; end: number; phrases: Phrase[];")
    lines.append("};")
    lines.append("export type WordTiming = { w: string; start: number; end: number; scene: string };")
    lines.append("")
    lines.append("export const CIA_SCENES: SceneTiming[] = [")
    for s in scenes:
        lines.append("  {")
        lines.append(f"    id: {json.dumps(s['id'])}, label: {json.dumps(s['label'])}, revealLabel: {json.dumps(s['revealLabel'])},")
        lines.append(f"    start: {s['start']}, end: {s['end']},")
        lines.append("    phrases: [")
        for p in s["phrases"]:
            lines.append(f"      {{ text: {json.dumps(p['text'])}, start: {p['start']}, end: {p['end']} }},")
        lines.append("    ],")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    lines.append("export const CIA_WORDS: WordTiming[] = [")
    for w in words:
        lines.append(f"  {{ w: {json.dumps(w['w'])}, start: {w['start']}, end: {w['end']}, scene: {json.dumps(w['scene'])} }},")
    lines.append("];")
    lines.append("")
    os.makedirs(SRC, exist_ok=True)
    with open(os.path.join(SRC, "clientesTimeline.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main():
    rate = BASE_RATE
    best = None
    for attempt in range(3):
        combined, scenes, words, total, durations, silences = build(rate)
        end_last = scenes[-1]["end"]
        print(f"[intento {attempt + 1}] rate=+{rate}%  fin ultima escena={end_last:.3f}s  total={total:.3f}s")
        for s, d in zip(scenes, durations):
            print(f"   {s['id']:7s} {s['start']:6.2f} -> {s['end']:6.2f}  ({d:5.2f}s)  frases={len(s['phrases'])}")
        best = (combined, scenes, words, total, durations, silences, rate)
        if abs(end_last - TARGET_END) <= 0.8 or rate >= MAX_RATE:
            break
        rate = int(min(MAX_RATE, max(MIN_RATE, round(rate * (end_last / TARGET_END)))))
    combined, scenes, words, total, durations, silences, rate = best
    write_ts(scenes, words, total, os.path.basename(combined), rate)
    print(f"\nTOTAL video: {total:.3f}s  ({round(total * 30)} frames @30fps)  rate=+{rate}%")
    print(f"silencios detectados: {len(silences)}")
    print(f"audio: {combined}")


if __name__ == "__main__":
    main()
