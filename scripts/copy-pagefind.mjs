// Pagefind's Astro/Vercel integration builds its static search index into
// dist/client/pagefind AFTER `astro build` runs. But the @astrojs/vercel
// adapter already snapshots dist/client into .vercel/output/static during
// the `astro build` step itself — before pagefind has run. So we copy the
// generated pagefind/ folder into .vercel/output/static afterwards to make
// sure it actually ships in the Vercel deployment.
import { existsSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.cwd(), 'dist', 'client', 'pagefind');
const dest = join(process.cwd(), '.vercel', 'output', 'static', 'pagefind');

if (existsSync(src) && existsSync(join(process.cwd(), '.vercel', 'output', 'static'))) {
  cpSync(src, dest, { recursive: true });
  console.log('[kortex] copied pagefind index into .vercel/output/static/pagefind');
} else {
  console.log('[kortex] skipped pagefind copy (no .vercel/output/static or no pagefind index found)');
}
