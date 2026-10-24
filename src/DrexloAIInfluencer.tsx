import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, DURATION_IN_FRAMES, FPS } from "./constants";
import { NARRATION_AUDIO, sceneFrameRanges } from "./timeline";
import { Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7 } from "./Scenes";

/**
 * Capa de texto animada, separada por completo de las ilustraciones.
 * Cada caption tiene 5 palabras o menos.
 */
const Caption: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const inP = Math.min(1, frame / (0.35 * fps));
  const outP = Math.min(1, Math.max(0, (durationInFrames - frame) / (0.3 * fps)));
  const p = Math.min(inP, outP);

  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        right: 90,
        bottom: 210,
        display: "flex",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      <div
        style={{
          padding: "26px 40px",
          borderRadius: 20,
          background: COLORS.navyDeep + "D9",
          border: `2px solid ${accent}88`,
          backdropFilter: "blur(6px)",
          boxShadow: `0 18px 50px #00000066, 0 0 0 1px ${accent}22`,
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: -0.4,
            color: COLORS.cream,
            textAlign: "center",
            lineHeight: 1.12,
            fontFamily:
              'Inter, "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

const CAPTIONS: Record<string, { text: string; accent: string }> = {
  scene1: { text: "What if they weren't human?", accent: COLORS.lavender },
  scene2: { text: "AI influencers get brand deals", accent: COLORS.teal },
  scene3: { text: "Meet a virtual creator", accent: COLORS.lavender },
  scene4: { text: "Products meet virtual creators", accent: COLORS.teal },
  scene5: { text: "Test more ad concepts", accent: COLORS.coral },
  scene6: { text: "Attention isn't sales", accent: COLORS.coral },
  scene7: { text: "Create. Test. Be transparent.", accent: COLORS.teal },
};

const SCENE_COMPONENTS: Record<string, React.FC> = {
  scene1: Scene1,
  scene2: Scene2,
  scene3: Scene3,
  scene4: Scene4,
  scene5: Scene5,
  scene6: Scene6,
  scene7: Scene7,
};

/** Transición de barrido entre escenas, para que no todo sea un fundido. */
const SceneTransition: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = 0.5 * fps;
  if (frame > dur) return null;
  const p = frame / dur;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accent,
          opacity: (1 - p) * 0.5,
          transform: `translateX(${(1 - p) * 100}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const DrexloAIInfluencer: React.FC = () => {
  const { fps } = useVideoConfig();
  const ranges = sceneFrameRanges(fps, DURATION_IN_FRAMES);

  return (
    <AbsoluteFill style={{ background: COLORS.navyDeep }}>
      {/* Narración real generada con TTS (edge-tts, PR 492) */}
      <Audio src={staticFile(NARRATION_AUDIO)} />

      {ranges.map((r) => {
        const Comp = SCENE_COMPONENTS[r.id];
        const cap = CAPTIONS[r.id];
        if (!Comp || !cap) return null;
        return (
          <Sequence
            key={r.id}
            from={r.from}
            durationInFrames={r.durationInFrames}
            name={r.id}
          >
            <Comp />
            <SceneTransition accent={cap.accent} />
            <Caption text={cap.text} accent={cap.accent} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
