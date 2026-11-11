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
- Build each branch in its own git worktree at `../weight-tracker-worktrees/<name>`, made with `git worktree add -b <branch> <path> <base>`, so the main folder stays on `main`. Install the dependencies in the worktree. Playwright always tests `localhost:5173` and reuses a server already running there, so if another folder's dev server holds that port, run Playwright with a temporary config outside the repo that starts this folder's dev server on its own port with `--strictPort`. Untracked files such as `CLAUDE.local.md` aren't in the worktree, so read them from the main folder.
- After a rebase merge, the branch's commits have new SHAs on `main`, so `git branch -d` refuses it. Check that `git cherry origin/main <branch>` lists no `+` lines, then remove the worktree with `git worktree remove` and the branch with `git branch -D`.
- Stay within the current milestone. Before a check or addition that goes beyond its bullets in `docs/PLAN.md`, such as using a later milestone's tools, say so and ask, with the in-scope option recommended.
- Ask questions with the question tool rather than a list in the reply. Give the background first, recommend an option by putting it first, and use previews to compare layouts.
- When a message holds both a task and a question, answer the question before starting the task.
- Use tried and tested libraries rather than writing general-purpose code, such as statistics or CSV parsing, by hand, and explain each new one. Keep hand-written code for the app's own rules.
- Use royalty-free art from an open-licensed icon set, such as Tabler Icons or Lucide, rather than drawing graphics, and say which set and licence each piece comes from.
- Give the user the commands to run on the homelab, and explain each one.

## Testing

- Write tests after writing the code. The code may need tweaks to get the behaviour exactly right, and the tests then lock that behaviour in to guard against regressions. For a bug fix, write the regression test first and see it fail. Don't use test-driven development, and don't chase coverage numbers.
- Follow the testing trophy: static checks, unit tests for pure logic, mostly component tests that render the real `DataProvider` and storage rules, and Playwright tests for the main journeys at desktop and phone sizes. Every input variation of a rule stays in unit tests.
- Cover every behaviour: each rule, edge case, journey and failure should have a test that would catch it breaking.
- Test what a user sees, and fake only what a test can't use for real, such as IndexedDB in Node.
- Find elements by role and label first, and use `data-testid` only where nothing a user sees identifies the element, such as a chart.
- Check that a new test can fail by breaking the code on purpose, and say that the edit is temporary before making it.

## Documentation

- Give every module-level item a TSDoc comment, private ones included: functions, components, classes, types, constants, and each field of a type.
- Follow TSDoc's conventions first: a one-line summary, then `@param name - …`, `@returns`, `@throws {@link Error}`, `@typeParam` and `@remarks`, with types left to the signature. Document a promise's rejections with `@throws`.
- Describe what a value means, not its type.
- Components document each prop on their props type, with no `@param props` or `@returns`. Classes that implement `WeightStorage` or `StorageBackend` leave the interface's methods uncommented, so editors show the interface's comment, and never use `{@inheritDoc}`.
- Use `{@link}` only for names in scope, and backticks otherwise.
- Tests are described by their names, with no comment above each test. Every test file groups its tests in `describe` blocks named after the unit, screen or journey. Module-level fixtures and helpers get full doc comments.
- Check every claim a comment makes against the code, and third-party behaviour in the library's docs or source, or by running it. When changing a comment, re-read the comments that describe the same thing.
- `npm run lint` checks that comments are well formed, with `eslint-plugin-tsdoc`, and complete, with `eslint-plugin-jsdoc`. Prove a change to those checks on a broken and a complete example. Lint can't tell whether a comment is true.

## Rules

- Keep calculations in pure functions, separate from React components.
- Access data only through the storage interface.
- Store weights in kg at full precision. Convert and round only for display.
- Store dates as `YYYY-MM-DD` calendar dates, never as timestamps.
- Never save interpolated values as entries.
- Use Podman, not Docker, for container commands and docs.
- Never commit `example-weight-tracker.fods` or use its contents as test data. It holds real personal data.
- Keep the homelab's IP out of committed files.
