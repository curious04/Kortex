import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { isOwnerAsync } from '../../../lib/owners';

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(
    JSON.stringify({
      authenticated: true,
      username: session.username,
      avatar: session.avatar,
      isOwner: await isOwnerAsync(session.token, session.username),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};

