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
        redirect_uri: AUTH.callbackUrl,
      }),
    });

    const json = await tokenRes.json();
    const access_token = json.access_token;

    if (!access_token) {
      return new Response(
        `GitHub error: ${json.error}\n` +
        `Description: ${json.error_description}\n\n` +
        `Debug:\n` +
        `  client_id len: ${AUTH.clientId.length} (ok: ${AUTH.clientId.length === 20})\n` +
        `  client_secret len: ${AUTH.clientSecret.length} (ok: ${AUTH.clientSecret.length === 40})\n` +
        `  redirect_uri: ${AUTH.callbackUrl}\n` +
        `  code len: ${code.length}\n` +
        `  code prefix: ${code.slice(0, 6)}...`,
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
