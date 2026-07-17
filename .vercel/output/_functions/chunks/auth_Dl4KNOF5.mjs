const COOKIE_NAME = "kortex_session";
const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30
  // 30 days
};
function setSession(cookies, session) {
  cookies.set(COOKIE_NAME, JSON.stringify(session), COOKIE_OPTS);
}
function getSession(cookies) {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function clearSession(cookies) {
  cookies.delete(COOKIE_NAME, { path: "/" });
}

export { clearSession as c, getSession as g, setSession as s };
