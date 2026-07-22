import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { linkNotes } from '../../../lib/notes';

/** Manually connect two notes from the knowledge graph — owners only. */
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const body = await request.json();
  const { sourceId, targetTitle } = body;
  if (!sourceId || !targetTitle) {
    return new Response(JSON.stringify({ error: 'sourceId and targetTitle are required' }), { status: 400 });
  }

  try {
    const result = await linkNotes(session, sourceId, targetTitle);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const status = err.message?.includes('Only owners') ? 403 : err.message?.includes('not found') ? 404 : 500;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
};
