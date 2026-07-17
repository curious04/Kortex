import { A as AUTH } from '../../../chunks/config_Be36SAIC.mjs';
import { s as setSession } from '../../../chunks/auth_Dl4KNOF5.mjs';
import { g as getUser } from '../../../chunks/github_BfY_ZhMy.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ url, cookies, redirect }) => {
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
  const { access_token } = await tokenRes.json();
  if (!access_token) return new Response("No access token received", { status: 500 });
  const user = await getUser(access_token);
  setSession(cookies, {
    token: access_token,
    username: user.login,
    avatar: user.avatar_url
  });
  return redirect("/");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
