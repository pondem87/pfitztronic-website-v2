import { getCollection } from 'astro:content';
import { siteConfig } from '../config';

export async function GET() {
  const [blogs, services] = await Promise.all([getCollection('blogs'), getCollection('services')]);
  const paths = ['/', '/about/', '/services/', '/blog/', '/projects/', '/projects/iot-hub/', '/projects/home-automation/', '/features/', '/team/', '/testimonials/', '/contact/', '/privacy/', '/faqs/',
    ...blogs.map(({ id }) => `/blog/${id}/`),
    ...services.map(({ id }) => `/services/${id}/`),
  ];
  const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${escapeXml(new URL(path, siteConfig.origin).href)}</loc></url>`).join('\n')}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
