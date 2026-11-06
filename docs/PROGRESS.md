# Progress

**Current status:** Milestone 3 is merged. The repo is public at `LeonKeithFranco/weight-tracker-react`, with a placeholder app and tested calculation code in `src/lib/`. All 309 days of calculated figures matched the real spreadsheet. CI runs on every PR, and the `Protect main` ruleset blocks merging until the `Checks` job passes.

**Next:** Start milestone 4, projections.

**In progress:** Milestone 4, on `feat/projections`.

## Milestones

### Phase 1: Pipeline

- [x] 1. Project setup
- [x] 2. CI and branch protection

### Phase 2: Logic

- [x] 3. Core calculations
- [ ] 4. Projections
- [ ] 5. CSV logic
- [ ] 6. Storage and activity log

### Phase 3: UI

- [ ] 7. App shell, logging and settings
- [ ] 8. Containers and deployment
- [ ] 9. CSV screens and log page
- [ ] 10. Data table
- [ ] 11. Charts
- [ ] 12. PWA
- [ ] 13. Release

## Decision log

Record changes to the spec or plan here, with the reason.

### 2026-11-06

- Chart range presets count back from the latest day in the data, not from today. Otherwise a break from logging would leave the charts empty.
- Date arithmetic parses calendar dates as UTC, because UTC has no daylight saving. A local day can be 23 or 25 hours long.
- The simulation follows the spec, not the Scratch sheet. The sheet's other details, such as its hardcoded floor on simulated weight, aren't carried over, because the user doesn't remember what they were for.
- Claude merges PRs when the user asks, once CI passes. The user reviews the code as it's written, so asking for the merge is their sign-off.
- Commits are small, with one logical change each, because milestone 3's single 15-file commit was hard to read. Claude commits as the work goes rather than once at the end.
- PRs now rebase merge by default, so those small commits stay on `main`. This replaces choosing per PR, and squash is only for commits that aren't worth keeping.

### 2026-11-05

- Spec and plan approved.
- The repo is `weight-tracker-react`, because `weight-tracker` was already taken on the account.
- The license is MIT.
- ESLint was chosen over Oxlint, for its ecosystem and because it's what the plan specified.
- A moderate `npm audit` warning in `minimatch` is accepted for now. It only affects development tools, and `npm audit fix --force` would downgrade ESLint.
- Branches use `type/description` names, and commits and PR titles use Conventional Commits.
- PR merge method is chosen per PR: rebase when the commits are worth keeping, squash when they aren't.
- Tests sit next to the code they test. Playwright tests will go in a top-level `e2e/` folder.
- CI runs on pushes to `main` and on pull requests, not on every branch push as the plan said. Running on both would check each PR commit twice.
- CI also checks Prettier formatting, which the plan didn't list, so unformatted code can't reach `main`.
- `main` is protected with a ruleset rather than a classic branch protection rule, because GitHub recommends rulesets. It requires a PR and the `Checks` job, with 0 approvals because GitHub doesn't allow approving your own PR. Renaming that job would break the rule.
- Containers and deployment moved from milestone 3 to milestone 8, right after the app shell, and the milestones between were renumbered. Deploying a placeholder has little value for a solo project, and nothing needs deployment until real data goes in at milestone 9, when the address must be settled.
- The user writes first-time config by hand, such as the CI workflow. Claude writes test files unless told otherwise.
- Logic is built and unit tested before any UI, so components sit on tested code. Component and Playwright tests start with the UI.
- There are no coverage targets. Tests exist to catch real regressions, and chasing coverage produces brittle tests.
- Linear interpolation stays for missed days. It had the lowest error of the four methods tested against real data.
- Projections use a 90-day window. A 28-day window changed direction too often on real data.
- Calculations are kept in memory with `useMemo` and never saved. A saved copy could go stale after an edit.
