import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, Easing, delayRender, continueRender,
} from 'remotion';
import {Character, INK, SW, CURIOSO, Check} from './Cartoon';
import './fonts';
import {CIA_FPS, CIA_SCENES, CIA_WORDS, CIA_TOTAL_SECONDS, CIA_AUDIO} from './clientesTimeline';

// ============================================================================
// DREXLO — "AI Can Find Clients Your Competitors Ignore"
// Short vertical 1080x1920 @30fps. Base reutilizada del proyecto Vinc:
//   src/Cartoon.tsx (Character / CURIOSO), src/fonts.ts, estructura de
//   src/BagFeesCartoon.tsx (Cam + Sequence + Captions + TitleBox).
// Todo dibujado con codigo SVG. Los tiempos salen de clientesTimeline.ts,
// medidos con ffmpeg silencedetect sobre la voz real.
// ============================================================================

const FPS = CIA_FPS;
const s = (sec: number) => Math.round(sec * FPS);
const YELLOW = '#ffd23f';
const RED = '#c0392b';
const GREEN = '#3fbf6a';
const BLUE = '#3d6fb0';
const CYAN = '#4fa8ff';

const SCENE = (id: string) => CIA_SCENES.find((x) => x.id === id) ?? CIA_SCENES[0];
const REL = (id: string, pi: number) => {
  const sc = SCENE(id);
  return sc.phrases[Math.min(pi, sc.phrases.length - 1)].start - sc.start;
};

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const CHIP: Record<string, string> = {
  step1: 'STEP 1 - PICK A NICHE',
  step2: 'STEP 2 - FIND THE PROBLEMS',
  step3: 'STEP 3 - PICK ONE PROBLEM',
  step4: 'STEP 4 - WRITE THE MESSAGE',
  ending: 'THE RIGHT WAY',
};

// ---------------------------------------------------------------- camara ----
// Empuje lento durante toda la escena + un "golpecito" de zoom en cada revelado.
const Cam: React.FC<{len: number; kicks?: number[]; children: React.ReactNode}> = ({len, kicks = [], children}) => {
  const f = useCurrentFrame();
  let z = interpolate(f, [0, s(len)], [1, 1.06]);
  for (const k of kicks) {
    z += 0.045 * Math.exp(-Math.max(0, f - s(k)) / 5) * (f >= s(k) ? 1 : 0);
  }
  const enter = interpolate(f, [0, 7], [70, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: 'translateX(' + enter + 'px) scale(' + z + ')'}}>
      {children}
    </AbsoluteFill>
  );
};

const Pop: React.FC<{at: number; damping?: number; stiffness?: number; children: (p: number) => React.ReactNode}> = ({at, damping = 10, stiffness = 120, children}) => {
  const f = useCurrentFrame();
  const p = spring({frame: f - s(at), fps: FPS, config: {damping, stiffness}});
  return <>{children(p)}</>;
};

// --------------------------------------------------------------- utileria ---
const Magnifier: React.FC<{x: number; y: number; r: number; glow?: number; children?: React.ReactNode}> = ({x, y, r, glow = 0, children}) => {
  const id = 'lens' + Math.round(x) + '_' + Math.round(y);
  return (
    <g>
      {glow > 0 && <circle cx={x} cy={y} r={r + 34 + 26 * glow} fill="none" stroke={YELLOW} strokeWidth={16} opacity={0.55 * (1 - glow) + 0.2} />}
      <defs>
        <clipPath id={id}>
          <circle cx={x} cy={y} r={r - 4} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r} fill="#eaf4ff" stroke={INK} strokeWidth={SW} />
      <g clipPath={'url(#' + id + ')'}>{children}</g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={SW} />
      <path d={'M ' + (x - r * 0.48) + ' ' + (y - r * 0.6) + ' A ' + r * 0.8 + ' ' + r * 0.8 + ' 0 0 1 ' + (x + r * 0.06) + ' ' + (y - r * 0.88)} stroke="#fff" strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

const Tooth: React.FC<{x: number; y: number; s?: number}> = ({x, y, s: sc = 1}) => (
  <g transform={'translate(' + x + ' ' + y + ') scale(' + sc + ')'}>
    <path d="M 0 -70 C -46 -70 -62 -34 -52 6 C -44 40 -30 70 -18 70 C -6 70 -6 40 0 40 C 6 40 6 70 18 70 C 30 70 44 40 52 6 C 62 -34 46 -70 0 -70 Z" fill="#fff" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M -26 -40 Q -30 -10 -22 20" stroke="#cfe0ee" strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
);

const Dumbbell: React.FC<{x: number; y: number; s?: number}> = ({x, y, s: sc = 1}) => (
  <g transform={'translate(' + x + ' ' + y + ') scale(' + sc + ')'}>
    <rect x={-14} y={-14} width={28} height={28} rx={8} fill="#9aa7b4" stroke={INK} strokeWidth={6} />
    <rect x={-96} y={-52} width={38} height={104} rx={12} fill="#4f8fc9" stroke={INK} strokeWidth={SW} />
    <rect x={58} y={-52} width={38} height={104} rx={12} fill="#4f8fc9" stroke={INK} strokeWidth={SW} />
    <rect x={-62} y={-38} width={26} height={76} rx={10} fill="#7fb4e0" stroke={INK} strokeWidth={6} />
    <rect x={36} y={-38} width={26} height={76} rx={10} fill="#7fb4e0" stroke={INK} strokeWidth={6} />
  </g>
);

const House: React.FC<{x: number; y: number; s?: number}> = ({x, y, s: sc = 1}) => (
  <g transform={'translate(' + x + ' ' + y + ') scale(' + sc + ')'}>
    <path d="M -84 0 L 0 -78 L 84 0 Z" fill="#c0392b" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={-62} y={0} width={124} height={86} rx={6} fill="#f2e6c8" stroke={INK} strokeWidth={SW} />
    <rect x={-18} y={28} width={36} height={58} rx={4} fill="#b98b5e" stroke={INK} strokeWidth={6} />
    <rect x={-52} y={20} width={24} height={24} fill="#bfe0f2" stroke={INK} strokeWidth={5} />
    <rect x={28} y={20} width={24} height={24} fill="#bfe0f2" stroke={INK} strokeWidth={5} />
  </g>
);

const Gear: React.FC<{x: number; y: number; r: number; rot: number; color?: string}> = ({x, y, r, rot, color = '#f2b134'}) => (
  <g transform={'translate(' + x + ' ' + y + ') rotate(' + rot + ')'}>
    {Array.from({length: 10}).map((_, i) => (
      <rect key={i} x={-r * 0.16} y={-r * 1.18} width={r * 0.32} height={r * 0.42} rx={r * 0.08} fill={color} stroke={INK} strokeWidth={6} transform={'rotate(' + (i * 36) + ')'} />
    ))}
    <circle r={r} fill={color} stroke={INK} strokeWidth={SW} />
    <circle r={r * 0.36} fill="#e9eef4" stroke={INK} strokeWidth={6} />
  </g>
);

const Bulb: React.FC<{x: number; y: number; p: number; f: number}> = ({x, y, p, f}) => (
  <g transform={'translate(' + x + ' ' + y + ') scale(' + p + ')'}>
    {Array.from({length: 10}).map((_, i) => {
      const a = (i / 10) * Math.PI * 2 + f / 40;
      const r0 = 118, r1 = 152 + Math.sin(f / 5 + i) * 16;
      return <path key={i} d={'M ' + Math.cos(a) * r0 + ' ' + Math.sin(a) * r0 + ' L ' + Math.cos(a) * r1 + ' ' + Math.sin(a) * r1} stroke={YELLOW} strokeWidth={14} strokeLinecap="round" />;
    })}
    <circle r={106} fill={YELLOW} stroke={INK} strokeWidth={SW} />
    <path d="M -34 10 Q -20 -34 0 -34 Q 20 -34 34 10" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <rect x={-30} y={100} width={60} height={30} rx={8} fill="#c9cfd8" stroke={INK} strokeWidth={6} />
    <rect x={-26} y={128} width={52} height={22} rx={8} fill="#9aa7b4" stroke={INK} strokeWidth={6} />
  </g>
);

const Envelope: React.FC<{x: number; y: number; s?: number; rot?: number; open?: number; check?: number}> = ({x, y, s: sc = 1, rot = 0, open = 0, check = 0}) => (
  <g transform={'translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + sc + ')'}>
    <rect x={-150} y={-100} width={300} height={200} rx={12} fill="#fff" stroke={INK} strokeWidth={SW} />
    <path d="M -150 -100 L 0 30 L 150 -100" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <g transform={'translate(0 -100) rotate(' + (-open * 34) + ')'}>
      <path d="M -150 0 L 150 0 L 0 130 Z" fill="#eef3f9" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
    {check > 0 && (
      <g transform={'translate(112 -70) scale(' + check + ')'}>
        <circle r={58} fill={GREEN} stroke={INK} strokeWidth={SW} />
        <path d="M -26 2 L -6 22 L 28 -18" stroke="#fff" strokeWidth={15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )}
  </g>
);

const Keyboard: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <g transform={'translate(' + x + ' ' + y + ')'}>
    <rect x={-320} y={-40} width={640} height={170} rx={16} fill="#dfe6ee" stroke={INK} strokeWidth={SW} />
    {Array.from({length: 3}).map((_, row) =>
      Array.from({length: 9}).map((__, col) => {
        const seed = row * 9 + col;
        const press = Math.max(0, Math.sin(f / 3 + seed) - 0.86) * 18;
        return (
          <rect key={seed} x={-292 + col * 66} y={-22 + row * 48 + press} width={54} height={38} rx={7}
            fill={seed % 7 === 0 ? YELLOW : '#fff'} stroke={INK} strokeWidth={5} />
        );
      })
    )}
  </g>
);

const Chip: React.FC<{x: number; y: number; p: number; color: string; label: string; fs?: number}> = ({x, y, p, color, label, fs = 40}) => (
  <g transform={'translate(' + x + ' ' + y + ') scale(' + p + ')'} opacity={Math.min(1, Math.max(0, p * 2))}>
    <rect x={-250} y={-52} width={500} height={104} rx={52} fill={color} stroke={INK} strokeWidth={SW} />
    <text x={0} y={14} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={fs} fill="#fff">{label}</text>
  </g>
);

const CheckChip: React.FC<{x: number; y: number; p: number; label: string}> = ({x, y, p, label}) => {
  const fs = label.length > 16 ? 32 : 38;
  const tw = Math.min(400, label.length * fs * 0.66);
  return (
    <g transform={'translate(' + x + ' ' + y + ') scale(' + p + ')'} opacity={Math.min(1, Math.max(0, p * 2))}>
      <rect x={-300} y={-52} width={600} height={104} rx={52} fill="#fff" stroke={INK} strokeWidth={SW} />
      <circle cx={-238} cy={0} r={38} fill={GREEN} stroke={INK} strokeWidth={6} />
      <path d="M -256 -2 L -242 14 L -220 -14" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={58} y={fs * 0.36} textAnchor="middle" textLength={tw} lengthAdjust="spacingAndGlyphs" fontFamily="Poppins" fontWeight={800} fontSize={fs} fill={INK}>{label}</text>
    </g>
  );
};

// --------------------------------------------------------------- escena 1 ---
// HOOK: El Curioso mira alrededor con una lupa gigante. Aparece el titulo.
const SceneHook: React.FC = () => {
  const f = useCurrentFrame();
  const sc = SCENE('hook');
  const len = sc.end - sc.start;
  const foundAt = REL('hook', 1);
  const lensP = spring({frame: f - 3, fps: FPS, config: {damping: 12, stiffness: 95}});
  const found = spring({frame: f - s(foundAt), fps: FPS, config: {damping: 9}});
  const pulse = 1 - spring({frame: f - s(foundAt), fps: FPS, config: {damping: 14, stiffness: 60}});
  const lx = 862;
  const ly = 892;
  const r = 196;
  return (
    <Cam len={len} kicks={[foundAt]}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width={1080} height={1920} fill="#dbe7f5" />
        {/* ciudad de fondo */}
        {[[-40, 560, 170, 900], [120, 660, 130, 800], [130, 430, 220, 1030], [980, 600, 180, 860]].map((b, i) => (
          <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} fill="#c9d8ea" stroke={INK} strokeWidth={6} />
        ))}
        {Array.from({length: 24}).map((_, i) => (
          <rect key={'w' + i} x={140 + (i % 4) * 52} y={470 + Math.floor(i / 4) * 78} width={30} height={40} fill="#eaf2fb" opacity={0.9} />
        ))}
        <rect y={1400} width={1080} height={520} fill="#c3d3e6" />
        {/* local del cliente escondido */}
        <rect x={642} y={520} width={368} height={880} rx={14} fill="#eef3f9" stroke={INK} strokeWidth={SW} />
        <path d="M 642 620 L 1010 620 L 986 690 L 666 690 Z" fill={RED} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <rect x={684} y={742} width={286} height={252} rx={8} fill="#bfe0f2" stroke={INK} strokeWidth={6} />
        {[684, 826, 970].map((x, i) => <rect key={i} x={x - 4} y={742} width={8} height={252} fill="#eef3f9" stroke={INK} strokeWidth={3} />)}
        <rect x={684} y={1040} width={286} height={360} rx={8} fill="#e6d3bb" stroke={INK} strokeWidth={6} />
        <rect x={790} y={1120} width={140} height={280} rx={8} fill="#b98b5e" stroke={INK} strokeWidth={6} />
        <circle cx={930} cy={1258} r={11} fill={INK} />
        <text x={826} y={1120} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={34} fill={INK}>OPEN</text>
        {/* manija de la lupa */}
        <path d={'M 578 1216 L ' + (lx - 132) + ' ' + (ly + 150) + ' L ' + (lx - 96) + ' ' + (ly + 184) + ' L 542 1258 Z'} fill="#8a5a2b" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* El Curioso */}
        <Character x={380} y={1240} s={1.0} {...CURIOSO} mouth={f > s(foundAt) ? 'grin' : 'smile'} brow={f > s(foundAt) ? 0.6 : 0.2}
          armR={110} armL={12} look={[0.9, -0.3]} blinkSeed={1} />
        <g transform={'scale(' + lensP + ') translate(' + (lx * (1 / lensP - 1)) + ' ' + (ly * (1 / lensP - 1)) + ')'}>
          <Magnifier x={lx} y={ly} r={r} glow={pulse}>
            <rect x={lx - r} y={ly - r} width={r * 2} height={r * 2} fill="#eaf4ff" />
            <rect x={630} y={640} width={400} height={500} fill="#eef3f9" />
            <path d="M 630 700 L 1030 700 L 1010 760 L 650 760 Z" fill={RED} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <rect x={666} y={800} width={330} height={330} rx={6} fill="#bfe0f2" stroke={INK} strokeWidth={5} />
            {/* el cliente escondido, ahora visible */}
            <Character x={830} y={1090} s={0.42} suit="#6fae7a" hair="#6b4a2f" hairStyle="side" mouth="grin" brow={0.5}
              armR={f > s(foundAt) ? 150 : 20} armL={12} look={[-0.2, -0.2]} blinkSeed={2} />
            {f > s(foundAt) && (
              <g transform={'translate(862 ' + (742 + Math.sin(f / 6) * 6) + ') scale(' + found + ')'}>
                <rect x={-112} y={-40} width={224} height={80} rx={40} fill={YELLOW} stroke={INK} strokeWidth={6} />
                <text x={0} y={14} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={50} fill={INK}>CLIENT</text>
              </g>
            )}
          </Magnifier>
        </g>
      </svg>
    </Cam>
  );
};

// --------------------------------------------------------------- escena 2 ---
// STEP 1: el personaje senala 3 iconos flotantes (diente, mancuerna, casa).
const SceneNiche: React.FC = () => {
  const f = useCurrentFrame();
  const sc = SCENE('step1');
  const len = sc.end - sc.start;
  const base = REL('step1', 1);
  const icons = [
    {x: 200, y: 620, el: <Tooth x={0} y={0} s={1.0} />, label: 'DENTISTS', color: '#4f8fc9'},
    {x: 540, y: 560, el: <Dumbbell x={0} y={0} s={0.9} />, label: 'GYMS', color: '#e08a3c'},
    {x: 880, y: 640, el: <House x={0} y={0} s={0.95} />, label: 'REAL ESTATE', color: '#6fae7a'},
  ];
  const count = Math.round(interpolate(f, [s(base), s(base + 1.2)], [0, 3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const focus = spring({frame: f - s(REL('step1', 2)), fps: FPS, config: {damping: 10}});
  return (
    <Cam len={len} kicks={[base, base + 0.5, base + 1.0, REL('step1', 2)]}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width={1080} height={1920} fill="#fdf1dd" />
        <rect y={1400} width={1080} height={520} fill="#ecd9b8" />
        <rect y={1372} width={1080} height={30} fill="#d8c096" />
        {icons.map((ic, i) => (
          <Pop key={i} at={base + i * 0.5} damping={11}>
            {(p) => (
              <g transform={'translate(' + ic.x + ' ' + (ic.y + (1 - p) * 120) + ') scale(' + p + ')'} opacity={Math.min(1, p * 1.6)}>
                <rect x={-138} y={-138} width={276} height={276} rx={34} fill="#fff" stroke={INK} strokeWidth={SW} />
                {ic.label === 'DENTISTS' ? <Tooth x={0} y={-8} s={1.15} /> : null}
                {ic.label === 'GYMS' ? <Dumbbell x={0} y={-8} s={1.0} /> : null}
                {ic.label === 'REAL ESTATE' ? <House x={0} y={-10} s={1.05} /> : null}
                <g transform={'translate(0 168)'}>
                  <rect x={-118} y={-34} width={236} height={68} rx={34} fill={ic.color} stroke={INK} strokeWidth={6} />
                  <text x={0} y={12} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={ic.label.length > 8 ? 30 : 36} fill="#fff">{ic.label}</text>
                </g>
              </g>
            )}
          </Pop>
        ))}
        {/* contador 0 -> 3 */}
        <g transform={'translate(540 1110) scale(' + (0.7 + 0.3 * Math.min(1, f / s(base + 0.6))) + ')'}>
          <rect x={-330} y={-96} width={660} height={192} rx={40} fill="#fff" stroke={INK} strokeWidth={SW} />
          <text x={-150} y={64} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={150} fill={RED}>{String(count)}</text>
          <text x={90} y={20} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={40} fill={INK}>TYPES OF</text>
          <text x={90} y={66} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={40} fill={INK}>BUSINESS</text>
        </g>
        {/* foco: una sola */}
        <g transform={'translate(540 1345) scale(' + focus + ')'} opacity={Math.min(1, focus * 2)}>
          <rect x={-330} y={-58} width={660} height={116} rx={58} fill={YELLOW} stroke={INK} strokeWidth={SW} />
          <text x={0} y={16} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={60} fill={INK}>PICK ONE TYPE</text>
        </g>
        <Character x={128} y={1160} s={0.78} {...CURIOSO} mouth="grin" brow={0.4} armR={150} armL={14} look={[0.4, -0.9]} blinkSeed={3} />
      </svg>
    </Cam>
  );
};

// --------------------------------------------------------------- escena 3 ---
// STEP 2: pantalla de computadora; la web fea lleva una X roja.
const SceneScreen: React.FC = () => {
  const f = useCurrentFrame();
  const sc = SCENE('step2');
  const len = sc.end - sc.start;
  const scanAt = REL('step2', 1);
  const xAt = REL('step2', 2);
  const copyAt = REL('step2', 3);
  const scanY = interpolate(f, [s(scanAt), s(scanAt + 2.2)], [90, 430], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const xp = spring({frame: f - s(xAt), fps: FPS, config: {damping: 8}});
  const cp = spring({frame: f - s(copyAt), fps: FPS, config: {damping: 9}});
  const cp1 = spring({frame: f - s(xAt + 0.15), fps: FPS, config: {damping: 9}});
  return (
    <Cam len={len} kicks={[scanAt, xAt, copyAt]}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width="1080" height="1920" fill="#e9eff7" />
        <rect y={1372} width={1080} height={548} fill="#ccd9e8" />
        {/* escritorio */}
        <rect x={90} y={1216} width={900} height={34} rx={10} fill="#b98b5e" stroke={INK} strokeWidth={6} />
        <rect x={140} y={1250} width={30} height={190} fill="#a1754d" stroke={INK} strokeWidth={5} />
        <rect x={910} y={1250} width={30} height={190} fill="#a1754d" stroke={INK} strokeWidth={5} />
        {/* monitor */}
        <rect x={224} y={540} width={632} height={470} rx={24} fill="#3b4152" stroke={INK} strokeWidth={SW} />
        <rect x={248} y={566} width={584} height={388} rx={10} fill="#fff" stroke={INK} strokeWidth={5} />
        <rect x={498} y={1010} width={84} height={70} fill="#3b4152" stroke={INK} strokeWidth={6} />
        <rect x={392} y={1080} width={296} height={30} rx={14} fill="#3b4152" stroke={INK} strokeWidth={6} />
        {/* la web fea */}
        <g>
          <rect x={248} y={566} width={584} height={62} fill="#7a8aa0" />
          <rect x={268} y={586} width={70} height={22} rx={4} fill="#fff" opacity={0.85} />
          <rect x={640} y={586} width={58} height={22} rx={4} fill="#c9d2de" />
          <rect x={712} y={586} width={58} height={22} rx={4} fill="#c9d2de" />
          <rect x={784} y={586} width={36} height={22} rx={4} fill="#c9d2de" />
          <rect x={272} y={654} width={230} height={26} rx={5} fill="#8f9db0" />
          <rect x={272} y={694} width={300} height={16} rx={4} fill="#c2ccd8" />
          <rect x={272} y={722} width={260} height={16} rx={4} fill="#c2ccd8" />
          <rect x={272} y={750} width={180} height={16} rx={4} fill="#c2ccd8" />
          <rect x={272} y={800} width={140} height={52} rx={10} fill="#9aa7b4" stroke={INK} strokeWidth={5} />
          <text x={342} y={836} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={24} fill="#fff">BOOK</text>
          <rect x={540} y={654} width={266} height={198} rx={8} fill="#dfe6ee" stroke="#b6c1cd" strokeWidth={4} />
          <path d="M 560 690 L 786 690 M 560 726 L 700 726" stroke="#c2ccd8" strokeWidth={12} strokeLinecap="round" />
          <rect x={272} y={880} width={534} height={54} rx={8} fill="#e6ecf3" />
        </g>
        {/* linea de escaneo IA */}
        <rect x={248} y={566 + scanY} width={584} height={7} fill={CYAN} opacity={0.95} />
        <rect x={248} y={566 + scanY - 34} width={584} height={34} fill={CYAN} opacity={0.18} />
        {/* X roja sobre la web */}
        <g transform={'translate(540 760) scale(' + xp + ')'} opacity={Math.min(1, xp * 2)}>
          <path d="M -120 -120 L 120 120 M 120 -120 L -120 120" stroke={RED} strokeWidth={40} strokeLinecap="round" />
          <path d="M -120 -120 L 120 120 M 120 -120 L -120 120" stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.5} />
        </g>
        {/* anotaciones (fuera de la pantalla, con linea guia) */}
        <Pop at={xAt + 0.15} damping={9}>
          {(p) => (
            <g transform={'translate(320 452) scale(' + p + ')'} opacity={Math.min(1, p * 2)}>
              <path d="M 120 52 L 208 186" stroke={INK} strokeWidth={7} />
              <circle cx={210} cy={192} r={12} fill={YELLOW} stroke={INK} strokeWidth={5} />
              <rect x={-256} y={-56} width={512} height={112} rx={56} fill={YELLOW} stroke={INK} strokeWidth={6} />
              <text x={0} y={13} textAnchor="middle" textLength={420} lengthAdjust="spacingAndGlyphs" fontFamily="Poppins" fontWeight={800} fontSize={36} fill={INK}>CONFUSING BOOKING</text>
            </g>
          )}
        </Pop>
        <Pop at={copyAt} damping={9}>
          {(p) => (
            <g transform={'translate(830 452) scale(' + p + ')'} opacity={Math.min(1, p * 2)}>
              <path d="M -82 52 L -186 160" stroke={INK} strokeWidth={7} />
              <circle cx={-188} cy={166} r={12} fill={YELLOW} stroke={INK} strokeWidth={5} />
              <rect x={-240} y={-56} width={480} height={112} rx={56} fill={YELLOW} stroke={INK} strokeWidth={6} />
              <text x={0} y={11} textAnchor="middle" textLength={380} lengthAdjust="spacingAndGlyphs" fontFamily="Poppins" fontWeight={800} fontSize={32} fill={INK}>WEAK WEBSITE COPY</text>
            </g>
          )}
        </Pop>
        <Character x={900} y={1300} s={0.78} {...CURIOSO} flip mouth="flat" brow={-0.4} armR={132} armL={12} look={[-0.9, 0.1]} blinkSeed={4} />
      </svg>
    </Cam>
  );
};

// --------------------------------------------------------------- escena 4 ---
// STEP 3: idea (foco amarillo) + engranaje + mensaje.
const SceneIdea: React.FC = () => {
  const f = useCurrentFrame();
  const sc = SCENE('step3');
  const len = sc.end - sc.start;
  const ideaAt = REL('step3', 0);
  const o1 = REL('step3', 1);
  const o2 = REL('step3', 2);
  const o3 = REL('step3', 3);
  const bulb = spring({frame: f - s(ideaAt), fps: FPS, config: {damping: 9}});
  return (
    <Cam len={len} kicks={[ideaAt, o1, o2, o3]}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width={1080} height={1920} fill="#ece6f8" />
        <rect y={1400} width={1080} height={520} fill="#d5ccec" />
        <Gear x={880} y={470} r={132} rot={f * 1.1} color="#c9b6f0" />
        <Gear x={160} y={360} r={86} rot={-f * 1.6} color="#e0d5f7" />
        {/* tarjeta de idea */}
        <g transform={'translate(540 800) scale(' + (0.8 + 0.2 * Math.min(1, f / 8)) + ')'}>
          <rect x={-360} y={-150} width={720} height={300} rx={44} fill="#fff" stroke={INK} strokeWidth={SW} />
          <text x={0} y={-60} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={40} fill={INK}>REAL PROBLEM</text>
          <text x={-70} y={92} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={190} fill={RED}>1</text>
          <text x={110} y={80} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={38} fill={INK}>YOU CAN</text>
          <text x={110} y={124} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={38} fill={INK}>SOLVE</text>
        </g>
        {/* foco amarillo sobre la cabeza */}
        <Bulb x={540} y={330} p={bulb} f={f} />
        {/* opciones concretas */}
        <Pop at={o1} damping={11}>{(p) => <CheckChip x={540} y={1240} p={p} label="AUTOMATE REMINDERS" />}</Pop>
        <Pop at={o2} damping={11}>{(p) => <CheckChip x={540} y={1372} p={p} label="IMPROVE THE WEBSITE" />}</Pop>
        <Pop at={o3} damping={11}>{(p) => <CheckChip x={540} y={1504} p={p} label="FOLLOW UP WITH LEADS" />}</Pop>
        <Character x={118} y={1170} s={0.78} {...CURIOSO} mouth="o" brow={0.9} armR={158} armL={16} look={[0.3, -0.9]} blinkSeed={5} />
      </svg>
    </Cam>
  );
};

// --------------------------------------------------------------- escena 5 ---
// STEP 4: teclea; sale un sobre volando con un check verde.
const SceneMessage: React.FC = () => {
  const f = useCurrentFrame();
  const sc = SCENE('step4');
  const len = sc.end - sc.start;
  const typeAt = REL('step4', 1);
  const sendAt = REL('step4', 2);
  const checkAt = REL('step4', 3);
  const fly = interpolate(f, [s(sendAt), s(sendAt + 1.6)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const ex = interpolate(fly, [0, 1], [640, 800]);
  const ey = interpolate(fly, [0, 1], [1300, 700]);
  const rot = interpolate(fly, [0, 1], [0, -12]);
  const open = interpolate(f, [s(checkAt), s(checkAt + 0.5)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chk = spring({frame: f - s(checkAt + 0.2), fps: FPS, config: {damping: 8}});
  const stamp = spring({frame: f - s(checkAt + 0.35), fps: FPS, config: {damping: 10}});
  return (
    <Cam len={len} kicks={[typeAt, sendAt, checkAt]}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width={1080} height="1920" fill="#e6eff0" />
        <rect y={1400} width={1080} height={520} fill="#c9dde0" />
        {/* escritorio */}
        <rect x={60} y={1240} width={660} height={30} rx={10} fill="#b98b5e" stroke={INK} strokeWidth={6} />
        <Keyboard x={390} y={1200} f={f} />
        {/* chispas de tecleo */}
        {Array.from({length: 9}).map((_, i) => {
          const t = (f / 4 + i) % 9;
          return <rect key={i} x={210 + hash(i) * 560} y={1150 - t * 22} width={16} height={16} rx={4} fill={YELLOW} stroke={INK} strokeWidth={4} opacity={Math.max(0, 1 - t / 9)} />;
        })}
        {/* sobre volando */}
        <g opacity={fly > 0.02 ? 1 : 0}>
          <Envelope x={ex} y={ey} s={1.0} rot={rot} open={open} check={Math.min(1, chk)} />
        </g>
        {/* sello: revisar los hechos */}
        <g transform={'translate(540 1560) scale(' + stamp + ')'} opacity={Math.min(1, stamp * 2)}>
          <rect x={-330} y={-62} width={660} height={124} rx={62} fill={YELLOW} stroke={INK} strokeWidth={SW} />
          <text x={0} y={18} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={62} fill={INK}>CHECK THE FACTS</text>
        </g>
        <Character x={860} y={1300} s={0.8} {...CURIOSO} flip mouth={f > s(checkAt) ? 'grin' : 'smile'} brow={0.3}
          armR={f > s(typeAt) ? 96 : 20} armL={f > s(typeAt) ? 96 : 20} look={[-0.8, 0.2]} blinkSeed={6} />
      </svg>
    </Cam>
  );
};

// --------------------------------------------------------------- escena 6 ---
// ENDING: El Curioso sonrie y senala el boton Follow. Sin gatos.
const SceneFollow: React.FC = () => {
  const f = useCurrentFrame();
  const sc = SCENE('ending');
  const len = sc.end - sc.start;
  const spamAt = REL('ending', 0);
  const c1 = REL('ending', 1);
  const c2 = REL('ending', 2);
  const c3 = REL('ending', 3);
  const ctaAt = REL('ending', 4);
  const noSpam = spring({frame: f - s(spamAt), fps: FPS, config: {damping: 10}});
  const cta = spring({frame: f - s(ctaAt), fps: FPS, config: {damping: 9}});
  const beat = 1 + Math.sin(f / 6) * 0.02;
  return (
    <Cam len={len} kicks={[spamAt, c1, c2, c3, ctaAt]}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect width={1080} height={1920} fill="#dfe9f6" />
        <rect y={1420} width={1080} height={500} fill="#c3d3e6" />
        {/* no spam: pila de sobres tachada */}
        <g transform={'translate(252 580) scale(' + noSpam + ')'} opacity={Math.min(1, noSpam * 2)}>
          {Array.from({length: 5}).map((_, i) => (
            <g key={i} transform={'translate(' + ((i % 2) * 16 - 8) + ' ' + (-i * 34) + ') rotate(' + ((i - 2) * 5) + ')'}>
              <rect x={-120} y={-78} width={240} height={156} rx={9} fill="#fff" stroke={INK} strokeWidth={6} />
              <path d="M -120 -78 L 0 24 L 120 -78" fill="none" stroke={INK} strokeWidth={5} />
            </g>
          ))}
          <circle r={172} fill="none" stroke={RED} strokeWidth={26} />
          <path d="M -122 -122 L 122 122" stroke={RED} strokeWidth={26} strokeLinecap="round" />
          <g transform="translate(0 250)">
            <rect x={-206} y={-50} width={412} height={100} rx={50} fill="#fff" stroke={INK} strokeWidth={6} />
            <text x={0} y={15} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={38} fill={RED}>NO SPAM</text>
          </g>
        </g>
        {/* boton Follow */}
        <g transform={'translate(680 760) scale(' + beat + ')'}>
          <rect x={-260} y={-95} width={520} height={190} rx={95} fill={RED} stroke={INK} strokeWidth={SW} />
          <text x={0} y={34} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={104} fill="#fff">FOLLOW</text>
        </g>
        <g transform={'translate(680 940) scale(' + cta + ')'} opacity={Math.min(1, cta * 2)}>
          <rect x={-230} y={-56} width={460} height={112} rx={56} fill="#fff" stroke={INK} strokeWidth={8} />
          <text x={0} y={20} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={62} fill={BLUE}>DREXLO</text>
        </g>
        {/* oferta relevante en 3 checks */}
        <Pop at={c1} damping={11}>{(p) => <CheckChip x={610} y={1120} p={p} label="RIGHT BUSINESSES" />}</Pop>
        <Pop at={c2} damping={11}>{(p) => <CheckChip x={610} y={1248} p={p} label="REAL PROBLEMS" />}</Pop>
        <Pop at={c3} damping={11}>{(p) => <CheckChip x={610} y={1376} p={p} label="RELEVANT OFFER" />}</Pop>
        {/* el boton late cuando llega el llamado a la accion */}
        {cta > 0.05 && (
          <g transform="translate(680 760) scale(1.06)" opacity={Math.min(1, cta) * (0.5 + 0.5 * Math.abs(Math.sin(f / 8)))}>
            <rect x={-285} y={-122} width={570} height={244} rx={122} fill="none" stroke={YELLOW} strokeWidth={16} />
          </g>
        )}
        <Character x={200} y={1330} s={0.92} {...CURIOSO} mouth="grin" brow={0.6} armR={148} armL={14} look={[0.8, -0.5]} blinkSeed={7} />
      </svg>
    </Cam>
  );
};

// ------------------------------------------------------------- subtitulos ---
type Chunk = {words: typeof CIA_WORDS; start: number};
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: typeof CIA_WORDS = [];
  for (const w of CIA_WORDS) {
    if (cur.length && (cur[0].scene !== w.scene || cur.length === 3)) {
      out.push({words: cur, start: cur[0].start});
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push({words: cur, start: cur[0].start});
  return out;
})();

// Palabra por palabra en Luckiest Guy, la activa resaltada en amarillo.
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const ch = [...CHUNKS].reverse().find((c) => c.start <= t + 0.02);
  if (!ch) return null;
  const last = ch.words[ch.words.length - 1];
  if (t > last.end + 0.7) return null;
  const p = spring({frame: f - s(ch.start), fps: FPS, config: {damping: 12, stiffness: 200}});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 96}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 26, rowGap: 2, maxWidth: 1010,
        transform: 'scale(' + (0.82 + 0.18 * p) + ')'}}>
        {ch.words.map((w, i) => {
          const active = t >= w.start - 0.06 && t <= w.end + 0.06;
          return (
            <span key={i} style={{fontFamily: '"Luckiest Guy"', fontSize: 90, lineHeight: 1.02, letterSpacing: 1,
              color: active ? YELLOW : '#ffffff', WebkitTextStroke: '12px ' + INK, paintOrder: 'stroke fill',
              textShadow: '0 8px 0 rgba(0,0,0,0.28)', textTransform: 'uppercase'}}>{w.w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------- titulo en caja blanca ---
const Header: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const idx = CIA_SCENES.findIndex((sc, i) => t >= sc.start - 0.01 && (i === CIA_SCENES.length - 1 || t < CIA_SCENES[i + 1].start));
  if (idx < 0) return null;
  const sc = CIA_SCENES[idx];
  const isHook = sc.id === 'hook';
  const revealAt = isHook ? sc.phrases[1].start : sc.start;
  const p = spring({frame: f - s(revealAt), fps: FPS, config: {damping: 13, stiffness: 110}});
  if (p <= 0.001) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 66}}>
      <div style={{
        opacity: Math.min(1, p * 1.6),
        transform: 'translateY(' + ((1 - p) * -60) + 'px) scale(' + (0.88 + 0.12 * p) + ')',
        background: '#fff', border: '6px solid ' + INK, borderRadius: 18,
        padding: isHook ? '22px 32px' : '14px 38px',
        boxShadow: '0 10px 0 rgba(0,0,0,0.22)', maxWidth: 920, textAlign: 'center'}}>
        {isHook ? (
          <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 56, lineHeight: 1.08, color: INK, textTransform: 'uppercase', letterSpacing: -0.5}}>
            {'AI Can Find Clients '}
            <span style={{color: BLUE}}>{'Your Competitors Ignore'}</span>
          </div>
        ) : (
          <div style={{fontFamily: 'Poppins', fontWeight: 800, fontSize: 42, letterSpacing: 2, color: INK}}>{CHIP[sc.id] ?? ''}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ composicion ---
export const ClientesIA: React.FC = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load('92px "Luckiest Guy"'), document.fonts.load('800 56px Poppins')])
      .then(() => continueRender(h))
      .catch(() => continueRender(h));
  }, [h]);

  const scenes: Record<string, React.ReactNode> = {
    hook: <SceneHook />,
    step1: <SceneNiche />,
    step2: <SceneScreen />,
    step3: <SceneIdea />,
    step4: <SceneMessage />,
    ending: <SceneFollow />,
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#dbe7f5'}}>
      {CIA_SCENES.map((sc, i) => {
        const next = CIA_SCENES[i + 1];
        const dur = next ? next.start - sc.start : CIA_TOTAL_SECONDS - sc.start;
        return (
          <Sequence key={sc.id} from={s(sc.start)} durationInFrames={Math.max(1, s(dur))}>
            {scenes[sc.id]}
          </Sequence>
        );
      })}
      <Audio src={staticFile('audio/' + CIA_AUDIO)} />
      <Captions />
      <Header />
    </AbsoluteFill>
  );
};

export const CLIENTES_IA_ID = 'ClientesIA';
