import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const targets = {
  bw: { bucket: 'pfitztronic.co.bw', distribution: 'E2IHQHKBAWD0GN', origin: 'https://pfitztronic.co.bw' },
  zw: { bucket: 'pfitztronic.co.zw', distribution: 'E1NIKM2EN50E34', origin: 'https://pfitztronic.co.zw' },
};

// URLs published by the original repository, including renamed service routes.
export const legacyRoutes = {
  '/about.html': '/about/',
  '/service.html': '/services/',
  '/services.html': '/services/',
  '/projects.html': '/projects/',
  '/projects/iot-hub.html': '/projects/iot-hub/',
  '/blog.html': '/blog/',
  '/contact.html': '/contact/',
  '/privacy.html': '/privacy/',
  '/faqs.html': '/faqs/',
  '/services/business-architecture-design.html': '/services/business-architecture-blueprints/',
  '/services/capability-maturity-assessment.html': '/services/capability-maturity-and-change-management/',
  '/services/digital-transformation-readiness.html': '/services/enterprise-architecture-and-digitalisation/',
  '/services/enterprise-architecture.html': '/services/enterprise-architecture-and-digitalisation/',
  '/services/process-and-experience-design.html': '/services/business-process-and-customer-journey-design/',
  '/services/solution-delivery-and-support.html': '/services/website-and-application-development/',
  ...Object.fromEntries(['clinical-information-architecture', 'first-pdca-cycle', 'africa-fourth-industrial-revolution', 'healthcare-digital-transformation', 'right-level-of-formality']
    .map(slug => [`/blogs/${slug}.html`, `/blog/${slug}/`])),
};

export function filesUnder(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return [];
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? filesUnder(root, path) : [path];
  });
}

export function redirectHtml(path, origin) {
  if (!/^\/[a-z0-9/-]*$/.test(path) || path.startsWith('//')) throw new Error(`Unsafe redirect target: ${path}`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page moved | Pfitztronic</title><link rel="canonical" href="${origin}${path}"><meta http-equiv="refresh" content="0;url=${path}"><script>location.replace(${JSON.stringify(path)}+location.search+location.hash);</script></head><body><p>This page has moved. <a href="${path}">Continue to Pfitztronic</a>.</p></body></html>\n`;
}

export function prepareHosting(root, country, revision = 'local') {
  const target = targets[country];
  if (!target) throw new Error('Expected country bw or zw');
  if (revision !== 'local' && !/^[a-f0-9]{40}$/.test(revision)) throw new Error('Expected a full Git commit SHA');
  const files = filesUnder(root);
  const routes = files.filter(file => file === 'index.html' || file.endsWith('/index.html'))
    .map(file => ({ source: file, path: '/' + file.replace(/index\.html$/, '') }));
  if (!routes.some(route => route.path === '/contact/')) throw new Error('Build is incomplete');
  for (const route of routes) {
    const html = readFileSync(join(root, route.source), 'utf8');
    if (!html.includes(`data-site-country="${country}"`) || !html.includes(`rel="canonical" href="${target.origin}${route.path}"`)) {
      throw new Error(`Wrong country or canonical in ${route.source}`);
    }
  }
  const aliases = [];
  for (const [oldPath, newPath] of Object.entries(legacyRoutes)) {
    if (!routes.some(route => route.path === newPath)) throw new Error(`Missing legacy destination ${newPath}`);
    const source = oldPath.slice(1);
    mkdirSync(dirname(join(root, source)), { recursive: true });
    writeFileSync(join(root, source), redirectHtml(newPath, target.origin));
    aliases.push({ path: oldPath, destination: newPath });
  }
  const objects = [];
  // Private S3 REST origins do not resolve directory indexes. Publish the HTML
  // at the exact trailing-slash key as well as the normal Astro index.html key.
  for (const route of routes.filter(route => route.path !== '/')) {
    objects.push({ source: route.source, key: route.path.slice(1) });
    const source = `.hosting/redirects/${route.path.slice(1)}index.html`;
    mkdirSync(dirname(join(root, source)), { recursive: true });
    writeFileSync(join(root, source), redirectHtml(route.path, target.origin));
    objects.push({ source, key: route.path.slice(1, -1) });
    aliases.push({ path: route.path.slice(0, -1), destination: route.path });
  }
  const manifest = { country, revision, origin: target.origin, routes, aliases, objects };
  mkdirSync(join(root, '.hosting'), { recursive: true });
  writeFileSync(join(root, '.hosting/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(join(root, 'release.json'), JSON.stringify({ country, revision }) + '\n');
  return manifest;
}

export function deploymentCommands(root, country, region = 'af-south-1') {
  const target = targets[country];
  if (!target) throw new Error('Expected country bw or zw');
  const manifest = JSON.parse(readFileSync(join(root, '.hosting/manifest.json'), 'utf8'));
  if (manifest.country !== country || manifest.origin !== target.origin) throw new Error('Deployment country mismatch');
  for (const object of manifest.objects) {
    if (!/^[a-z0-9/-]+$/.test(object.key) || object.key.startsWith('/') || !/^(?:\.hosting\/redirects\/)?[a-z0-9/-]+index\.html$/.test(object.source) || !existsSync(join(root, object.source))) {
      throw new Error('Invalid hosting object');
    }
  }
  const bucket = `s3://${target.bucket}/`;
  return [
    ['s3', 'sync', `${root}/_astro/`, `${bucket}_astro/`, '--cache-control', 'public,max-age=31536000,immutable', '--region', region],
    ['s3', 'sync', `${root}/`, bucket, '--exclude', '*.html', '--exclude', '_astro/*', '--exclude', '.hosting/*', '--exclude', 'release.json', '--cache-control', 'public,max-age=3600', '--region', region],
    ['s3', 'cp', `${root}/`, bucket, '--recursive', '--exclude', '*', '--include', '*.html', '--exclude', '.hosting/*', '--content-type', 'text/html; charset=utf-8', '--cache-control', 'no-cache', '--region', region],
    ...manifest.objects.map(({ source, key }) => ['s3api', 'put-object', '--bucket', target.bucket, '--key', key, '--body', join(root, source), '--content-type', 'text/html; charset=utf-8', '--cache-control', 'no-cache', '--region', region]),
    ['s3', 'cp', join(root, 'release.json'), `${bucket}release.json`, '--content-type', 'application/json', '--cache-control', 'no-store', '--region', region],
  ];
}
