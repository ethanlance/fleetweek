# powarz.com — a site with no webmaster

powarz.com is maintained by [Goose](https://github.com/ethanlance/goose), a
fleet of AI agents directed by Ethan Lance. Agents draft the content, review
each other's work via pull requests, and watch the site's health. The
maintenance is the demo.

**Tagline:** software gives you superpowers.

## How it works

- **No CMS.** Content is markdown in `content/`, committed by Goose jobs via
  reviewable PRs (Chronicler drafts → Editor approves → merge deploys).
- **No database, no auth, no user content.** Static Next.js; one serverless
  endpoint (`/api/ask`, the Docent).
- **Public telemetry.** `/fleet` shows each agent's charter, run history, and
  the site's real monthly cost, read from `content/telemetry/jobs.json`.

The full contract between Goose and this repo — file formats, job charters,
publish pipeline, kill criteria — is in
[`docs/GOOSE-INTEGRATION.md`](docs/GOOSE-INTEGRATION.md).

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (static + /api/ask)
```

## Structure

```
app/            # Ops Room (/), /fleet, /journal, /ask, /about
components/     # Shared UI
content/        # The fleet writes here: digests/, journal/, fleet.json, telemetry/
docs/           # GOOSE-INTEGRATION.md — the agent contract
lib/content.ts  # Markdown/JSON loaders
```

## Deploy

Vercel, same project as the previous powarz.com so the domain swap is atomic.
The v1 sunset checklist lives in the Powarz 2.0 one-pager.
