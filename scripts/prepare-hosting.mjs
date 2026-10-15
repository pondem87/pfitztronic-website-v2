import { prepareHosting } from './lib/hosting.mjs';
for (const country of ['bw', 'zw']) {
  const manifest = prepareHosting(`dist/${country}`, country, process.env.GITHUB_SHA || 'local');
  console.log(`Prepared ${country}: ${manifest.routes.length} routes and ${manifest.aliases.length} compatibility URLs.`);
}
