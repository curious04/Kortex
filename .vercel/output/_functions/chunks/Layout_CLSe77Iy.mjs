import { escape } from 'html-escaper';
import { Traverse } from 'neotraverse/modern';
import pLimit from 'p-limit';
import { z } from 'zod';
import { r as removeBase, i as isRemotePath, p as prependForwardSlash } from './path_tbLlI_c1.mjs';
import { V as VALID_INPUT_FORMATS } from './consts_Bd-1c2lz.mjs';
import { A as AstroError, R as RenderUndefinedEntryError, a as createComponent, u as unescapeHTML, b as renderTemplate, U as UnknownContentCollectionError, e as renderUniqueStylesheet, f as renderScriptElement, g as createHeadAndContent, r as renderComponent, c as createAstro, h as defineScriptVars, i as renderSlot, j as renderHead, d as addAttribute, F as Fragment } from './astro/server_Biqo3-S5.mjs';
import 'piccolore';
import * as devalue from 'devalue';
/* empty css                          */
import { i as isOwner, S as SITE } from './config_D_BjX1gx.mjs';
import { g as getSession } from './auth_DMpIRFSQ.mjs';

const CONTENT_IMAGE_FLAG = "astroContentImageFlag";
const IMAGE_IMPORT_PREFIX = "__ASTRO_IMAGE_";

function imageSrcToImportId(imageSrc, filePath) {
  imageSrc = removeBase(imageSrc, IMAGE_IMPORT_PREFIX);
  if (isRemotePath(imageSrc)) {
    return;
  }
  const ext = imageSrc.split(".").at(-1)?.toLowerCase();
  if (!ext || !VALID_INPUT_FORMATS.includes(ext)) {
    return;
  }
  const params = new URLSearchParams(CONTENT_IMAGE_FLAG);
  if (filePath) {
    params.set("importer", filePath);
  }
  return `${imageSrc}?${params.toString()}`;
}

class ImmutableDataStore {
  _collections = /* @__PURE__ */ new Map();
  constructor() {
    this._collections = /* @__PURE__ */ new Map();
  }
  get(collectionName, key) {
    return this._collections.get(collectionName)?.get(String(key));
  }
  entries(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.entries()];
  }
  values(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.values()];
  }
  keys(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.keys()];
  }
  has(collectionName, key) {
    const collection = this._collections.get(collectionName);
    if (collection) {
      return collection.has(String(key));
    }
    return false;
  }
  hasCollection(collectionName) {
    return this._collections.has(collectionName);
  }
  collections() {
    return this._collections;
  }
  /**
   * Attempts to load a DataStore from the virtual module.
   * This only works in Vite.
   */
  static async fromModule() {
    try {
      const data = await import('./_astro_data-layer-content_D-vJieyM.mjs');
      if (data.default instanceof Map) {
        return ImmutableDataStore.fromMap(data.default);
      }
      const map = devalue.unflatten(data.default);
      return ImmutableDataStore.fromMap(map);
    } catch {
    }
    return new ImmutableDataStore();
  }
  static async fromMap(data) {
    const store = new ImmutableDataStore();
    store._collections = data;
    return store;
  }
}
function dataStoreSingleton() {
  let instance = void 0;
  return {
    get: async () => {
      if (!instance) {
        instance = ImmutableDataStore.fromModule();
      }
      return instance;
    },
    set: (store) => {
      instance = store;
    }
  };
}
const globalDataStore = dataStoreSingleton();

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": "http://localhost:4321", "SSR": true};
function createCollectionToGlobResultMap({
  globResult,
  contentDir
}) {
  const collectionToGlobResultMap = {};
  for (const key in globResult) {
    const keyRelativeToContentDir = key.replace(new RegExp(`^${contentDir}`), "");
    const segments = keyRelativeToContentDir.split("/");
    if (segments.length <= 1) continue;
    const collection = segments[0];
    collectionToGlobResultMap[collection] ??= {};
    collectionToGlobResultMap[collection][key] = globResult[key];
  }
  return collectionToGlobResultMap;
}
z.object({
  tags: z.array(z.string()).optional(),
  lastModified: z.date().optional()
});
function createGetCollection({
  contentCollectionToEntryMap,
  dataCollectionToEntryMap,
  getRenderEntryImport,
  cacheEntriesByCollection,
  liveCollections
}) {
  return async function getCollection(collection, filter) {
    if (collection in liveCollections) {
      throw new AstroError({
        ...UnknownContentCollectionError,
        message: `Collection "${collection}" is a live collection. Use getLiveCollection() instead of getCollection().`
      });
    }
    const hasFilter = typeof filter === "function";
    const store = await globalDataStore.get();
    let type;
    if (collection in contentCollectionToEntryMap) {
      type = "content";
    } else if (collection in dataCollectionToEntryMap) {
      type = "data";
    } else if (store.hasCollection(collection)) {
      const { default: imageAssetMap } = await import('./content-assets_DleWbedO.mjs');
      const result = [];
      for (const rawEntry of store.values(collection)) {
        const data = updateImageReferencesInData(rawEntry.data, rawEntry.filePath, imageAssetMap);
        let entry = {
          ...rawEntry,
          data,
          collection
        };
        if (entry.legacyId) {
          entry = emulateLegacyEntry(entry);
        }
        if (hasFilter && !filter(entry)) {
          continue;
        }
        result.push(entry);
      }
      return result;
    } else {
      console.warn(
        `The collection ${JSON.stringify(
          collection
        )} does not exist or is empty. Please check your content config file for errors.`
      );
      return [];
    }
    const lazyImports = Object.values(
      type === "content" ? contentCollectionToEntryMap[collection] : dataCollectionToEntryMap[collection]
    );
    let entries = [];
    if (!Object.assign(__vite_import_meta_env__, { Path: process.env.Path })?.DEV && cacheEntriesByCollection.has(collection)) {
      entries = cacheEntriesByCollection.get(collection);
    } else {
      const limit = pLimit(10);
      entries = await Promise.all(
        lazyImports.map(
          (lazyImport) => limit(async () => {
            const entry = await lazyImport();
            return type === "content" ? {
              id: entry.id,
              slug: entry.slug,
              body: entry.body,
              collection: entry.collection,
              data: entry.data,
              async render() {
                return render({
                  collection: entry.collection,
                  id: entry.id,
                  renderEntryImport: await getRenderEntryImport(collection, entry.slug)
                });
              }
            } : {
              id: entry.id,
              collection: entry.collection,
              data: entry.data
            };
          })
        )
      );
      cacheEntriesByCollection.set(collection, entries);
    }
    if (hasFilter) {
      return entries.filter(filter);
    } else {
      return entries.slice();
    }
  };
}
function emulateLegacyEntry({ legacyId, ...entry }) {
  const legacyEntry = {
    ...entry,
    id: legacyId,
    slug: entry.id
  };
  return {
    ...legacyEntry,
    // Define separately so the render function isn't included in the object passed to `renderEntry()`
    render: () => renderEntry(legacyEntry)
  };
}
const CONTENT_LAYER_IMAGE_REGEX = /__ASTRO_IMAGE_="([^"]+)"/g;
async function updateImageReferencesInBody(html, fileName) {
  const { default: imageAssetMap } = await import('./content-assets_DleWbedO.mjs');
  const imageObjects = /* @__PURE__ */ new Map();
  const { getImage } = await import('./_astro_assets_Cg4_jB8u.mjs').then(n => n._);
  for (const [_full, imagePath] of html.matchAll(CONTENT_LAYER_IMAGE_REGEX)) {
    try {
      const decodedImagePath = JSON.parse(imagePath.replaceAll("&#x22;", '"'));
      let image;
      if (URL.canParse(decodedImagePath.src)) {
        image = await getImage(decodedImagePath);
      } else {
        const id = imageSrcToImportId(decodedImagePath.src, fileName);
        const imported = imageAssetMap.get(id);
        if (!id || imageObjects.has(id) || !imported) {
          continue;
        }
        image = await getImage({ ...decodedImagePath, src: imported });
      }
      imageObjects.set(imagePath, image);
    } catch {
      throw new Error(`Failed to parse image reference: ${imagePath}`);
    }
  }
  return html.replaceAll(CONTENT_LAYER_IMAGE_REGEX, (full, imagePath) => {
    const image = imageObjects.get(imagePath);
    if (!image) {
      return full;
    }
    const { index, ...attributes } = image.attributes;
    return Object.entries({
      ...attributes,
      src: image.src,
      srcset: image.srcSet.attribute,
      // This attribute is used by the toolbar audit
      ...Object.assign(__vite_import_meta_env__, { Path: process.env.Path }).DEV ? { "data-image-component": "true" } : {}
    }).map(([key, value]) => value ? `${key}="${escape(value)}"` : "").join(" ");
  });
}
function updateImageReferencesInData(data, fileName, imageAssetMap) {
  return new Traverse(data).map(function(ctx, val) {
    if (typeof val === "string" && val.startsWith(IMAGE_IMPORT_PREFIX)) {
      const src = val.replace(IMAGE_IMPORT_PREFIX, "");
      const id = imageSrcToImportId(src, fileName);
      if (!id) {
        ctx.update(src);
        return;
      }
      const imported = imageAssetMap?.get(id);
      if (imported) {
        ctx.update(imported);
      } else {
        ctx.update(src);
      }
    }
  });
}
async function renderEntry(entry) {
  if (!entry) {
    throw new AstroError(RenderUndefinedEntryError);
  }
  if ("render" in entry && !("legacyId" in entry)) {
    return entry.render();
  }
  if (entry.deferredRender) {
    try {
      const { default: contentModules } = await import('./content-modules_Dz-S_Wwv.mjs');
      const renderEntryImport = contentModules.get(entry.filePath);
      return render({
        collection: "",
        id: entry.id,
        renderEntryImport
      });
    } catch (e) {
      console.error(e);
    }
  }
  const html = entry?.rendered?.metadata?.imagePaths?.length && entry.filePath ? await updateImageReferencesInBody(entry.rendered.html, entry.filePath) : entry?.rendered?.html;
  const Content = createComponent(() => renderTemplate`${unescapeHTML(html)}`);
  return {
    Content,
    headings: entry?.rendered?.metadata?.headings ?? [],
    remarkPluginFrontmatter: entry?.rendered?.metadata?.frontmatter ?? {}
  };
}
async function render({
  collection,
  id,
  renderEntryImport
}) {
  const UnexpectedRenderError = new AstroError({
    ...UnknownContentCollectionError,
    message: `Unexpected error while rendering ${String(collection)} → ${String(id)}.`
  });
  if (typeof renderEntryImport !== "function") throw UnexpectedRenderError;
  const baseMod = await renderEntryImport();
  if (baseMod == null || typeof baseMod !== "object") throw UnexpectedRenderError;
  const { default: defaultMod } = baseMod;
  if (isPropagatedAssetsModule(defaultMod)) {
    const { collectedStyles, collectedLinks, collectedScripts, getMod } = defaultMod;
    if (typeof getMod !== "function") throw UnexpectedRenderError;
    const propagationMod = await getMod();
    if (propagationMod == null || typeof propagationMod !== "object") throw UnexpectedRenderError;
    const Content = createComponent({
      factory(result, baseProps, slots) {
        let styles = "", links = "", scripts = "";
        if (Array.isArray(collectedStyles)) {
          styles = collectedStyles.map((style) => {
            return renderUniqueStylesheet(result, {
              type: "inline",
              content: style
            });
          }).join("");
        }
        if (Array.isArray(collectedLinks)) {
          links = collectedLinks.map((link) => {
            return renderUniqueStylesheet(result, {
              type: "external",
              src: isRemotePath(link) ? link : prependForwardSlash(link)
            });
          }).join("");
        }
        if (Array.isArray(collectedScripts)) {
          scripts = collectedScripts.map((script) => renderScriptElement(script)).join("");
        }
        let props = baseProps;
        if (id.endsWith("mdx")) {
          props = {
            components: propagationMod.components ?? {},
            ...baseProps
          };
        }
        return createHeadAndContent(
          unescapeHTML(styles + links + scripts),
          renderTemplate`${renderComponent(
            result,
            "Content",
            propagationMod.Content,
            props,
            slots
          )}`
        );
      },
      propagation: "self"
    });
    return {
      Content,
      headings: propagationMod.getHeadings?.() ?? [],
      remarkPluginFrontmatter: propagationMod.frontmatter ?? {}
    };
  } else if (baseMod.Content && typeof baseMod.Content === "function") {
    return {
      Content: baseMod.Content,
      headings: baseMod.getHeadings?.() ?? [],
      remarkPluginFrontmatter: baseMod.frontmatter ?? {}
    };
  } else {
    throw UnexpectedRenderError;
  }
}
function isPropagatedAssetsModule(module) {
  return typeof module === "object" && module != null && "__astroPropagation" in module;
}

// astro-head-inject

const liveCollections = {};

const contentDir = '/src/content/';

const contentEntryGlob = "";
const contentCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: contentEntryGlob,
	contentDir,
});

const dataEntryGlob = "";
const dataCollectionToEntryMap = createCollectionToGlobResultMap({
	globResult: dataEntryGlob,
	contentDir,
});
createCollectionToGlobResultMap({
	globResult: { ...contentEntryGlob, ...dataEntryGlob },
	contentDir,
});

let lookupMap = {};
lookupMap = {};

new Set(Object.keys(lookupMap));

function createGlobLookup(glob) {
	return async (collection, lookupId) => {
		const filePath = lookupMap[collection]?.entries[lookupId];

		if (!filePath) return undefined;
		return glob[collection][filePath];
	};
}

const renderEntryGlob = "";
const collectionToRenderEntryMap = createCollectionToGlobResultMap({
	globResult: renderEntryGlob,
	contentDir,
});

const cacheEntriesByCollection = new Map();
const getCollection = createGetCollection({
	contentCollectionToEntryMap,
	dataCollectionToEntryMap,
	getRenderEntryImport: createGlobLookup(collectionToRenderEntryMap),
	cacheEntriesByCollection,
	liveCollections,
});

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro("http://localhost:4321");
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, description } = Astro2.props;
  const pageTitle = title ? `${title} \u2014 ${SITE.title}` : `${SITE.title} \u2014 ${SITE.tagline}`;
  const session = getSession(Astro2.cookies);
  const owner = session ? isOwner(session.username) : false;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description"', '><meta name="theme-color" content="#0a0a0c"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>', "</title>", '</head> <body> <header class="site-header"> <div class="wrap"> <a class="brand" href="/"> <img class="mark" src="/favicon.svg" alt=""> <span>Kortex</span> <span class="sep">/</span> <span class="sub">second brain</span> </a> <div class="header-spacer"></div> <nav class="header-nav"> ', " </nav> </div> </header> ", ` <footer class="site-footer"> <div class="wrap"> <p>Kortex \u2014 your knowledge, versioned and yours forever.</p> </div> </footer> <!-- Toast container --> <div class="toast-container" id="toasts"></div> <!-- Add Content Modal --> <div class="modal-backdrop" id="modal-add"> <div class="modal"> <h2>Add to your brain</h2> <form id="form-add"> <label for="add-title">Title</label> <input id="add-title" name="title" type="text" placeholder="What's on your mind?" required> <label for="add-type">Type</label> <select id="add-type" name="type"> <option value="note">Note</option> <option value="link">Link</option> <option value="idea">Idea</option> <option value="task">Task</option> <option value="routine">Routine</option> <option value="reference">Reference</option> <option value="doc">Document</option> </select> <label for="add-url">URL (optional)</label> <input id="add-url" name="url" type="url" placeholder="https://..."> <label for="add-tags">Tags (comma-separated)</label> <input id="add-tags" name="tags" type="text" placeholder="ai, productivity, idea"> <label for="add-content">Content</label> <textarea id="add-content" name="content" placeholder="Write anything \u2014 markdown supported..."></textarea> <label>Attach file</label> <div class="file-drop" id="file-drop">
Drop a file here or click to upload
<input type="file" id="file-input" style="display:none"> </div> <div class="actions"> <button type="button" class="btn" id="btn-cancel">Cancel</button> <button type="submit" class="btn primary">Publish</button> </div> </form> </div> </div> <!-- PR Review Modal --> <div class="modal-backdrop" id="modal-pulls"> <div class="modal"> <h2>Pending contributions</h2> <div id="pr-list"> <p style="color:var(--text-tertiary);font-size:0.88rem;">Loading...</p> </div> <div class="actions"> <button type="button" class="btn" id="btn-close-pulls">Close</button> </div> </div> </div> <script>(function(){`, `
      // ========== Toast system ==========
      function toast(message, type = 'info') {
        const el = document.createElement('div');
        el.className = \`toast \${type}\`;
        el.textContent = message;
        document.getElementById('toasts').appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }

      // ========== Add Modal ==========
      const modal = document.getElementById('modal-add');
      const btnAdd = document.getElementById('btn-add');
      const btnCancel = document.getElementById('btn-cancel');
      const form = document.getElementById('form-add');
      const fileDrop = document.getElementById('file-drop');
      const fileInput = document.getElementById('file-input');
      let uploadedFileUrl = null;

      btnAdd?.addEventListener('click', () => modal.classList.add('open'));
      btnCancel?.addEventListener('click', () => modal.classList.remove('open'));
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });

      // File upload
      fileDrop?.addEventListener('click', () => fileInput.click());
      fileInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        fileDrop.textContent = \`Uploading \${file.name}...\`;

        const fd = new FormData();
        fd.append('file', file);

        // Use release endpoint for files > 1MB, regular upload for smaller
        const endpoint = file.size > 1024 * 1024 ? '/api/content/upload-release' : '/api/content/upload';

        try {
          const res = await fetch(endpoint, { method: 'POST', body: fd });
          const data = await res.json();
          if (data.success) {
            uploadedFileUrl = data.url;
            fileDrop.textContent = \`Attached: \${file.name}\`;
            toast('File uploaded successfully', 'success');
          } else {
            throw new Error(data.error);
          }
        } catch (err) {
          fileDrop.textContent = 'Upload failed \u2014 click to retry';
          toast(err.message || 'Upload failed', 'error');
        }
      });

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        if (uploadedFileUrl) {
          data.content = (data.content || '') + \`\\n\\n[Attached file](\${uploadedFileUrl})\`;
        }

        try {
          toast('Saving...', 'info');
          const res = await fetch('/api/content/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await res.json();

          if (result.success) {
            modal.classList.remove('open');
            form.reset();
            uploadedFileUrl = null;
            fileDrop.textContent = 'Drop a file here or click to upload';

            if (result.action === 'committed') {
              toast('Published! Redeploying...', 'success');
            } else if (result.action === 'pr_created') {
              toast('Suggestion submitted as a Pull Request!', 'success');
            }
            // Reload after short delay to show updated content
            setTimeout(() => location.reload(), 2000);
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
          toast(err.message || 'Something went wrong', 'error');
        }
      });

      // ========== PR Review Modal ==========
      const modalPulls = document.getElementById('modal-pulls');
      const btnPulls = document.getElementById('btn-pulls');
      const btnClosePulls = document.getElementById('btn-close-pulls');
      const prList = document.getElementById('pr-list');

      btnPulls?.addEventListener('click', async () => {
        modalPulls.classList.add('open');
        prList.innerHTML = '<p style="color:var(--text-tertiary);font-size:0.88rem;">Loading...</p>';

        try {
          const res = await fetch('/api/pulls');
          const pulls = await res.json();

          if (!pulls.length) {
            prList.innerHTML = '<p style="color:var(--text-tertiary);font-size:0.88rem;">No pending contributions.</p>';
            return;
          }

          prList.innerHTML = pulls.map(pr => \`
            <div class="pr-item">
              <img class="avatar" src="\${pr.avatar}" alt="\${pr.user}" />
              <div class="pr-info">
                <div class="pr-title">\${pr.title}</div>
                <div class="pr-meta">by @\${pr.user} \xB7 \${new Date(pr.created).toLocaleDateString()}</div>
              </div>
              <div class="pr-actions">
                <button class="btn sm primary" onclick="handlePR(\${pr.number}, 'merge')">Merge</button>
                <button class="btn sm" onclick="handlePR(\${pr.number}, 'close')">Close</button>
              </div>
            </div>
          \`).join('');
        } catch (err) {
          prList.innerHTML = '<p style="color:var(--text-tertiary);">Failed to load PRs</p>';
        }
      });

      btnClosePulls?.addEventListener('click', () => modalPulls.classList.remove('open'));
      modalPulls?.addEventListener('click', (e) => {
        if (e.target === modalPulls) modalPulls.classList.remove('open');
      });

      window.handlePR = async function(number, action) {
        try {
          const res = await fetch('/api/pulls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, action }),
          });
          const result = await res.json();
          if (result.success) {
            toast(\`PR \${action === 'merge' ? 'merged' : 'closed'} successfully!\`, 'success');
            btnPulls.click(); // Refresh list
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
          toast(err.message || 'Action failed', 'error');
        }
      };

      // ========== Scroll animations ==========
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );
      document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    })();<\/script> </body> </html>`], ['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description"', '><meta name="theme-color" content="#0a0a0c"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>', "</title>", '</head> <body> <header class="site-header"> <div class="wrap"> <a class="brand" href="/"> <img class="mark" src="/favicon.svg" alt=""> <span>Kortex</span> <span class="sep">/</span> <span class="sub">second brain</span> </a> <div class="header-spacer"></div> <nav class="header-nav"> ', " </nav> </div> </header> ", ` <footer class="site-footer"> <div class="wrap"> <p>Kortex \u2014 your knowledge, versioned and yours forever.</p> </div> </footer> <!-- Toast container --> <div class="toast-container" id="toasts"></div> <!-- Add Content Modal --> <div class="modal-backdrop" id="modal-add"> <div class="modal"> <h2>Add to your brain</h2> <form id="form-add"> <label for="add-title">Title</label> <input id="add-title" name="title" type="text" placeholder="What's on your mind?" required> <label for="add-type">Type</label> <select id="add-type" name="type"> <option value="note">Note</option> <option value="link">Link</option> <option value="idea">Idea</option> <option value="task">Task</option> <option value="routine">Routine</option> <option value="reference">Reference</option> <option value="doc">Document</option> </select> <label for="add-url">URL (optional)</label> <input id="add-url" name="url" type="url" placeholder="https://..."> <label for="add-tags">Tags (comma-separated)</label> <input id="add-tags" name="tags" type="text" placeholder="ai, productivity, idea"> <label for="add-content">Content</label> <textarea id="add-content" name="content" placeholder="Write anything \u2014 markdown supported..."></textarea> <label>Attach file</label> <div class="file-drop" id="file-drop">
Drop a file here or click to upload
<input type="file" id="file-input" style="display:none"> </div> <div class="actions"> <button type="button" class="btn" id="btn-cancel">Cancel</button> <button type="submit" class="btn primary">Publish</button> </div> </form> </div> </div> <!-- PR Review Modal --> <div class="modal-backdrop" id="modal-pulls"> <div class="modal"> <h2>Pending contributions</h2> <div id="pr-list"> <p style="color:var(--text-tertiary);font-size:0.88rem;">Loading...</p> </div> <div class="actions"> <button type="button" class="btn" id="btn-close-pulls">Close</button> </div> </div> </div> <script>(function(){`, `
      // ========== Toast system ==========
      function toast(message, type = 'info') {
        const el = document.createElement('div');
        el.className = \\\`toast \\\${type}\\\`;
        el.textContent = message;
        document.getElementById('toasts').appendChild(el);
        setTimeout(() => el.remove(), 4500);
      }

      // ========== Add Modal ==========
      const modal = document.getElementById('modal-add');
      const btnAdd = document.getElementById('btn-add');
      const btnCancel = document.getElementById('btn-cancel');
      const form = document.getElementById('form-add');
      const fileDrop = document.getElementById('file-drop');
      const fileInput = document.getElementById('file-input');
      let uploadedFileUrl = null;

      btnAdd?.addEventListener('click', () => modal.classList.add('open'));
      btnCancel?.addEventListener('click', () => modal.classList.remove('open'));
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });

      // File upload
      fileDrop?.addEventListener('click', () => fileInput.click());
      fileInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        fileDrop.textContent = \\\`Uploading \\\${file.name}...\\\`;

        const fd = new FormData();
        fd.append('file', file);

        // Use release endpoint for files > 1MB, regular upload for smaller
        const endpoint = file.size > 1024 * 1024 ? '/api/content/upload-release' : '/api/content/upload';

        try {
          const res = await fetch(endpoint, { method: 'POST', body: fd });
          const data = await res.json();
          if (data.success) {
            uploadedFileUrl = data.url;
            fileDrop.textContent = \\\`Attached: \\\${file.name}\\\`;
            toast('File uploaded successfully', 'success');
          } else {
            throw new Error(data.error);
          }
        } catch (err) {
          fileDrop.textContent = 'Upload failed \u2014 click to retry';
          toast(err.message || 'Upload failed', 'error');
        }
      });

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        if (uploadedFileUrl) {
          data.content = (data.content || '') + \\\`\\\\n\\\\n[Attached file](\\\${uploadedFileUrl})\\\`;
        }

        try {
          toast('Saving...', 'info');
          const res = await fetch('/api/content/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await res.json();

          if (result.success) {
            modal.classList.remove('open');
            form.reset();
            uploadedFileUrl = null;
            fileDrop.textContent = 'Drop a file here or click to upload';

            if (result.action === 'committed') {
              toast('Published! Redeploying...', 'success');
            } else if (result.action === 'pr_created') {
              toast('Suggestion submitted as a Pull Request!', 'success');
            }
            // Reload after short delay to show updated content
            setTimeout(() => location.reload(), 2000);
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
          toast(err.message || 'Something went wrong', 'error');
        }
      });

      // ========== PR Review Modal ==========
      const modalPulls = document.getElementById('modal-pulls');
      const btnPulls = document.getElementById('btn-pulls');
      const btnClosePulls = document.getElementById('btn-close-pulls');
      const prList = document.getElementById('pr-list');

      btnPulls?.addEventListener('click', async () => {
        modalPulls.classList.add('open');
        prList.innerHTML = '<p style="color:var(--text-tertiary);font-size:0.88rem;">Loading...</p>';

        try {
          const res = await fetch('/api/pulls');
          const pulls = await res.json();

          if (!pulls.length) {
            prList.innerHTML = '<p style="color:var(--text-tertiary);font-size:0.88rem;">No pending contributions.</p>';
            return;
          }

          prList.innerHTML = pulls.map(pr => \\\`
            <div class="pr-item">
              <img class="avatar" src="\\\${pr.avatar}" alt="\\\${pr.user}" />
              <div class="pr-info">
                <div class="pr-title">\\\${pr.title}</div>
                <div class="pr-meta">by @\\\${pr.user} \xB7 \\\${new Date(pr.created).toLocaleDateString()}</div>
              </div>
              <div class="pr-actions">
                <button class="btn sm primary" onclick="handlePR(\\\${pr.number}, 'merge')">Merge</button>
                <button class="btn sm" onclick="handlePR(\\\${pr.number}, 'close')">Close</button>
              </div>
            </div>
          \\\`).join('');
        } catch (err) {
          prList.innerHTML = '<p style="color:var(--text-tertiary);">Failed to load PRs</p>';
        }
      });

      btnClosePulls?.addEventListener('click', () => modalPulls.classList.remove('open'));
      modalPulls?.addEventListener('click', (e) => {
        if (e.target === modalPulls) modalPulls.classList.remove('open');
      });

      window.handlePR = async function(number, action) {
        try {
          const res = await fetch('/api/pulls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, action }),
          });
          const result = await res.json();
          if (result.success) {
            toast(\\\`PR \\\${action === 'merge' ? 'merged' : 'closed'} successfully!\\\`, 'success');
            btnPulls.click(); // Refresh list
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
          toast(err.message || 'Action failed', 'error');
        }
      };

      // ========== Scroll animations ==========
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-in');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );
      document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    })();<\/script> </body> </html>`])), addAttribute(description ?? SITE.description, "content"), pageTitle, renderHead(), session ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate`${owner && renderTemplate`<button class="btn sm" id="btn-pulls" title="Review contributions">
PRs
</button>`}<button class="btn primary" id="btn-add">
+ Add
</button> <img class="avatar"${addAttribute(session.avatar, "src")}${addAttribute(session.username, "alt")}${addAttribute(session.username, "title")}> <a class="btn sm" href="/api/auth/logout">Sign out</a> ` })}` : renderTemplate`<a class="btn" href="/api/auth/login">Sign in with GitHub</a>`, renderSlot($$result, $$slots["default"]), defineScriptVars({ owner }));
}, "C:/Users/hrsing/Downloads/Kortex/src/layouts/Layout.astro", void 0);

export { $$Layout as $, getCollection as g, renderEntry as r };
