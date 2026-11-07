# Weight Tracker

A self-hostable React PWA for tracking daily weight. Data stays in the browser, and there is no custom backend.

Current status: @docs/PROGRESS.md

## Docs

- `docs/SPEC.md`: what the app does. Its figure definitions are the source of truth.
- `docs/PLAN.md`: stack, milestone order and what each milestone teaches.
- `docs/PROGRESS.md`: current status and decision log. Update it when a milestone finishes, before ending a session partway through one, and when a decision changes.

## Working style

- Build each milestone on its own branch, in small rounds of about one commit. Each round makes a small set of changes, explains them and the related concepts listed in `docs/PLAN.md`, then stops for the user's questions before continuing.
- Commit in small steps as the work goes. Each commit is one logical change that passes the checks by itself, such as one module with its tests.
- Merge through a pull request once CI passes. The user reviews the code as it's written and asks Claude to merge. Never merge without being asked.
- Rebase merge by default, so the small commits stay on `main`. Squash only when the commits aren't worth keeping.
- Teaching is a core goal. Explain what each new command and piece of code does and why, without being asked, and break new commands down part by part. Don't re-teach what's already been covered. Python, Java, C# and Selenium make good comparisons.
- Run commands and setup steps directly, then explain them. Only hand a step to the user if they ask, or if Claude can't run it.
- Create and change files with the file tools, not shell commands, so the user sees each diff. Use the project's tools for mechanical fixes, such as `npm run format`, and say which files changed.
- Prefer the conventional, idiomatic approach for each language and framework, and point out where it differs from Python, Java or C# habits.
- Name branches `type/short-description`, describing the work, such as `feat/chart-range-presets`. Never use milestone numbers.
- Use Conventional Commits for commit messages and PR titles, such as `feat(charts): add range presets`.
- Write tests alongside or after the code to guard against regressions. Don't use test-driven development, and don't chase coverage numbers.
- Give the user the commands to run on the homelab, and explain each one.

## Rules

- Keep calculations in pure functions, separate from React components.
- Access data only through the storage interface.
- Store weights in kg at full precision. Convert and round only for display.
- Store dates as `YYYY-MM-DD` calendar dates, never as timestamps.
- Never save interpolated values as entries.
- Use Podman, not Docker, for container commands and docs.
- Never commit `example-weight-tracker.fods` or use its contents as test data. It holds real personal data.
- Keep the homelab's IP out of committed files.
