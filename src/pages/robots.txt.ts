import { siteConfig } from '../config';

export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${siteConfig.origin}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
