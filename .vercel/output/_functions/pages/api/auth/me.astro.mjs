import { g as getSession } from '../../../chunks/auth_Dl4KNOF5.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(
    JSON.stringify({
      authenticated: true,
      username: session.username,
      avatar: session.avatar
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
