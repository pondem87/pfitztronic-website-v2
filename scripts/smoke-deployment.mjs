import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { targets } from './lib/hosting.mjs';

const country = process.argv[2];
if (!targets[country]) throw new Error('Expected bw or zw');
const manifest = JSON.parse(readFileSync(`dist/${country}/.hosting/manifest.json`, 'utf8'));
async function get(path) {
  const response = await fetch(new URL(path, manifest.origin), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response;
}
assert.deepEqual(await (await get('/release.json')).json(), { country, revision: manifest.revision });
for (const { path } of manifest.routes) {
  const response = await get(path);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  const html = await response.text();
  assert.ok(html.includes(`rel="canonical" href="${manifest.origin}${path}"`), `${path}: incorrect page`);
  assert.ok(html.includes(`data-site-country="${country}"`), `${path}: incorrect country`);
}
for (const { path, destination } of manifest.aliases) {
  assert.ok((await (await get(path)).text()).includes(`rel="canonical" href="${manifest.origin}${destination}"`), `${path}: missing compatibility redirect`);
}
const notFound = await fetch(`${manifest.origin}/__deployment_missing_page__`, { signal: AbortSignal.timeout(20000) });
assert.equal(notFound.status, 404, 'Missing pages must return HTTP 404');
console.log(`Live ${country} release ${manifest.revision}: pages, compatibility URLs and 404 verified.`);
