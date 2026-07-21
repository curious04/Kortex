import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getSession } from '../../../lib/auth';
import { isOwner } from '../../../config';

/** Lightweight list of note titles, used by the wiki-link autocomplete and AI related-notes suggestions. */
export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies);
  const includePrivate = Boolean(session && isOwner(session.username));

  const notes = await getCollection('notes', ({ data }) => includePrivate || data.public !== false);
  const titles = notes
    .map((n) => ({ title: n.data.title, slug: n.id }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return new Response(JSON.stringify(titles), {
    headers: { 'Content-Type': 'application/json' },
  });
};
