import { c as createAstro, a as createComponent, b as renderTemplate, r as renderComponent, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_Biqo3-S5.mjs';
import 'piccolore';
import { g as getCollection, $ as $$Layout } from '../chunks/Layout_CLSe77Iy.mjs';
import { i as isOwner, S as SITE } from '../chunks/config_D_BjX1gx.mjs';
import { g as getSession } from '../chunks/auth_DMpIRFSQ.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("http://localhost:4321");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const session = getSession(Astro2.cookies);
  session ? isOwner(session.username) : false;
  const all = await getCollection("notes", ({ data }) => data.public !== false);
  const entries = all.sort((a, b) => {
    const pin = (b.data.pinned ? 1 : 0) - (a.data.pinned ? 1 : 0);
    if (pin !== 0) return pin;
    const ad = (a.data.updated ?? a.data.created ?? /* @__PURE__ */ new Date(0)).getTime();
    const bd = (b.data.updated ?? b.data.created ?? /* @__PURE__ */ new Date(0)).getTime();
    return bd - ad;
  });
  const types = [...new Set(entries.map((e) => e.data.type))].sort();
  function excerpt(body) {
    if (!body) return "";
    return body.replace(/^---[\s\S]*?---/, "").replace(/[#*_`>\[\]!]/g, "").replace(/\(https?:[^)]*\)/g, "").replace(/\s+/g, " ").trim().slice(0, 180);
  }
  return renderTemplate(_a || (_a = __template(["", ' <script>\n  const search = document.getElementById("search");\n  const grid = document.getElementById("grid");\n  const empty = document.getElementById("empty");\n  const chips = document.getElementById("type-chips");\n  const cards = Array.from(grid.querySelectorAll(".card"));\n  let activeType = "all";\n  let query = "";\n\n  function apply() {\n    let shown = 0;\n    for (const card of cards) {\n      const matchType = activeType === "all" || card.dataset.type === activeType;\n      const matchText = !query || card.dataset.search.includes(query);\n      const show = matchType && matchText;\n      card.hidden = !show;\n      if (show) shown++;\n    }\n    empty.hidden = shown !== 0;\n  }\n\n  search.addEventListener("input", (e) => {\n    query = e.target.value.trim().toLowerCase();\n    apply();\n  });\n\n  chips.addEventListener("click", (e) => {\n    const btn = e.target.closest(".chip");\n    if (!btn) return;\n    activeType = btn.dataset.type;\n    chips.querySelectorAll(".chip").forEach((c) =>\n      c.setAttribute("aria-pressed", String(c === btn))\n    );\n    apply();\n  });\n<\/script>'])), renderComponent($$result, "Layout", $$Layout, {}, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="hero"> <div class="wrap"> <span class="label animate-in">Your knowledge hub</span> <h1 class="animate-in delay-1">Everything you know,<br>in one place.</h1> <p class="animate-in delay-2">${SITE.description}</p> ${!session && renderTemplate`<div class="hero-actions animate-in delay-3"> <a class="btn primary" href="/api/auth/login">Sign in with GitHub</a> <a class="btn"${addAttribute(`https://github.com/${SITE.github.owner}/${SITE.github.repo}`, "href")} target="_blank" rel="noopener">
View source
</a> </div>`} </div> </section> <div class="wrap"> <!-- Stats --> <div class="stats animate-in delay-2" data-animate> <div class="stat"><b>${entries.length}</b><span>total</span></div> ${types.map((t) => renderTemplate`<div class="stat"> <b>${entries.filter((e) => e.data.type === t).length}</b> <span>${t}</span> </div>`)} </div> <!-- Controls --> <div class="controls"> <div class="search-wrap"> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path> </svg> <input id="search" class="search" type="search" placeholder="Search everything..." autocomplete="off"> </div> <div class="chips" id="type-chips"> <button class="chip" data-type="all" aria-pressed="true">All</button> ${types.map((t) => renderTemplate`<button class="chip"${addAttribute(t, "data-type")} aria-pressed="false">${t}</button>`)} </div> </div> <!-- Grid --> <div class="grid" id="grid"> ${entries.map((e, i) => {
    const searchText = (e.data.title + " " + e.data.tags.join(" ") + " " + e.data.type + " " + excerpt(e.body)).toLowerCase();
    return renderTemplate`<article${addAttribute(`card`, "class")}${addAttribute(e.data.type, "data-type")}${addAttribute(searchText, "data-search")} data-animate${addAttribute(`animation-delay: ${Math.min(i * 0.05, 0.4)}s`, "style")}> ${e.data.pinned && renderTemplate`<span class="pin"></span>`} <div class="meta"> <span class="type">${e.data.type}</span> ${(e.data.updated || e.data.created) && renderTemplate`<span class="date"> ${(e.data.updated ?? e.data.created).toISOString().slice(0, 10)} </span>`} </div> <h3> ${e.data.url ? renderTemplate`<a${addAttribute(e.data.url, "href")} target="_blank" rel="noopener">${e.data.title}</a>` : renderTemplate`<a${addAttribute(`/${e.id}/`, "href")}>${e.data.title}</a>`} </h3> ${excerpt(e.body) && renderTemplate`<p class="excerpt">${excerpt(e.body)}</p>`} ${e.data.tags.length > 0 && renderTemplate`<div class="tags"> ${e.data.tags.map((tag) => renderTemplate`<span class="tag">${tag}</span>`)} </div>`} </article>`;
  })} </div> <p class="empty" id="empty" hidden>No results found.</p> </div> ` }));
}, "C:/Users/hrsing/Downloads/Kortex/src/pages/index.astro", void 0);

const $$file = "C:/Users/hrsing/Downloads/Kortex/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
