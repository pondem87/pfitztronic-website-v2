import { defineConfig } from 'astro/config';
import { siteConfig } from './src/config.ts';

if (process.env.SITE_OUTPUT_DIR !== `dist/${siteConfig.countryCode}`) {
  throw new Error('Use npm run build:bw or npm run build:zw to select a country output directory.');
}

export default defineConfig({
  site: siteConfig.origin,
  output: 'static',
  trailingSlash: 'always',
  outDir: process.env.SITE_OUTPUT_DIR,
});
