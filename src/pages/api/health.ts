import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      env: {
        GITHUB_CLIENT_ID: Boolean(process.env.GITHUB_CLIENT_ID),
        GITHUB_CLIENT_SECRET: Boolean(process.env.GITHUB_CLIENT_SECRET),
        AUTH_CALLBACK_URL: process.env.AUTH_CALLBACK_URL ?? '(not set, using default)',
        NODE_ENV: process.env.NODE_ENV,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
