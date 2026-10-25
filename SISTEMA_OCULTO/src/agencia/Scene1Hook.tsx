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
import { ensureStyleFonts, STYLE_FONTS } from "../styles/styleFonts";

// DREXLO — Escena 1 (preview)
// Mundo 3D surreal en miniatura: el emprendedor (personaje geométrico recurrente)
// parado en una ciudad digital con fachadas descomunales y sitios flotando, y una
// onda de escaneo IA que revela oportunidades escondidas entre los edificios.
// Todo el estado sale de useCurrentFrame(): render determinista en local y nube.

export const AGENCIA_PREVIEW_ID = "AgenciaPreviewHook";
export const AGENCIA_PREVIEW_DURATION = 210; // 7 s a 30 fps
export const AGENCIA_PREVIEW_FPS = 30;

const W = 1080;
const H = 1920;

// Paleta pedida: azul eléctrico, violeta, naranja cálido y blanco.
const BLUE = "#2F6BFF";
const ELECTRIC = "#4FA8FF";
const VIOLET = "#8B5CF6";
const VIOLET_DEEP = "#4C1D95";
const ORANGE = "#FF9A3C";
const WHITE = "#F5F9FF";
const BG_TOP = "#0B1233";
const BG_BOTTOM = "#1A1140";

const CITY_GROUND = -1.15;

// Residuos deterministas: nada de Math.random (render reproducible).
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Tower = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  accent: string;
  seed: number;
};

const TOWERS: Tower[] = Array.from({ length: 34 }, (_, i) => {
  const side = i % 2 === 0 ? -1 : 1;
  const lane = Math.floor(i / 2);
  const jitter = hash(i) * 0.45;
  const palette = [BLUE, VIOLET, ELECTRIC, VIOLET_DEEP];
  return {
    x: side * (2.3 + lane * 1.05 + jitter),
    z: -2.5 - (lane % 7) * 1.5 + hash(i + 40) * 1.1,
    w: 0.75 + hash(i + 7) * 0.55,
    d: 0.75 + hash(i + 13) * 0.55,
    h: 1.4 + hash(i + 21) * 3.6 + (lane < 3 ? 1.2 : 0),
    color: palette[i % palette.length],
    accent: i % 5 === 0 ? ORANGE : ELECTRIC,
    seed: i,
  };
});

/** Cámara: push-in cinematográfico desde arriba, con leve deriva lateral. */
const CameraRig: React.FC<{ t: number }> = ({ t }) => {
  const camera = useThree((s) => s.camera);
  // eases suave: arranca lejos y alto, termina cerca del emprendedor
  const p = t / (AGENCIA_PREVIEW_DURATION / AGENCIA_PREVIEW_FPS);
  const eased = 1 - Math.pow(1 - Math.min(p, 1), 2.2);
  const z = 9.2 - eased * 4.1;
  const y = 2.9 - eased * 1.15;
  const x = Math.sin(t * 0.55) * 0.22;
  camera.position.set(x, y, z);
  camera.lookAt(x * 0.4, -0.15, -1.2);
  return null;
};

/** Emprendedor en miniatura: geometría simple, misma silueta en todo el video. */
const Entrepreneur: React.FC<{ t: number }> = ({ t }) => {
  const bob = Math.sin(t * 2.1) * 0.045;
  // mira hacia arriba, hacia la onda de escaneo
  const tilt = -0.18 + Math.sin(t * 1.3) * 0.04;
  return (
    <group position={[0, CITY_GROUND + bob, 0.9]} rotation={[tilt, 0, 0]}>
      {/* cuerpo */}
      <mesh castShadow>
        <capsuleGeometry args={[0.19, 0.36, 6, 16]} />
        <meshStandardMaterial color={WHITE} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* cabeza flotante (diseño limpio, no robot) */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.185, 24, 24]} />
        <meshStandardMaterial color={BLUE} roughness={0.3} metalness={0.25} />
      </mesh>
      {/* visor de datos */}
      <mesh position={[0, 0.53, 0.155]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.2, 0.055, 0.03]} />
        <meshStandardMaterial
          color={ELECTRIC}
          emissive={ELECTRIC}
          emissiveIntensity={2.2}
        />
      </mesh>
      {/* brazo derecho levantado señalando */}
      <mesh position={[0.28, 0.34, 0.05]} rotation={[0, 0, -0.85]} castShadow>
        <capsuleGeometry args={[0.055, 0.3, 4, 12]} />
        <meshStandardMaterial color={WHITE} roughness={0.35} />
      </mesh>
      <mesh position={[-0.24, 0.02, 0.02]} rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.055, 0.3, 4, 12]} />
        <meshStandardMaterial color={WHITE} roughness={0.35} />
      </mesh>
      {/* base: aro de luz en el piso */}
      <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 48]} />
        <meshBasicMaterial color={ELECTRIC} transparent opacity={0.85} />
      </mesh>
    </group>
  );
};

/** Onda de escaneo: un anillo que se expande y "enciende" los edificios. */
const ScanWave: React.FC<{ t: number }> = ({ t }) => {
  const radius = 0.4 + t * 2.6;
  const fade = interpolate(t, [0, 0.5, 3.4, 4.4], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <group position={[0, CITY_GROUND + 0.02, 0.9]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.18, 96]} />
        <meshBasicMaterial color={ELECTRIC} transparent opacity={0.5 * fade} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.62, radius * 0.62 + 0.06, 96]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.32 * fade} />
      </mesh>
    </group>
  );
};

/** Fachada descomunal con ventanas emisivas; se enciende cuando pasa el escaneo. */
const Tower: React.FC<{ tower: Tower; t: number }> = ({ tower, t }) => {
  const dx = tower.x;
  const dz = tower.z - 0.9;
  const dist = Math.sqrt(dx * dx + dz * dz);
  // el anillo tarda dist/2.6 s en llegar
  const revealAt = dist / 2.6;
  const lit = interpolate(t, [revealAt, revealAt + 0.35], [0.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = 0.75 + Math.sin(t * 1.6 + tower.seed) * 0.12;

  return (
    <group position={[tower.x, CITY_GROUND + tower.h / 2, tower.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[tower.w, tower.h, tower.d]} />
        <meshStandardMaterial
          color={tower.color}
          roughness={0.28}
          metalness={0.45}
          emissive={tower.color}
          emissiveIntensity={0.14 + lit * 0.16}
        />
      </mesh>
      {/* cintura de luz */}
      <mesh position={[0, tower.h * 0.18, 0]}>
        <boxGeometry args={[tower.w * 1.03, 0.045, tower.d * 1.03]} />
        <meshBasicMaterial color={tower.accent} transparent opacity={0.55 + lit * 0.45} />
      </mesh>
      {/* corona */}
      <mesh position={[0, tower.h / 2 + 0.02, 0]}>
        <boxGeometry args={[tower.w * 0.55, 0.05, tower.d * 0.55]} />
        <meshBasicMaterial color={tower.accent} transparent opacity={pulse * (0.25 + lit * 0.7)} />
      </mesh>
    </group>
  );
};

/** Ventanas brillantes sueltas (partículas de datos entre los edificios). */
const DataMotes: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {Array.from({ length: 46 }, (_, i) => {
      const x = (hash(i) - 0.5) * 12;
      const y = hash(i + 3) * 5.2 - 0.6 + Math.sin(t * 0.8 + i) * 0.12;
      const z = -8 + hash(i + 9) * 9;
      const s = 0.018 + hash(i + 17) * 0.03;
      return (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[s, s, s]} />
          <meshBasicMaterial
            color={i % 4 === 0 ? ORANGE : i % 3 === 0 ? VIOLET : ELECTRIC}
            transparent
            opacity={0.55 + Math.sin(t * 2 + i) * 0.25}
          />
        </mesh>
      );
    })}
  </group>
);

/** Mini sitios web flotando entre los edificios. */
const FloatingSites: React.FC<{ t: number }> = ({ t }) => (
  <group>
    {Array.from({ length: 7 }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const baseX = side * (1.5 + hash(i + 50) * 2.2);
      const baseY = 1.1 + hash(i + 60) * 2.1;
      const baseZ = -1.4 - hash(i + 70) * 3.4;
      return (
        <group
          key={i}
          position={[
            baseX,
            baseY + Math.sin(t * 0.9 + i) * 0.09,
            baseZ,
          ]}
          rotation={[0, side * 0.55 + Math.sin(t * 0.4 + i) * 0.08, 0]}
        >
          <mesh>
            <planeGeometry args={[0.62, 0.4]} />
            <meshBasicMaterial color={WHITE} transparent opacity={0.16} />
          </mesh>
          <mesh position={[-0.17, 0.1, 0.002]}>
            <planeGeometry args={[0.22, 0.05]} />
            <meshBasicMaterial color={ELECTRIC} transparent opacity={0.85} />
          </mesh>
          <mesh position={[-0.17, 0.01, 0.002]}>
            <planeGeometry args={[0.16, 0.035]} />
            <meshBasicMaterial color={VIOLET} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.12, -0.09, 0.002]}>
            <planeGeometry args={[0.2, 0.075]} />
            <meshBasicMaterial color={ORANGE} transparent opacity={0.9} />
          </mesh>
        </group>
      );
    })}
  </group>
);

const SceneContent: React.FC<{ t: number }> = ({ t }) => {
  return (
    <>
      <color attach="background" args={[BG_TOP]} />
      <fog attach="fog" args={[BG_TOP, 8, 17]} />

      <ambientLight intensity={0.55} color="#B9CBFF" />
      <directionalLight
        position={[3.5, 6, 4]}
        intensity={1.5}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      {/* luz cálida de contrapunto */}
      <pointLight position={[-3, 1.6, 2]} intensity={14} color={ORANGE} distance={9} />
      {/* relleno violeta desde atrás */}
      <pointLight position={[2.5, 2.4, -4]} intensity={16} color={VIOLET} distance={12} />

      {/* piso: base limpia de la ciudad */}
      <mesh
        position={[0, CITY_GROUND - 0.02, -2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[7, 64]} />
        <meshStandardMaterial color="#141B45" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* rejilla que se enciende con la onda */}
      <mesh position={[0, CITY_GROUND, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.28, 96]} />
        <meshBasicMaterial color={ELECTRIC} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, CITY_GROUND, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.1, 4.16, 96]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.26} />
      </mesh>

      <ScanWave t={t} />
      {TOWERS.map((tower) => (
        <Tower key={tower.seed} tower={tower} t={t} />
      ))}
      <FloatingSites t={t} />
      <DataMotes t={t} />
      <Entrepreneur t={t} />
    </>
  );
};

export const AgenciaHookPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  React.useEffect(() => {
    ensureStyleFonts();
  }, []);

  // Titular: entra al frame 8 y se mantiene
  const titleIn = interpolate(frame, [8, 26], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [8, 26], [40, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flash de escaneo sobre todo el cuadro cuando la onda pasa por el centro
  const flash = interpolate(t, [0.55, 0.95, 1.5], [0, 0.22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Salida suave
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)`,
      }}
    >
      <ThreeCanvas
        width={W}
        height={H}
        shadows
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 46, position: [0, 2.9, 9.2], near: 0.1, far: 60 }}
      >
        <CameraRig t={t} />
        <SceneContent t={t} />
      </ThreeCanvas>

      {/* Respiradero de escaneo */}
      <AbsoluteFill
        style={{ backgroundColor: ELECTRIC, opacity: flash, mixBlendMode: "screen" }}
      />

      {/* Viñeta: mantiene la escena clara pero enfoca el centro */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 58%, rgba(0,0,0,0) 34%, rgba(6,10,30,0.55) 100%)",
        }}
      />

      {/* Titular (on-screen text de la escena 1) */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 176,
          opacity: titleIn,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: STYLE_FONTS.heavy,
            fontSize: 104,
            lineHeight: 0.98,
            letterSpacing: 1,
            textAlign: "center",
            textTransform: "uppercase",
            color: WHITE,
            textShadow: `0 0 42px ${ELECTRIC}99, 0 18px 60px rgba(0,0,0,0.75)`,
            maxWidth: 900,
          }}
        >
          Find your next client
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: STYLE_FONTS.heavy,
            fontSize: 30,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: ELECTRIC,
            opacity: 0.9,
          }}
        >
          preview · escena 1
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{ backgroundColor: "#05070F", opacity: fadeOut }}
      />
    </AbsoluteFill>
  );
};
