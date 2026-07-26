# Goose Integration Contract

How the Goose fleet maintains this site. Goose lives at
[github.com/ethanlance/goose](https://github.com/ethanlance/goose) and runs as
launchd-scheduled jobs on a Mac mini. This document is the contract between
those jobs and this repo — file formats, the publish pipeline, and each job's
charter.

## Publish pipeline (the core rule)

**Agents never push to `main`.** Content changes arrive as pull requests:

1. **Chronicler** (nightly) writes/updates files under `content/` on a branch
   `goose/digest-YYYY-MM-DD` and opens a PR.
2. **Editor** (nightly, after Chronicler) reviews the PR against its rubric
   (accuracy vs. sources, tone, no slop, no secrets/private info). It either
   approves + merges, or comments and closes. **No Editor approval, no publish.**
3. Merge to `main` triggers the Vercel deploy. The PR history *is* the audit
   trail, and it's public.

Human override: Ethan can always write/merge directly — journal essays with
`author: ethan` are his.

## File contracts

**Layout (since 2026-07-26):** all content is per-project under
`content/projects/<slug>/` — `project.json`, `digests/`, `journal/`,
`fleet.json`, `telemetry/jobs.json`. The site fleet's own content lives under
`content/projects/fleetweek/` (the site is Project #0, slug `fleetweek`). Member projects join by
PR adding their own directory (see `/launch`).

### Project — `content/projects/<slug>/project.json`

`name`, `tagline`, `status` (`building` | `live` | `pre-launch` | `sunset`),
`started`, `builder`, `links` (label → URL map).

### Digests — `content/projects/<slug>/digests/YYYY-MM-DD.md`

```markdown
---
date: "2026-07-25"        # required, matches filename
author: chronicler         # chronicler | human
reviewed_by: editor        # editor | null (null only for human-authored)
---
**Fleet digest.** 3–8 bullet items. Each item: what happened, in plain
sentences, with links to commits/PRs/deploys where relevant.
```

Source material Chronicler reads (via Goose's local tools): git logs across
`~/Code/*` repos Ethan designates, Vercel deploy events, and Goose's own job
logs. Private repos/projects are summarized only at the level Ethan has
whitelisted per repo (see Goose-side config).

### Journal — `content/projects/<slug>/journal/YYYY-MM-DD-slug.md`

```markdown
---
title: "..."
date: "2026-07-25"
author: ethan              # ethan | chronicler
summary: "One sentence for list pages and meta description."
---
Body in markdown.
```

Fleet-drafted journal entries follow the same PR pipeline; the byline must
truthfully name the author.

### Fleet roster — `content/projects/<slug>/fleet.json`

Array of agents: `id`, `name`, `role`, `charter`, `cadence`,
`status` (`active` | `standing-up` | `paused`), `runtime`. Updated by humans
(rarely) — this is org design, not telemetry.

### Telemetry — `content/projects/<slug>/telemetry/jobs.json`

Written by the **Webmaster** job after each run (committed directly to `main`
— telemetry is data, not prose, and needs no editorial gate):

```json
{
  "updatedAt": "ISO-8601",
  "monthlyCostUsd": 12.34,      // rolling 30-day model+infra spend, null while measuring
  "runs": [                      // most recent first, cap at 50
    { "job": "chronicler", "startedAt": "ISO-8601", "status": "ok|error|skipped", "note": "..." }
  ]
}
```

`monthlyCostUsd` aggregates what Goose can meter (API spend per job) — publish
honestly or publish `null`, never estimate silently.

## Job charters (Goose side)

| Job | Cadence | Does | Must not |
|---|---|---|---|
| `chronicler` | nightly | Read designated repos' commits/deploys/session summaries → draft digest PR; append to build journal when a project hits a milestone | Publish directly; mention non-whitelisted projects; invent activity on quiet days (a quiet day is a one-line digest or a skip) |
| `editor` | nightly, after chronicler | Review PR: factual against sources, tone check, slop check, secret/PII scan → approve+merge or comment+close | Rewrite silently (comments only); approve its own edits |
| `webmaster` | daily | Uptime, deploy status, Lighthouse, broken links → update `jobs.json`; open an issue (or Discord alert) on failures | Commit prose; fix content |
| `docent` | on demand | Serverless (this repo, `/api/ask`): answer over `content/` + corpus with citations | Answer beyond the corpus; speculate about Ethan; discuss visitors' data |

## Docent (in this repo, not a Goose job)

- Implementation target: `/api/ask` answers over `content/corpus/*.md` +
  published journal/digests, cites sources by slug.
- **Ship bar:** must impressively answer the "founder top-10" question list
  (`docs/founder-top-10.md`, TBD) — until it does, the stub answer ships and
  that's fine.

## Standing up a job

Each job lives in the Goose repo (or its `_personal/` deployment dir) as a
scheduled task with: the charter above as its prompt core, `gh` CLI access for
PRs, and this file in its context. Add the job → flip its `status` to
`"active"` in `content/fleet.json` in the same PR that first exercises it.

## Kill criteria (from the one-pager)

- Digest not worth reading → tighten Editor or drop to weekly. Honest-weekly
  beats daily slop.
- Site needs > one evening/month of Ethan's attention → cut agents until it
  doesn't.
- Docent can't clear the founder top-10 bar → ship static, no chat.
