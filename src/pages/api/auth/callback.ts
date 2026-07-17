import type { APIRoute } from 'astro';
import { AUTH } from '../../../config';
import { setSession } from '../../../lib/auth';
import { getUser } from '../../../lib/github';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const code = url.searchParams.get('code');
    if (!code) return new Response('Missing code', { status: 400 });

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
    const json = await tokenRes.json();
    const access_token = json.access_token;
    if (!access_token) return new Response(`No access token: ${JSON.stringify(json)}`, { status: 500 });

    const user = await getUser(access_token);

    setSession(cookies, {
      token: access_token,
      username: user.login,
      avatar: user.avatar_url,
    });

    return Response.redirect(new URL('/', url).href, 302);
  } catch (err) {
    console.error('[kortex] callback error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
