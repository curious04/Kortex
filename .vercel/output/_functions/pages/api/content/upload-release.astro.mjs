import { g as getSession } from '../../../chunks/auth_Dl4KNOF5.mjs';
import { i as isOwner } from '../../../chunks/config_Be36SAIC.mjs';
import { u as uploadToRelease } from '../../../chunks/github_BfY_ZhMy.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }
  if (!isOwner(session.username)) {
    return new Response(JSON.stringify({ error: "Only the owner can upload large files" }), {
      status: 403
    });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }
  const buffer = await file.arrayBuffer();
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  try {
    const asset = await uploadToRelease(session.token, safeName, buffer, file.type || "application/octet-stream");
    return new Response(
      JSON.stringify({ success: true, url: asset.browser_download_url, name: safeName }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
