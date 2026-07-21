import fs from 'node:fs';
import path from 'node:path';

/** Shared slug logic used by the wiki-link remark plugin, backlinks, and the graph view. */
export function wikilinkSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Matches [[Some Title]] or [[Some Title|Custom label]] */
export const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function readScalar(frontmatter, key) {
  const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

/**
 * Reads content/notes/*.md(x) directly from disk to build a lightweight index of
 * {id, title, slug, type, url}. Used by the remark wiki-link plugin, which runs during
 * markdown compilation and has no direct access to the astro:content collection.
 */
export function readNotesIndex(notesDir = 'content/notes') {
  const dir = path.resolve(process.cwd(), notesDir);
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => /\.(md|mdx)$/.test(f));
  } catch {
    return [];
  }
  return files.map((file) => {
    const id = file.replace(/\.(md|mdx)$/, '');
    let frontmatter = '';
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      frontmatter = fm ? fm[1] : '';
    } catch {
      // ignore unreadable files
    }
    const title = readScalar(frontmatter, 'title') || id;
    return {
      id,
      title,
      slug: wikilinkSlug(title),
      type: readScalar(frontmatter, 'type') || 'note',
      url: readScalar(frontmatter, 'url'),
    };
  });
}

/**
 * Resolves the text inside [[...]] to a note, tolerating shortened/partial titles
 * (e.g. [[stackblitz]] matching "StackBlitz | Instant Dev Environments..."). Falls back
 * from an exact slug/id match to a prefix match, then a loose "contains" match.
 * Candidates need at least { id, slug }.
 */
export function resolveWikilink(rawText, candidates) {
  const query = wikilinkSlug(rawText);
  if (!query) return null;
  return (
    candidates.find((n) => n.slug === query || n.id === query) ||
    candidates.find((n) => n.slug.startsWith(`${query}-`) || n.id.startsWith(`${query}-`)) ||
    candidates.find((n) => n.slug.includes(query) || n.id.includes(query)) ||
    null
  );
}

