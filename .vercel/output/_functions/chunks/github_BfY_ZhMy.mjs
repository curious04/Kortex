import { S as SITE } from './config_Be36SAIC.mjs';

const API = "https://api.github.com";
function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}
async function getUser(token) {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}
async function createFile(token, path, content, message, branch) {
  const { owner, repo } = SITE.github;
  const b = branch ?? SITE.github.branch;
  let sha;
  const existing = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}?ref=${b}`, {
    headers: headers(token)
  });
  if (existing.ok) {
    const data = await existing.json();
    sha = data.sha;
  }
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: b,
      ...sha ? { sha } : {}
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} — ${err}`);
  }
  return res.json();
}
async function uploadFile(token, path, base64Content, message, branch) {
  const { owner, repo } = SITE.github;
  const b = SITE.github.branch;
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: b
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} — ${err}`);
  }
  return res.json();
}
async function uploadToRelease(token, fileName, fileBuffer, contentType) {
  const { owner, repo } = SITE.github;
  let release;
  const existing = await fetch(`${API}/repos/${owner}/${repo}/releases/tags/assets`, {
    headers: headers(token)
  });
  if (existing.ok) {
    release = await existing.json();
  } else {
    const createRes = await fetch(`${API}/repos/${owner}/${repo}/releases`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        tag_name: "assets",
        name: "Kortex Assets",
        body: "Large files stored here (PDFs, images, etc.)",
        draft: false
      })
    });
    if (!createRes.ok) throw new Error("Failed to create release");
    release = await createRes.json();
  }
  const uploadUrl = release.upload_url.replace("{?name,label}", `?name=${encodeURIComponent(fileName)}`);
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      ...headers(token),
      "Content-Type": contentType
    },
    body: fileBuffer
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Release upload failed: ${uploadRes.status} — ${err}`);
  }
  return uploadRes.json();
}
async function createContributionPR(token, username, path, content, title) {
  const { owner, repo, branch: mainBranch } = SITE.github;
  await fetch(`${API}/repos/${owner}/${repo}/forks`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ default_branch_only: true })
  });
  await new Promise((r) => setTimeout(r, 2e3));
  const refRes = await fetch(`${API}/repos/${username}/${repo}/git/ref/heads/${mainBranch}`, {
    headers: headers(token)
  });
  if (!refRes.ok) throw new Error("Fork not ready — try again in a moment");
  const refData = await refRes.json();
  const baseSha = refData.object.sha;
  const branchName = `kortex-${Date.now()}`;
  await fetch(`${API}/repos/${username}/${repo}/git/refs`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    })
  });
  await createFile(token, path, content, `Add: ${title}`, branchName);
  const prRes = await fetch(`${API}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      title: `[Kortex] ${title}`,
      body: `Suggested by @${username} via Kortex UI`,
      head: `${username}:${branchName}`,
      base: mainBranch
    })
  });
  if (!prRes.ok) {
    const err = await prRes.text();
    throw new Error(`PR creation failed: ${prRes.status} — ${err}`);
  }
  return prRes.json();
}
async function listPulls(token) {
  const { owner, repo } = SITE.github;
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls?state=open&per_page=30`, {
    headers: headers(token)
  });
  if (!res.ok) throw new Error("Failed to list PRs");
  return res.json();
}
async function mergePull(token, pullNumber) {
  const { owner, repo } = SITE.github;
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({ merge_method: "squash" })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Merge failed: ${res.status} — ${err}`);
  }
  return res.json();
}
async function closePull(token, pullNumber) {
  const { owner, repo } = SITE.github;
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls/${pullNumber}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ state: "closed" })
  });
  if (!res.ok) throw new Error("Failed to close PR");
  return res.json();
}

export { createContributionPR as a, uploadFile as b, createFile as c, closePull as d, getUser as g, listPulls as l, mergePull as m, uploadToRelease as u };
