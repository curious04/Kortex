import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { getDeploymentForCommit, isVercelConfigured } from '../../lib/vercel';

/** Poll this to find out whether the Vercel deployment for a given commit is READY yet. */
export const GET: APIRoute = async ({ url, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const sha = url.searchParams.get('sha');
  if (!sha) {
    return new Response(JSON.stringify({ error: 'Missing sha' }), { status: 400 });
  }

  if (!isVercelConfigured()) {
    return new Response(JSON.stringify({ configured: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const deployment = await getDeploymentForCommit(sha);
    return new Response(JSON.stringify({ configured: true, deployment }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
