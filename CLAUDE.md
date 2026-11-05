# Weight Tracker

A self-hostable React PWA for tracking daily weight. Data stays in the browser, and there is no custom backend.

Current status: @docs/PROGRESS.md

## Docs

- `docs/SPEC.md`: what the app does. Its figure definitions are the source of truth.
- `docs/PLAN.md`: stack, milestone order and what each milestone teaches.
- `docs/PROGRESS.md`: current status and decision log. Update it when a milestone finishes, before ending a session partway through one, and when a decision changes.

## Working style

- Build each milestone on its own branch, then walk through the concepts listed for it in `docs/PLAN.md`.
- Merge through a pull request once CI passes. The user reviews and merges.
- Explain concepts as they come up. Python, Java, C# and Selenium make good comparisons.
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
