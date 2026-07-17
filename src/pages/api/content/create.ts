import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { isOwner } from '../../../config';
import { createFile, createContributionPR } from '../../../lib/github';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const body = await request.json();
  const { title, type, tags, url, content, isPublic } = body;

  if (!title || !type) {
    return new Response(JSON.stringify({ error: 'Title and type are required' }), { status: 400 });
  }

  // Build markdown frontmatter
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const now = new Date().toISOString().slice(0, 10);
  const tagList = tags
    ? tags
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  let frontmatter = `---\ntitle: "${title}"\ntype: ${type}\ntags: [${tagList.join(', ')}]\npublic: ${isPublic !== false}\ncreated: ${now}\nupdated: ${now}\n`;
  if (url) frontmatter += `url: ${url}\n`;
  frontmatter += `---\n\n${content || ''}`;

  const path = `content/notes/${slug}.md`;

  try {
    if (isOwner(session.username)) {
      // Owner: commit directly
      await createFile(session.token, path, frontmatter, `Add: ${title}`);
      return new Response(JSON.stringify({ success: true, action: 'committed' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Contributor: create PR
      const pr = await createContributionPR(session.token, session.username, path, frontmatter, title);
      return new Response(
        JSON.stringify({ success: true, action: 'pr_created', pr_url: pr.html_url }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
