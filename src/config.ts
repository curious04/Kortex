export const SITE = {
  title: 'Kortex',
  tagline: 'My second brain',
  description:
    'A calm, personal knowledge hub — notes, links, ideas, tasks and files, all in one place.',
  /**
   * Fill these in AFTER you create your GitHub repo.
   * This unlocks the "+ Add" quick-capture button and the "Suggest" (contribute) button.
   * Example: owner: 'hrsing', repo: 'Kortex'
   */
  github: {
    owner: 'curious04', // your GitHub username
    repo: 'Kortex',
    branch: 'main',
  },
};

export function isGithubConfigured() {
  return Boolean(SITE.github.owner);
}

/** URL that opens GitHub's "create new file" page in your content folder (quick add for you). */
export function newEntryUrl() {
  const { owner, repo, branch } = SITE.github;
  return `https://github.com/${owner}/${repo}/new/${branch}?filename=content/notes/new-note.md`;
}

/** URL to open the repo (used by the "Suggest" / contribute button for visitors). */
export function repoUrl() {
  const { owner, repo } = SITE.github;
  return `https://github.com/${owner}/${repo}`;
}
