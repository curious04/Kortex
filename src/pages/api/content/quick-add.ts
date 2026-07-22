import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { AI, isAiConfigured } from '../../../config';
import { saveNote } from '../../../lib/notes';

const VALID_TYPES = ['note', 'link', 'idea', 'task', 'routine', 'reference', 'doc'];

/** Simple heuristic used when AI isn't configured (or fails) — still always works. */
function fallbackMeta(text: string) {
  const firstLine = text
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean);
  const title = (firstLine || 'Untitled note').replace(/^#+\s*/, '').slice(0, 80);
  const urlMatch = text.match(/https?:\/\/\S+/);
  return { title, type: (urlMatch ? 'link' : 'note') as string, tags: [] as string[], url: urlMatch?.[0] };
}

async function analyzeWithAi(text: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a filing assistant for a personal knowledge base called Kortex. The user pastes raw, ' +
            'unstructured text (a thought, a link, a task, meeting notes, anything) and you decide how to file it. ' +
            'Respond with ONLY a JSON object: ' +
            `{"title": "short descriptive title, max 80 chars, no surrounding quotes", "type": one of [${VALID_TYPES.join(', ')}], ` +
            '"tags": ["tag1", "tag2"], "url": "https://... or null"}. ' +
            'Pick "link" only if a URL is clearly the main subject of the text (put that URL in "url"). ' +
            'Pick "task" for to-dos/reminders, "idea" for thoughts/brainstorms, "routine" for recurring habits, ' +
            '"reference" for facts/cheatsheets/lookup info, "doc" for longer structured writeups, otherwise "note". ' +
            'Use 2-5 short, lowercase, single-word-or-hyphenated tags. Do not restate the whole text in the title. ' +
            'No explanation, no markdown.',
        },
        { role: 'user', content: text.slice(0, 6000) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const json = await res.json();
  const parsed = JSON.parse(json.choices?.[0]?.message?.content);

  const type = VALID_TYPES.includes(parsed.type) ? parsed.type : 'note';
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 6)
    : [];
  const title = (typeof parsed.title === 'string' && parsed.title.trim()) || fallbackMeta(text).title;
  const url = typeof parsed.url === 'string' && /^https?:\/\//.test(parsed.url) ? parsed.url : undefined;

  return { title: title.slice(0, 120), type, tags, url };
}

/** Quick capture: user pastes raw text, AI (or a heuristic fallback) decides title/type/tags, and it's published immediately. */
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const body = await request.json();
  const text = String(body?.text ?? '').trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'Some content is required' }), { status: 400 });
  }

  let meta: { title: string; type: string; tags: string[]; url?: string };
  try {
    meta = isAiConfigured() ? await analyzeWithAi(text) : fallbackMeta(text);
  } catch {
    meta = fallbackMeta(text);
  }

  try {
    const result = await saveNote(session, {
      title: meta.title,
      type: meta.type,
      tags: meta.tags.join(', '),
      url: meta.url,
      content: text,
    });
    return new Response(
      JSON.stringify({ ...result, title: meta.title, type: meta.type, tags: meta.tags }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
