import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { isOwner } from '../../config';
import { listPulls, mergePull, closePull } from '../../lib/github';

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session || !isOwner(session.username)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  try {
    const pulls = await listPulls(session.token);
    const simplified = pulls.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      user: pr.user.login,
      avatar: pr.user.avatar_url,
      created: pr.created_at,
      url: pr.html_url,
    }));
    return new Response(JSON.stringify(simplified), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session || !isOwner(session.username)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  const { number, action } = await request.json();
  if (!number || !action) {
    return new Response(JSON.stringify({ error: 'number and action required' }), { status: 400 });
  }

  try {
    if (action === 'merge') {
      await mergePull(session.token, number);
      return new Response(JSON.stringify({ success: true, action: 'merged' }));
    } else if (action === 'close') {
      await closePull(session.token, number);
      return new Response(JSON.stringify({ success: true, action: 'closed' }));
    }
    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
