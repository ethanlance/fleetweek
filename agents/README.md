# The fleet

The agents that maintain this site. They are ordinary shell scripts on a
schedule: no daemon, no framework, no network ingress. Everything they do
arrives as a git commit or a pull request, so the whole operation is auditable
in this repo's history.

| Agent | Schedule | What it does |
|---|---|---|
| `chronicler.sh` | 06:45 daily | Reads the last 24h of commits across the configured source repos plus site telemetry, drafts the fleet digest, opens a `goose/digest-DATE` pull request. Never pushes to `main`. Skips quiet days rather than inventing activity. |
| `editor.sh` | 07:05 daily | Reviews Chronicler's PR: authorship check, path allowlist, secret scan, the anti-slop lexicon in `lib/slop-filter.sh`, then an LLM rubric. Approves and merges (which deploys), or comments and closes. Never rewrites silently. |
| `webmaster.sh` | 07:30 daily | Health checks (repo sync, production build, site reachability) published to `content/projects/<slug>/telemetry/jobs.json`. Publishes failures as readily as successes. |

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

Any scheduler works. On macOS these run as launchd agents labelled
`dev.fleetweek.*`; a crontab or a CI schedule would do equally well. Run any of
them by hand at any time — they are idempotent, and Chronicler will decline to
draft a second digest for a day that already has one.

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
