# Kortex

Your personal knowledge hub — notes, links, ideas, tasks and files, all in one
place. Dark, minimal, fast. Powered by GitHub as the database.

- **You** add content directly from the UI — it commits to GitHub automatically.
- **Others** can suggest additions — it creates a Pull Request you approve from the UI.
- **Files & images** upload directly through the UI — small ones go to the repo, large ones to GitHub Releases (free).
- **Auto-deploys** to Vercel on every change. 100% free.

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

## Cost

Everything is free:
- Vercel free tier (100K serverless invocations/month)
- GitHub (unlimited repos, API, releases)
- No database needed (your repo IS the database)

## Roadmap

- Phase 2: PWA install + phone "share-to-save" + offline queue
- Phase 3: Backlinks, graph view, activity heatmap
- Phase 4: Email/push notifications, scheduled resurfacing
