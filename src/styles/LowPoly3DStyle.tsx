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

/** Cámara: dolly lento hacia el modelo, sin controles interactivos. */
const CameraRig: React.FC<{ z: number }> = ({ z }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(0, 0.75, z);
  camera.lookAt(0, -0.12, 0);
  return null;
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

  // Dolly lento.
  const cameraZ = interpolate(frame, [0, end], [7.4, 6.2], {
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
        camera={{ fov: 45, position: [0, 0.75, cameraZ], near: 0.1, far: 60 }}
        style={{ backgroundColor: DARK }}
      >
        <CameraRig z={cameraZ} />
        <LowPolyCore frame={frame} fps={fps} />
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
