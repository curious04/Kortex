import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim() ?? '';
  return new Response(
    JSON.stringify({
      ok: true,
      env: {
        GITHUB_CLIENT_ID: Boolean(clientId),
        // Show first 8 chars so you can verify it matches GitHub — client_id is not secret
        GITHUB_CLIENT_ID_prefix: clientId ? clientId.slice(0, 8) + '...' : '(not set)',
        GITHUB_CLIENT_SECRET: Boolean(process.env.GITHUB_CLIENT_SECRET),
        AUTH_CALLBACK_URL: process.env.AUTH_CALLBACK_URL?.trim() ?? '(not set, using default)',
        NODE_ENV: process.env.NODE_ENV,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
