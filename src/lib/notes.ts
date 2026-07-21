import { isOwner } from '../config';
import { createFile, createContributionPR } from './github';
import type { Session } from './auth';

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface NoteInput {
  title: string;
  type: string;
  tags?: string;
  url?: string;
  content?: string;
  isPublic?: boolean;
}

export function buildNoteMarkdown(input: NoteInput) {
  const now = new Date().toISOString().slice(0, 10);
  const tagList = input.tags
    ? input.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  let frontmatter = `---\ntitle: "${input.title.replace(/"/g, '\\"')}"\ntype: ${input.type}\ntags: [${tagList.join(', ')}]\npublic: ${input.isPublic !== false}\ncreated: ${now}\nupdated: ${now}\n`;
  if (input.url) frontmatter += `url: ${input.url}\n`;
  frontmatter += `---\n\n${input.content || ''}`;
  return frontmatter;
}

/** Shared save path used by both the Add modal API and the Share Target page */
export async function saveNote(session: Session, input: NoteInput) {
  const markdown = buildNoteMarkdown(input);
  const path = `content/notes/${slugify(input.title)}.md`;

  if (isOwner(session.username)) {
    await createFile(session.token, path, markdown, `Add: ${input.title}`);
    return { success: true, action: 'committed' as const };
  }

  const pr = await createContributionPR(session.token, session.username, path, markdown, input.title);
  return { success: true, action: 'pr_created' as const, pr_url: pr.html_url };
}
