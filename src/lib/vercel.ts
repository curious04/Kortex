const VERCEL_TOKEN = (process.env.VERCEL_TOKEN ?? '').trim();
const VERCEL_PROJECT_ID = (process.env.VERCEL_PROJECT_ID ?? '').trim();
const VERCEL_TEAM_ID = (process.env.VERCEL_TEAM_ID ?? '').trim();

/** Whether Vercel deployment-status polling is set up (both a token and project id are required) */
export function isVercelConfigured() {
  return Boolean(VERCEL_TOKEN && VERCEL_PROJECT_ID);
}

/**
 * Look up the most recent Vercel deployment created for a given git commit SHA.
 * Returns null if no deployment is found yet (e.g. GitHub hasn't notified Vercel yet).
 */
export async function getDeploymentForCommit(sha: string) {
  const params = new URLSearchParams({ projectId: VERCEL_PROJECT_ID, sha, limit: '5' });
  if (VERCEL_TEAM_ID) params.set('teamId', VERCEL_TEAM_ID);

  const res = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Vercel API error: ${res.status}`);
  const data = await res.json();
  const deployment = data.deployments?.[0];
  if (!deployment) return null;

  return {
    id: deployment.uid as string,
    state: (deployment.readyState ?? deployment.state) as string,
    url: deployment.url as string,
  };
}
