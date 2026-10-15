import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const country = process.argv[2];
const command = process.argv[3] ?? 'build';

if (country !== 'bw' && country !== 'zw') {
  throw new Error('Country must be "bw" or "zw".');
}
if (!['build', 'dev', 'preview', 'check', 'verify'].includes(command)) {
  throw new Error('Command must be build, dev, preview, check, or verify.');
}

const root = new URL('../', import.meta.url);
const envFile = new URL(`.env.${country}`, root);
const fileEnv = parseEnv(await readFile(envFile, 'utf8'));
if (fileEnv.SITE_COUNTRY !== country) {
  throw new Error(`${envFile.pathname} must set SITE_COUNTRY=${country}.`);
}
if (fileEnv.SITE_OUTPUT_DIR !== `dist/${country}`) {
  throw new Error(`${envFile.pathname} must set SITE_OUTPUT_DIR=dist/${country}.`);
}

// Country files are authoritative: a parent shell cannot mix country settings
// or redirect one country's build over the other country's output.
const env = { ...process.env, ...fileEnv };
const cli = new URL(command === 'verify'
  ? 'scripts/verify-build.mjs'
  : 'node_modules/astro/bin/astro.mjs', root);
const args = command === 'verify' ? [] : [command];
const child = spawn(process.execPath, [fileURLToPath(cli), ...args, ...process.argv.slice(4)], {
  cwd: fileURLToPath(root), env, stdio: 'inherit',
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
