import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { listOwners, addOwner, isOwnerAsync } from '../../../lib/owners';

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  if (!(await isOwnerAsync(session.token, session.username))) {
    return new Response(JSON.stringify({ error: 'Only owners can view this' }), { status: 403 });
  }

  const owners = await listOwners(session.token);
  return new Response(JSON.stringify({ owners }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const body = await request.json();
  const { identifier } = body;
  if (!identifier || !String(identifier).trim()) {
    return new Response(JSON.stringify({ error: 'GitHub username or email is required' }), { status: 400 });
  }

  try {
    const result = await addOwner(session, { identifier });
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const status = err.message?.includes('Only owners')
      ? 403
      : err.message?.includes('Already an owner')
        ? 409
        : err.message?.includes('not found') || err.message?.includes("Couldn't find")
          ? 404
          : 500;
    return new Response(JSON.stringify({ error: err.message }), { status });
  }
};
