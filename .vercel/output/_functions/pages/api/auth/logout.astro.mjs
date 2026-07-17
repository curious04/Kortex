import { c as clearSession } from '../../../chunks/auth_Dl4KNOF5.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect("/");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
