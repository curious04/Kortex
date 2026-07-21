// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { remarkWikiLinks } from './src/lib/remark-wikilinks.mjs';

export default defineConfig({
  // server mode with per-page prerendering:
  // content pages opt-in to static with `export const prerender = true`,
  // API routes remain server-rendered.
  output: 'server',
  adapter: vercel(),
  site: process.env.SITE_URL || 'http://localhost:4321',
  markdown: {
    remarkPlugins: [remarkWikiLinks],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
});
