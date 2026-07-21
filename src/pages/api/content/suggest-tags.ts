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

  const { title, content } = await request.json();
  if (!title && !content) {
    return new Response(JSON.stringify({ error: 'title or content is required' }), { status: 400 });
  }

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
              `{"type": one of [${VALID_TYPES.join(', ')}], "tags": ["tag1", "tag2", ...]}. ` +
              'Use 2-5 short, lowercase, single-word-or-hyphenated tags. No explanation, no markdown.',
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

    return new Response(JSON.stringify({ type, tags }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Suggestion failed' }), { status: 502 });
  }
};
