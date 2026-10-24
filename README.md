# Drexlo Short — Could an AI Influencer Sell Your Product?

Vertical 9:16 explainer short (1080×1920, 30 fps) built with Remotion and rendered
in the cloud with [coldframe](https://github.com/Razee4315/coldframe).

## What it is

A 49-second editorial-style short about AI influencers in marketing. It covers the
opportunity, one documented example, the product-video workflow, concept testing,
the limitation (attention ≠ sales) and a transparency takeaway.

All visuals are code-generated with React/CSS — no stock footage, no image APIs, no
photorealistic humans, no external AI video services.

## Requirements

- Node.js 18+
- [GitHub CLI](https://cli.github.com) (`gh`), signed in
- Python 3.10+ (only to regenerate the narration)
- `ffmpeg` / `ffprobe` on `PATH` (only to regenerate the narration)

## Install

```bash
npm install
```

## Regenerate the narration

The narration is generated with `edge-tts` (free, no API key). The stock release
returns HTTP 403 because of the `Sec-MS-GEC` token change, so this project uses the
fix from PR #492 via a local install inside the workspace:

```bash
pip install --target .pylibs --no-deps \
  "git+https://github.com/rany2/edge-tts.git@refs/pull/492/head"

PYTHONPATH=.pylibs python scripts/make_narration.py
PYTHONPATH=.pylibs python scripts/build_audio_timeline.py
```

`build_audio_timeline.py` concatenates the per-scene MP3s into
`audio/drexlo_narration.mp3` and writes `audio/timeline.json` with the real scene
boundaries. Copy those numbers into `src/timeline.ts` so the visuals stay in sync
with the voice.

## Preview locally

```bash
npm run studio
```

## Render in the cloud (coldframe)

```bash
npx github:Razee4315/coldframe setup --public
npx github:Razee4315/coldframe render DrexloAIInfluencer
```

The MP4 lands in `out/cloud/`. `out/` and `*.mp4` are gitignored, so renders are
never pushed to the public repo.

## Composition

| | |
|---|---|
| ID | `DrexloAIInfluencer` |
| Size | 1080 × 1920 |
| FPS | 30 |
| Duration | 1471 frames (49.008 s) |

## Project layout

```
src/
  index.ts                 entry point (registerRoot)
  Root.tsx                 composition registration
  constants.ts             palette, fps, duration
  timeline.ts              real narration scene boundaries
  DrexloAIInfluencer.tsx   scene assembly, captions, audio
  Scenes.tsx               the seven scenes
  Visuals.tsx              reusable character, product, background, text
scripts/
  make_narration.py        per-scene TTS
  build_audio_timeline.py  concat + real timings
```

## Notes on accuracy

No follower counts, engagement rates, cost savings or sales figures are invented.
The only named example is the one documented in the sources. See `sources.md`.
