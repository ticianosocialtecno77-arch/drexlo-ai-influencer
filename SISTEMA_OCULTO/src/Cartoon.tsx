import React from 'react';
import {useCurrentFrame} from 'remotion';

export const INK = '#1d1b22';
export const SW = 8; // grosor de contorno

export type CharProps = {
  x: number; y: number; s?: number;
  suit: string; tie?: string; hair: string;
  hairStyle?: 'flat' | 'curly' | 'bald' | 'side' | 'bun' | 'messy';
  skin?: string;
  look?: [number, number];
  mouth?: 'smile' | 'o' | 'flat' | 'grin' | 'worried';
  brow?: number;          // + sube cejas (sorpresa), - las frunce
  armL?: number; armR?: number; // grados: 0 = colgando, 90 = horizontal, 160 = arriba
  lean?: number;          // grados de inclinación del cuerpo
  blinkSeed?: number;
  sweat?: boolean; glasses?: boolean; mustache?: boolean; blindfold?: boolean;
  flip?: boolean;
  outfit?: 'suit' | 'hoodie' | 'vest' | 'blazer';
  headphones?: boolean; pen?: boolean; bowtie?: string; chest?: string;
};

const Arm: React.FC<{side: -1 | 1; angle: number; suit: string; skin: string}> = ({side, angle, suit, skin}) => {
  const sx = side * 78, sy = 20;
  const a = (angle * Math.PI) / 180;
  const L = 135;
  const hx = sx + side * Math.sin(a) * L;
  const hy = sy + Math.cos(a) * L;
  // codo: punto medio desplazado para efecto "manguera"
  const mx = (sx + hx) / 2 + side * 18 * Math.cos(a);
  const my = (sy + hy) / 2 - 10 * Math.sin(a);
  return (
    <g>
      <path d={`M ${sx} ${sy} Q ${mx} ${my} ${hx} ${hy}`} stroke={INK} strokeWidth={46} fill="none" strokeLinecap="round" />
      <path d={`M ${sx} ${sy} Q ${mx} ${my} ${hx} ${hy}`} stroke={suit} strokeWidth={46 - SW * 2} fill="none" strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={22} fill={skin} stroke={INK} strokeWidth={SW} />
    </g>
  );
};

export const Character: React.FC<CharProps> = (p) => {
  const f = useCurrentFrame();
  const s = p.s ?? 1;
  const skin = p.skin ?? '#f5d2a8';
  const breathe = Math.sin((f + (p.blinkSeed ?? 0) * 7) / 11) * 3;
  const cycle = (f + (p.blinkSeed ?? 0) * 23) % 95;
  const blink = cycle < 4 ? 0.12 : 1;
  const [lx, ly] = p.look ?? [0, 0];
  const brow = p.brow ?? 0;
  const mouths: Record<string, string> = {
    smile: 'M -34 48 Q 0 78 34 48',
    grin: 'M -42 40 Q 0 95 42 40 Z',
    o: 'M -14 52 a 14 18 0 1 0 28 0 a 14 18 0 1 0 -28 0',
    flat: 'M -28 58 L 28 58',
    worried: 'M -30 64 Q 0 44 30 64',
  };
  const m = p.mouth ?? 'smile';
  return (
    <g transform={`translate(${p.x} ${p.y + breathe}) scale(${p.flip ? -s : s} ${s}) rotate(${p.lean ?? 0})`}>
      {/* cuerpo */}
      {p.outfit === 'hoodie' && <ellipse cx={0} cy={-6} rx={120} ry={46} fill={p.suit} stroke={INK} strokeWidth={SW} />}
      <path d="M -82 0 Q -100 120 -104 260 L 104 260 Q 100 120 82 0 Q 0 -22 -82 0 Z" fill={p.outfit === 'vest' ? '#ffffff' : p.suit} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {(p.outfit === undefined || p.outfit === 'suit' || p.outfit === 'blazer') && (
        <path d="M -30 -6 L 0 70 L 30 -6 Z" fill={p.outfit === 'blazer' ? '#f7e3a1' : '#ffffff'} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      )}
      {p.outfit === 'vest' && (
        <path d="M -92 60 L -40 -4 L 0 110 L 40 -4 L 92 60 L 104 260 L -104 260 Z" fill={p.suit} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )}
      {p.outfit === 'hoodie' && (
        <g>
          <path d="M -26 -4 L -30 70 M 26 -4 L 30 70" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <circle cx={-30} cy={74} r={7} fill="#fff" stroke={INK} strokeWidth={4} /><circle cx={30} cy={74} r={7} fill="#fff" stroke={INK} strokeWidth={4} />
          <path d="M -60 170 L 60 170 L 70 250 L -70 250 Z" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
      {p.chest && <text x={0} y={150} textAnchor="middle" fontFamily="Luckiest Guy" fontSize={70} fill="#fff" stroke={INK} strokeWidth={5} paintOrder="stroke">{p.chest}</text>}
      {p.tie && <path d="M -10 4 L 10 4 L 16 92 L 0 112 L -16 92 Z" fill={p.tie} stroke={INK} strokeWidth={6} strokeLinejoin="round" />}
      {p.bowtie && <path d="M 0 8 L -34 -10 L -34 26 Z M 0 8 L 34 -10 L 34 26 Z" fill={p.bowtie} stroke={INK} strokeWidth={6} strokeLinejoin="round" />}
      <Arm side={-1} angle={p.armL ?? 8} suit={p.suit} skin={skin} />
      <Arm side={1} angle={p.armR ?? 8} suit={p.suit} skin={skin} />
      {/* cabeza */}
      <g transform="translate(0 -120)">
        <ellipse cx={0} cy={0} rx={112} ry={118} fill={skin} stroke={INK} strokeWidth={SW} />
        {(p.hairStyle === undefined || p.hairStyle === 'flat' || p.hairStyle === 'bun') && (
          <path d="M -110 -20 Q -112 -120 0 -122 Q 112 -120 110 -20 Q 70 -70 0 -66 Q -70 -70 -110 -20 Z" fill={p.hair} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        )}
        {p.hairStyle === 'side' && (
          <path d="M -112 -10 Q -116 -118 10 -122 Q 112 -116 112 -30 Q 60 -96 -40 -60 Q -80 -50 -112 -10 Z" fill={p.hair} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        )}
        {p.hairStyle === 'bun' && <circle cx={0} cy={-140} r={42} fill={p.hair} stroke={INK} strokeWidth={SW} />}
        {p.hairStyle === 'messy' && (
          <path d="M -112 -14 L -120 -70 L -90 -60 L -96 -112 L -56 -92 L -40 -136 L -8 -104 L 18 -140 L 40 -102 L 76 -126 L 78 -86 L 116 -92 L 104 -50 L 122 -24 Q 70 -70 0 -64 Q -70 -70 -112 -14 Z" fill={p.hair} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        )}
        {p.hairStyle === 'curly' && (
          <g fill={p.hair} stroke={INK} strokeWidth={SW}>
            {[-95, -60, -20, 20, 60, 95].map((cx, i) => (
              <circle key={i} cx={cx} cy={-88 + Math.abs(cx) * 0.35} r={38} />
            ))}
            <path d="M -125 -40 Q -150 60 -110 130 L -96 40 Z" />
            <path d="M 125 -40 Q 150 60 110 130 L 96 40 Z" />
          </g>
        )}
        {p.hairStyle === 'bald' && (
          <g fill={p.hair} stroke={INK} strokeWidth={6}>
            <path d="M -112 -10 Q -122 -40 -96 -56 Q -86 -20 -104 10 Z" />
            <path d="M 112 -10 Q 122 -40 96 -56 Q 86 -20 104 10 Z" />
          </g>
        )}
        {/* ojos */}
        {p.blindfold ? (
          <rect x={-118} y={-38} width={236} height={48} rx={10} fill="#3c3a4a" stroke={INK} strokeWidth={6} />
        ) : (
          <g>
            {[-40, 40].map((ex) => (
              <g key={ex} transform={`translate(${ex} -8) scale(1 ${blink})`}>
                <ellipse cx={0} cy={0} rx={28} ry={32} fill="#fff" stroke={INK} strokeWidth={6} />
                <circle cx={lx * 10} cy={ly * 10} r={11} fill={INK} />
                <circle cx={lx * 10 + 4} cy={ly * 10 - 4} r={3.5} fill="#fff" />
              </g>
            ))}
            {[-40, 40].map((ex) => {
              const y0 = -52 - brow * 10; const t = brow < 0 ? -brow * 12 : 0;
              const outer = ex < 0 ? ex - 24 : ex + 24; const inner = ex < 0 ? ex + 24 : ex - 24;
              return <path key={'b' + ex} d={`M ${outer} ${y0} L ${inner} ${y0 + t}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />;
            })}
            {p.glasses && (
              <g fill="none" stroke={INK} strokeWidth={6}>
                <circle cx={-40} cy={-8} r={38} /><circle cx={40} cy={-8} r={38} /><path d="M -2 -10 L 2 -10" />
              </g>
            )}
          </g>
        )}
        {/* nariz y boca */}
        <path d="M -4 14 Q 12 26 -2 34" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        {p.mustache && <path d="M -44 44 Q -20 30 0 42 Q 20 30 44 44 Q 20 54 0 48 Q -20 54 -44 44 Z" fill={p.hair} stroke={INK} strokeWidth={5} />}
        <path d={mouths[m]} stroke={INK} strokeWidth={7} fill={m === 'grin' || m === 'o' ? '#7a2b2b' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
        {p.headphones && (
          <g>
            <path d="M -118 0 Q -126 -150 0 -150 Q 126 -150 118 0" stroke={INK} strokeWidth={26} fill="none" strokeLinecap="round" />
            <path d="M -118 0 Q -126 -150 0 -150 Q 126 -150 118 0" stroke="#3b3b4f" strokeWidth={12} fill="none" strokeLinecap="round" />
            <rect x={-142} y={-30} width={44} height={70} rx={18} fill="#e85d5d" stroke={INK} strokeWidth={SW} />
            <rect x={98} y={-30} width={44} height={70} rx={18} fill="#e85d5d" stroke={INK} strokeWidth={SW} />
          </g>
        )}
        {p.pen && <g transform="translate(108 -40) rotate(-35)"><rect x={-8} y={-60} width={16} height={90} rx={4} fill="#f2b134" stroke={INK} strokeWidth={5} /><path d="M -8 30 L 0 46 L 8 30 Z" fill={INK} /></g>}
        {p.sweat && <path d="M 100 -60 Q 118 -30 104 -18 Q 88 -30 100 -60 Z" fill="#8fd3ff" stroke={INK} strokeWidth={5} />}
      </g>
    </g>
  );
};

// Botella de contorno genérica, sin marca
export const Bottle: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const R: [number, number][] = [[16, -300], [17, -250], [32, -200], [44, -140], [34, -92], [46, -34], [42, 0]];
  const pts = [...R.map(([a, b]) => `${a},${b}`), ...[...R].reverse().map(([a, b]) => `${-a},${b}`)].join(' ');
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <clipPath id="bclip"><polygon points={pts} /></clipPath>
      <polygon points={pts} fill="#cfe7e4" />
      <rect x={-60} y={-205} width={120} height={210} fill="#4a2414" clipPath="url(#bclip)" />
      <polygon points={pts} fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M -22 -180 Q -30 -120 -20 -40" stroke="#fff" strokeOpacity={0.7} strokeWidth={8} fill="none" strokeLinecap="round" />
      <rect x={-19} y={-318} width={38} height={22} rx={5} fill="#c9a94b" stroke={INK} strokeWidth={6} />
    </g>
  );
};

export const Glass: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -38 -110 L 38 -110 L 30 0 L -30 0 Z" fill="#e8f4f3" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -34.5 -80 L 34.5 -80 L 30 0 L -30 0 Z" fill="#b8763f" />
    <path d="M -38 -110 L 38 -110 L 30 0 L -30 0 Z" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -22 -96 L -18 -14" stroke="#fff" strokeOpacity={0.7} strokeWidth={5} strokeLinecap="round" />
  </g>
);

export const Can: React.FC<{x: number; y: number; color: string; s?: number; rot?: number}> = ({x, y, color, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-48} y={-170} width={96} height={170} rx={14} fill={color} stroke={INK} strokeWidth={SW} />
    <ellipse cx={0} cy={-170} rx={44} ry={10} fill="#d9dde2" stroke={INK} strokeWidth={6} />
    <rect x={-30} y={-150} width={14} height={130} rx={7} fill="#fff" opacity={0.35} />
  </g>
);

export const Check: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={70} fill="#3fbf6a" stroke={INK} strokeWidth={SW} />
    <path d="M -34 2 L -8 28 L 38 -26" stroke="#fff" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

// Protagonista fijo de Vinc: "El Curioso" (elegido 2026-10-24)
export const CURIOSO = {suit: '#3d6fb0', outfit: 'hoodie' as const, chest: 'V', hair: '#2b2118', hairStyle: 'messy' as const, headphones: true, skin: '#e8b98d'};
