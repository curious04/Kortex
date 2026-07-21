import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getSession } from '../../../lib/auth';
import { isOwner, AI, isAiConfigured } from '../../../config';

function stripFrontmatter(body?: string) {
  return (body || '').replace(/^---[\s\S]*?---/, '').trim();
}

function excerpt(body?: string, max = 700) {
  return stripFrontmatter(body).slice(0, max);
}

/** Very small keyword-overlap ranker — good enough for a personal note collection without a vector DB. */
function relevance(question: string, text: string) {
  const words = question.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const lower = text.toLowerCase();
  return words.reduce((sum, w) => sum + (lower.includes(w) ? 1 : 0), 0);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAiConfigured()) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY is not configured. Add it in your Vercel environment variables.' }),
      { status: 503 },
    );
  }

  const { question } = await request.json();
  if (!question || !String(question).trim()) {
    return new Response(JSON.stringify({ error: 'question is required' }), { status: 400 });
  }

  const session = getSession(cookies);
  const includePrivate = Boolean(session && isOwner(session.username));

  const notes = await getCollection('notes', ({ data }) => includePrivate || data.public !== false);

  if (!notes.length) {
    return new Response(
      JSON.stringify({ answer: "You don't have any notes yet — add some content to Kortex first!", sources: [] }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  const ranked = notes
    .map((n) => ({
      title: n.data.title,
      body: excerpt(n.body),
      score: relevance(question, `${n.data.title} ${n.body || ''} ${(n.data.tags || []).join(' ')}`),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .filter((n, i) => i < 3 || n.score > 0);

  const context = ranked.map((n, i) => `[${i + 1}] "${n.title}"\n${n.body}`).join('\n\n---\n\n');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are Kortex Brain, an assistant that answers questions using ONLY the numbered notes given as context. ' +
              "If the answer isn't in the notes, say you don't have that information saved yet — don't make things up. " +
              'Keep answers concise. When you use a note, cite it inline like [1], matching the numbers given.',
          },
          { role: 'user', content: `Notes:\n\n${context}\n\n---\n\nQuestion: ${question}` },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error: ${res.status} — ${errText}`);
    }

    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content || 'No answer generated.';

    return new Response(JSON.stringify({ answer, sources: ranked.map((n) => n.title) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Ask failed' }), { status: 502 });
  }
};
