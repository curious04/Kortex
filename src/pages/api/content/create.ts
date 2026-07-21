import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { saveNote } from '../../../lib/notes';

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

  try {
    const result = await saveNote(session, { title, type, tags, url, content, isPublic });
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
