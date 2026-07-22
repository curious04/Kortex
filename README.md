# Kortex

Your personal knowledge hub — notes, links, ideas, tasks and files, all in one
place. Dark, minimal, fast. Powered by GitHub as the database.

- **You** add content directly from the UI — it commits to GitHub automatically. Edit or delete any note from its page too.
- **Multiple owners** can be trusted with direct edit/delete access (no PR needed) — just list their GitHub usernames.
- **Others** can suggest additions — it creates a Pull Request you approve from the UI.
- **Files & images** upload directly through the UI — small ones go to the repo, large ones to GitHub Releases (free).
- **Auto-deploys** to Vercel on every change. 100% free.
- **Installable PWA** with Share-to-Kortex from your phone, `Cmd/Ctrl+K` quick-add, real fuzzy full-text search, `[[wiki-links]]` (with click-to-link autocomplete) + backlinks, a knowledge graph view, a Today view with routine streaks, voice dictation, and an AI "Ask your brain" chat + tag/related-note suggestions.

---

## Architecture

```
Browser (dark PWA UI)
    ↕ GitHub OAuth
Vercel Serverless (API routes)
    ↕ GitHub API
Your Repo (markdown + assets = your data, forever)
```

## Run locally

```bash
cp .env.example .env
# Fill in GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (see below)
npm install
npm run dev
```

Open http://localhost:4321

## Set up GitHub OAuth (one-time, 2 minutes)

1. Go to https://github.com/settings/developers → **New OAuth App**
2. Fill in:
   - App name: `Kortex`
   - Homepage URL: `http://localhost:4321` (update to your Vercel URL later)
   - Authorization callback URL: `http://localhost:4321/api/auth/callback`
3. Copy the **Client ID** and generate a **Client Secret**
4. Put them in your `.env` file

## Deploy to Vercel (free, ~3 minutes)

1. Push this repo to GitHub
2. Go to https://vercel.com/new → Import your `Kortex` repo
3. Add environment variables in Vercel project settings:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `AUTH_CALLBACK_URL` = `https://your-app.vercel.app/api/auth/callback`
   - `SITE_URL` = `https://your-app.vercel.app`
   - `KORTEX_OWNERS` (optional) — comma-separated GitHub usernames allowed to edit/delete content directly, no PR needed. Defaults to just the repo owner. Example: `KORTEX_OWNERS=alice,bob`. You can also add owners later from the UI (see below) without redeploying.
   - `RESEND_API_KEY` (optional) — enables emailing new owners an invite when you add them from the UI. Free tier at https://resend.com. Without a verified sending domain, Resend's sandbox mode only delivers to the email on your Resend account — verify a domain to email arbitrary people.
   - `RESEND_FROM` (optional) — the "from" address for owner-invite emails, e.g. `Kortex <notify@yourdomain.com>`. Defaults to Resend's shared sandbox address.
   - `GROQ_API_KEY` (optional) — enables the "✨ Suggest tags & type" button in the Add modal. Get a free key at https://console.groq.com/keys. Without it, that button just shows a friendly error and everything else still works.
   - `VERCEL_TOKEN` + `VERCEL_PROJECT_ID` (optional) — lets Kortex show a "Deployed!" popup at the exact moment your change actually goes live, instead of guessing with a fixed delay. Get a token at https://vercel.com/account/tokens and the project ID from your project's Settings → General page. If your project belongs to a team, also set `VERCEL_TEAM_ID` (Settings → General on the team). Without these, Kortex just falls back to a short fixed delay before refreshing.
4. Deploy. Done.
5. Update your GitHub OAuth App's callback URL to match Vercel.

## How it works

### Adding content (you)
Click **+ Add** → choose a mode:
- **⚡ Quick capture** (default): just dump raw text — a link, a thought, meeting notes, a to-do — into one box and hit "Analyze & Publish". AI reads it and decides the title, type and tags for you, then publishes immediately. Falls back to a simple heuristic (first line as title, link-detection) if `GROQ_API_KEY` isn't configured, so it always works.
- **📝 Detailed**: the classic form — fill in title, type, URL, tags and content yourself, with an optional "✨ Suggest tags & type" AI assist.

Behind the scenes: the API commits a markdown file to your repo via GitHub's API.
Vercel auto-redeploys. You get a toast notification when it's live.

### Editing & deleting notes (owners)
Open any note → click **✏️ Edit** to open the same modal pre-filled, or **🗑 Delete** to remove it (with a confirmation prompt). Both commit straight to GitHub, just like adding content — no PR needed for owners. Only usernames listed in `KORTEX_OWNERS` (or the repo owner, by default) see these buttons.

### Multiple owners
By default only the repo owner gets direct edit/delete/commit access. Click **👥 Owners** in the header (visible to owners only) to add more people right from the UI — type their GitHub username or an email connected to their GitHub account. This commits an updated `content/owners.json` to your repo (no redeploy needed) and, if `RESEND_API_KEY` is configured, emails them an invite. Anyone else who signs in can still contribute via Pull Request. Owners added this way can be removed from the same panel; owners set via `KORTEX_OWNERS` can only be changed by editing that env var.

### Contributing (others)
Others sign in with GitHub → click **+ Add** → submit.  
Behind the scenes: the API forks your repo, creates a branch, commits the file, and opens a Pull Request.
You see it in the **PRs** panel and can merge or close it with one click.

### File uploads
- **Images < 1 MB**: committed directly to `content/assets/` in the repo.
- **Large files (PDFs, etc.)**: uploaded to a GitHub Release (free, up to 2 GB each, no LFS needed).

### Mobile & quick capture
- Installable as a PWA ("Add to Home Screen"). Android's Share button can send any page/text directly into Kortex via `/share`.
- `Cmd/Ctrl+K` opens the Add modal from anywhere.

### Search & connections
- The search box does an instant client-side filter of visible cards, *and* queries a Pagefind full-text index (built at deploy time) covering the complete body of every note — shown as a live dropdown.
- Write `[[Note Title]]` inside any note's content to link to another note. The target note automatically shows a "Linked mentions" section.
- `/graph` visualizes all notes and their `[[wiki-link]]` connections as an interactive force-directed graph.

### Today view & streaks
- `/today` lists every `task`/`routine` note with its checklist items.
- Routines get a "Mark done today" button; streak history is stored in `content/streaks.json` (committed via the GitHub API) and read live from GitHub's raw CDN, so it updates without waiting for a redeploy.

### Linking notes together
- Type `[[` inside the Content field to open a fuzzy-search dropdown of your existing note titles — arrow keys or a click inserts a real `[[Title]]` link, no need to type the exact title.

### AI features (optional, powered by Groq's free tier)
- **Suggest tags & type**: in the Add modal, click "✨ Suggest tags & type" to have AI propose tags, a content type, and up to 3 existing notes worth linking to (shown as clickable chips that insert a `[[wiki-link]]`).
- **Ask your brain** (`/ask`): a chat page that answers questions using only the notes you've actually saved, with sources cited — no vector DB required, just a lightweight keyword-ranked context window sent to Groq.
- Both require `GROQ_API_KEY`. Without it, they show a friendly error and everything else still works.

### Voice dictation
- Click the 🎤 button next to the Title or Content fields to dictate instead of typing (uses the browser's built-in Web Speech API — no API key, no cost; Chrome/Edge only).

## Cost

Everything is free:
- Vercel free tier (100K serverless invocations/month)
- GitHub (unlimited repos, API, releases)
- No database needed (your repo IS the database)

## Roadmap

- Phase 2: PWA install + phone "share-to-save" + offline queue
- Phase 3: Backlinks, graph view, activity heatmap
- Phase 4: Email/push notifications, scheduled resurfacing
