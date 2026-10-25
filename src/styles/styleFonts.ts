import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fuentes de las pruebas de estilo.
// El navegador de render no tiene las fuentes del sistema, así que nunca se
// depende de "Impact" o "Arial Black": se cargan desde public/ con @remotion/fonts.
export const STYLE_FONTS = {
  // Titular condensado y pesado (stick-figure y titular del 3D).
  heavy: "PruebaHeavy",
  // Sans negra para el estilo comic.
  black: "PruebaBlack",
} as const;

// loadFont() llama a delayRender(): Remotion espera a que carguen antes de capturar.
export const fontsReady = Promise.all([
  loadFont({
    family: STYLE_FONTS.heavy,
    url: staticFile("fonts/impact.ttf"),
    weight: "400",
    style: "normal",
  }),
  loadFont({
    family: STYLE_FONTS.black,
    url: staticFile("fonts/ariblk.ttf"),
    weight: "400",
    style: "normal",
  }),
]);

export const ensureStyleFonts = () => fontsReady;
