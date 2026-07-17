import { A as AUTH } from '../../../chunks/config_D-FnjJFE.mjs';
import { s as setSession } from '../../../chunks/auth_Dl4KNOF5.mjs';
import { g as getUser } from '../../../chunks/github_BvE2pf2S.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ url, cookies }) => {
  try {
    const code = url.searchParams.get("code");
    if (!code) return new Response("Missing code", { status: 400 });
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: AUTH.clientId,
        client_secret: AUTH.clientSecret,
        code
      })
    });
    if (!tokenRes.ok) return new Response("Token exchange failed", { status: 500 });
    const json = await tokenRes.json();
    const access_token = json.access_token;
    if (!access_token) return new Response(`No access token: ${JSON.stringify(json)}`, { status: 500 });
    const user = await getUser(access_token);
    setSession(cookies, {
      token: access_token,
      username: user.login,
      avatar: user.avatar_url
    });
    return Response.redirect(new URL("/", url).href, 302);
  } catch (err) {
    console.error("[kortex] callback error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
