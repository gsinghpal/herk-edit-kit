#!/usr/bin/env node
// Local Whisper transcription normalized for the kit's cutting tools.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join, parse } from 'node:path';
import { tmpdir } from 'node:os';

const [input, output, ...extra] = process.argv.slice(2);
if (!input || extra.length) {
  console.error('Usage: npm run transcribe:local -- recording.mp4 [output.json]');
  process.exit(1);
}
const source = resolve(input);
const { dir, name } = parse(source);
const destination = output ? resolve(output) : join(dir, `${name}.transcript.json`);
if (!existsSync(source) || existsSync(destination)) {
  console.error('Source must exist and output must be a new filename.');
  process.exit(1);
}
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || result.stderr || result.stdout || `${command} failed`);
  }
  return result.stdout;
}
let temporary;
try {
  const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', source]).trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid media duration.');
  temporary = mkdtempSync(join(tmpdir(), 'hyperframes-transcribe-'));
  const cli = resolve(import.meta.dirname, '../node_modules/hyperframes/dist/cli.js');
  run(process.execPath, [cli, 'transcribe', source, '--engine', 'whisper',
    '--model', 'small.en', '--language', 'en', '--dir', temporary, '--json']);
  const words = JSON.parse(readFileSync(join(temporary, 'transcript.json'), 'utf8'));
  if (!Array.isArray(words) || !words.length) throw new Error('No speech recognized.');
  let previous = 0;
  const timingAdjustments = [];
  for (const word of words) {
    if (typeof word.text !== 'string' || !word.text.trim() ||
        !Number.isFinite(word.start) || !Number.isFinite(word.end) ||
        word.start < previous || word.end < word.start || word.start >= duration ||
        word.end > duration + 0.25) {
      throw new Error('Invalid word timing; review the source before cutting.');
    }
    // Whisper can place the last word slightly beyond the real recording.
    // Bound only this small overrun, retaining the original value for review.
    if (word.end > duration) {
      timingAdjustments.push({ text: word.text, original_end: word.end, end: duration });
      word.end = duration;
    }
    previous = word.end;
  }
  writeFileSync(destination, JSON.stringify({
    text: words.map(word => word.text).join(' '),
    audio_duration_secs: duration,
    words,
    ...(timingAdjustments.length ? { timing_adjustments: timingAdjustments } : {}),
  }, null, 2) + '\n', { flag: 'wx' });
  console.log(`Saved ${words.length} words to ${destination}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
