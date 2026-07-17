import { A as AUTH } from '../../../chunks/config_Be36SAIC.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  const params = new URLSearchParams({
    client_id: AUTH.clientId,
    redirect_uri: AUTH.callbackUrl,
    scope: "repo"
  });
  return new Response(null, {
    status: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
