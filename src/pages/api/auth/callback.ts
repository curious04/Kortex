import type { APIRoute } from 'astro';
import { AUTH } from '../../../config';
import { setSession } from '../../../lib/auth';
import { getUser } from '../../../lib/github';

export const GET: APIRoute = async ({ url, request, cookies }) => {
  try {
    // Read code both ways to catch any URL construction issue
    const code = url.searchParams.get('code')
      ?? new URL(request.url).searchParams.get('code');

    if (!code) {
      return new Response(
        `Missing code.\nurl.search: ${url.search}\nrequest.url: ${request.url}`,
        { status: 400, headers: { 'Content-Type': 'text/plain' } },
      );
    }

    // JSON body — GitHub supports both JSON and form-encoded
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: AUTH.clientId,
        client_secret: AUTH.clientSecret,
        code,
      }),
    });

    const json = await tokenRes.json();
    const access_token = json.access_token;

    if (!access_token) {
      // Full diagnostics visible in browser (code expires in ~10 min, safe to show prefix)
      return new Response(
        `GitHub error: ${json.error}\n` +
        `Description: ${json.error_description}\n\n` +
        `Debug:\n` +
        `  tokenRes.status: ${tokenRes.status}\n` +
        `  client_id prefix: ${AUTH.clientId.slice(0, 8)}... (len ${AUTH.clientId.length})\n` +
        `  code prefix: ${code.slice(0, 6)}... (len ${code.length})\n` +
        `  request.url: ${request.url.slice(0, 150)}\n` +
        `  url.toString: ${url.toString().slice(0, 150)}`,
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
