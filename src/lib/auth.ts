import type { AstroCookies } from 'astro';

const COOKIE_NAME = 'kortex_session';
const COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export interface Session {
  token: string;
  username: string;
  avatar: string;
}

export function setSession(cookies: AstroCookies, session: Session) {
  cookies.set(COOKIE_NAME, JSON.stringify(session), COOKIE_OPTS);
}

export function getSession(cookies: AstroCookies): Session | null {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}
