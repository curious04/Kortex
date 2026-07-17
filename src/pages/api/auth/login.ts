import type { APIRoute } from 'astro';
import { AUTH } from '../../../config';

export const GET: APIRoute = async () => {
  const params = new URLSearchParams({
    client_id: AUTH.clientId,
    redirect_uri: AUTH.callbackUrl,
    scope: 'repo',
  });
  return new Response(null, {
    status: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
  });
};
