import type { APIRoute } from 'astro';
import { AUTH } from '../../../config';
import { setSession } from '../../../lib/auth';
import { getUser } from '../../../lib/github';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const code = url.searchParams.get('code');
    if (!code) return new Response('Missing code', { status: 400 });

    // Use form-encoded body — standard OAuth 2.0
    const tokenBody = new URLSearchParams({
      client_id: AUTH.clientId,
      client_secret: AUTH.clientSecret,
      code,
    });

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) return new Response('Token exchange HTTP failed: ' + tokenRes.status, { status: 500 });
    const json = await tokenRes.json();
    const access_token = json.access_token;
    if (!access_token) {
      return new Response(
        `GitHub error: ${json.error}\nDescription: ${json.error_description}`,
        { status: 401, headers: { 'Content-Type': 'text/plain' } },
      );
    }

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
