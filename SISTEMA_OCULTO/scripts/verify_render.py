"""Verifica el MP4 renderizado comparando fotogramas crudos (raw RGB).

- Confirma que cada escena es visualmente distinta de las demás.
- Confirma que hay contenido real (no un frame en blanco/negro).
- Reporta el color dominante para detectar la paleta esperada.

No usa Pillow: lee los .raw que exportó ffmpeg con -pix_fmt rgb24.
"""

import os
import sys

import numpy as np

W, H = 540, 960
RAW_DIR = os.path.join("out", "raw")
LABELS = [
    "s1_hook",
    "s2_deals",
    "s3_creator",
    "s4_products",
    "s5_testing",
    "s6_limitation",
    "s7_takeaway",
]


def load(i: int) -> np.ndarray:
    p = os.path.join(RAW_DIR, f"f{i}.raw")
    a = np.fromfile(p, dtype=np.uint8)
    expected = W * H * 3
    if a.size != expected:
        raise ValueError(f"{p}: {a.size} bytes, se esperaban {expected}")
    return a.reshape(H, W, 3).astype(np.int16)


def main() -> None:
    frames = [load(i) for i in range(len(LABELS))]

    print("=== Contenido de cada escena ===")
    for label, fr in zip(LABELS, frames):
        mean = fr.reshape(-1, 3).mean(axis=0)
        std = fr.reshape(-1, 3).std()
        # proporción de píxeles casi negros (fondo navy muy oscuro)
        dark = float((fr.max(axis=2) < 30).mean())
        print(
            f"{label:14s} mean RGB=({mean[0]:6.1f},{mean[1]:6.1f},{mean[2]:6.1f}) "
            f"std={std:6.1f} dark={dark*100:5.1f}%"
        )

    print("\n=== Diferencias entre escenas (error absoluto medio 0-255) ===")
    n = len(frames)
    too_similar = []
    for i in range(n):
        for j in range(i + 1, n):
            diff = np.abs(frames[i] - frames[j]).mean()
            flag = ""
            if diff < 3.0:
                too_similar.append((LABELS[i], LABELS[j], diff))
                flag = "  <-- DEMASIADO PARECIDAS"
            print(f"{LABELS[i]:14s} vs {LABELS[j]:14s} MAE={diff:6.2f}{flag}")

    print("\n=== Veredicto ===")
    blanks = [
        lab for lab, fr in zip(LABELS, frames)
        if fr.std() < 2.0 or float((fr.max(axis=2) < 30).mean()) > 0.995
    ]
    if blanks:
        print(f"FALLO: escenas en blanco/negro: {blanks}")
        sys.exit(1)
    if too_similar:
        print(f"FALLO: escenas casi idénticas: {too_similar}")
        sys.exit(1)
    print("OK: las 7 escenas tienen contenido real y son distintas entre sí.")


if __name__ == "__main__":
    main()
