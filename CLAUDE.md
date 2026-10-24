## Working here

- Keep the main checkout on `main`: the user's Firefox add-on loads from its `src/`. Do all branch work in a worktree under `.claude/worktrees/`, and run `npm ci` there first.
- Code review applies `CODING_STANDARDS.md`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on gsajith/youtube-speed-tool, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
