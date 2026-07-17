import { g as getSession } from '../../../chunks/auth_Dl4KNOF5.mjs';
import { i as isOwner } from '../../../chunks/config_Be36SAIC.mjs';
import { b as uploadFile } from '../../../chunks/github_BfY_ZhMy.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `content/assets/${Date.now()}-${safeName}`;
  try {
    if (!isOwner(session.username)) {
      return new Response(JSON.stringify({ error: "Only the owner can upload files directly" }), {
        status: 403
      });
    }
    const result = await uploadFile(session.token, path, base64, `Upload: ${safeName}`);
    const downloadUrl = result.content.download_url;
    return new Response(JSON.stringify({ success: true, url: downloadUrl, path }), {
      headers: { "Content-Type": "application/json" }
    });
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
