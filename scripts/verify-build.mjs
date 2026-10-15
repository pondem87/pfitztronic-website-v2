import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const country = process.env.SITE_COUNTRY;
assert.ok(['bw', 'zw'].includes(country), 'Run npm run verify:bw or npm run verify:zw.');
const output = resolve(`dist/${country}`);
const origin = process.env.SITE_ORIGIN;
const decodeHtml = (value) => value.replace(/&amp;/g, '&');
const pages = ['index.html', 'about/index.html', 'services/index.html', 'blog/index.html', 'projects/index.html', 'projects/iot-hub/index.html', 'projects/home-automation/index.html',
  'features/index.html', 'team/index.html', 'testimonials/index.html', 'contact/index.html', 'privacy/index.html', 'faqs/index.html', '404.html'];
const blogIds = readdirSync('src/content/blogs', { recursive: true })
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace(/\.md$/, ''));
pages.push(...blogIds.map((id) => `blog/${id}/index.html`));
const serviceIds = readdirSync('src/content/services', { recursive: true })
  .filter((file) => file.endsWith('.md'))
  .sort((a, b) => {
    const order = (file) => Number(readFileSync(join('src/content/services', file), 'utf8').match(/^order: (\d+)$/m)?.[1]);
    return order(a) - order(b) || a.localeCompare(b);
  })
  .map((file) => file.replace(/\.md$/, ''));
pages.push(...serviceIds.map((id) => `services/${id}/index.html`));

for (const page of pages) {
  const file = join(output, page);
  assert.ok(existsSync(file), `Missing generated page: ${page}. Run npm run build first.`);
  const html = readFileSync(file, 'utf8');
  assert.equal((html.match(/<nav\b[^>]*class="[^"]*\bnavbar\b/g) ?? []).length, 1, `${page}: duplicate main navigation`);
  assert.equal((html.match(/<main\b/g) ?? []).length, 1, `${page}: missing main landmark`);
  assert.ok(html.includes(`lang="${process.env.SITE_LOCALE}"`), `${page}: wrong locale`);
  assert.ok(html.includes(`data-site-country="${country}"`), `${page}: wrong country`);
  const pathname = '/' + page.replace(/index\.html$/, '');
  assert.ok(html.includes(`rel="canonical" href="${origin}${pathname}"`), `${page}: wrong canonical`);
  for (const [locale, base] of [
    [process.env.SITE_LOCALE, origin],
    [process.env.SITE_ALTERNATE_LOCALE, process.env.SITE_ALTERNATE_ORIGIN],
    ['x-default', process.env.SITE_DEFAULT_ORIGIN],
  ]) {
    assert.ok(html.includes(`hreflang="${locale}" href="${base}${pathname}"`), `${page}: wrong alternate ${locale}`);
  }
  assert.ok(html.includes(`gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID}`), `${page}: wrong Analytics ID`);
  assert.ok(html.includes(`data-contact-form-endpoint="${process.env.CONTACT_FORM_ENDPOINT}"`), `${page}: wrong contact endpoint`);
  assert.ok(html.includes(process.env.SITE_LOCATION), `${page}: wrong location`);
  assert.ok(html.includes(`href="mailto:${process.env.SITE_EMAIL}"`), `${page}: wrong email`);
  assert.ok(html.includes(`href="tel:${process.env.SITE_PHONE_HREF.replace(/^tel:/i, '')}"`), `${page}: wrong telephone`);
  for (const key of ['FACEBOOK_URL', 'X_URL', 'LINKEDIN_URL']) {
    assert.ok(decodeHtml(html).includes(`href="${process.env[key]}"`), `${page}: wrong ${key}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${page}: duplicate element IDs`);
  const navigation = html.match(/<nav\b[^>]*>(.*?)<\/nav>/s)?.[1] ?? '';
  assert.ok(navigation.includes('id="servicesMenu"'), `${page}: missing Services dropdown`);
  let previousService = -1;
  for (const id of serviceIds) {
    const position = navigation.indexOf(`href="/services/${id}/"`);
    assert.ok(position > previousService, `${page}: missing or incorrectly ordered service link ${id}`);
    previousService = position;
  }

  for (const [, reference] of html.matchAll(/(?:src|href)="([^"]*)"/g)) {
    if (!reference || reference.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
    assert.ok(reference.startsWith('/'), `${page}: relative reference ${reference}`);
    const pathname = decodeURIComponent(reference.split(/[?#]/)[0]);
    let target = join(output, pathname);
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    assert.ok(existsSync(target), `${page}: missing target ${reference}`);
  }
}

for (const file of readdirSync(join(output, 'css'))) {
  const css = readFileSync(join(output, 'css', file), 'utf8');
  for (const [, reference] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    if (/^(?:data:|https?:|\/\/)/.test(reference)) continue;
    assert.ok(existsSync(resolve(output, 'css', reference)), `${file}: missing asset ${reference}`);
  }
}

const blogIndex = readFileSync(join(output, 'blog/index.html'), 'utf8');
const home = readFileSync(join(output, 'index.html'), 'utf8');
assert.equal((blogIndex.match(/class="blog-item h-100"/g) ?? []).length, blogIds.length,
  'Blog listing must contain each Markdown post once');
assert.equal((home.match(/class="blog-item h-100"/g) ?? []).length, Math.min(4, blogIds.length),
  'Homepage must show up to four posts');
for (const id of blogIds) {
  assert.ok(blogIndex.includes(`href="/blog/${id}/"`), `Blog listing omits ${id}`);
  const detail = readFileSync(join(output, `blog/${id}/index.html`), 'utf8');
  assert.ok(/class="blog-content"[^>]*>\s*\S/.test(detail), `${id}: missing Markdown body`);
  assert.ok(detail.includes('href="/blog/"'), `${id}: missing link back to the blog`);
}

for (const page of ['index.html', 'services/index.html']) {
  const main = readFileSync(join(output, page), 'utf8').match(/<main\b[^>]*>(.*?)<\/main>/s)?.[1] ?? '';
  assert.equal((main.match(/class="service-item\b/g) ?? []).length, serviceIds.length,
    `${page}: service cards must show each collection entry once`);
  let previous = -1;
  for (const id of serviceIds) {
    const position = main.indexOf(`href="/services/${id}/"`);
    assert.ok(position > previous, `${page}: service card link missing or out of order: ${id}`);
    previous = position;
  }
}
for (const id of serviceIds) {
  const detail = readFileSync(join(output, `services/${id}/index.html`), 'utf8');
  assert.ok(/class="service-content"[^>]*>\s*\S/.test(detail), `${id}: missing service body`);
  const navigation = detail.match(/<nav\b[^>]*>(.*?)<\/nav>/s)?.[1] ?? '';
  const link = navigation.split(`href="/services/${id}/"`)[1]?.split('>')[0] ?? '';
  assert.ok(link.includes('aria-current="page"'), `${id}: current service is not marked in the dropdown`);
  assert.ok(detail.includes('href="/contact/"'), `${id}: missing contact link`);
}

const contact = readFileSync(join(output, 'contact/index.html'), 'utf8');
assert.ok(decodeHtml(contact).includes(`src="${process.env.SITE_MAP_URL}"`), 'Contact map uses the wrong country');
for (const html of [home, contact]) {
  assert.ok(html.includes('class="js-contact-form"'), 'Missing endpoint-backed contact form');
  assert.ok(!html.includes('data-demo-form'), 'Contact form is still in demo mode');
  const form = html.match(/<form\b[^>]*class="js-contact-form"[\s\S]*?<\/form>/)?.[0] ?? '';
  assert.ok(form.includes('method="post"'), 'Contact details must never be sent in a query string');
  assert.match(form, /<button\b[^>]*type="submit"[^>]*disabled/, 'Enable submission only when the JS handler is ready');
  assert.ok(form.includes('href="/privacy/"'), 'Missing privacy information');
  assert.ok(form.includes(`href="mailto:${process.env.SITE_EMAIL}"`), 'Missing direct email fallback');
  for (const name of ['name', 'email', 'mobile', 'subject', 'message']) {
    assert.ok(form.includes(`name="${name}"`), `Missing form field: ${name}`);
  }
}
const sitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapUrls.length, pages.length - 1, 'Sitemap should list every page except 404');
for (const page of pages.filter(page => page !== '404.html')) {
  assert.ok(sitemapUrls.includes(`${origin}/${page.replace(/index\.html$/, '')}`), `Sitemap omits ${page}`);
}
assert.ok(readFileSync(join(output, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`), 'Wrong robots sitemap');
assert.ok(!existsSync(join(output, `.env.${country}`)), 'Country environment file should not be published');
console.log(`Verified ${country}: ${pages.length} pages, country metadata, contact details, Analytics, sitemap, assets, and collection links.`);
