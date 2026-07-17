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

/** GitHub OAuth App settings — set these in your .env file */
export const AUTH = {
  clientId: import.meta.env.GITHUB_CLIENT_ID ?? '',
  clientSecret: import.meta.env.GITHUB_CLIENT_SECRET ?? '',
  callbackUrl: import.meta.env.AUTH_CALLBACK_URL ?? 'http://localhost:4321/api/auth/callback',
};

export function isGithubConfigured() {
  return Boolean(SITE.github.owner);
}

export function isOwner(username: string) {
  return username.toLowerCase() === SITE.github.owner.toLowerCase();
}

export function repoUrl() {
  const { owner, repo } = SITE.github;
  return `https://github.com/${owner}/${repo}`;
}
