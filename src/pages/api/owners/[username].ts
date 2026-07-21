import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { removeOwner } from '../../../lib/owners';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const username = params.username;
  if (!username) {
    return new Response(JSON.stringify({ error: 'Missing username' }), { status: 400 });
  }

  try {
    const result = await removeOwner(session, username);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const status = err.message?.includes('Only owners')
      ? 403
      : err.message?.includes('Cannot remove')
        ? 400
        : err.message?.includes('not found')
          ? 404
          : 500;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
};
