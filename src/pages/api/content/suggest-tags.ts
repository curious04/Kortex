import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { AI, isAiConfigured } from '../../../config';

const VALID_TYPES = ['note', 'link', 'idea', 'task', 'routine', 'reference', 'doc'];

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  if (!isAiConfigured()) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY is not configured. Add it in your Vercel environment variables.' }),
      { status: 503 },
    );
  }

  const { title, content, existingTitles } = await request.json();
  if (!title && !content) {
    return new Response(JSON.stringify({ error: 'title or content is required' }), { status: 400 });
  }

  const titlePool: string[] = Array.isArray(existingTitles)
    ? existingTitles.filter((t: unknown) => typeof t === 'string').slice(0, 200)
    : [];

  const relatedInstruction = titlePool.length
    ? ` Also pick 0-3 titles from this list of the user's EXISTING notes that are genuinely relevant to link to ` +
      `(only if truly related, otherwise return an empty array — do not force it): ${JSON.stringify(titlePool)}. ` +
      `Return them verbatim (exact spelling) as "related": ["Existing Title", ...].`
    : '';

  try {
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
              'You are a tagging assistant for a personal knowledge base called Kortex. ' +
              'Given a note title and content, respond with ONLY a JSON object: ' +
              `{"type": one of [${VALID_TYPES.join(', ')}], "tags": ["tag1", "tag2", ...], "related": []}. ` +
              'Use 2-5 short, lowercase, single-word-or-hyphenated tags. No explanation, no markdown.' +
              relatedInstruction,
          },
          { role: 'user', content: `Title: ${title || '(none)'}\n\nContent: ${(content || '').slice(0, 4000)}` },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error: ${res.status} — ${errText}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);

    const type = VALID_TYPES.includes(parsed.type) ? parsed.type : 'note';
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 6)
      : [];

    const poolLower = new Map(titlePool.map((t) => [t.toLowerCase(), t]));
    const related = Array.isArray(parsed.related)
      ? parsed.related
          .filter((t: unknown) => typeof t === 'string')
          .map((t: string) => poolLower.get(t.toLowerCase()))
          .filter((t: unknown): t is string => Boolean(t))
          .slice(0, 3)
      : [];

    return new Response(JSON.stringify({ type, tags, related }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Suggestion failed' }), { status: 502 });
  }
};
