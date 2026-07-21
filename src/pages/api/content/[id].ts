import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { updateNote, deleteNote } from '../../../lib/notes';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing note id' }), { status: 400 });
  }

  const body = await request.json();
  const { title, type, tags, url, content, isPublic } = body;
  if (!title || !type) {
    return new Response(JSON.stringify({ error: 'Title and type are required' }), { status: 400 });
  }

  try {
    const result = await updateNote(session, id, { title, type, tags, url, content, isPublic });
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const status = err.message?.includes('Only owners') ? 403 : err.message?.includes('not found') ? 404 : 500;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing note id' }), { status: 400 });
  }

  try {
    const result = await deleteNote(session, id);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const status = err.message?.includes('Only owners') ? 403 : err.message?.includes('not found') ? 404 : 500;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
};
