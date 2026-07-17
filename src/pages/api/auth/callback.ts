import type { APIRoute } from 'astro';
import { AUTH } from '../../../config';
import { setSession } from '../../../lib/auth';
import { getUser } from '../../../lib/github';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: AUTH.clientId,
      client_secret: AUTH.clientSecret,
      code,
    }),
  });

  if (!tokenRes.ok) return new Response('Token exchange failed', { status: 500 });
  const { access_token } = await tokenRes.json();
  if (!access_token) return new Response('No access token received', { status: 500 });

  // Get user info
  const user = await getUser(access_token);

  setSession(cookies, {
    token: access_token,
    username: user.login,
    avatar: user.avatar_url,
  });

  return redirect('/');
};
