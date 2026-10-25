import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ensureStyleFonts, STYLE_FONTS } from "./styleFonts";

// ESTILO 2 — 3D LOW-POLY (Three.js / @remotion/three)
// Fondo oscuro, un modelo geométrico low-poly (cristal de caras planas +
// satélites), iluminación teatral con un SpotLight desde arriba que proyecta
// una sombra DURA sobre el pedestal, y una rotación suave.
// Todo el estado se deriva de useCurrentFrame(): el Canvas nunca usa el reloj
// real, así que local y nube producen el mismo video.
//
// Rendimiento: en GitHub los runners no tienen GPU (WebGL por software), por eso
// la escena es liviana: dos mallas, 12 satélites, sombra de 1024px, sin reflejos.

export const THREE_TEXT = "Descubre el secreto";
export const THREE_DURATION = 150;
export const THREE_FPS = 30;

const W = 1080;
const H = 1920;

const DARK = "#07090F";
const FLOOR_Y = -2.05;

const SATELLITES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  // Valores fijos (deterministas): sin Math.random.
  return {
    a,
    r: 1.85 + (i % 3) * 0.16,
    h: Math.sin(a * 2) * 0.32 + (i % 2 === 0 ? 0.14 : -0.14),
    size: 0.09 + (i % 4) * 0.022,
    even: i % 2 === 0,
  };
});

/** Cámara: slow dolly (acercamiento + paneo lateral lento), sin controles. */
const CameraRig: React.FC<{ z: number; x: number }> = ({ z, x }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(x, 0.8, z);
  camera.lookAt(-x * 0.35, -0.12, 0);
  return null;
};

// Partículas flotando en bucle: posiciones fijas (deterministas), movimiento por frame.
const PARTICLES = Array.from({ length: 40 }, (_, i) => {
  const g = (i * 0.6180339887) % 1; // secuencia áurea, sin Math.random
  return {
    x: (g - 0.5) * 11,
    y: ((i * 0.37) % 1) * 4.5 - 1,
    z: ((i * 0.73) % 1) * 7 - 3.5,
    size: 0.018 + ((i * 0.21) % 1) * 0.04,
    speed: 0.25 + ((i * 0.13) % 1) * 0.5,
    phase: (i * 0.9) % (Math.PI * 2),
  };
});

const Particles: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const t = frame / fps;
  return (
    <group>
      {PARTICLES.map((p, i) => (
        <mesh
          key={i}
          position={[
            p.x + Math.sin(t * p.speed + p.phase) * 0.35,
            p.y + Math.sin(t * p.speed * 0.7 + p.phase) * 0.5,
            p.z + Math.cos(t * p.speed + p.phase) * 0.35,
          ]}
        >
          <icosahedronGeometry args={[p.size, 0]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? "#FFC98A" : "#9FB4D8"}
            transparent
            opacity={0.45 + ((i * 0.17) % 1) * 0.35}
          />
        </mesh>
      ))}
    </group>
  );
};

const LowPolyCore: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const t = frame / fps; // segundos

  // Rotación suave y constante + inclinación sutil.
  const rotY = t * 0.55 + Math.sin(t * 0.7) * 0.1;
  const rotX = 0.18 + Math.sin(t * 0.9) * 0.06;

  // Entrada: el modelo crece y baja desde el cono de luz.
  const enter = interpolate(frame, [0, 22], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flotación sobre el pedestal.
  const hover = Math.sin(t * 1.1) * 0.05;
  const y = -0.12 + hover + (1 - enter) * 2.4;

  return (
    <>
      <color attach="background" args={[DARK]} />
      <fog attach="fog" args={[DARK, 12, 26]} />

      {/* Luz ambiental mínima: el SpotLight hace el trabajo */}
      <ambientLight intensity={0.2} color="#9FB4D8" />

      {/* Rim light fría desde atrás, sin sombras */}
      <directionalLight
        position={[-4, 2.5, -5]}
        intensity={1.8}
        color="#5B7CFF"
      />

      {/* Luz cálida rasante del pedestal */}
      <pointLight
        position={[2.8, -1.2, 3]}
        intensity={5}
        color="#FF7A3D"
        distance={8}
      />

      {/* SPOTLIGHT teatral: cono desde arriba, sombra DURA (penumbra ~0) */}
      <spotLight
        position={[1.6, 7.5, 3.2]}
        angle={0.6}
        penumbra={0.02}
        intensity={380}
        color="#FFF3E0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        target-position={[0, -0.1, 0]}
      />

      {/* Cristal low-poly */}
      <group
        position={[0, y, 0]}
        rotation={[rotX, rotY, Math.sin(t * 0.5) * 0.07]}
        scale={enter}
      >
        <mesh castShadow receiveShadow>
          <octahedronGeometry args={[1.15, 1]} />
          <meshStandardMaterial
            color="#E89A52"
            roughness={0.45}
            metalness={0.25}
            flatShading
          />
        </mesh>
        {/* Aristas tenues: refuerzan la lectura facetada */}
        <mesh scale={1.004}>
          <octahedronGeometry args={[1.15, 1]} />
          <meshBasicMaterial
            color="#2A1608"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Satélites low-poly girando alrededor */}
        {SATELLITES.map((s, i) => {
          const a = s.a + t * 0.4;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(a) * s.r,
                s.h + Math.sin(a * 1.7) * 0.16,
                Math.sin(a) * s.r,
              ]}
              rotation={[a, a * 1.4, 0]}
              scale={s.size}
              castShadow
            >
              {s.even ? (
                <octahedronGeometry args={[1, 0]} />
              ) : (
                <tetrahedronGeometry args={[1, 0]} />
              )}
              <meshStandardMaterial
                color={s.even ? "#F4EADF" : "#6C8CFF"}
                roughness={0.4}
                metalness={0.1}
                flatShading
              />
            </mesh>
          );
        })}
      </group>

      {/* Pedestal: recibe la sombra dura del spotlight */}
      <mesh
        position={[0, FLOOR_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[9, 72]} />
        <meshStandardMaterial color="#181D28" roughness={1} metalness={0} />
      </mesh>
    </>
  );
};

export const LowPoly3DStyle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  React.useEffect(() => {
    ensureStyleFonts();
  }, []);

  const end = durationInFrames - 1;

  // Slow dolly: se acerca y panea de izquierda a derecha, como espiando un diorama.
  const cameraZ = interpolate(frame, [0, end], [7.4, 6.2], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cameraX = interpolate(frame, [0, end], [-0.85, 0.7], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Titular: entra desde abajo contra el fondo, sale al final.
  const titleIn = interpolate(frame, [22, 46], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOut = interpolate(frame, [end - 18, end - 4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fundido de entrada y salida a negro.
  const blackout = Math.max(
    1 - interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [end - 12, end], [0, 1], { extrapolateLeft: "clamp" }),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      <ThreeCanvas
        width={W}
        height={H}
        shadows
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 45, position: [cameraX, 0.8, cameraZ], near: 0.1, far: 60 }}
        style={{ backgroundColor: DARK }}
      >
        <CameraRig z={cameraZ} x={cameraX} />
        <LowPolyCore frame={frame} fps={fps} />
        <Particles frame={frame} fps={fps} />
      </ThreeCanvas>

      {/* Viñeta teatral */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 22%, rgba(0,0,0,0.6) 68%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 130,
        }}
      >
        <div
          style={{
            fontFamily: STYLE_FONTS.heavy,
            fontSize: 128,
            lineHeight: 0.96,
            color: "#F7EFE6",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: 2,
            maxWidth: 760,
            opacity: titleIn * titleOut,
            transform: `translateY(${(1 - titleIn) * 44}px)`,
            textShadow: "0 20px 70px rgba(0,0,0,0.95)",
          }}
        >
          {THREE_TEXT}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: STYLE_FONTS.heavy,
            fontSize: 36,
            letterSpacing: 12,
            color: "#8FA6C8",
            textTransform: "uppercase",
            opacity: titleIn * titleOut * 0.9,
          }}
        >
          estilo 2 · 3d low-poly
        </div>
      </AbsoluteFill>

      {blackout > 0.001 ? (
        <AbsoluteFill style={{ backgroundColor: "#000", opacity: blackout }} />
      ) : null}
    </AbsoluteFill>
  );
};
