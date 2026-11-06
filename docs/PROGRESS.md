# Progress

**Current status:** The repo is public at `LeonKeithFranco/weight-tracker-react`. The project is scaffolded on `chore/scaffold-react-app`.

**Next:** Open and merge the pull request for milestone 1, then start milestone 2.

**In progress:** Milestone 1.

## Milestones

### Phase 1: Pipeline

- [ ] 1. Project setup
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
- Logic is built and unit tested before any UI, so components sit on tested code. Component and Playwright tests start with the UI.
- There are no coverage targets. Tests exist to catch real regressions, and chasing coverage produces brittle tests.
- Linear interpolation stays for missed days. It had the lowest error of the four methods tested against real data.
- Projections use a 90-day window. A 28-day window changed direction too often on real data.
- Calculations are kept in memory with `useMemo` and never saved. A saved copy could go stale after an edit.
