import { isOwnerAsync, getOwnerEmails } from './owners';
import { createFile, createContributionPR, getFile, deleteFile } from './github';
import { isEmailConfigured, sendNewContributionEmail } from './email';
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

  if (await isOwnerAsync(session.token, session.username)) {
    const result = await createFile(session.token, path, markdown, `Add: ${input.title}`);
    return { success: true, action: 'committed' as const, commitSha: result.commit?.sha as string | undefined };
  }

  const pr = await createContributionPR(session.token, session.username, path, markdown, input.title);

  // Best-effort notify owners by email that a new PR is waiting for review — a
  // failed/unconfigured notification must never fail the publish itself.
  if (isEmailConfigured()) {
    try {
      const to = await getOwnerEmails(session.token);
      if (to.length) {
        await sendNewContributionEmail({
          to,
          contributor: session.username,
          title: input.title,
          prUrl: pr.html_url,
        });
      }
    } catch {
      // ignore — the PR was still created successfully
    }
  }

  return { success: true, action: 'pr_created' as const, pr_url: pr.html_url };
}

/** Edit an existing note in place (same file path/id) — owners only, commits directly. */
export async function updateNote(session: Session, id: string, input: NoteInput) {
  if (!(await isOwnerAsync(session.token, session.username))) {
    throw new Error('Only owners can edit notes directly');
  }
  const path = `content/notes/${id}.md`;
  const existing = await getFile(session.token, path);
  if (!existing) throw new Error('Note not found');

  const created = extractField(existing.content, 'created');
  const pinned = extractField(existing.content, 'pinned');
  const attachment = extractField(existing.content, 'attachment');

  const markdown = buildNoteMarkdown(input, { created, extra: { pinned, attachment } });
  const result = await createFile(session.token, path, markdown, `Update: ${input.title}`);
  return { success: true, commitSha: result.commit?.sha as string | undefined };
}

/** Delete an existing note — owners only, commits directly. */
export async function deleteNote(session: Session, id: string) {
  if (!(await isOwnerAsync(session.token, session.username))) {
    throw new Error('Only owners can delete notes directly');
  }
  const path = `content/notes/${id}.md`;
  const existing = await getFile(session.token, path);
  if (!existing) throw new Error('Note not found');

  const result = await deleteFile(session.token, path, `Delete: ${id}`);
  return { success: true, commitSha: result.commit?.sha as string | undefined };
}

/**
 * Append a `[[Target Title]]` wiki-link to the end of a note's content — owners only.
 * Used by the knowledge graph's manual "link nodes" mode. Leaves the rest of the note
 * (frontmatter, existing body) untouched, so no need to re-parse/rebuild the whole file.
 */
export async function linkNotes(session: Session, sourceId: string, targetTitle: string) {
  if (!(await isOwnerAsync(session.token, session.username))) {
    throw new Error('Only owners can link notes directly');
  }
  const path = `content/notes/${sourceId}.md`;
  const existing = await getFile(session.token, path);
  if (!existing) throw new Error('Note not found');

  const linkText = `[[${targetTitle}]]`;
  if (existing.content.includes(linkText)) {
    return { success: true, alreadyLinked: true as const };
  }

  const now = new Date().toISOString().slice(0, 10);
  let updated = existing.content.replace(/^updated:\s*.+$/m, `updated: ${now}`);
  updated = `${updated.replace(/\s+$/, '')}\n\n${linkText}\n`;

  const result = await createFile(session.token, path, updated, `Link: ${sourceId} -> ${targetTitle}`);
  return { success: true, commitSha: result.commit?.sha as string | undefined };
}


