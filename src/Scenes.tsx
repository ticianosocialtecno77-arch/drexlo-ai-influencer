import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./constants";
import {
  AnimatedHeadline,
  EditorialBackground,
  GenericProduct,
  GeometricCharacter,
  Kicker,
} from "./Visuals";

/** Envoltorio común: fondo + contenido centrado + caption opcional. */
const SceneShell: React.FC<{
  accent?: string;
  seed?: number;
  children: React.ReactNode;
}> = ({ accent, seed, children }) => (
  <AbsoluteFill>
    <EditorialBackground accent={accent} particleSeed={seed} />
    {children}
  </AbsoluteFill>
);

const lerp = (frame: number, fps: number, from: number, to: number, dur: number) =>
  interpolate(frame, [from * fps, (from + dur) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/* ---------------------------------------------------------------- Escena 1
   Hook: aparece un producto genérico y luego un personaje virtual se forma
   a partir de partículas.
---------------------------------------------------------------------------- */
export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const productIn = lerp(frame, fps, 0.1, 0.6, 1);
  const charForm = lerp(frame, fps, 1.1, 3.0, 1.2);
  const productOut = lerp(frame, fps, 1.2, 0.8, 1);

  return (
    <SceneShell accent={COLORS.lavender} seed={1}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            top: "26%",
            transform: `translateY(${(1 - productIn) * 60}px) scale(${0.86 + 0.14 * productIn})`,
            opacity: productIn * (1 - productOut * 0.75),
          }}
        >
          <GenericProduct width={250} accent={COLORS.coral} />
        </div>

        <div
          style={{
            position: "absolute",
            top: "40%",
            opacity: 0.25 + 0.75 * charForm,
          }}
        >
          <GeometricCharacter
            form={charForm}
            size={300}
            accent={COLORS.lavender}
            bob={Math.sin((frame / fps) * 1.6) * 6 * charForm}
          />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/* ---------------------------------------------------------------- Escena 2
   Oportunidad: tarjetas sociales abstractas fluyen hacia una tarjeta de
   colaboración comercial. Sin cifras inventadas.
---------------------------------------------------------------------------- */
export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = 5;
  return (
    <SceneShell accent={COLORS.teal} seed={2}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {Array.from({ length: cards }).map((_, i) => {
          const p = lerp(frame, fps, 0.2 + i * 0.18, 1.5, 0.5);
          const y = 470 + i * 120 - p * 26;
          const x = 150 + Math.sin(i * 1.3) * 40 + (1 - p) * -260;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 620,
                height: 96,
                borderRadius: 18,
                background: COLORS.charcoal + "E6",
                border: `1px solid ${COLORS.teal}44`,
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "0 22px",
                opacity: p,
                transform: `translateX(${(1 - p) * 90}px)`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: `linear-gradient(140deg, ${COLORS.lavender}, ${COLORS.teal})`,
                  opacity: 0.9,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 12,
                    width: `${58 + i * 6}%`,
                    borderRadius: 6,
                    background: COLORS.dim + "66",
                  }}
                />
                <div
                  style={{
                    height: 9,
                    width: `${34 + i * 5}%`,
                    borderRadius: 5,
                    marginTop: 9,
                    background: COLORS.dim + "33",
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* tarjeta de colaboración */}
        <div
          style={{
            position: "absolute",
            top: 1060,
            width: 700,
            height: 210,
            borderRadius: 24,
            background: `linear-gradient(160deg, ${COLORS.teal}2E, ${COLORS.charcoal})`,
            border: `2px solid ${COLORS.teal}`,
            opacity: lerp(frame, fps, 2.0, 0.8, 0.9),
            transform: `translateY(${(1 - lerp(frame, fps, 2.0, 0.8, 0.9)) * 40}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 26,
          }}
        >
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 16,
              background: COLORS.coral,
            }}
          />
          <div style={{ width: 4, height: 96, background: COLORS.teal + "88" }} />
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 16,
              background: COLORS.lavender,
            }}
          />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/* ---------------------------------------------------------------- Escena 3
   Ejemplo: personaje vectorial claramente artificial junto a un perfil
   abstracto. Sin imitar a la persona real ni inventar cifras.
---------------------------------------------------------------------------- */
export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = lerp(frame, fps, 0.3, 0.9, 1);
  return (
    <SceneShell accent={COLORS.lavender} seed={3}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 420, opacity: p }}>
          <GeometricCharacter
            size={330}
            accent={COLORS.lavender}
            bob={Math.sin((frame / fps) * 1.4) * 7}
          />
        </div>

        {/* perfil abstracto */}
        <div
          style={{
            position: "absolute",
            top: 1000,
            width: 660,
            height: 300,
            borderRadius: 26,
            background: COLORS.charcoal + "F2",
            border: `1px solid ${COLORS.lavender}55`,
            padding: 30,
            opacity: lerp(frame, fps, 1.4, 0.9, 0.9),
            transform: `translateY(${(1 - lerp(frame, fps, 1.4, 0.9, 0.9)) * 36}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                background: `conic-gradient(from 40deg, ${COLORS.lavender}, ${COLORS.teal}, ${COLORS.coral}, ${COLORS.lavender})`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, width: "52%", borderRadius: 8, background: COLORS.cream + "CC" }} />
              <div style={{ height: 11, width: "34%", borderRadius: 6, marginTop: 12, background: COLORS.dim + "77" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 30 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 86,
                  borderRadius: 14,
                  background: COLORS.navy,
                  border: `1px solid ${COLORS.dim}33`,
                }}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/* ---------------------------------------------------------------- Escena 4
   Vídeos de producto: el mismo personaje y producto en varios fondos.
---------------------------------------------------------------------------- */
export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const backdrops = [
    { bg: COLORS.tealMuted + "55", accent: COLORS.teal },
    { bg: COLORS.lavender + "44", accent: COLORS.lavender },
    { bg: COLORS.coral + "44", accent: COLORS.coral },
  ];
  const active = Math.min(2, Math.floor(frame / fps / 2.1));
  const b = backdrops[active];
  const swap = lerp(frame, fps, 0, 0.35, 0.55);
  return (
    <SceneShell accent={b.accent} seed={4}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 380,
            width: 860,
            height: 1000,
            borderRadius: 34,
            background: `linear-gradient(170deg, ${b.bg}, ${COLORS.charcoal})`,
            border: `1px solid ${b.accent}66`,
            transform: `scale(${0.96 + 0.04 * swap})`,
          }}
        />
        <div style={{ position: "absolute", top: 640, opacity: 1 }}>
          <GeometricCharacter
            size={290}
            accent={b.accent}
            bob={Math.sin((frame / fps) * 1.5) * 7}
          />
        </div>
        <div style={{ position: "absolute", top: 1060 }}>
          <GenericProduct width={210} accent={b.accent} />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/* ---------------------------------------------------------------- Escena 5
   Pruebas creativas: tres variaciones de anuncio en comparación.
---------------------------------------------------------------------------- */
export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variants = [
    { label: "A", accent: COLORS.teal, crop: 1.0 },
    { label: "B", accent: COLORS.lavender, crop: 1.25 },
    { label: "C", accent: COLORS.coral, crop: 0.85 },
  ];
  return (
    <SceneShell accent={COLORS.coral} seed={5}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {variants.map((v, i) => {
          const p = lerp(frame, fps, 0.3 + i * 0.25, 1.4, 0.6);
          return (
            <div
              key={v.label}
              style={{
                position: "absolute",
                top: 430 + i * 460,
                width: 800,
                height: 400,
                borderRadius: 24,
                background: COLORS.charcoal + "F2",
                border: `2px solid ${v.accent}`,
                overflow: "hidden",
                opacity: p,
                transform: `translateX(${(1 - p) * (i % 2 === 0 ? -70 : 70)}px)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(150deg, ${v.accent}26, transparent 70%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  top: 34,
                  width: 150,
                  height: 150,
                  borderRadius: 18,
                  background: `linear-gradient(140deg, ${v.accent}, ${COLORS.charcoal})`,
                  transform: `scale(${v.crop})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 34,
                  top: 46,
                  width: 210,
                  height: 128,
                  borderRadius: 14,
                  background: COLORS.cream + "E6",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  bottom: 40,
                  width: 300 * v.crop,
                  height: 16,
                  borderRadius: 8,
                  background: COLORS.dim + "88",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 34,
                  bottom: 40,
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  border: `3px solid ${v.accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: v.accent,
                  fontWeight: 800,
                  fontSize: 30,
                  fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
                }}
              >
                {v.label}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </SceneShell>
  );
};

/* ---------------------------------------------------------------- Escena 6
   Límite: atención separada de ventas y una lupa que revela que el
   testimonio es sintético.
---------------------------------------------------------------------------- */
export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const attention = interpolate(
    frame,
    [0.2 * fps, 2.2 * fps],
    [0, 82],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const sales = interpolate(
    frame,
    [0.6 * fps, 2.6 * fps],
    [0, 21],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // La lupa entra después de mostrar los dos indicadores
  const lensP = lerp(frame, fps, 3.0, 1.0, 1.2);
  const lensX = interpolate(lensP, [0, 1], [40, 300]);
  const reveal = lerp(frame, fps, 4.2, 1.0, 1.0);

  return (
    <SceneShell accent={COLORS.coral} seed={6}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Indicador de atención */}
        <div style={{ position: "absolute", top: 400, width: 820 }}>
          <Kicker color={COLORS.teal}>Attention</Kicker>
          <div
            style={{
              marginTop: 20,
              height: 46,
              borderRadius: 10,
              background: COLORS.charcoalSoft,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${attention}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.tealMuted})`,
              }}
            />
          </div>
        </div>

        {/* Indicador de ventas */}
        <div style={{ position: "absolute", top: 640, width: 820 }}>
          <Kicker color={COLORS.coral}>Sales</Kicker>
          <div
            style={{
              marginTop: 20,
              height: 46,
              borderRadius: 10,
              background: COLORS.charcoalSoft,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${sales}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.coralSoft})`,
              }}
            />
          </div>
        </div>

        {/* Testimonio ficticio + lupa */}
        <div
          style={{
            position: "absolute",
            top: 960,
            width: 780,
            height: 320,
            borderRadius: 24,
            background: COLORS.charcoal + "F2",
            border: `1px solid ${COLORS.dim}44`,
            padding: 34,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 37,
                background: `conic-gradient(from 20deg, ${COLORS.lavender}, ${COLORS.teal}, ${COLORS.lavender})`,
                // al revelarse, se marca como sintético
                outline: `${3 + reveal * 3}px solid ${COLORS.coral}`,
                outlineOffset: 4,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: "44%", borderRadius: 7, background: COLORS.cream + "BB" }} />
              <div style={{ height: 10, width: "28%", borderRadius: 5, marginTop: 10, background: COLORS.dim + "66" }} />
            </div>
          </div>
          <div style={{ marginTop: 30 }}>
            {[100, 92, 74].map((w, i) => (
              <div
                key={i}
                style={{
                  height: 13,
                  width: `${w}%`,
                  borderRadius: 7,
                  marginTop: 14,
                  background: COLORS.dim + "44",
                }}
              />
            ))}
          </div>

          {/* Marca de "synthetic" */}
          <div
            style={{
              position: "absolute",
              right: 26,
              bottom: 22,
              padding: "10px 18px",
              borderRadius: 10,
              background: COLORS.coral,
              color: COLORS.navyDeep,
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: reveal,
              transform: `translateY(${(1 - reveal) * 12}px)`,
              fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
            }}
          >
            synthetic
          </div>

          {/* Lupa */}
          <div
            style={{
              position: "absolute",
              left: `${lensX}px`,
              top: 60,
              width: 190,
              height: 190,
              borderRadius: 95,
              border: `6px solid ${COLORS.cream}CC`,
              background: `${COLORS.cream}12`,
              opacity: lensP,
              boxShadow: `0 0 0 6px ${COLORS.coral}22`,
            }}
          />
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};

/* ---------------------------------------------------------------- Escena 7
   Cierre: las variaciones se ordenan en una grilla y termina con un
   símbolo claro de transparencia.
---------------------------------------------------------------------------- */
export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grid = lerp(frame, fps, 0.2, 1.2, 0.8);
  const badge = lerp(frame, fps, 1.6, 1.0, 0.9);
  const cells = 6;
  return (
    <SceneShell accent={COLORS.teal} seed={7}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 380,
            width: 860,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            opacity: grid,
          }}
        >
          {Array.from({ length: cells }).map((_, i) => {
            const accent = [COLORS.teal, COLORS.lavender, COLORS.coral][i % 3];
            const p = lerp(frame, fps, 0.2 + i * 0.12, 0.9, 0.5);
            return (
              <div
                key={i}
                style={{
                  height: 220,
                  borderRadius: 20,
                  background: `linear-gradient(150deg, ${accent}22, ${COLORS.charcoal})`,
                  border: `1px solid ${accent}66`,
                  transform: `scale(${0.9 + 0.1 * p})`,
                  opacity: p,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 22,
                    top: 22,
                    width: 70,
                    height: 70,
                    borderRadius: 14,
                    background: accent,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 22,
                    bottom: 26,
                    width: "62%",
                    height: 12,
                    borderRadius: 6,
                    background: COLORS.dim + "66",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Símbolo de transparencia */}
        <div
          style={{
            position: "absolute",
            top: 1120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
            opacity: badge,
            transform: `scale(${0.86 + 0.14 * badge})`,
          }}
        >
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: 120,
              border: `8px solid ${COLORS.teal}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${COLORS.teal}14`,
            }}
          >
            {/* ojo abierto: transparencia */}
            <div style={{ position: "relative", width: 150, height: 84 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  border: `7px solid ${COLORS.cream}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 52,
                  height: 52,
                  marginLeft: -26,
                  marginTop: -26,
                  borderRadius: 26,
                  background: COLORS.coral,
                }}
              />
            </div>
          </div>
          <AnimatedHeadline delay={2.0} size={54} color={COLORS.cream}>
            Be transparent
          </AnimatedHeadline>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
