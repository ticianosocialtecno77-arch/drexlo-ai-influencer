import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ensureStyleFonts, STYLE_FONTS } from "./styleFonts";

// ESTILO 3 — 2D FLAT CARTOON (cómic)
// SVG en línea con bordes negros gruesos y colores sólidos. Las partes del SVG
// se animan por interpolación con useCurrentFrame() (nada de CSS animations:
// en el render cada frame se captura por separado y una animación CSS no
// coincidiría con el tiempo del video). El ciclo dura 60 frames y hace bucle
// sin costuras: el personaje se inclina a investigar, se yergue, abre los
// brazos y la caja del secreto se abre con un destello.

export const CARTOON_TEXT = "Descubre el secreto";
export const CARTOON_DURATION = 150;
export const CARTOON_FPS = 30;

const W = 1080;
const H = 1920;

const INK = "#101010";
const PAPER = "#F2C14E";
const PAPER_DARK = "#E8B23C";
const SKIN = "#F7B98A";
const SHIRT = "#2E6FE8";
const SHORTS = "#E2432E";
const WHITE = "#FFFFFF";
const BOX = "#3DBE7B";
const BOX_LID = "#2FA866";
const GOLD = "#FFD84D";

const OUTLINE = 10; // grosor del borde negro grueso
const LOOP_FRAMES = 60; // ciclo de 2 s

// Layout: el letrero ocupa la parte de arriba y el personaje la de abajo,
// así la cara nunca queda tapada.
const PX = 800; // eje del personaje
const BODY_Y = 1740; // piso del personaje
const BOX_X = 330; // la caja va a la izquierda del personaje
const BOX_BASE = BODY_Y + 20;

// Plantel del letrero (la escena se achica 0.86 → 0.62, así que nunca pisa al personaje)
const SIGN = { cx: 540, y: 400, w: 920, h: 470 };

// Se dibuja en tres líneas SVG: a 132px "DESCUBRE" mide 611*1.32 = 807 px.
const LINE_1 = "DESCUBRE";
const LINE_2 = "EL";
const LINE_3 = "SECRETO";
const TITLE_SIZE = 132;

/** Líneas de velocidad: tres trazos a cada lado, latido de 30 frames. */
const SpeedLines: React.FC<{ frame: number }> = ({ frame }) => {
  const loop = (frame % 30) / 30;
  const opacity = interpolate(loop, [0, 0.25, 0.75, 1], [0.85, 0.3, 0.85, 0.85]);
  const spread = interpolate(loop, [0, 1], [0, 54]);
  return (
    <g opacity={opacity}>
      {[-1, 1].map((dir) =>
        [0, 1, 2].map((i) => {
          const y = BODY_Y - 760 + i * 150;
          const len = 110 + i * 34;
          const x1 = PX + dir * (290 + spread);
          const x2 = x1 + dir * len;
          return (
            <line
              key={`${dir}-${i}`}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke={INK}
              strokeWidth={12}
              strokeLinecap="round"
            />
          );
        }),
      )}
    </g>
  );
};

/** Rayos de "¡ajá!" alrededor de la caja, con latido. */
const Burst: React.FC<{ frame: number; active: number }> = ({
  frame,
  active,
}) => {
  const beat = 1 + Math.sin((frame / 20) * Math.PI * 2) * 0.06;
  const cx = BOX_X;
  const cy = BOX_BASE - 140;
  return (
    <g
      opacity={active}
      transform={`translate(${cx} ${cy}) scale(${beat}) translate(${-cx} ${-cy})`}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.26;
        const inner = 215;
        const outer = 290 + (i % 2) * 60;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * inner}
            y1={cy + Math.sin(a) * inner}
            x2={cx + Math.cos(a) * outer}
            y2={cy + Math.sin(a) * outer}
            stroke={INK}
            strokeWidth={OUTLINE}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

export const FlatCartoonStyle: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  React.useEffect(() => {
    ensureStyleFonts();
  }, []);

  const end = durationInFrames - 1;
  const t = frame / CARTOON_FPS;

  // ---- Micro-vida: parpadeo cada ~3 s y respiración del tórax.
  // La secuencia es fija (determinista) para que el render sea idéntico.
  const blinkCycle = frame % 90;
  const blink = interpolate(blinkCycle, [0, 3, 7, 10], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = 1 + Math.sin(t * Math.PI * 0.8) * 0.02;

  // ---- Ciclo del personaje: se inclina a investigar y se yergue ----
  const loop = (frame % LOOP_FRAMES) / LOOP_FRAMES;
  const curious = Math.sin(loop * Math.PI * 2); // -1 (anhela) .. 1 (descubre)
  const lean = curious * 6; // grados
  const crouch = Math.max(0, -curious) * 18; // px
  const bob = Math.sin(t * Math.PI * 1.5) * 5;

  // ---- Squash & stretch derivado del mismo ciclo: al bajar se achata
  // (más ancho y bajo), al estirarse se alarga. Arranca rápido y frena suave.
  const squashDrive = Math.max(0, -curious) * 0.06 - Math.max(0, curious) * 0.03;
  const bodyScaleX = 1 + squashDrive;
  const bodyScaleY = 1 - squashDrive;

  // Brazos: bajan al inclinarse, se abren al descubrir.
  const armLift = interpolate(curious, [-1, 1], [0, 1]);
  const leftArm = interpolate(armLift, [0, 1], [54, 14]);
  const rightArm = interpolate(armLift, [0, 1], [-54, -14]);
  const headTilt = curious * 5;

  // ---- Caja secreta: la tapa se abre con el ciclo ----
  const openAmount = interpolate(curious, [-1, 1], [0, 1]);
  const flapAngle = interpolate(openAmount, [0, 1], [0, -100]);
  const glow = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Letrero: entra con un "boing" ----
  const titlePop = interpolate(frame, [4, 14, 20], [0, 1.12, 1], {
    easing: Easing.out(Easing.back(2.2)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleRot = interpolate(frame, [0, end], [3, 1.4], {
    extrapolateRight: "clamp",
  });

  // ---- Escena completa: entra con un boing y después respira (escala chica) ----
  const heroIn = interpolate(frame, [8, 22], [0, 1], {
    easing: Easing.out(Easing.back(1.8)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sceneScale =
    interpolate(frame, [0, 14], [0.97, 1], {
      easing: Easing.out(Easing.back(1.4)),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * (1 + Math.sin(t * 1.7) * 0.005);
  // Además la escena arranca un 6% más grande y se aleja: las partes bajas
  // (pies, caja) nunca quedan cortadas por el borde.
  const sceneZoom = 1.06;
  const sceneY = (H / 2) * 0;
  const sceneTransform = `translate(0 ${sceneY}) scale(${sceneScale * sceneZoom})`;

  // ---- Cierre: un zoom de lente suave (nada de fundidos, que es un estilo flat) ----
  const lensScale = interpolate(frame, [end - 16, end], [1, 1.18], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---- Salida a negro ----
  const blackout = interpolate(frame, [end - 10, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Contenido local de la cabeza (coordenadas relativas al personaje).
  const headCY = -760;
  const visor = { x: -62, y: headCY - 26, w: 124, h: 68, r: 26 };

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <AbsoluteFill
        style={{
          transform: sceneTransform,
          transformOrigin: "50% 50%",
        }}
      >
        {/* Fondo plano: círculo de color con borde grueso */}
        <AbsoluteFill>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <circle cx={540} cy={1090} r={620} fill={PAPER_DARK} />
            <circle
              cx={540}
              cy={1090}
              r={620}
              fill="none"
              stroke={INK}
              strokeWidth={OUTLINE}
            />
          </svg>
        </AbsoluteFill>

        {/* Escena: personaje + caja + efectos. Entra un poco más tarde que el
            letrero, para que la creación de la escena se lea por pasos. */}
        <AbsoluteFill
          style={{
            transform: `translate(0 ${140 * (1 - heroIn)}) scale(${heroIn})`,
            transformOrigin: "50% 78%",
          }}
        >
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {/* ---- Letrero de cómic ---- */}
            <g
              transform={`translate(${SIGN.cx} ${SIGN.y}) rotate(${-titleRot}) scale(${titlePop})`}
            >
              <rect
                x={-SIGN.w / 2}
                y={-SIGN.h / 2}
                width={SIGN.w}
                height={SIGN.h}
                rx={34}
                fill={WHITE}
                stroke={INK}
                strokeWidth={18}
              />
              <g
                fontFamily={STYLE_FONTS.black}
                fontSize={TITLE_SIZE}
                fill={INK}
                textAnchor="middle"
              >
                <text x={0} y={-96}>
                  {LINE_1}
                </text>
                <text x={0} y={58}>
                  {LINE_2}
                </text>
                <text x={0} y={212}>
                  {LINE_3}
                </text>
              </g>
            </g>

            {/* Pastilla con el nombre del estilo (entre el cartel y el personaje) */}
            <g transform={`translate(540 675) scale(${titlePop})`}>
              <rect
                x={-360}
                y={-44}
                width={720}
                height={88}
                rx={44}
                fill={WHITE}
                stroke={INK}
                strokeWidth={9}
              />
              <text
                x={0}
                y={12}
                fontFamily={STYLE_FONTS.black}
                fontSize={30}
                fill={INK}
                textAnchor="middle"
                letterSpacing={4}
              >
                ESTILO 3 · 2D FLAT CARTOON
              </text>
            </g>

            <SpeedLines frame={frame} />
            <Burst frame={frame} active={glow} />

            {/* Sombra plana en el piso */}
            <ellipse
              cx={PX}
              cy={BODY_Y + 26}
              rx={150}
              ry={22}
              fill={INK}
              opacity={0.2}
            />

            {/* Squash & stretch con origen en los pies */}
            <g
              transform={`translate(${PX} ${BODY_Y + crouch - bob}) rotate(${lean}) scale(${bodyScaleX} ${bodyScaleY})`}
            >
              {/* Piernas */}
              <rect x={-76} y={-300} width={64} height={300} rx={28} fill={SHORTS} stroke={INK} strokeWidth={OUTLINE} />
              <rect x={12} y={-300} width={64} height={300} rx={28} fill={SHORTS} stroke={INK} strokeWidth={OUTLINE} />
              {/* Zapatos */}
              <rect x={-94} y={-46} width={100} height={46} rx={23} fill={WHITE} stroke={INK} strokeWidth={OUTLINE} />
              <rect x={2} y={-46} width={100} height={46} rx={23} fill={WHITE} stroke={INK} strokeWidth={OUTLINE} />

              {/* Torso: respira (el tórax expande ~2%) */}
              <g transform={`translate(0 -440) scale(${breathe} ${breathe}) translate(0 440)`}>
                <rect x={-112} y={-590} width={224} height={300} rx={56} fill={SHIRT} stroke={INK} strokeWidth={OUTLINE} />
              </g>

              {/* Brazos: rotan desde el hombro */}
              <g transform={`rotate(${leftArm} -98 -560)`}>
                <rect x={-136} y={-580} width={56} height={230} rx={28} fill={SHIRT} stroke={INK} strokeWidth={OUTLINE} />
                <circle cx={-108} cy={-330} r={34} fill={SKIN} stroke={INK} strokeWidth={OUTLINE} />
              </g>
              <g transform={`rotate(${rightArm} 98 -560)`}>
                <rect x={80} y={-580} width={56} height={230} rx={28} fill={SHIRT} stroke={INK} strokeWidth={OUTLINE} />
                <circle cx={108} cy={-330} r={34} fill={SKIN} stroke={INK} strokeWidth={OUTLINE} />
              </g>

              {/* Cabeza */}
              <g transform={`rotate(${headTilt} 0 -630)`}>
                <circle cx={0} cy={headCY} r={136} fill={SKIN} stroke={INK} strokeWidth={OUTLINE} />
                {/* Pelo plano */}
                <path
                  d={`M -136 ${headCY - 18} A 136 136 0 0 1 136 ${headCY - 18} Q 104 ${headCY - 120} 0 ${headCY - 136} Q -104 ${headCY - 120} -136 ${headCY - 18} Z`}
                  fill={INK}
                />
                {/* Visor tipo gafas */}
                <rect x={visor.x} y={visor.y} width={visor.w} height={visor.h} rx={visor.r} fill={INK} />
                <g clipPath="url(#visorClip)">
                  <rect x={visor.x} y={visor.y} width={visor.w} height={visor.h} fill="#CFE0FF" />
                  {/* Brillo que barre el visor en bucle */}
                  <rect
                    x={visor.x - 70 + ((frame * 11) % 240)}
                    y={visor.y - 20}
                    width={34}
                    height={visor.h + 40}
                    fill={WHITE}
                    opacity={0.8}
                    transform={`rotate(12 ${visor.x + visor.w / 2} ${visor.y + visor.h / 2})`}
                  />
                </g>
                <rect
                  x={visor.x}
                  y={visor.y}
                  width={visor.w}
                  height={visor.h}
                  rx={visor.r}
                  fill="none"
                  stroke={INK}
                  strokeWidth={OUTLINE}
                />
                {/* Sonrisa */}
                <path
                  d={`M -44 ${headCY + 58} Q 0 ${headCY + 100} 44 ${headCY + 58}`}
                  fill="none"
                  stroke={INK}
                  strokeWidth={OUTLINE}
                  strokeLinecap="round"
                />
                {/* Parpadeo: un párpado del color de la piel que baja sobre el visor */}
                {blink > 0.01 ? (
                  <g>
                    <rect
                      x={visor.x - 8}
                      y={visor.y - 8}
                      width={visor.w + 16}
                      height={(visor.h + 12) * blink}
                      rx={(visor.r + 4) * (1 - blink)}
                      fill={SKIN}
                    />
                  </g>
                ) : null}
              </g>
            </g>

            {/* ---- Caja secreta, a la izquierda: no tapa la cara ---- */}
            <g transform={`translate(${BOX_X} ${BOX_BASE})`}>
              {/* Contenido brillante que se asoma */}
              <ellipse cx={0} cy={-120} rx={104} ry={30} fill={GOLD} opacity={glow} />
              <rect x={-132} y={-196} width={264} height={140} rx={18} fill={BOX} stroke={INK} strokeWidth={OUTLINE} />
              <rect x={-46} y={-156} width={92} height={52} rx={12} fill={INK} />
              <circle cx={0} cy={-130} r={10} fill={GOLD} />
              {/* Tapa que se abre desde la bisagra izquierda */}
              <g transform={`rotate(${flapAngle} -132 -196)`}>
                <rect x={-132} y={-242} width={264} height={50} rx={16} fill={BOX_LID} stroke={INK} strokeWidth={OUTLINE} />
              </g>
            </g>

            <defs>
              <clipPath id="visorClip">
                <rect x={visor.x} y={visor.y} width={visor.w} height={visor.h} rx={visor.r} />
              </clipPath>
            </defs>
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Borde de la escena: al hacer zoom de lente, una luna PAPER tapa los bordes.
          Se recorta con un path grande menos un círculo, así el centro queda limpio. */}
      <AbsoluteFill
        style={{
          transform: `scale(${lensScale})`,
          transformOrigin: "50% 45%",
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <path
            d={`M -600 -600 H ${W + 600} V ${H + 600} H -600 Z M ${540 + 1700} 960 A ${1700} ${1700} 0 1 0 ${540 - 1700} 960 A ${1700} ${1700} 0 1 0 ${540 + 1700} 960 Z`}
            fill={PAPER}
            fillRule="evenodd"
          />
        </svg>
      </AbsoluteFill>

      {blackout > 0.001 ? (
        <AbsoluteFill style={{ backgroundColor: INK, opacity: blackout }} />
      ) : null}
    </AbsoluteFill>
  );
};
