import type { APIRoute } from 'astro';
import { AUTH } from '../../../config';
import { setSession, getSession } from '../../../lib/auth';
import { getUser } from '../../../lib/github';

// In-memory cache so that if a link-prefetcher/security-scanner (or a duplicate
// browser request) hits this URL with the same one-time code before the real
// request, we don't waste the code on a second GitHub exchange — we reuse the
// first result. Serverless instances stay warm for a few minutes, which covers
// the near-simultaneous double-hit window that causes bad_verification_code.
const codeCache = new Map<string, Promise<{ token: string; username: string; avatar: string } | { error: string }>>();

function exchangeAndFetchUser(code: string) {
  return (async () => {
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
      return { error: json.error_description ?? json.error ?? 'unknown_error' };
    }

    const user = await getUser(access_token);
    return { token: access_token, username: user.login, avatar: user.avatar_url };
  })();
}

export const GET: APIRoute = async ({ url, request, cookies }) => {
  try {
    const existing = getSession(cookies);
    if (existing?.username) {
      return Response.redirect('https://kortex-sandy.vercel.app/', 302);
    }

    const code = url.searchParams.get('code')
      ?? new URL(request.url).searchParams.get('code');
    if (!code) {
      return new Response(`Missing code. url.search: ${url.search}`, { status: 400 });
    }

    // Reuse an in-flight or already-resolved exchange for this exact code
    if (!codeCache.has(code)) {
      codeCache.set(code, exchangeAndFetchUser(code));
      // Evict after 2 minutes to avoid unbounded memory growth
      setTimeout(() => codeCache.delete(code), 2 * 60 * 1000);
    }

    const result = await codeCache.get(code)!;

    if ('error' in result) {
      return new Response(
        `Auth failed: ${result.error}\n\n` +
        `This can happen if a security scanner or link-preview bot visited\n` +
        `this callback URL before your browser did, consuming the one-time code.\n` +
        `Please try signing in again.`,
        { status: 401, headers: { 'Content-Type': 'text/plain' } },
      );
    }

    setSession(cookies, result);
    return Response.redirect('https://kortex-sandy.vercel.app/', 302);
  } catch (err) {
    console.error('[kortex] callback error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
