import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'out', 'stills_clientes');
fs.mkdirSync(outDir, {recursive: true});

const SHOTS = [
  ['s1_hook', 128],
  ['s2_niche', 333],
  ['s3_screen', 594],
  ['s4_idea', 815],
  ['s5_message', 1053],
  ['s6_follow', 1341],
];

const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts')});
const composition = await selectComposition({serveUrl, id: 'ClientesIA', inputProps: {}});
console.log('composition:', composition.id, composition.width + 'x' + composition.height,
  composition.durationInFrames + ' frames @' + composition.fps + 'fps',
  (composition.durationInFrames / composition.fps).toFixed(2) + 's');

for (const [name, frame] of SHOTS) {
  const out = path.join(outDir, name + '.png');
  await renderStill({composition, serveUrl, output: out, frame, scale: 0.5, inputProps: {}});
  console.log('still', name, 'frame', frame, '->', out);
}
