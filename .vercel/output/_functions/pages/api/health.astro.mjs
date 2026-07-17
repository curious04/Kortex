export { renderers } from '../../renderers.mjs';

const GET = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      env: {
        GITHUB_CLIENT_ID: Boolean(process.env.GITHUB_CLIENT_ID),
        GITHUB_CLIENT_SECRET: Boolean(process.env.GITHUB_CLIENT_SECRET),
        AUTH_CALLBACK_URL: process.env.AUTH_CALLBACK_URL ?? "(not set, using default)",
        NODE_ENV: process.env.NODE_ENV
      }
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
