import { visit } from 'unist-util-visit';
import { WIKILINK_RE, wikilinkSlug } from './wikilinks.mjs';

/** Remark plugin: turns [[Note Title]] / [[Note Title|label]] into real links to /{slug}/ */
export function remarkWikiLinks() {
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
        newNodes.push({
          type: 'link',
          url: `/${wikilinkSlug(title)}/`,
          data: { hProperties: { class: 'wikilink' } },
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
