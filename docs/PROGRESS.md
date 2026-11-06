# Progress

**Current status:** Milestone 1 is merged. The repo is public at `LeonKeithFranco/weight-tracker-react`, with a placeholder app, ESLint, Prettier, Vitest and one smoke test.

**Next:** Finish milestone 2: add `.github/workflows/ci.yml`, open the PR, protect `main`, and prove a failing test can't merge. When protecting `main`, require passing checks but not approvals, because GitHub doesn't allow approving your own PR.

**In progress:** Milestone 2, on `ci/add-github-actions-workflow`.

## Milestones

### Phase 1: Pipeline

- [x] 1. Project setup
- [ ] 2. CI and branch protection
- [ ] 3. Containers and deployment

### Phase 2: Logic

- [ ] 4. Core calculations
- [ ] 5. Projections
- [ ] 6. CSV logic
- [ ] 7. Storage and activity log

### Phase 3: UI

- [ ] 8. App shell, logging and settings
- [ ] 9. CSV screens and log page
- [ ] 10. Data table
- [ ] 11. Charts
- [ ] 12. PWA
- [ ] 13. Release

## Decision log

Record changes to the spec or plan here, with the reason.

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
- Logic is built and unit tested before any UI, so components sit on tested code. Component and Playwright tests start with the UI.
- There are no coverage targets. Tests exist to catch real regressions, and chasing coverage produces brittle tests.
- Linear interpolation stays for missed days. It had the lowest error of the four methods tested against real data.
- Projections use a 90-day window. A 28-day window changed direction too often on real data.
- Calculations are kept in memory with `useMemo` and never saved. A saved copy could go stale after an edit.
