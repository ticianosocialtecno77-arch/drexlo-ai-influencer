// Constantes globales de la composición Drexlo Short.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Duración total: coincide con la narración real (48.108 s) + cola de 0.9 s.
// 49.008 s a 30 fps = 1470.24 -> 1471 frames. Dentro del rango 30–50 s.
export const DURATION_IN_SECONDS = 49.008;
export const DURATION_IN_FRAMES = Math.round(DURATION_IN_SECONDS * FPS);

// Paleta editorial: navy profundo, sombras carbón, teal apagado, lavanda y coral.
export const COLORS = {
  navy: "#0B1220",
  navyDeep: "#070C16",
  charcoal: "#161B26",
  charcoalSoft: "#232A38",
  teal: "#4FB3A8",
  tealMuted: "#2E7D74",
  lavender: "#A99BE0",
  lavenderSoft: "#CFC6F0",
  coral: "#F2795C",
  coralSoft: "#F5A08A",
  cream: "#F4F1EA",
  white: "#FFFFFF",
  dim: "#8C93A8",
} as const;

// Límites de tiempo por escena (segundos), estimados y luego retimados a la narración.
export type SceneTiming = {
  id: string;
  start: number;
  end: number;
  caption: string;
};

export const SCENES: SceneTiming[] = [
  { id: "scene1", start: 0, end: 5.5, caption: "What if they weren't human?" },
  { id: "scene2", start: 5.5, end: 10.5, caption: "AI influencers get brand deals" },
  { id: "scene3", start: 10.5, end: 16.5, caption: "Meet a virtual creator" },
  { id: "scene4", start: 16.5, end: 22.5, caption: "Products meet virtual creators" },
  { id: "scene5", start: 22.5, end: 28.5, caption: "Test more ad concepts" },
  { id: "scene6", start: 28.5, end: 35.5, caption: "Attention isn't sales" },
  { id: "scene7", start: 35.5, end: 42, caption: "Create. Test. Be transparent." },
];
