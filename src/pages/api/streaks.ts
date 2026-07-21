import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { isOwner } from '../../config';
import { getFile, createFile } from '../../lib/github';

const STREAKS_PATH = 'content/streaks.json';

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }
  if (!isOwner(session.username)) {
    return new Response(JSON.stringify({ error: 'Only the owner can update streaks' }), { status: 403 });
  }

  const { noteId } = await request.json();
  if (!noteId || typeof noteId !== 'string') {
    return new Response(JSON.stringify({ error: 'noteId is required' }), { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const existing = await getFile(session.token, STREAKS_PATH);
    const streaks: Record<string, string[]> = existing ? JSON.parse(existing.content) : {};

    if (!streaks[noteId]) streaks[noteId] = [];
    const idx = streaks[noteId].indexOf(today);
    const marked = idx === -1;
    if (marked) {
      streaks[noteId].push(today);
    } else {
      streaks[noteId].splice(idx, 1);
    }

    await createFile(
      session.token,
      STREAKS_PATH,
      JSON.stringify(streaks, null, 2),
      `${marked ? 'Mark' : 'Unmark'} streak: ${noteId} (${today})`,
    );

    return new Response(JSON.stringify({ success: true, marked, dates: streaks[noteId] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
