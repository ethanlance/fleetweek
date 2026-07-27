---
title: "A site with no webmaster"
date: "2026-07-25"
author: ethan
summary: "Why this site is maintained by a fleet of AI agents, in public — and where it came from."
---

This site began as a reckoning with another one. For the last year, my domain powarz.com has hosted an AI-powered battle arena and fan wiki. I built it, instrumented it, and stared hard at what the data said. The full story — with the numbers — is in the post-mortem entry.

What came out of that reckoning is this site, and the twist is in the footer: **no human maintains it.**

Fleet Week is run by [its own fleet of agents](https://github.com/ethanlance/fleetweek/tree/main/agents), a persistent agent platform I built that lives on a Mac mini in my house. Goose already spent months doing daily health checks on powarz.com. Now its jobs run this site:

- **Chronicler** reads my commits, deploys, and build sessions every night and drafts the ops digest you see on the front page.
- **Editor** reviews every draft before it ships. Agents here don't write to a CMS — they open pull requests. Every word on this site has a reviewable git trail.
- **Webmaster** watches uptime, deploys, and page health, and publishes its own status reports.
- **Docent** answers your questions about my work, grounded in what's actually published here.

I direct the fleet. The fleet runs the site. The maintenance is the demo.

If you're an engineering leader wondering what agentic development looks like past the autocomplete phase — this is a small, honest, running example. And if you want one of your own: The agents live in this site's own repo under `agents/` — fork the fleet.
