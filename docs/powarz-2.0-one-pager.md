# Powarz 2.0 — "The Site With No Webmaster" — One-Pager

*Drafted 2026-07-24. powarz.com's job: convert recruiters and founders evaluating Ethan for head-of-eng / head-of-product roles. Constraint: must never compete with Haul for his hours — the maintenance IS the demo.*

## One-liner

powarz.com is run by a small, named fleet of agents that Ethan directs — in public. The site demonstrates agentic engineering leadership by *being* it: content written nightly by agents via reviewable PRs, a docent agent visitors interrogate, live fleet telemetry including monthly cost. Tagline survives the pivot: **"software gives you superpowers."**

**The fleet already exists: it's Goose** (`~/Code/goose` / github.com/ethanlance/goose) — Ethan's persistent Discord-connected agent platform (tmux-dispatched Claude Code sessions, nightly reflection + prompt self-scoring, SQLite FTS5 knowledge, launchd scheduling, admin dashboard, model-agnostic harness). Goose already ran powarz v1's webmaster health checks. Powarz 2.0 is **Goose's public showroom**, not a new agent system.

## The Fleet (the agents in it)

| Agent | Charter | Cadence |
|---|---|---|
| **Chronicler** | Reads commits, deploys, and build-session summaries across Ethan's projects (esp. Haul); drafts the daily digest and the Haul build journal | Nightly cron |
| **Editor** | Reviews Chronicler's drafts for accuracy, tone, and slop; approves or bounces the PR. No Editor approval → no publish | Nightly, after Chronicler |
| **Docent** | The front-of-house agent visitors interrogate about Ethan's work — grounded strictly in the corpus, cites its sources, says "I don't know" cleanly | On demand |
| **Webmaster** | Health checks, Lighthouse scores, broken links, uptime — publishes its own public status page (carried over from v1's daily-health-check cron, turned outward) | Daily |

Every agent has a public page: charter, model, recent runs, and **cost**. A live "this entire site runs on ~$X/month" counter is the engineering-chops flex nobody else will have.

## Surfaces

- **/ (Ops Room)** — not a bio page: this week's fleet digest, latest journal entries, fleet status lights. Changes daily because agents change it.
- **/fleet** — meet the staff: the roster above, with run history and cost telemetry.
- **/ask** — the Docent. A founder asks "how did he decide to kill the battle platform?" and gets the real, cited answer.
- **/journal** — the Haul build log (self-written) + flagship essays.
- **/about** — the quiet essentials: bio, resume, GitHub, contact.
- *(Phase 2)* **/diagnostic** — "Powarz gives your team superpowers": a short agentic-readiness assessment for eng leaders, in Ethan's voice. Conversation-starter machine for founders.

## The content pipeline is the portfolio

Agents don't write to a CMS — they **open pull requests**. Chronicler drafts → Editor reviews → merge deploys the static site. Every word on the site has a reviewable git trail, and visitors can literally read the agents' PR history. That one architectural choice simultaneously shows product taste (quality gate), systems thinking (pipeline, auditability), and honesty (the process is inspectable).

## Launch corpus (the Docent's ground truth)

1. **The Powarz v1 post-mortem** — flagship essay: built an AI battle platform, instrumented it, data said kill it (64% battle abandonment, 2 repeat battlers, 1 paying sub), killed it. All numbers already pulled (2026-07-24 analysis).
2. **The UnitedMasters agentic-transformation story** — how he actually leads teams through AI adoption (shareable version).
3. Resume / career narrative (CNET → Whiskey Media → Beats/Apple → Dwell → UnitedMasters).
4. The Haul journal, accreting from day one.

## For fellow tech nerds: fork the fleet

The template **is Goose** — which Ethan has already been prepping for public release (separate-personal refactor phases, gitleaks pre-commit, `defaults/` + `init.sh` for fresh deploys). Powarz 2.0 becomes Goose's flagship demo: "this site is maintained by Goose; here's the repo — run your own." Stars and forks compound reputation with exactly the audience that refers head-of-eng candidates, and the site and the open-source project market each other.

## Architecture (deliberately boring)

Static Next.js (or Astro) shell; content = markdown in the repo, committed by Goose jobs via PRs (Chronicler/Editor/Webmaster become Goose scheduled tasks on the Mac mini — the launchd + monitoring infra already exists); one serverless endpoint for the Docent over a small embedded corpus; deploy on the existing Vercel project so the v1 → v2 swap is atomic. No database, no auth, no user content, nothing that rots. /fleet telemetry reads from Goose's real job logs and prompt-optimizer scores. Target run cost: under ~$25/mo, published live.

## Quality gates & kill criteria

- **Docent bar:** must impressively answer the top 10 questions a founder would actually ask (write them first, test against them). If it can't after two weeks of tuning → ship the static version, no chat.
- **No slop:** if the nightly digest isn't genuinely worth reading, Editor thresholds tighten or cadence drops to weekly. A boring-but-honest weekly beats a daily slop feed.
- **Time budget:** if the site needs more than one evening/month of Ethan's attention, it is failing its own thesis — cut agents until it doesn't.
- **Success metric:** not DAU — "saw your site" mentions in recruiter/founder conversations, and forks of the template.

## v1 sunset checklist (prerequisite)

1. Refund + cancel the single Stripe subscription; disable checkout.
2. Snapshot the production DB (Supabase gntpliknbcoiyjisrpbf); export the 62 user emails; send a courteous farewell note.
3. Archive the v1 repo; keep character/battle data for the post-mortem essay's charts.
4. Atomic swap: point the Vercel project at the new repo. The resume link never breaks.

## Two-week cut

- **Week 1:** design system + static shell + corpus written (post-mortem essay is the long pole) + Docent over corpus, tested against the founder top-10.
- **Week 2:** Chronicler + Editor PR pipeline live, /fleet with real telemetry, Webmaster status page, v1 sunset, swap.
- **Phase 2 (post-Haul-start):** /diagnostic, open-source template release.
