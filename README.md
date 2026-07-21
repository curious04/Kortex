# Kortex

Your personal knowledge hub — notes, links, ideas, tasks and files, all in one
place. Dark, minimal, fast. Powered by GitHub as the database.

- **You** add content directly from the UI — it commits to GitHub automatically.
- **Others** can suggest additions — it creates a Pull Request you approve from the UI.
- **Files & images** upload directly through the UI — small ones go to the repo, large ones to GitHub Releases (free).
- **Auto-deploys** to Vercel on every change. 100% free.
- **Installable PWA** with Share-to-Kortex from your phone, `Cmd/Ctrl+K` quick-add, real fuzzy full-text search, `[[wiki-links]]` + backlinks, a knowledge graph view, a Today view with routine streaks, and optional AI tag suggestions.

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
   - `GROQ_API_KEY` (optional) — enables the "✨ Suggest tags & type" button in the Add modal. Get a free key at https://console.groq.com/keys. Without it, that button just shows a friendly error and everything else still works.
4. Deploy. Done.
5. Update your GitHub OAuth App's callback URL to match Vercel.

## How it works

### Adding content (you)
Click **+ Add** → fill the form → hit Publish.  
Behind the scenes: the API commits a markdown file to your repo via GitHub's API.
Vercel auto-redeploys. You get a toast notification when it's live.

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

### AI tag suggestions (optional)
- If `GROQ_API_KEY` is set, the Add modal shows a "✨ Suggest tags & type" button that calls Groq's free-tier API to suggest tags and a content type from your title/content.

## Cost

Everything is free:
- Vercel free tier (100K serverless invocations/month)
- GitHub (unlimited repos, API, releases)
- No database needed (your repo IS the database)

## Roadmap

- Phase 2: PWA install + phone "share-to-save" + offline queue
- Phase 3: Backlinks, graph view, activity heatmap
- Phase 4: Email/push notifications, scheduled resurfacing
