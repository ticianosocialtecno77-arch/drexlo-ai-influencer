import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./constants";

/**
 * Personaje digital abstracto y reutilizable.
 * Construido solo con formas geométricas simples (nunca una persona real).
 * Se usa en varias escenas con distintos tamaños y colores de acento.
 */
export const GeometricCharacter: React.FC<{
  /** 0 = disperso en partículas, 1 = completamente formado */
  form?: number;
  size?: number;
  accent?: string;
  /** desplazamiento vertical del "cabeceo" idle */
  bob?: number;
  opacity?: number;
}> = ({ form = 1, size = 260, accent = COLORS.lavender, bob = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Partículas que convergen hacia el cuerpo del personaje.
  const particles = React.useMemo(() => {
    const out: { x: number; y: number; r: number; delay: number }[] = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 26; i++) {
      out.push({
        x: (rand() - 0.5) * size * 3.4,
        y: (rand() - 0.5) * size * 3.4,
        r: 3 + rand() * 7,
        delay: i / 26,
      });
    }
    return out;
  }, [size]);

  const s = size / 260;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 1.55,
        opacity,
        transform: `translateY(${bob}px)`,
      }}
    >
      {/* Partículas convergentes durante la formación */}
      {form < 1 &&
        particles.map((p, i) => {
          const local = interpolate(
            form,
            [0, 1],
            [0, 1],
          );
          const appear = Math.max(0, Math.min(1, local * 1.6 - p.delay));
          const px = p.x * (1 - appear);
          const py = p.y * (1 - appear);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "45%",
                width: p.r,
                height: p.r,
                marginLeft: p.x * 0 + px,
                marginTop: py,
                borderRadius: p.r,
                background: i % 3 === 0 ? accent : COLORS.teal,
                opacity: (1 - appear) * 0.9,
              }}
            />
          );
        })}

      {/* Cabeza */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 74 * s,
          height: 74 * s,
          marginLeft: (-37 * s) * form,
          transform: `scale(${0.6 + 0.4 * form})`,
          borderRadius: 18 * s,
          background: `linear-gradient(140deg, ${accent}, ${COLORS.lavenderSoft})`,
          opacity: form,
        }}
      />

      {/* Torso trapezoidal */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 84 * s,
          width: 92 * s,
          height: 110 * s,
          marginLeft: -46 * s,
          transform: `scale(${0.6 + 0.4 * form})`,
          clipPath: "polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)",
          background: `linear-gradient(160deg, ${COLORS.teal}, ${COLORS.tealMuted})`,
          opacity: form,
        }}
      />

      {/* Brazos */}
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            left: "50%",
            top: 92 * s,
            width: 20 * s,
            height: 96 * s,
            marginLeft: side * 56 * s - 10 * s,
            transform: `scale(${0.6 + 0.4 * form})`,
            borderRadius: 10 * s,
            background: COLORS.lavenderSoft,
            opacity: form * 0.95,
          }}
        />
      ))}

      {/* Piernas */}
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            left: "50%",
            top: 198 * s,
            width: 26 * s,
            height: 84 * s,
            marginLeft: side * 24 * s - 13 * s,
            transform: `scale(${0.6 + 0.4 * form})`,
            borderRadius: 8 * s,
            background: COLORS.charcoalSoft,
            opacity: form,
          }}
        />
      ))}

      {/* Anillo de escaneo: refuerza que es una creación digital */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          width: size * 0.95,
          height: size * 0.95,
          marginLeft: -size * 0.475,
          marginTop: -size * 0.475,
          borderRadius: "50%",
          border: `2px dashed ${accent}55`,
          transform: `rotate(${(frame / fps) * 18}deg)`,
          opacity: 0.6 * form,
        }}
      />
    </div>
  );
};

/** Producto genérico y sin marca (caja + etiqueta neutra). */
export const GenericProduct: React.FC<{
  width?: number;
  accent?: string;
  label?: boolean;
}> = ({ width = 200, accent = COLORS.coral, label = true }) => {
  const h = width * 1.25;
  return (
    <div style={{ position: "relative", width, height: h }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: width * 0.09,
          background: `linear-gradient(150deg, ${COLORS.cream}, #D9D4C8)`,
          boxShadow: `0 ${width * 0.06}px ${width * 0.14}px #0006`,
        }}
      />
      {/* franja de acento */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: h * 0.38,
          height: h * 0.16,
          background: accent,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            left: "18%",
            right: "18%",
            top: h * 0.66,
            height: h * 0.1,
            borderRadius: 6,
            background: COLORS.charcoal + "22",
          }}
        />
      )}
    </div>
  );
};

/** Fondo editorial con navy profundo, viñeta y partículas sutiles. */
export const EditorialBackground: React.FC<{
  accent?: string;
  particleSeed?: number;
}> = ({ accent = COLORS.teal, particleSeed = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dots = React.useMemo(() => {
    const out: { x: number; y: number; r: number; sp: number }[] = [];
    let seed = particleSeed * 7919 + 13;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 40; i++) {
      out.push({
        x: rand() * 100,
        y: rand() * 100,
        r: 1 + rand() * 3.2,
        sp: 0.15 + rand() * 0.5,
      });
    }
    return out;
  }, [particleSeed]);

  const t = frame / fps;

  return (
    <AbsoluteFill style={{ background: COLORS.navyDeep }}>
      {/* Gradiente de profundidad */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 80% at 50% 12%, ${COLORS.navy} 0%, ${COLORS.navyDeep} 62%, #04070E 100%)`,
        }}
      />
      {/* Halo de acento que respira */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 50% 72%, ${accent}1F 0%, transparent 70%)`,
          opacity: 0.7 + 0.3 * Math.sin(t * 0.8),
        }}
      />
      {/* Partículas */}
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${((d.y + t * d.sp * 3) % 100).toFixed(2)}%`,
            width: d.r,
            height: d.r,
            borderRadius: "50%",
            background: i % 4 === 0 ? accent : COLORS.dim,
            opacity: 0.28,
          }}
        />
      ))}
      {/* Viñeta */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(75% 55% at 50% 50%, transparent 55%, #000000B3 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Título grande con entrada por máscara. */
export const AnimatedHeadline: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  align?: "center" | "left";
  maxWidth?: number;
}> = ({ children, delay = 0, size = 76, color = COLORS.cream, align = "center", maxWidth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame - delay * fps, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontSize: size,
        lineHeight: 1.08,
        fontWeight: 800,
        letterSpacing: -0.5,
        color,
        textAlign: align,
        maxWidth,
        fontFamily:
          'Inter, "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** Subtítulo/etiqueta pequeña en mayúsculas. */
export const Kicker: React.FC<{
  children: React.ReactNode;
  color?: string;
  delay?: number;
}> = ({ children, color = COLORS.teal, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame - delay * fps, [0, 0.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 4,
        textTransform: "uppercase",
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 10}px)`,
        fontFamily:
          'Inter, "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {children}
    </div>
  );
};
