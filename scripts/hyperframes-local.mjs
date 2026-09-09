#!/usr/bin/env node
// Use this project's optional Python tools without changing the global Python.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const bin = join(root, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin');
const python = join(bin, process.platform === 'win32' ? 'python.exe' : 'python');
const env = { ...process.env };
if (existsSync(python)) {
  env.HYPERFRAMES_PYTHON = python;
  env.PATH = `${bin}${process.platform === 'win32' ? ';' : ':'}${env.PATH || ''}`;
}
const result = spawnSync(process.execPath,
  [join(root, 'node_modules/hyperframes/dist/cli.js'), ...process.argv.slice(2)],
  { env, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
