import type { APIRoute } from 'astro';
import { clearSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect('/');
};
