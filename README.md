# Road to 3,000+ · HYPE Dashboard

Team-facing progress dashboard for the Healthbridge Clinical **3,000+ users by Oct 2026** mission.

Published as a static site on **GitHub Pages**. Weekly numbers live in `data.json` and sync from your Google Sheet via Apps Script.

## Live site

After setup: `https://<your-org>.github.io/<repo-name>/`

## How data updates work

```
Google Sheet (Weekly tab)
        ↓
Apps Script web app (JSONP)
        ↓
GitHub Action (Mondays) or manual sync script
        ↓
data.json in this repo
        ↓
GitHub Pages serves index.html
```

**You only edit the Google Sheet.** The automation (or a one-line manual command) updates the published dashboard.

### Sheet columns (Weekly tab)

| date | total | contributor | note |
|------|-------|-------------|------|
| 2026-03-24 | 1949 | Hb Clinical New-sales | Best week of Q1… |

- **date** — ISO date (`YYYY-MM-DD`) for the week snapshot  
- **total** — cumulative user/site count  
- **contributor** — team or workstream (shown in weekly highlight)  
- **note** — short win message for the highlight card  

## One-time GitHub setup

1. **Create a repo** in your GitHub org (e.g. `road-to-3000`).

2. **Push this folder:**
   ```bash
   git init
   git add .
   git commit -m "Add Road to 3,000 HYPE dashboard"
   git branch -M main
   git remote add origin https://github.com/<org>/<repo>.git
   git push -u origin main
   ```

3. **Enable GitHub Pages:**  
   Repo → **Settings** → **Pages** → Source: **Deploy from branch** → Branch: `main` / `/ (root)`.

4. **Optional — repo secret for sync:**  
   Settings → Secrets → Actions → `WEEKLY_DATA_URL`  
   Set to your Apps Script deploy URL if it differs from the default in `scripts/sync-data.mjs`.

5. **Apps Script access:**  
   Deploy as web app with access **Anyone** (or anyone in your Google domain).  
   Test in an incognito window:  
   `https://…/exec?callback=test` should return JSON, not a login page.

6. **Run first sync:**  
   Actions → **Sync weekly dashboard data** → **Run workflow**.

## Manual sync (local)

If you update the sheet and want the site refreshed immediately:

```bash
node scripts/sync-data.mjs
git add data.json
git commit -m "chore: sync weekly dashboard data"
git push
```

Or trigger the GitHub Action manually from the Actions tab.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Dashboard (GitHub Pages entry point) |
| `data.json` | Weekly numbers consumed by the page |
| `scripts/sync-data.mjs` | Pulls sheet data → updates `data.json` |
| `.github/workflows/sync-weekly-data.yml` | Scheduled Monday sync |
| `hbc_3000_hype.html` | Original local copy (optional) |
| `hbc_3000_dashboard.html` | Steerco view — not published by default |

## Privacy

Consider a **private org repo** if user counts are internal-only. GitHub Enterprise can restrict Pages to org members.

The Steerco dashboard contains more detailed planning data and is kept out of the default publish set.
