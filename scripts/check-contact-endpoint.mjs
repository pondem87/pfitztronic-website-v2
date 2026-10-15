import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// OPTIONS only: never send a test enquiry or invoke the handler with POST in CI.
for (const country of ['bw', 'zw']) {
  const config = parseEnv(readFileSync(`.env.${country}`, 'utf8'));
  const response = await fetch(config.CONTACT_FORM_ENDPOINT, {
    method: 'OPTIONS',
    headers: { Origin: config.SITE_ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    signal: AbortSignal.timeout(20000),
  });
  const allowedOrigin = response.headers.get('access-control-allow-origin');
  const allows = (header, expected) => (response.headers.get(header) || '').toLowerCase().split(',').map(v => v.trim()).some(v => v === '*' || v === expected);
  if (!response.ok || !['*', config.SITE_ORIGIN].includes(allowedOrigin) || !allows('access-control-allow-methods', 'post') || !allows('access-control-allow-headers', 'content-type')) {
    throw new Error(`${country}: contact endpoint preflight failed (${response.status}). Check DigitalOcean CORS settings.`);
  }
  console.log(`${country}: contact endpoint permits JSON POST preflight. Server origin allowlist and mail delivery still depend on backend configuration.`);
}
