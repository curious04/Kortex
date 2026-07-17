import { g as getSession } from '../../../chunks/auth_DMpIRFSQ.mjs';
import { i as isOwner } from '../../../chunks/config_D_BjX1gx.mjs';
import { c as createFile, a as createContributionPR } from '../../../chunks/github_D-b3BnwH.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }
  const body = await request.json();
  const { title, type, tags, url, content, isPublic } = body;
  if (!title || !type) {
    return new Response(JSON.stringify({ error: "Title and type are required" }), { status: 400 });
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  let frontmatter = `---
title: "${title}"
type: ${type}
tags: [${tagList.join(", ")}]
public: ${isPublic !== false}
created: ${now}
updated: ${now}
`;
  if (url) frontmatter += `url: ${url}
`;
  frontmatter += `---

${content || ""}`;
  const path = `content/notes/${slug}.md`;
  try {
    if (isOwner(session.username)) {
      await createFile(session.token, path, frontmatter, `Add: ${title}`);
      return new Response(JSON.stringify({ success: true, action: "committed" }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const pr = await createContributionPR(session.token, session.username, path, frontmatter, title);
      return new Response(
        JSON.stringify({ success: true, action: "pr_created", pr_url: pr.html_url }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
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
