import type { APIRoute } from 'astro';
import { AUTH } from '../../../config';
import { setSession, getSession } from '../../../lib/auth';
import { getUser } from '../../../lib/github';

export const GET: APIRoute = async ({ url, request, cookies }) => {
  try {
    // If already logged in (from a previous/parallel invocation), just redirect
    const existing = getSession(cookies);
    if (existing?.username) {
      return Response.redirect('https://kortex-sandy.vercel.app/', 302);
    }

    const code = url.searchParams.get('code')
      ?? new URL(request.url).searchParams.get('code');
    if (!code) {
      return new Response(`Missing code. url.search: ${url.search}`, { status: 400 });
    }

    const body = new URLSearchParams({
      client_id: AUTH.clientId,
      client_secret: AUTH.clientSecret,
      code,
      redirect_uri: AUTH.callbackUrl,
    });

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Kortex-App/1.0',
      },
      body: body.toString(),
    });

    const json = await tokenRes.json();
    const access_token = json.access_token;

    if (!access_token) {
      return new Response(
        `GitHub full response: ${JSON.stringify(json)}\n\n` +
        `Debug:\n` +
        `  client_id len: ${AUTH.clientId.length} (ok: ${AUTH.clientId.length === 20})\n` +
        `  client_secret len: ${AUTH.clientSecret.length} (ok: ${AUTH.clientSecret.length === 40})\n` +
        `  redirect_uri: ${AUTH.callbackUrl}\n` +
        `  code len: ${code.length}\n` +
        `  code (for manual test): ${code}`,
        { status: 401, headers: { 'Content-Type': 'text/plain' } },
      );
    }

    const user = await getUser(access_token);
    setSession(cookies, { token: access_token, username: user.login, avatar: user.avatar_url });
    return Response.redirect('https://kortex-sandy.vercel.app/', 302);
  } catch (err) {
    console.error('[kortex] callback error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
