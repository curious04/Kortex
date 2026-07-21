/** Transactional email via Resend (https://resend.com) — optional, free tier available. */
const RESEND_API_KEY = (process.env.RESEND_API_KEY ?? '').trim();
const RESEND_FROM = (process.env.RESEND_FROM ?? 'Kortex <onboarding@resend.dev>').trim();

export function isEmailConfigured() {
  return Boolean(RESEND_API_KEY);
}

/** Sends a personalized "you've been added as an owner" email. Throws if it fails. */
export async function sendOwnerInviteEmail(opts: { to: string; username: string; addedBy: string }) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

  const siteUrl = (process.env.SITE_URL || 'https://your-app.vercel.app').trim();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [opts.to],
      subject: "You've been added as a Kortex owner",
      html: `
        <div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#111;">
          <h2 style="margin:0 0 12px;">You're in, @${opts.username} 👋</h2>
          <p><strong>@${opts.addedBy}</strong> just added you as an owner on their Kortex knowledge hub.</p>
          <p>Sign in with your GitHub account and you'll be able to add, edit, and delete notes directly — no pull requests needed.</p>
          <p style="margin-top:20px;">
            <a href="${siteUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;border-radius:8px;text-decoration:none;">Open Kortex &rarr;</a>
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email send failed: ${res.status} — ${err}`);
  }
  return res.json();
}
