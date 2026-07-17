import { A as AUTH } from '../../../chunks/config_D-FnjJFE.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  try {
    if (!AUTH.clientId) {
      return new Response(
        JSON.stringify({ error: "GITHUB_CLIENT_ID is not configured. Set it in your Vercel environment variables." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    const params = new URLSearchParams({
      client_id: AUTH.clientId,
      redirect_uri: AUTH.callbackUrl,
      scope: "repo"
    });
    return Response.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`,
      302
    );
  } catch (err) {
    console.error("[kortex] login error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
