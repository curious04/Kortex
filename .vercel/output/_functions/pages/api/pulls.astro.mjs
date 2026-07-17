import { g as getSession } from '../../chunks/auth_Dl4KNOF5.mjs';
import { i as isOwner } from '../../chunks/config_D-FnjJFE.mjs';
import { l as listPulls, m as mergePull, d as closePull } from '../../chunks/github_BvE2pf2S.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session || !isOwner(session.username)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  try {
    const pulls = await listPulls(session.token);
    const simplified = pulls.map((pr) => ({
      number: pr.number,
      title: pr.title,
      user: pr.user.login,
      avatar: pr.user.avatar_url,
      created: pr.created_at,
      url: pr.html_url
    }));
    return new Response(JSON.stringify(simplified), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
const POST = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session || !isOwner(session.username)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }
  const { number, action } = await request.json();
  if (!number || !action) {
    return new Response(JSON.stringify({ error: "number and action required" }), { status: 400 });
  }
  try {
    if (action === "merge") {
      await mergePull(session.token, number);
      return new Response(JSON.stringify({ success: true, action: "merged" }));
    } else if (action === "close") {
      await closePull(session.token, number);
      return new Response(JSON.stringify({ success: true, action: "closed" }));
    }
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
