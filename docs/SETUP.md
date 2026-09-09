# Setup and troubleshooting

## Prepared local workspace

Installed and verified on Apple Silicon on September 8, 2026. Open this repository
folder in Codex for its 14 editing skills. Use the following from the repo root:

```sh
npm run studio                         # open the demo Studio on port 3082
npm run new-video -- lesson-one         # create a private editing project
npm run hf -- preview video-projects/lesson-one
npm run transcribe:local -- video-projects/lesson-one/assets/raw.mp4
npm run hf -- tts "Your narration here" --output video-projects/lesson-one/assets/narration.wav
```

`npm run hf -- ...` automatically uses the project's `.venv` for optional Python
tools. From a video project directory, activate the environment with
`source ../../.venv/bin/activate`, then use `npx hyperframes` normally.
Render a reviewed project from its directory:

```sh
npx hyperframes lint
npx hyperframes render --quality draft --output renders/draft-01.mp4
```

Local transcription uses whisper.cpp with the downloaded `small.en` English model.
It writes a new `raw.transcript.json` containing the word timings and the full
ffprobe source duration, ready for the kit's cutting tools. Existing output files
are refused. A last-word overrun of at most 0.25 seconds is bounded to the actual
recording duration and recorded in `timing_adjustments`; larger timing errors are
rejected. Review recognized words and timing against speech before applying cuts.
For other languages, use the native HyperFrames transcription command with an
appropriate multilingual model and normalize its output before cutting.

Kokoro voice generation is installed with its model and voices and has produced
a test WAV. NumPy, SoundFile, Transformers, and PyTorch are installed in `.venv`;
MusicGen weights are not downloaded and music generation has not been tested.
Paid providers remain unconfigured; local editing, transcription, and narration
do not require an API key. Recreate the Python environment with:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-local.txt
```

Verification: 11 tests pass; media cuts preserve A/V duration alignment; the demo
renders to eight seconds of 1920x1080 H.264 at 30fps. Local transcription recognizes
the 20-word synthetic speech fixture and its normalized output passes silence-cut
planning. Demo evidence is saved in `video-projects/demo/VERIFY.md`.

The lockfile includes patched Hono 4.13.7 and Sharp 0.35.4. npm still reports the
unpatched `adm-zip` symlink-extraction advisory GHSA-vwc7-r8mq-g2x9 (also attributed
to its HyperFrames parent). Avoid extracting untrusted ZIP archives through the
kit. HyperFrames stays at the kit's tested 0.7.109 pin; doctor may advertise a newer
release. Updating it is a separate compatibility check.

## General installation

Start with [tools, accounts, and API keys](TOOLS-AND-API-KEYS.md) for Nate's
ElevenLabs and Kie.ai choices, Whisper alternatives, and optional services.

Use Node 22+ (required by the pinned HyperFrames CLI), FFmpeg with ffprobe, and
Chrome/Chromium. Run `npm ci` in the repository root before any project commands.
`npm run setup` checks tool availability; `npx hyperframes doctor` diagnoses the
renderer. If Chromium is unavailable, follow `npx hyperframes browser --help`.
Windows users should reopen their terminal after installing FFmpeg to refresh PATH.

The repository pins HyperFrames 0.7.109 and GSAP 3.14.2. Keep package-lock.json
with package.json. Upgrade deliberately, then repeat the render checks.

`npm run new-video -- lesson-one` copies the synthetic starter and local GSAP into
a new self-contained folder. Existing project names are refused so nothing is
overwritten. Replace the starter with your recording and planned compositions.
The left glass template needs your own `assets/source.mp4` with an audio stream.

Codex reads AGENTS.md and discovers `.agents/skills/`. Trust the project in Codex
if you want its project settings loaded. Restart if the skills do not appear.
Claude Code reads CLAUDE.md and `.claude/skills/`. Neither runtime needs a special
MCP server for local editing. The root `npm run check` validates the distribution;
it does not lint personal work under video-projects.

To update a skill, edit `.claude/skills/<name>/`, run `npm run sync:skills`, and
then `npm run check:skills`. No Windows symlink privileges are needed.

Scribe errors: a 401 generally means invalid authentication; a 403 can mean
missing speech_to_text access. Check the key's permissions without printing it.
No key is required for `npm test`, starter preview, or starter rendering.
For speech-free sources, supply a separate audio track before using the cutting
renderers: they expect one video stream and one audio stream.
