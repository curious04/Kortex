import { isOwner } from '../config';
import { createFile, createContributionPR, getFile, deleteFile } from './github';
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

function extractField(raw: string, key: string): string | undefined {
  const m = raw.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined;
}

export function buildNoteMarkdown(
  input: NoteInput,
  opts: { created?: string; extra?: { pinned?: string; attachment?: string } } = {},
) {
  const now = new Date().toISOString().slice(0, 10);
  const created = opts.created || now;
  const tagList = input.tags
    ? input.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  let frontmatter = `---\ntitle: "${input.title.replace(/"/g, '\\"')}"\ntype: ${input.type}\ntags: [${tagList.join(', ')}]\npublic: ${input.isPublic !== false}\n`;
  if (opts.extra?.pinned) frontmatter += `pinned: ${opts.extra.pinned}\n`;
  frontmatter += `created: ${created}\nupdated: ${now}\n`;
  if (input.url) frontmatter += `url: ${input.url}\n`;
  if (opts.extra?.attachment) frontmatter += `attachment: ${opts.extra.attachment}\n`;
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

/** Edit an existing note in place (same file path/id) — owners only, commits directly. */
export async function updateNote(session: Session, id: string, input: NoteInput) {
  if (!isOwner(session.username)) {
    throw new Error('Only owners can edit notes directly');
  }
  const path = `content/notes/${id}.md`;
  const existing = await getFile(session.token, path);
  if (!existing) throw new Error('Note not found');

  const created = extractField(existing.content, 'created');
  const pinned = extractField(existing.content, 'pinned');
  const attachment = extractField(existing.content, 'attachment');

  const markdown = buildNoteMarkdown(input, { created, extra: { pinned, attachment } });
  await createFile(session.token, path, markdown, `Update: ${input.title}`);
  return { success: true };
}

/** Delete an existing note — owners only, commits directly. */
export async function deleteNote(session: Session, id: string) {
  if (!isOwner(session.username)) {
    throw new Error('Only owners can delete notes directly');
  }
  const path = `content/notes/${id}.md`;
  const existing = await getFile(session.token, path);
  if (!existing) throw new Error('Note not found');

  await deleteFile(session.token, path, `Delete: ${id}`);
  return { success: true };
}

