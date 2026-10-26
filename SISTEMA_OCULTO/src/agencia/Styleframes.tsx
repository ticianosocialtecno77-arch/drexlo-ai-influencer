import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ensureStyleFonts, STYLE_FONTS } from "../styles/styleFonts";

// DREXLO AGENCIA — Styleframes: 3 direcciones de arte para la ESCENA 1.
// Son frames fijos, para elegir el look antes de animar nada.
// Render: coldframe render AgenciaStyleframes --name agencia-styleframes.mp4
//         (o --frame=N con remotion still)

export const AGENCIA_SF_DURATION = 3; // 3 frames: uno por propuesta
export const AGENCIA_SF_FPS = 30;

const W = 1080;
const H = 1920;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Dir = "A" | "B" | "C";

/* ------------------------------------------------------------------ */
/* DIRECCION A — Diorama luminoso                                     */
/* Isometrico, miniatura de juguete, luz de estudio, cielo degradado  */
/* ------------------------------------------------------------------ */
const A_BG_TOP = "#7FC4FF";
const A_BG_BOT = "#E8F2FF";
const A_GROUND = "#C9DCF5";

const DioramaCity: React.FC<{ t: number }> = ({ t }) => {
  const towers = React.useMemo(
    () =>
      Array.from({ length: 96 }, (_, i) => {
        const ring = Math.floor(i / 8);
        const idx = i % 8;
        const ang = (idx / 8) * Math.PI * 2 + ring * 0.39;
        const rad = 1.5 + ring * 0.62 + hash(i) * 0.3;
        return {
          x: Math.cos(ang) * rad,
          z: Math.sin(ang) * rad,
          w: 0.22 + hash(i + 5) * 0.16,
          h: 0.35 + hash(i + 11) * 1.25,
          hue: [0, 1, 2, 3][i % 4],
        };
      }),
    [],
  );
  const palette = ["#2F6BFF", "#8B5CF6", "#4FA8FF", "#FFFFFF"];

  return (
    <group position={[0, -0.9, 0]} rotation={[0, t * 0.12, 0]}>
      {/* base del diorama */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[5.4, 5.6, 0.5, 64]} />
        <meshStandardMaterial color={A_GROUND} roughness={0.85} metalness={0} />
      </mesh>
      {towers.map((tw, i) => (
        <group key={i} position={[tw.x, 0.25 + tw.h / 2, tw.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[tw.w, tw.h, tw.w]} />
            <meshStandardMaterial
              color={palette[tw.hue]}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
          {/* ventanas como cintas claras */}
          <mesh position={[0, tw.h * 0.15, 0]}>
            <boxGeometry args={[tw.w * 1.02, 0.035, tw.w * 1.02]} />
            <meshBasicMaterial color="#FFF6D8" />
          </mesh>
        </group>
      ))}
      {/* el emprendedor en el centro */}
      <group position={[0, 0.85, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.13, 0.24, 6, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow>
          <sphereGeometry args={[0.125, 24, 24]} />
          <meshStandardMaterial color="#2F6BFF" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.35, 0.1]}>
          <boxGeometry args={[0.13, 0.035, 0.02]} />
          <meshBasicMaterial color="#4FA8FF" />
        </mesh>
      </group>
      {/* aro de escaneo */}
      <mesh position={[0, 0.53, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.22, 96]} />
        <meshBasicMaterial color="#4FA8FF" transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

const DirA: React.FC<{ t: number }> = ({ t }) => (
  <>
    <color attach="background" args={[A_BG_TOP]} />
    <ambientLight intensity={1.15} color="#FFFFFF" />
    <hemisphereLight args={["#BFE0FF", "#8FA6C8", 1.0]} />
    <directionalLight
      position={[4, 7, 5]}
      intensity={2.4}
      color="#FFFFFF"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
    <directionalLight position={[-5, 3, -4]} intensity={0.7} color="#9FD8FF" />
    <DioramaCity t={t} />
  </>
);

/* ------------------------------------------------------------------ */
/* DIRECCION B — Tunel de neon                                        */
/* Camara dentro de un canon de luz, alto contraste, mucho glow       */
/* ------------------------------------------------------------------ */
const B_BG = "#070A1C";

const NeonTunnel: React.FC<{ t: number }> = ({ t }) => {
  const rings = React.useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({ z: -i * 1.15, i })),
    [],
  );
  return (
    <group>
      {rings.map((r) => (
        <mesh key={r.i} position={[0, 0, r.z]} rotation={[0, 0, (r.i % 4) * 0.22]}>
          <torusGeometry args={[3.1 - r.i * 0.045, 0.075, 12, 8]} />
          <meshBasicMaterial
            color={r.i % 3 === 0 ? "#FF9A3C" : r.i % 3 === 1 ? "#4FA8FF" : "#8B5CF6"}
            transparent
            opacity={0.95 - r.i * 0.022}
          />
        </mesh>
      ))}
      {/* rayos de datos saliendo del centro */}
      {Array.from({ length: 90 }, (_, i) => {
        const a = (i / 90) * Math.PI * 2;
        const rad = 0.5 + hash(i) * 2.4;
        const y = (hash(i + 30) - 0.5) * 3.4;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * rad, y, -3 - hash(i + 60) * 14]}
            rotation={[0, 0, a]}
          >
            <boxGeometry args={[0.02 + hash(i + 90) * 0.05, 0.02, 0.9 + hash(i + 7) * 2.2]} />
            <meshBasicMaterial
              color={i % 5 === 0 ? "#FF9A3C" : "#7FD4FF"}
              transparent
              opacity={0.5 + hash(i + 3) * 0.45}
            />
          </mesh>
        );
      })}
      {/* silueta del emprendedor en primer plano, contraluz */}
      <group position={[0.35, -0.85, 1.6]} rotation={[-0.2, 0, 0]}>
        <mesh>
          <capsuleGeometry args={[0.2, 0.36, 6, 16]} />
          <meshBasicMaterial color="#0A0F26" />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.19, 20, 20]} />
          <meshBasicMaterial color="#0A0F26" />
        </mesh>
        {/* borde de luz */}
        <mesh position={[0, 0.52, 0.14]}>
          <boxGeometry args={[0.2, 0.05, 0.01]} />
          <meshBasicMaterial color="#7FD4FF" />
        </mesh>
      </group>
    </group>
  );
};

const CameraB: React.FC<{ t: number }> = ({ t }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(Math.sin(t * 0.3) * 0.25, 0.1, 4.6);
  camera.lookAt(0, 0, -4);
  return null;
};

const DirB: React.FC<{ t: number }> = ({ t }) => (
  <>
    <color attach="background" args={[B_BG]} />
    <ambientLight intensity={0.35} />
    <pointLight position={[0, 0, 1]} intensity={22} color="#4FA8FF" distance={12} />
    <pointLight position={[0, 1.4, -5]} intensity={26} color="#8B5CF6" distance={14} />
    <CameraB t={t} />
    <NeonTunnel t={t} />
  </>
);

/* ------------------------------------------------------------------ */
/* DIRECCION C — Ciudad de datos                                      */
/* Fachadas de cristal, ventanas encendidas, camara a nivel de calle  */
/* ------------------------------------------------------------------ */
const C_BG_TOP = "#1B2A6B";
const C_BG_BOT = "#3B2B7A";
const C_GROUND = "#2A3570";

const GlassCity: React.FC<{ t: number }> = ({ t }) => {
  const towers = React.useMemo(
    () =>
      Array.from({ length: 78 }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const lane = Math.floor(i / 2);
        const depth = -(lane % 9) * 1.35 - 0.6 - hash(i) * 0.9;
        const along = side * (1.35 + Math.floor(lane / 9) * 0.95 + hash(i + 3) * 0.35);
        return {
          x: along,
          z: depth,
          w: 0.5 + hash(i + 8) * 0.42,
          h: 1.1 + hash(i + 15) * 4.2,
          glass: i % 3 === 0,
        };
      }),
    [],
  );

  return (
    <group position={[0, -1.2, 0]}>
      {/* calle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]} receiveShadow>
        <planeGeometry args={[16, 26]} />
        <meshStandardMaterial color={C_GROUND} roughness={0.35} metalness={0.6} />
      </mesh>
      {/* linea central luminosa */}
      <mesh position={[0, 0.01, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.14, 24]} />
        <meshBasicMaterial color="#9FD8FF" transparent opacity={0.75} />
      </mesh>

      {towers.map((tw, i) => (
        <group key={i} position={[tw.x, tw.h / 2, tw.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[tw.w, tw.h, tw.w]} />
            <meshStandardMaterial
              color={tw.glass ? "#4E7BE8" : "#6E5BD6"}
              roughness={0.12}
              metalness={0.85}
              emissive={tw.glass ? "#1E4FCC" : "#3A2A9A"}
              emissiveIntensity={0.35}
            />
          </mesh>
          {/* piso de ventanas encendidas */}
          {Array.from({ length: Math.max(2, Math.floor(tw.h / 0.34)) }, (_, k) => (
            <mesh key={k} position={[0, -tw.h / 2 + 0.22 + k * 0.34, tw.w / 2 + 0.005]}>
              <planeGeometry args={[tw.w * 0.72, 0.1]} />
              <meshBasicMaterial
                color={hash(i * 13 + k) > 0.45 ? "#FFE6A8" : "#9FD8FF"}
                transparent
                opacity={0.55 + hash(i + k) * 0.45}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* emprendedor a nivel de calle, de espaldas mirando la ciudad */}
      <group position={[0, 0.72, 1.1]} rotation={[-0.12, 0, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.17, 0.32, 6, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.47, 0]} castShadow>
          <sphereGeometry args={[0.165, 24, 24]} />
          <meshStandardMaterial color="#2F6BFF" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0.26, 0.32, 0.04]} rotation={[0, 0, -0.7]} castShadow>
          <capsuleGeometry args={[0.05, 0.28, 4, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.35} />
        </mesh>
        {/* aro de escaneo en la calle */}
        <mesh position={[0, -0.7, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.62, 96]} />
          <meshBasicMaterial color="#4FA8FF" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, -0.7, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.9, 2.98, 96]} />
          <meshBasicMaterial color="#8B5CF6" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* hologramas de oportunidad flotando */}
      {Array.from({ length: 5 }, (_, i) => (
        <group
          key={i}
          position={[
            (i % 2 === 0 ? -1 : 1) * (0.9 + hash(i + 40) * 0.9),
            1.5 + hash(i + 50) * 1.8,
            -2.4 - hash(i + 60) * 2.6,
          ]}
          rotation={[0, (i % 2 === 0 ? 1 : -1) * 0.5, 0]}
        >
          <mesh>
            <planeGeometry args={[0.7, 0.46]} />
            <meshBasicMaterial color="#8FD8FF" transparent opacity={0.28} />
          </mesh>
          <mesh position={[-0.18, 0.12, 0.003]}>
            <planeGeometry args={[0.26, 0.06]} />
            <meshBasicMaterial color="#FF9A3C" />
          </mesh>
          <mesh position={[-0.2, 0.0, 0.003]}>
            <planeGeometry args={[0.18, 0.04]} />
            <meshBasicMaterial color="#9FD8FF" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const DirC: React.FC<{ t: number }> = ({ t }) => (
  <>
    <color attach="background" args={[C_BG_TOP]} />
    <fog attach="fog" args={[C_BG_BOT, 7, 20]} />
    <ambientLight intensity={0.9} color="#CFE0FF" />
    <directionalLight position={[3, 6, 4]} intensity={2.0} color="#FFFFFF" castShadow />
    <pointLight position={[-2.4, 2, 2]} intensity={16} color="#FF9A3C" distance={10} />
    <pointLight position={[2.2, 3, -3]} intensity={20} color="#8B5CF6" distance={14} />
    <GlassCity t={t} />
  </>
);

/* ------------------------------------------------------------------ */

const LABELS: Record<Dir, { a: string; b: string }> = {
  A: { a: "A · DIORAMA LUMINOSO", b: "miniatura de juguete · claro y premium" },
  B: { a: "B · TÚNEL DE NEÓN", b: "alto contraste · velocidad y datos" },
  C: { a: "C · CIUDAD DE DATOS", b: "cristal y hologramas · cinematográfico" },
};

const BACKGROUNDS: Record<Dir, string> = {
  A: `linear-gradient(180deg, ${A_BG_TOP} 0%, ${A_BG_BOT} 100%)`,
  B: B_BG,
  C: `linear-gradient(180deg, ${C_BG_TOP} 0%, ${C_BG_BOT} 100%)`,
};

export const AgenciaStyleframes: React.FC<{ dir?: number }> = ({ dir = 0 }) => {
  const dirs: Dir[] = ["A", "B", "C"];
  const picked = dirs[Math.max(0, Math.min(2, Math.round(dir)))];
  const t = 1.2;

  React.useEffect(() => {
    ensureStyleFonts();
  }, []);

  const label = LABELS[picked];

  return (
    <AbsoluteFill style={{ background: BACKGROUNDS[picked] }}>
      <ThreeCanvas
        width={W}
        height={H}
        shadows
        gl={{ antialias: true, alpha: true }}
        camera={
          picked === "A"
            ? { fov: 32, position: [6.2, 5.4, 7.4], near: 0.1, far: 60 }
            : picked === "B"
              ? { fov: 58, position: [0, 0.1, 4.6], near: 0.1, far: 60 }
              : { fov: 44, position: [0, 1.35, 5.6], near: 0.1, far: 60 }
        }
      >
        {picked === "A" ? <CameraA /> : null}
        {picked === "A" ? <DirA t={t} /> : null}
        {picked === "B" ? <DirB t={t} /> : null}
        {picked === "C" ? <DirC t={t} /> : null}
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          background:
            picked === "A"
              ? "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0) 60%)"
              : "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 150,
        }}
      >
        <div
          style={{
            fontFamily: STYLE_FONTS.heavy,
            fontSize: 46,
            letterSpacing: 2,
            color: picked === "A" ? "#10213F" : "#FFFFFF",
            textShadow: picked === "A" ? "none" : "0 0 30px #4FA8FF88",
          }}
        >
          {label.a}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: STYLE_FONTS.heavy,
            fontSize: 26,
            letterSpacing: 4,
            color: picked === "A" ? "#2F4A7A" : "#9FD8FF",
          }}
        >
          {label.b}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Camara fija para el diorama isometrico. */
const CameraA: React.FC = () => {
  const camera = useThree((s) => s.camera);
  camera.position.set(6.2, 5.4, 7.4);
  camera.lookAt(0, -0.2, 0);
  return null;
};
