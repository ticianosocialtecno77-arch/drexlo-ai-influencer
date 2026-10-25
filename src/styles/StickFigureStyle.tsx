import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ensureStyleFonts, STYLE_FONTS } from "./styleFonts";

// ESTILO 1 — STICK-FIGURE
// Fondo negro puro, figuras de palo blancas con trazo grueso.
// Un personaje camina de izquierda a derecha mientras la cámara (un zoom
// continuo sobre el lienzo) lo sigue, y al final queda en primer plano.
// Todo se calcula con useCurrentFrame(): nada depende del reloj real, así
// que cada frame es determinista y el render en la nube coincide con el local.

export const STICK_TEXT = "Descubre el secreto";
export const STICK_DURATION = 150; // 5 s a 30 fps
export const STICK_FPS = 30;

const W = 1080;
const H = 1920;

const STROKE = 22;
const WHITE = "#FFFFFF";
const BLACK = "#000000";

// El personaje camina ~48.4 px por ciclo de 24 frames → sin deslizamiento.
const WALK_CYCLE = 24;
const STRIDE = 48.4;
// Cámara: viaja con el personaje un poco hacia la derecha (caminamos hacia el futuro).
const CAM_X = 60;
const HORIZON_Y = 1660;

const FLOOR_SPEED = STRIDE / WALK_CYCLE;

const walkerX = (frame: number) => 300 + (frame / WALK_CYCLE) * STRIDE;

const segment = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  key: string,
) => (
  <line
    key={key}
    x1={a.x}
    y1={a.y}
    x2={b.x}
    y2={b.y}
    stroke={WHITE}
    strokeWidth={STROKE}
    strokeLinecap="round"
  />
);

const StickFigure: React.FC<{
  x: number;
  frame: number;
  opacity: number;
  scale: number;
  walking: boolean;
  waving: boolean;
}> = ({ x, frame, opacity, scale, walking, waving }) => {
  const phase = walking ? (frame / WALK_CYCLE) * Math.PI * 2 : 0;
  const swing = walking ? Math.sin(phase) : 0.18;
  const bob = walking ? Math.abs(Math.cos(phase)) * 9 : 0;

  const hip = { x: 0, y: -232 - bob };
  const shoulder = { x: 0, y: -388 - bob };
  const head = { x: 6, y: -462 - bob };

  const leg = (s: number) => {
    const thigh = s * 0.72; // radianes respecto de la vertical
    const knee = {
      x: hip.x + Math.sin(thigh) * 120,
      y: hip.y + Math.cos(thigh) * 120,
    };
    // La pantorrilla se dobla al recoger el pie.
    const shin = thigh - Math.max(0, -s) * 0.85;
    const foot = {
      x: knee.x + Math.sin(shin) * 120,
      y: knee.y + Math.cos(shin) * 120,
    };
    return { knee, foot };
  };

  const front = leg(swing);
  const back = leg(-swing);

  const arm = (s: number) => {
    // Amplitud menor que la de las piernas: el codo casi nunca sube al pivote.
    const upper = -s * 0.5;
    const elbow = {
      x: shoulder.x + Math.sin(upper) * 96,
      y: shoulder.y + Math.cos(upper) * 96,
    };
    const fore = upper + 0.35;
    const hand = {
      x: elbow.x + Math.sin(fore) * 92,
      y: elbow.y + Math.cos(fore) * 92,
    };
    return { elbow, hand };
  };

  const armFront = arm(-swing);
  const armBack = arm(swing);
  // Mano que saluda (solo cuando está parado en primer plano).
  // Ángulo medida desde "brazo abajo"; positivo = hacia adelante.
  const waveAngle =
    2.95 + (waving ? Math.sin((frame / 8) * Math.PI * 2) * 0.26 : 0);
  const waveElbow = {
    x: shoulder.x + Math.sin(waveAngle) * 96,
    y: shoulder.y + Math.cos(waveAngle) * 96,
  };
  const waveHand = {
    x: waveElbow.x + Math.sin(waveAngle - 0.15) * 92,
    y: waveElbow.y + Math.cos(waveAngle - 0.15) * 92,
  };

  return (
    <g
      transform={`translate(${x} ${HORIZON_Y}) scale(${scale})`}
      opacity={opacity}
    >
      {/* pierna lejana */}
      {segment(hip, back.knee, "blt")}
      {segment(back.knee, back.foot, "bls")}
      {/* pierna cercana */}
      {segment(hip, front.knee, "flt")}
      {segment(front.knee, front.foot, "fls")}
      <line
        x1={front.foot.x}
        y1={front.foot.y + 6}
        x2={front.foot.x + 34}
        y2={front.foot.y + 6}
        stroke={WHITE}
        strokeWidth={STROKE - 4}
        strokeLinecap="round"
      />
      {/* tronco dibujado DESPUÉS de las piernas: tapa la doble línea del pivote */}
      {segment(hip, shoulder, "torso")}
      {/* brazo lejano */}
      {segment(shoulder, armBack.elbow, "bat")}
      {segment(armBack.elbow, armBack.hand, "bas")}
      {/* cabeza */}
      <circle
        cx={head.x}
        cy={head.y}
        r={58}
        fill="none"
        stroke={WHITE}
        strokeWidth={STROKE}
      />
      {/* brazo cercano */}
      {waving ? (
        <>
          {segment(shoulder, waveElbow, "wat")}
          {segment(waveElbow, waveHand, "was")}
        </>
      ) : (
        <>
          {segment(shoulder, armFront.elbow, "fat")}
          {segment(armFront.elbow, armFront.hand, "fas")}
        </>
      )}
    </g>
  );
};

export const StickFigureStyle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  React.useEffect(() => {
    ensureStyleFonts();
  }, []);

  const end = durationInFrames - 1;

  // ---- Cámara: zoom continuo, acelerado al principio y al final ----
  const zoom = interpolate(frame, [0, end * 0.62, end], [1, 1.42, 1.95], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Personaje principal ----
  const walker = walkerX(frame);
  const stopsWalking = frame >= 78;
  const frozenWalker = walkerX(78);
  const finalX = frozenWalker;

  // Al parar, entra un último paso con springs (sin salto brusco).
  const stopSettle = stopsWalking
    ? spring({ frame: frame - 78, fps, config: { damping: 200, mass: 0.6 } })
    : 0;
  const walkerFinal = stopsWalking
    ? interpolate(stopSettle, [0, 1], [frozenWalker, finalX + 26])
    : walker;

  // La cámara sigue al personaje: solo se ve el zoom sobre él.
  const camFollow =
    interpolate(frame, [0, end], [0, CAM_X * 0.9], {
      extrapolateRight: "clamp",
    });

  const camScale = zoom;
  const camY = interpolate(frame, [0, end], [0, -120], {
    extrapolateRight: "clamp",
  });
  // Centrado inicial: el mundo está dibujado para 1080x1920 desde transform-origin center.
  const camTransform = `translate(${W / 2} ${H / 2}) scale(${camScale}) translate(${-W / 2 + camFollow} ${-H / 2 + camY})`;

  // ---- Suelo: rayas que se mueven con la velocidad de la caminata ----
  const floorOffset = (frame % 80) * FLOOR_SPEED * 1.0;
  const floorMarks: React.ReactNode[] = [];
  for (let i = -6; i < 26; i++) {
    const x = i * 80 - floorOffset;
    floorMarks.push(
      <line
        key={i}
        x1={x}
        y1={HORIZON_Y + 14}
        x2={x - 90}
        y2={H - 120}
        stroke={WHITE}
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.22}
      />,
    );
  }

  // ---- Personajes del fondo que esperan y giran a mirar ----
  const backdropA = interpolate(
    spring({ frame: frame - 12, fps, config: { damping: 200 } }),
    [0, 1],
    [-300, 700],
  );
  const backdropB = interpolate(
    spring({ frame: frame - 26, fps, config: { damping: 200 } }),
    [0, 1],
    [1500, 880],
  );

  // ---- Título ----
  const titleOpacity = interpolate(frame, [18, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSlide = interpolate(frame, [18, 46], [60, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Puntito de énfasis junto al título (el "secreto" que se descubre) ----
  const popDist = interpolate(frame, [96, 108], [260, 30], {
    easing: Easing.out(Easing.back(2.4)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const popSize = interpolate(frame, [96, 100, 104], [0, 1.15, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const popOpacity = interpolate(frame, [96, 102], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Salida: a negro en los últimos 12 frames ----
  const fadeOut = interpolate(frame, [end - 12, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={camTransform}>
          <g>{floorMarks}</g>
          <line
            x1={-1200}
            y1={HORIZON_Y}
            x2={3040}
            y2={HORIZON_Y}
            stroke={WHITE}
            strokeWidth={12}
            strokeLinecap="round"
          />
          <StickFigure
            x={backdropA}
            frame={frame}
            opacity={0.55}
            scale={0.82}
            walking
            waving={false}
          />
          <StickFigure
            x={backdropB}
            frame={frame + 7}
            opacity={0.78}
            scale={0.92}
            walking
            waving={false}
          />
          <StickFigure
            x={walkerFinal}
            frame={frame}
            opacity={1}
            scale={1}
            walking={!stopsWalking}
            waving={stopsWalking}
          />
        </g>
      </svg>

      {/* Título: texto real (no SVG) para que se lea nítido */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 190,
          opacity: titleOpacity * fadeIn,
          transform: `translateY(${titleSlide}px)`,
        }}
      >
        <div style={{ position: "relative" }}>
          {popSize > 0 ? (
            <div
              style={{
                position: "absolute",
                right: -popDist,
                top: 52,
                width: 56 * popSize,
                height: 56 * popSize,
                borderRadius: "50%",
                backgroundColor: WHITE,
                opacity: popOpacity * fadeOut,
              }}
            />
          ) : null}
          <div
            style={{
              fontFamily: STYLE_FONTS.heavy,
              fontSize: 150,
              lineHeight: 0.94,
              color: WHITE,
              textAlign: "center",
              letterSpacing: 2,
              textTransform: "uppercase",
              maxWidth: 820,
            }}
          >
            {STICK_TEXT}
          </div>
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: STYLE_FONTS.heavy,
            fontSize: 42,
            letterSpacing: 14,
            color: WHITE,
            opacity: 0.5,
            textTransform: "uppercase",
          }}
        >
          estilo 1 · stick-figure
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ backgroundColor: BLACK, opacity: 1 - fadeOut }} />
    </AbsoluteFill>
  );
};
