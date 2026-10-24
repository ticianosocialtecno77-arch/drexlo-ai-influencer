// Tiempos reales de la narración (generados por scripts/build_audio_timeline.py).
// Si se regenera el audio, volver a ejecutar ese script y actualizar este archivo.

// Remotion sirve los assets estáticos desde public/, así que la narración
// combinada vive en public/audio/ y se referencia con staticFile().
export const NARRATION_AUDIO = "audio/drexlo_narration.mp3";

export const TOTAL_SECONDS = 49.008;

export type SceneSpan = {
  id: string;
  /** inicio en segundos */
  start: number;
  /** fin en segundos */
  end: number;
};

export const SCENE_SPANS: SceneSpan[] = [
  { id: "scene1", start: 0.0, end: 3.456 },
  { id: "scene2", start: 3.906, end: 9.714 },
  { id: "scene3", start: 10.164, end: 17.028 },
  { id: "scene4", start: 17.478, end: 23.886 },
  { id: "scene5", start: 24.336, end: 30.888 },
  { id: "scene6", start: 31.338, end: 39.594 },
  { id: "scene7", start: 40.044, end: 48.108 },
];

// Límites de escena en frames, incluyendo el pequeño silencio entre escenas.
// Cada escena se extiende hasta el inicio de la siguiente para que no haya huecos.
export const sceneFrameRanges = (
  fps: number,
  totalFrames: number,
): { id: string; from: number; durationInFrames: number }[] => {
  const starts = SCENE_SPANS.map((s) => Math.round(s.start * fps));
  return SCENE_SPANS.map((s, i) => {
    const from = starts[i];
    const next =
      i + 1 < starts.length ? starts[i + 1] : totalFrames;
    return { id: s.id, from, durationInFrames: Math.max(1, next - from) };
  });
};
