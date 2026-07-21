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
