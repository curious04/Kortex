import { visit } from 'unist-util-visit';
import { WIKILINK_RE, wikilinkSlug, readNotesIndex, resolveWikilink } from './wikilinks.mjs';

/**
 * Remark plugin: turns [[Note Title]] / [[Note Title|label]] into real links.
 * - Links to "link"-type notes (bookmarks with a `url`) go straight to that external URL.
 * - Everything else links to the note's own page at /{id}/.
 * - Tolerates shortened/partial titles by falling back to prefix/contains matching.
 */
export function remarkWikiLinks() {
  const notesIndex = readNotesIndex();

  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      const value = node.value;
      if (!value.includes('[[')) return;

      WIKILINK_RE.lastIndex = 0;
      let match;
      let lastIndex = 0;
      const newNodes = [];

      while ((match = WIKILINK_RE.exec(value))) {
        if (match.index > lastIndex) {
          newNodes.push({ type: 'text', value: value.slice(lastIndex, match.index) });
        }
        const title = match[1].trim();
        const label = (match[2] || title).trim();
        const target = resolveWikilink(title, notesIndex);
        const isExternal = Boolean(target?.url && target.type === 'link');

        newNodes.push({
          type: 'link',
          url: isExternal ? target.url : `/${target ? target.id : wikilinkSlug(title)}/`,
          data: {
            hProperties: {
              class: isExternal ? 'wikilink wikilink-external' : target ? 'wikilink' : 'wikilink wikilink-missing',
              ...(isExternal ? { target: '_blank', rel: 'noopener' } : {}),
            },
          },
          children: [{ type: 'text', value: label }],
        });
        lastIndex = match.index + match[0].length;
      }

      if (!newNodes.length) return;
      if (lastIndex < value.length) {
        newNodes.push({ type: 'text', value: value.slice(lastIndex) });
      }
      parent.children.splice(index, 1, ...newNodes);
      return index + newNodes.length;
    });
  };
}

