import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CMFwqG51.mjs';
import { manifest } from './manifest_Da_D5ulA.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/auth/callback.astro.mjs');
const _page2 = () => import('./pages/api/auth/login.astro.mjs');
const _page3 = () => import('./pages/api/auth/logout.astro.mjs');
const _page4 = () => import('./pages/api/auth/me.astro.mjs');
const _page5 = () => import('./pages/api/content/create.astro.mjs');
const _page6 = () => import('./pages/api/content/upload.astro.mjs');
const _page7 = () => import('./pages/api/content/upload-release.astro.mjs');
const _page8 = () => import('./pages/api/pulls.astro.mjs');
const _page9 = () => import('./pages/index.astro.mjs');
const _page10 = () => import('./pages/_---slug_.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/auth/callback.ts", _page1],
    ["src/pages/api/auth/login.ts", _page2],
    ["src/pages/api/auth/logout.ts", _page3],
    ["src/pages/api/auth/me.ts", _page4],
    ["src/pages/api/content/create.ts", _page5],
    ["src/pages/api/content/upload.ts", _page6],
    ["src/pages/api/content/upload-release.ts", _page7],
    ["src/pages/api/pulls.ts", _page8],
    ["src/pages/index.astro", _page9],
    ["src/pages/[...slug].astro", _page10]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "7685ea30-3b31-42bb-909d-bd74ef67b55c",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
