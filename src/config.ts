export const SITE = {
  title: 'Kortex',
  tagline: 'Second brain',
  description:
    'Your personal knowledge hub — notes, links, ideas, tasks and files. All in one place, accessible anywhere.',
  github: {
    owner: 'curious04',
    repo: 'Kortex',
    branch: 'main',
  },
};

/** GitHub OAuth App settings — set these in your Vercel environment variables */
export const AUTH = {
  clientId: (process.env.GITHUB_CLIENT_ID ?? '').replace(/\s/g, ''),
  // Strip non-printable chars — copy-pasted secrets can contain invisible characters
  clientSecret: (process.env.GITHUB_CLIENT_SECRET ?? '').replace(/[^\x21-\x7E]/g, ''),
  callbackUrl: (process.env.AUTH_CALLBACK_URL ?? 'https://kortex-sandy.vercel.app/api/auth/callback').trim(),
};

export function isGithubConfigured() {
  return Boolean(SITE.github.owner);
}

/**
 * Who can edit/delete content directly (no PR needed). Defaults to just the repo owner.
 * Add more GitHub usernames via the KORTEX_OWNERS env var, comma-separated, e.g.
 * KORTEX_OWNERS=alice,bob
 */
export const OWNERS: string[] = (process.env.KORTEX_OWNERS ?? SITE.github.owner)
  .split(',')
  .map((u) => u.trim().toLowerCase())
  .filter(Boolean);

/** Groq API (free tier) — used for optional AI tag/type suggestions */
export const AI = {
  groqApiKey: (process.env.GROQ_API_KEY ?? '').replace(/\s/g, ''),
};

export function isAiConfigured() {
  return Boolean(AI.groqApiKey);
}

export function isOwner(username: string) {
  return OWNERS.includes(username.toLowerCase());
}

export function repoUrl() {
  const { owner, repo } = SITE.github;
  return `https://github.com/${owner}/${repo}`;
}
