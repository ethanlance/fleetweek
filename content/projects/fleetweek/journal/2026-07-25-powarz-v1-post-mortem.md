---
title: "The data said kill it. The site argued back."
date: "2026-07-25"
author: ethan
summary: "I spent a year building an AI battle arena, one afternoon reading its production database, and one day watching my kill verdict get appealed."
---

For about a year, my domain powarz.com has hosted Powarz: a fan wiki and battle arena for fictional characters. You could browse hundreds of characters, forge original ones with AI portraits and lore, and pit any two against each other in AI-narrated battles. It had three battle modes, a points economy with ranks and titles, a suggestion-and-review wiki workflow, discussions, leaderboards, email digests, AI moderation, a Stripe-backed Pro tier, and the beginnings of a native iOS app — 61 Swift files deep.

One afternoon with the production database told me to kill it. The next day, the site argued back. Here's the whole story — the numbers, the call, and the reprieve.

## What the production database said

One afternoon of honest SQL, one year into the project:

- **62 registered users.** Signups were actually trickling in — 12 to 16 a month, with zero marketing. Acquisition wasn't the problem.
- **195 battles fought — 116 of them by me.** The battle arena was the marquee feature, the thing on the homepage, the thing the whole architecture served.
- **64% of battles were abandoned mid-fight.** People started a battle, played a round or two of the move-selection loop, and walked away before the ending.
- **Exactly 2 users besides me ever battled on more than one day.** That's the retention story of the flagship feature, in one number.
- **3 discussion threads, 0 comments, 2 votes** — in the entire life of the site. The community layer wasn't small; it was empty.
- **1 paying subscriber: me**, testing the checkout flow.

And then, the one line of the ledger that pointed somewhere: **30–45 wiki contributions a month, every month, from a dozen-plus real users** — people creating and editing characters, steadily, right up to the week I pulled the data. The feature I treated as scaffolding for the battle arena was the only thing users actually kept doing.

People came to *make* something. They didn't come to fight with it.

## What I got wrong

**1. I built the pitch, not the product.** "AI battle arena" demos brilliantly and describes what almost nobody retained on. "A place to create a character" sounds smaller and was the only living loop. The marquee feature and the actual product can be two different things, and the only way to find out is instrumentation plus the humility to read it.

**2. I shipped features that require other people, at a scale with no other people.** PvP battles need two humans online at once. A forum needs a crowd. At 62 users, both were furniture in an empty room — and a dead forum is worse than no forum, because it tells every visitor the site is abandoned. Everything that worked at n=1 (creating a character, editing a wiki page) worked. Everything that needed n=many died on arrival.

**3. The abandonment number was the loudest signal, and I ignored it longest.** When two-thirds of users walk out mid-experience, the experience is too long for its payoff. The bitter footnote: I had built a fast, streaming, no-account-needed quick-battle mode — and left it hidden behind a flag while the slow, grindy mode got the spotlight.

**4. I monetized before I had anything to monetize.** A daily battle cap on the free tier throttled the one behavior I most needed to grow. Worse, in auditing the code I found the Pro tier advertised an "enhanced AI narration" upgrade that was never actually wired up — every tier got the same model. Nobody was harmed (the one subscriber was me), but it's the kind of drift that creeps in when a solo project's ambitions outrun its checklists. Audit your own paywall claims like an adversary would.

**5. I let sunk cost compound.** With web retention at effectively zero, I started porting the product to iOS — adding App Store review, mandatory Sign in with Apple, and an IAP fork of my billing to a bet that hadn't paid off on the platform where it was easiest to test. The Swift was good. The decision wasn't.

## What I got right

The build itself was cheap — that's the part of this story that's genuinely new. Powarz v1 was built almost entirely agentically: 200+ tracked issues closed, an autonomous agent doing daily production health checks and committing its reports, AI-assisted everything from schema to moderation prompts. A year of nights-and-weekends produced a system with 40+ database models, three battle engines, and a full moderation pipeline. A decade ago that was a funded team's roadmap. The lesson isn't that I should have built less — it's that **when building gets this cheap, the scarce skill moves entirely to deciding what deserves to exist.** Which is exactly the skill the kill decision exercised.

And making the kill call *was* cheap, emotionally and literally, because the data was unambiguous. One afternoon of queries. No committee, no quarter of denial.

## The reprieve

Then, the day after I wrote the verdict, something happened that had never happened before: a stranger signed up and started a discussion thread. Not spam — a real matchup argument ("Invincible should have won"), from someone who ran a battle, disagreed with the result, and cared enough to say so. In a year of operation, every previous thread had been mine.

One post doesn't overturn a retention table, and I know exactly how motivated reasoning works the day after you sentence your own product to death. But the *shape* of the post matters: battle → disagreement → debate is the engagement loop the data had been pointing at all along — the one thing users had never done organically until they did. So the sentence is commuted, with conditions: powarz.com stays up as a bounded experiment. Fix the honesty problems, lean the product into the debate loop, spend almost nothing, and let the data keep talking. The kill criteria don't go away; they get a stay of execution and a calendar.

## What happens now

The pivot conclusions stand either way. The living signal — people who love a thing, making and cataloging what they love — points somewhere specific, and I'm following it in a new project chronicled on this site. Powarz continues as what it honestly is: a small, cheap, instrumented experiment that occasionally surprises me.

And this site is the other half of the answer — maintained by [its own fleet of agents](https://github.com/ethanlance/fleetweek/tree/main/agents), grown out of the jobs that were already doing Powarz's health checks: they draft the digests, review each other's pull requests, and watch the deploys, in public. The superpowers stayed.
