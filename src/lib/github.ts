import { SITE } from '../config';

const API = 'https://api.github.com';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/** Get the authenticated user's profile */
export async function getUser(token: string) {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

/** Look up a public GitHub user profile by username (returns null if not found) */
export async function getGithubUser(token: string, username: string) {
  const res = await fetch(`${API}/users/${encodeURIComponent(username)}`, { headers: headers(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to look up GitHub user: ${res.status}`);
  const data = await res.json();
  return { login: data.login as string, email: (data.email as string | null) ?? null, avatarUrl: data.avatar_url as string };
}

/** Search for a GitHub user by their public email (only finds emails set as public on the profile) */
export async function findGithubUserByEmail(token: string, email: string) {
  const res = await fetch(`${API}/search/users?q=${encodeURIComponent(email)}+in:email`, {
    headers: headers(token),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const first = data.items?.[0];
  return first ? { login: first.login as string } : null;
}


/** Read a file's content (or null if it doesn't exist) */
export async function getFile(token: string, path: string, branch?: string) {
  const { owner, repo } = SITE.github;
  const b = branch ?? SITE.github.branch;
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}?ref=${b}`, {
    headers: headers(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to read file: ${res.status}`);
  const data = await res.json();
  const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
  return { content, sha: data.sha as string };
}

/** Create or update a file in the repo (or a fork, when `repoOverride` is given) */
export async function createFile(
  token: string,
  path: string,
  content: string,
  message: string,
  branch?: string,
  repoOverride?: { owner: string; repo: string },
) {
  const { owner, repo } = repoOverride ?? SITE.github;
  const b = branch ?? SITE.github.branch;

  // Check if file exists (for updates we need the sha)
  let sha: string | undefined;
  const existing = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}?ref=${b}`, {
    headers: headers(token),
  });
  if (existing.ok) {
    const data = await existing.json();
    sha = data.sha;
  }

  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: b,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} — ${err}`);
  }
  return res.json();
}

/** Delete a file from the repo */
export async function deleteFile(token: string, path: string, message: string, branch?: string) {
  const { owner, repo } = SITE.github;
  const b = branch ?? SITE.github.branch;

  const existing = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}?ref=${b}`, {
    headers: headers(token),
  });
  if (!existing.ok) throw new Error('File not found');
  const data = await existing.json();

  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE',
    headers: headers(token),
    body: JSON.stringify({ message, sha: data.sha, branch: b }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Delete failed: ${res.status} — ${err}`);
  }
  return res.json();
}

/** Upload a binary file (image) to the repo */
export async function uploadFile(
  token: string,
  path: string,
  base64Content: string,
  message: string,
  branch?: string,
) {
  const { owner, repo } = SITE.github;
  const b = branch ?? SITE.github.branch;

  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: b,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} — ${err}`);
  }
  return res.json();
}

/** Upload a large file as a GitHub Release asset (free, no LFS needed) */
export async function uploadToRelease(
  token: string,
  fileName: string,
  fileBuffer: ArrayBuffer,
  contentType: string,
) {
  const { owner, repo } = SITE.github;

  // Get or create a release tagged "assets"
  let release: any;
  const existing = await fetch(`${API}/repos/${owner}/${repo}/releases/tags/assets`, {
    headers: headers(token),
  });

  if (existing.ok) {
    release = await existing.json();
  } else {
    const createRes = await fetch(`${API}/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        tag_name: 'assets',
        name: 'Kortex Assets',
        body: 'Large files stored here (PDFs, images, etc.)',
        draft: false,
      }),
    });
    if (!createRes.ok) throw new Error('Failed to create release');
    release = await createRes.json();
  }

  // Upload the file as a release asset
  const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(fileName)}`);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...headers(token),
      'Content-Type': contentType,
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Release upload failed: ${uploadRes.status} — ${err}`);
  }
  return uploadRes.json();
}

/** Create a fork + branch + PR for a contributor */
export async function createContributionPR(
  token: string,
  username: string,
  path: string,
  content: string,
  title: string,
) {
  const { owner, repo, branch: mainBranch } = SITE.github;

  // 1. Fork the repo (if not already forked, GitHub handles idempotently)
  await fetch(`${API}/repos/${owner}/${repo}/forks`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ default_branch_only: true }),
  });

  // Wait a moment for fork to be ready
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Get latest commit SHA from main
  const refRes = await fetch(`${API}/repos/${username}/${repo}/git/ref/heads/${mainBranch}`, {
    headers: headers(token),
  });
  if (!refRes.ok) throw new Error('Fork not ready — try again in a moment');
  const refData = await refRes.json();
  const baseSha = refData.object.sha;

  // 3. Create a new branch in the fork
  const branchName = `kortex-${Date.now()}`;
  const branchRes = await fetch(`${API}/repos/${username}/${repo}/git/refs`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    }),
  });
  if (!branchRes.ok) {
    const err = await branchRes.text();
    throw new Error(`Branch creation failed: ${branchRes.status} — ${err}`);
  }

  // 4. Create file in the new branch — this must target the *fork*
  // (username/repo), not the upstream repo, since that's where `branchName`
  // actually exists. Passing no repoOverride here would silently PUT against
  // `${owner}/${repo}` with a branch ref that only exists in the fork, which
  // GitHub's contents API reports as a 404 "Not Found".
  await createFile(token, path, content, `Add: ${title}`, branchName, { owner: username, repo });

  // 5. Create PR from fork to upstream
  const prRes = await fetch(`${API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      title: `[Kortex] ${title}`,
      body: `Suggested by @${username} via Kortex UI`,
      head: `${username}:${branchName}`,
      base: mainBranch,
    }),
  });

  if (!prRes.ok) {
    const err = await prRes.text();
    throw new Error(`PR creation failed: ${prRes.status} — ${err}`);
  }
  return prRes.json();
}

/** List open PRs */
export async function listPulls(token: string) {
  const { owner, repo } = SITE.github;
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls?state=open&per_page=30`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error('Failed to list PRs');
  return res.json();
}

/** Merge a PR */
export async function mergePull(token: string, pullNumber: number) {
  const { owner, repo } = SITE.github;
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ merge_method: 'squash' }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Merge failed: ${res.status} — ${err}`);
  }
  return res.json();
}

/** Close a PR without merging */
export async function closePull(token: string, pullNumber: number) {
  const { owner, repo } = SITE.github;
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${pullNumber}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ state: 'closed' }),
  });
  if (!res.ok) throw new Error('Failed to close PR');
  return res.json();
}
