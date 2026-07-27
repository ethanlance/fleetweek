# The fleet

The agents that maintain this site. They are ordinary shell scripts on a
schedule: no daemon, no framework, no network ingress. Everything they do
arrives as a git commit or a pull request, so the whole operation is auditable
in this repo's history.

| Agent | Schedule | What it does |
|---|---|---|
| `chronicler.sh` | 06:45 UTC daily | Reads the last 24h of commits across the configured source repos (local checkouts or `owner/repo` via the GitHub API) plus site telemetry, drafts the fleet digest, opens a `fleet/digest-DATE` pull request. Never pushes to `main`. Skips quiet days rather than inventing activity. |
| `editor.sh` | 07:05 UTC daily | Reviews Chronicler's PR: authorship check, path allowlist, secret scan, the anti-slop lexicon in `lib/slop-filter.sh`, then an LLM rubric. Approves and merges (which deploys), or comments and closes. Never rewrites silently. |
| `webmaster.sh` | 07:30 UTC daily | Health checks (repo sync, production build, site reachability) published to `content/projects/<slug>/telemetry/jobs.json`. Publishes failures as readily as successes. |

## Configuration

Runtime state lives outside the repo, at `~/.fleetweek/` (override with
`FLEET_HOME`). Create `~/.fleetweek/config.json`:

```json
{
  "display_name": "fleetweek.dev",
  "site_url": "https://fleetweek.dev",
  "branch": "main",
  "telemetry_file": "content/projects/fleetweek/telemetry/jobs.json",
  "chronicler": {
    "project_slug": "fleetweek",
    "model": "claude-sonnet-5",
    "bot_author": "your-github-login",
    "source_repos": ["/path/to/repo-a", "/path/to/repo-b"]
  }
}
```

`repo_dir` is optional and defaults to this repository. `bot_author` is a
security control, not a label: Editor only reviews pull requests opened by that
account, because branch names are attacker-controlled on a public repo.

Requires `bash`, `jq`, `git`, `gh` (authenticated), and the `claude` CLI.
Logs land in `~/.fleetweek/logs/`.

## Scheduling

These run on **GitHub Actions** — no always-on machine required. The workflows
are in `.github/workflows/`, on a daily UTC cron, each also runnable by hand
via *Run workflow*. Every run's logs are public in the Actions tab, which makes
the fleet's behaviour auditable without trusting a summary of it.

Two repository secrets:

| Secret | Needed for |
|---|---|
| `ANTHROPIC_API_KEY` | Chronicler drafting and Editor's rubric review |
| `FLEET_REPOS_TOKEN` | *Optional.* A fine-grained read token if Chronicler should see commits in repos other than this one. Without it, the built-in `GITHUB_TOKEN` covers this repo only. |

The scripts are plain bash and run anywhere: a cron job, another CI provider,
or a laptop. Locally they use the `claude` CLI if present and the Anthropic API
otherwise, and read `~/.fleetweek/config.json` in preference to the committed
`agents/config.json`. Run any of them by hand at any time — they are
idempotent, and Chronicler declines to draft a second digest for a day that
already has one.

## Design notes

- **Agents never publish unreviewed.** Chronicler drafts, Editor decides. The
  rejection path is the point: on the first live run, Editor rejected
  Chronicler's draft for AI-slop phrasing, closed the PR, and published
  nothing. The redraft passed.
- **Untrusted input stays untrusted.** The diff under review is marked as data
  in Editor's prompt, and approval requires the mechanical checks to pass
  first, so a PR body cannot talk its way to a merge.
- **Telemetry is honest.** Failed runs are published to the same public page as
  successful ones. A site that only reports good news isn't reporting.
