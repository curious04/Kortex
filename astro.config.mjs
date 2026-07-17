// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL and BASE_PATH are provided by the GitHub Actions deploy workflow.
// Locally they default to a root-served dev site.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
});
