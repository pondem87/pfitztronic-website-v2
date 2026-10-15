import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { prepareHosting, deploymentCommands, legacyRoutes, targets, redirectHtml } from '../scripts/lib/hosting.mjs';

function fixture(country) {
  const root = mkdtempSync(join(tmpdir(), 'pfitz-hosting-'));
  const routes = new Set(['/', '/projects/home-automation/', ...Object.values(legacyRoutes)]);
  for (const route of routes) {
    const path = join(root, route, 'index.html');
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `<html data-site-country="${country}"><link rel="canonical" href="${targets[country].origin}${route}"></html>`);
  }
  return root;
}

for (const country of ['bw', 'zw']) test(`${country}: exact S3 keys serve directory routes and legacy URLs`, t => {
  const root = fixture(country);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const manifest = prepareHosting(root, country, 'a'.repeat(40));
  for (const { source, path } of manifest.routes.filter(route => route.path !== '/')) {
    const object = manifest.objects.find(item => item.key === path.slice(1));
    assert.equal(object.source, source);
    const slashless = manifest.objects.find(item => item.key === path.slice(1, -1));
    assert.ok(readFileSync(join(root, slashless.source), 'utf8').includes(`href="${targets[country].origin}${path}"`));
  }
  for (const [oldPath, destination] of Object.entries(legacyRoutes)) {
    assert.ok(readFileSync(join(root, oldPath), 'utf8').includes(`href="${targets[country].origin}${destination}"`));
  }
  const commands = deploymentCommands(root, country);
  assert.ok(commands[0].includes('public,max-age=31536000,immutable'));
  assert.ok(commands.every(args => !args.includes('--delete')), 'Retain prior assets so cached pages remain functional');
  assert.ok(commands[2].includes('.hosting/*'), 'Internal hosting files are not recursively uploaded');
  const objectUploads = commands.filter(args => args[0] === 's3api');
  assert.equal(objectUploads.length, manifest.objects.length);
  assert.ok(objectUploads.every(args => args.includes('text/html; charset=utf-8') && args.includes('no-cache')));
  assert.ok(commands.at(-1).includes(`${targets[country].origin.replace('https:', 's3:')}/release.json`));
  assert.throws(() => deploymentCommands(root, country === 'bw' ? 'zw' : 'bw'), /mismatch/);
  const rerun = prepareHosting(root, country, 'a'.repeat(40));
  assert.deepEqual(rerun, manifest, 'Preparation is idempotent');
});

test('incomplete builds and invalid revisions fail before producing a deployment', t => {
  const root = fixture('bw');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.throws(() => prepareHosting(root, 'zw'), /Wrong country/);
  assert.throws(() => prepareHosting(root, 'bw', 'branch-name'), /commit SHA/);
  rmSync(join(root, 'services'), { recursive: true });
  assert.throws(() => prepareHosting(root, 'bw'), /Missing legacy destination/);
  assert.throws(() => redirectHtml('//other.example/path', targets.bw.origin), /Unsafe/);
});
