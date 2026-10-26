import { Composition } from "remotion";
import { DrexloAIInfluencer } from "./DrexloAIInfluencer";
import { FPS, DURATION_IN_FRAMES, WIDTH, HEIGHT } from "./constants";
import {
  StickFigureStyle,
  STICK_DURATION,
  STICK_FPS,
} from "./styles/StickFigureStyle";
import {
  LowPoly3DStyle,
  THREE_DURATION,
  THREE_FPS,
} from "./styles/LowPoly3DStyle";
import {
  FlatCartoonStyle,
  CARTOON_DURATION,
  CARTOON_FPS,
} from "./styles/FlatCartoonStyle";
import {
  AgenciaHookPreview,
  AGENCIA_PREVIEW_DURATION,
  AGENCIA_PREVIEW_FPS,
} from "./agencia/Scene1Hook";
import {
  AgenciaStyleframes,
  AGENCIA_SF_DURATION,
  AGENCIA_SF_FPS,
} from "./agencia/Styleframes";
import { ClientesIA } from "./ClientesIA";
import { CIA_TOTAL_FRAMES, CIA_FPS } from "./clientesTimeline";

// Pruebas de estilo: misma frase ("Descubre el secreto"), 3 estilos, 5 s cada una.
// Render en la nube con coldframe:
//   coldframe render Estilo1StickFigure --name estilo1-stick-figure.mp4
//   coldframe render Estilo2LowPoly3D    --name estilo2-lowpoly-3d.mp4
//   coldframe render Estilo3FlatCartoon  --name estilo3-flat-cartoon.mp4
const STYLE_SIZE = { width: 1080, height: 1920 } as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DrexloAIInfluencer"
        component={DrexloAIInfluencer}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Composition
        id="Estilo1StickFigure"
        component={StickFigureStyle}
        durationInFrames={STICK_DURATION}
        fps={STICK_FPS}
        {...STYLE_SIZE}
      />
      <Composition
        id="Estilo2LowPoly3D"
        component={LowPoly3DStyle}
        durationInFrames={THREE_DURATION}
        fps={THREE_FPS}
        {...STYLE_SIZE}
      />
      <Composition
        id="Estilo3FlatCartoon"
        component={FlatCartoonStyle}
        durationInFrames={CARTOON_DURATION}
        fps={CARTOON_FPS}
        {...STYLE_SIZE}
      />

      {/* DREXLO AGENCIA IA — preview de la escena 1 (7 s), para aprobar
          la direccion de arte antes de hacer el short completo de 40-45 s.
          Render: coldframe render AgenciaPreviewHook --name agencia-preview-hook.mp4 --out MIS_VIDEOS/2_Agencia_IA */}
      <Composition
        id="AgenciaPreviewHook"
        component={AgenciaHookPreview}
        durationInFrames={AGENCIA_PREVIEW_DURATION}
        fps={AGENCIA_PREVIEW_FPS}
        {...STYLE_SIZE}
      />

      {/* Styleframes: 3 direcciones de arte para elegir el look.
          La prop "dir" elige: 0 = A (diorama), 1 = B (neon), 2 = C (ciudad de datos).
          remotion still AgenciaStyleframes out/sf-A.png --props='{"dir":0}' */}
      <Composition
        id="AgenciaStyleframes"
        component={AgenciaStyleframes}
        durationInFrames={AGENCIA_SF_DURATION}
        fps={AGENCIA_SF_FPS}
        defaultProps={{ dir: 0 }}
        {...STYLE_SIZE}
      />

      {/* DREXLO AGENCIA IA — short completo "AI Can Find Clients Your
          Competitors Ignore" (45 s, 6 escenas). Reutiliza src/Cartoon.tsx
          (El Curioso) y los tiempos reales de clientesTimeline.ts.
          Stills:  remotion still ClientesIA out/stills/s1.png --frame=128 --scale=0.5
          Render:  coldframe render ClientesIA --chunks 8 --name clientes-ia.mp4 */}
      <Composition
        id="ClientesIA"
        component={ClientesIA}
        durationInFrames={CIA_TOTAL_FRAMES}
        fps={CIA_FPS}
        {...STYLE_SIZE}
      />
    </>
  );
};
