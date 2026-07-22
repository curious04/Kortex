import { isOwner, OWNERS, NOTIFY_EMAILS } from '../config';
import { createFile, getFile, getGithubUser, findGithubUserByEmail } from './github';
import { isEmailConfigured, sendOwnerInviteEmail } from './email';
import type { Session } from './auth';

const OWNERS_PATH = 'content/owners.json';

export interface DynamicOwner {
  username: string;
  email?: string;
  addedAt: string;
  addedBy: string;
}

/** Reads the UI-managed owners list committed to the repo (empty array if it doesn't exist yet). */
export async function getDynamicOwners(token: string): Promise<DynamicOwner[]> {
  try {
    const file = await getFile(token, OWNERS_PATH);
    if (!file) return [];
    const parsed = JSON.parse(file.content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Owner check that accounts for both KORTEX_OWNERS (env) and UI-added owners. */
export async function isOwnerAsync(token: string, username: string): Promise<boolean> {
  if (isOwner(username)) return true;
  const dynamic = await getDynamicOwners(token);
  const lower = username.toLowerCase();
  return dynamic.some((o) => o.username.toLowerCase() === lower);
}

/** Combined list for the Owners UI — env-configured owners are flagged as non-removable. */
export async function listOwners(token: string) {
  const dynamic = await getDynamicOwners(token);
  const staticList = OWNERS.map((username) => ({ username, isStatic: true as const }));
  const dynamicList = dynamic.map((o) => ({ ...o, isStatic: false as const }));
  return [...staticList, ...dynamicList];
}

/** Resolves a best-effort email address for every current owner (env-configured +
 * UI-added), for notification purposes. UI-added owners use their stored email if
 * set; anyone without a stored email falls back to their public GitHub profile
 * email (if they have one listed). Owners we can't resolve an email for are simply
 * skipped — this is used for optional notifications, never for anything critical.
 * Also always includes any addresses from KORTEX_NOTIFY_EMAIL, so notifications
 * work even if no owner has a public GitHub email set. */
export async function getOwnerEmails(token: string): Promise<string[]> {
  const dynamic = await getDynamicOwners(token);
  const dynamicByUsername = new Map(dynamic.map((o) => [o.username.toLowerCase(), o]));
  const allUsernames = new Set<string>([...OWNERS, ...dynamic.map((o) => o.username.toLowerCase())]);

  const emails = new Set<string>(NOTIFY_EMAILS);
  for (const username of allUsernames) {
    const stored = dynamicByUsername.get(username)?.email;
    if (stored) {
      emails.add(stored);
      continue;
    }
    try {
      const ghUser = await getGithubUser(token, username);
      if (ghUser?.email) emails.add(ghUser.email);
    } catch {
      // best-effort — skip owners we can't resolve an email for
    }
  }
  return [...emails];
}

/** Accepts either a raw GitHub username or an email address connected to a GitHub account. */
async function resolveIdentifier(token: string, raw: string): Promise<{ username: string; email?: string }> {
  const value = raw.trim().replace(/^@/, '');
  if (!value.includes('@')) {
    return { username: value.toLowerCase() };
  }
  const found = await findGithubUserByEmail(token, value);
  if (!found) {
    throw new Error(
      "Couldn't find a GitHub account with that email publicly listed — ask them for their GitHub username instead.",
    );
  }
  return { username: found.login.toLowerCase(), email: value };
}

/** Adds a new owner (owners-only). Commits the updated list to GitHub and emails the new owner if possible. */
export async function addOwner(session: Session, input: { identifier: string }) {
  if (!(await isOwnerAsync(session.token, session.username))) {
    throw new Error('Only owners can add owners');
  }

  const { username, email: emailFromInput } = await resolveIdentifier(session.token, input.identifier);
  if (!username) throw new Error('GitHub username is required');

  const dynamic = await getDynamicOwners(session.token);
  if (isOwner(username) || dynamic.some((o) => o.username.toLowerCase() === username)) {
    throw new Error('Already an owner');
  }

  const ghUser = await getGithubUser(session.token, username);
  if (!ghUser) throw new Error(`GitHub user "${username}" not found`);

  const email = emailFromInput || ghUser.email || undefined;

  const entry: DynamicOwner = {
    username,
    email,
    addedAt: new Date().toISOString(),
    addedBy: session.username,
  };
  const updated = [...dynamic, entry];
  await createFile(
    session.token,
    OWNERS_PATH,
    JSON.stringify(updated, null, 2) + '\n',
    `Add owner: ${username}`,
  );

  let emailSent = false;
  let emailError: string | undefined;
  if (email && isEmailConfigured()) {
    try {
      await sendOwnerInviteEmail({ to: email, username, addedBy: session.username });
      emailSent = true;
    } catch (err: any) {
      emailError = err.message;
    }
  }

  return { success: true, username, email, emailSent, emailError };
}

/** Removes a UI-added owner (owners-only). Env-configured owners can't be removed this way. */
export async function removeOwner(session: Session, rawUsername: string) {
  if (!(await isOwnerAsync(session.token, session.username))) {
    throw new Error('Only owners can remove owners');
  }

  const target = rawUsername.trim().replace(/^@/, '').toLowerCase();
  if (isOwner(target)) {
    throw new Error('Cannot remove an owner configured via KORTEX_OWNERS — update that env var instead');
  }

  const dynamic = await getDynamicOwners(session.token);
  const updated = dynamic.filter((o) => o.username.toLowerCase() !== target);
  if (updated.length === dynamic.length) throw new Error('Owner not found');

  await createFile(
    session.token,
    OWNERS_PATH,
    JSON.stringify(updated, null, 2) + '\n',
    `Remove owner: ${target}`,
  );
  return { success: true };
}
