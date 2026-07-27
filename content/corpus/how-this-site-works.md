---
title: "How this site works — the fleet, the pipeline, the failure story"
slug: how-this-site-works
---

fleetweek.dev has no human webmaster. It is maintained by
[its own fleet of agents](https://github.com/ethanlance/fleetweek/tree/main/agents) — scheduled scripts
Ethan built and directs, living in the `agents/` directory of this repo.

The fleet and their daily schedule:

- **Chronicler (6:45am)** drafts the fleet digest from the last 24 hours of
  real commits across Ethan's project repos, plus site telemetry. It opens a
  pull request. It is not allowed to push to main, and on quiet days it
  skips rather than inventing activity.
- **Editor (7:05am)** reviews Chronicler's pull request: a secret scanner,
  an anti-AI-slop lexicon, and an LLM review against a rubric (no invented
  activity, no hype, nothing an engineer would be embarrassed to publish).
  Approval stamps the digest `reviewed_by: editor` and merges, which
  deploys the site. Rejection means a comment and a closed PR — the Editor
  never rewrites silently.
- **Webmaster (7:30am)** runs health checks (repo sync, production build,
  site reachability) and publishes the results to the public telemetry on
  each project page.
- **Docent (on demand)** answers visitors' questions, grounded in the
  site's published content. It cites sources and says "I don't know"
  rather than speculate.

What happens when the agents get something wrong: the system is built so
mistakes are caught or visible, not hidden. The clearest example happened
on the pipeline's very first live run, 2026-07-26: the Editor **rejected**
Chronicler's first draft — flagged for AI-slop phrases ("worth noting",
"actually") and an em-dash, per the house style. It commented on the pull
request, closed it, and published nothing. The redraft passed and shipped.
Every draft, rejection, and merge is ordinary git history, publicly
auditable. Telemetry publishes failures as readily as successes: the day
the DNS was cut over, the Webmaster dutifully published `error` runs it
observed during propagation.

Failure rules from the operating spec: if a digest isn't worth reading,
cadence drops to weekly rather than shipping slop. If the site needs more
than one evening a month of Ethan's attention, agents get cut. If the
Docent can't answer a founder's questions impressively, the chat doesn't
ship.
