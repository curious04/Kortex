# Kortex 🧠

My personal knowledge hub — notes, links, ideas, tasks, routines and files in one
calm, fast place. Local-first, versioned on GitHub, and published as an installable
website you can open anywhere.

- **You** add directly (push to `main`).
- **Anyone else** suggests additions via a Pull Request → you approve → it merges.
- **Auto-deploys** to GitHub Pages on every change. 100% free.

---

## Run it locally

```powershell
npm install
npm run dev
```

Open http://localhost:4321

## Add something

Create a Markdown file in `content/notes/`, for example `my-idea.md`:

```markdown
---
title: My idea
type: idea          # note | link | idea | task | routine | reference | doc
tags: [side-project]
pinned: false
public: true        # set false to hide it from the published site
# url: https://...  # add this and it becomes a bookmark card
# attachment: https://...  # link to a PDF (e.g. a GitHub Release asset)
---

Write anything here — text, lists, images, checklists, code.
```

Save it — it appears on the home page instantly.

## Publish it (free, ~5 minutes)

1. Create a **public** GitHub repo named `Kortex`.
2. Push this folder to it:
   ```powershell
   git init
   git add .
   git commit -m "Kortex: first commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/Kortex.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Wait for the "Deploy Kortex" action to finish. Your site is live at
   `https://<your-username>.github.io/Kortex/`.
5. Open it on your phone → browser menu → **Add to Home screen**.

## Unlock the quick-add & contribute buttons

Edit `src/config.ts` and set your GitHub username:

```ts
github: { owner: 'your-username', repo: 'Kortex', branch: 'main' }
```

Now **+ Add** opens a one-click editor to create a note, and **Suggest** lets
visitors propose additions via Pull Requests.

## Large files (PDFs / big images) — keep it free

Git LFS is *not* fully free, so instead:

- Small images (< ~1 MB): commit them into the repo directly.
- Large PDFs / images: attach them to a **GitHub Release** (free, up to 2 GB per
  file) and put the download URL in `attachment:` or `url:`.

## Roadmap

- **Phase 2** — PWA install + phone "share-to-save" + offline quick-capture queue.
- **Phase 3** — Public garden view + friendly "Suggest an edit" contribution flow.
- **Phase 4** — Backlinks, graph view, "on this day", activity heatmap.
