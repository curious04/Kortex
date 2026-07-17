import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_Biqo3-S5.mjs';
import 'piccolore';
import { g as getCollection, r as renderEntry, $ as $$Layout } from '../chunks/Layout_CLSe77Iy.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("http://localhost:4321");
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const { slug } = Astro2.params;
  const notes = await getCollection("notes", ({ data }) => data.public !== false);
  const note = notes.find((n) => n.id === slug);
  if (!note) {
    return Astro2.redirect("/");
  }
  const { Content } = await renderEntry(note);
  const date = note.data.updated ?? note.data.created;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": note.data.title }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="wrap"> <article class="article"> <a class="back" href="/">&larr; Back</a> <h1 class="animate-in">${note.data.title}</h1> <div class="meta animate-in delay-1"> <span class="type">${note.data.type}</span> ${date && renderTemplate`<span class="date">${date.toISOString().slice(0, 10)}</span>`} ${note.data.tags.map((t) => renderTemplate`<span class="tag">${t}</span>`)} </div> ${note.data.url && renderTemplate`<a class="linkout animate-in delay-2"${addAttribute(note.data.url, "href")} target="_blank" rel="noopener">
Open link &nearr;
</a>`} ${note.data.attachment && renderTemplate`<a class="linkout animate-in delay-2"${addAttribute(note.data.attachment, "href")} target="_blank" rel="noopener">
Open attachment &nearr;
</a>`} <div class="prose animate-in delay-2"> ${renderComponent($$result2, "Content", Content, {})} </div> </article> </div> ` })}`;
}, "C:/Users/hrsing/Downloads/Kortex/src/pages/[...slug].astro", void 0);

const $$file = "C:/Users/hrsing/Downloads/Kortex/src/pages/[...slug].astro";
const $$url = "/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
