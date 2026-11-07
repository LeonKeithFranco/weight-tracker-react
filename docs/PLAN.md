# Weight Tracker Plan

## Context

The spec is finished (`docs/SPEC.md`), and the repo has no app code yet. This plan sets the order, tools and working method for building the app, and teaches React, TypeScript, CI/CD, Quadlet, nginx, HTTPS and certificates, and local network naming along the way.

## How we work

- Claude builds each milestone on its own branch, then explains it.
- Claude commits in small steps as the work goes, with each commit being one logical change that passes the checks by itself.
- Each milestone is merged through a pull request once CI passes. You review the code as it's written, and Claude merges when you ask.
- A milestone is done when CI passes, the walkthrough of its concepts is finished, `docs/PROGRESS.md` is updated, and the PR is merged.
- Tests are written alongside or after the code to guard against regressions, not test-first. There are no coverage targets.
- Commands on the homelab are yours to run. Claude provides each step and explains it.

## Stack

| Concern                  | Choice                                     | Why                                                 |
| ------------------------ | ------------------------------------------ | --------------------------------------------------- |
| Build tool               | Vite                                       | The standard way to start a React app               |
| UI                       | React + TypeScript (strict)                | Learning goals                                      |
| Routing                  | React Router                               | Four screens, and a widely used skill               |
| Storage                  | Dexie over IndexedDB                       | Simpler API, with React hooks for live data         |
| Dates                    | Day.js                                     | Small, with `YYYY-MM-DD` style format tokens        |
| Statistics               | simple-statistics                          | Regression, percentiles and standard deviation      |
| Seeded randomness        | seedrandom and d3-random                   | Repeatable generator and normal distribution draws  |
| CSV                      | PapaParse                                  | Handles quoting, line endings and byte order marks  |
| Charts                   | Recharts                                   | Written for React; covers line, area and bar charts |
| Styling                  | CSS Modules                                | Teaches responsive CSS directly                     |
| PWA                      | vite-plugin-pwa                            | Generates the service worker and manifest           |
| Unit and component tests | Vitest + React Testing Library             | Integrates with Vite                                |
| End-to-end tests         | Playwright                                 | Builds on your Selenium experience                  |
| Containers               | Podman, Quadlet, `podman auto-update`      | Your homelab setup; rootless                        |
| Web server               | Unprivileged nginx                         | Serves static files without root                    |
| HTTPS                    | Caddy with its local certificate authority | No domain needed                                    |
| Local name               | Avahi (mDNS)                               | Your router can't set custom DNS names              |
| CI/CD                    | GitHub Actions + `ghcr.io`                 | The planned deployment                              |

## Before milestone 1

You:

- Install `gh` and run `gh auth login`.

Claude:

- Fast-forward `main` to `docs/spec`, which holds the spec and the moved `CLAUDE` files.
- Create the public `weight-tracker-react` repo and push, after checking with you.

## Milestones

The work runs in three phases:

1. **Pipeline:** CI and branch protection come first, so everything after them is checked automatically.
2. **Logic:** all calculations, parsing and storage are built and unit tested, with no UI.
3. **UI:** components are built on the tested logic, with component and Playwright tests alongside them. Deployment comes once there's a usable app, before real data goes in.

## Phase 1: Pipeline

### 1. Project setup

- Create the Vite, React and strict TypeScript project
- Add ESLint, Prettier and Vitest, with one placeholder page and test
- Pin the Node version

**Learn:** project structure, how TypeScript fits into the build, npm scripts, JSX and components

### 2. CI and branch protection

- Add a GitHub Actions workflow that runs lint, type checks, unit tests and the build on every push and pull request
- Protect `main` so a PR can't merge until checks pass

**Learn:** workflows, jobs, steps and triggers, branch protection, why CI protects you

## Phase 2: Logic

Everything here is plain TypeScript with no React, covered by unit tests using synthetic data.

### 3. Core calculations

- Add unit conversion and date helpers, including display formatting and compact chart labels
- Build the daily series with interpolation
- Calculate every daily figure in the spec
- Add chart range filtering
- Work out expected test values from the spreadsheet's formulas
- Do a one-off local comparison against the real spreadsheet, keeping the file out of the repo

**Learn:** TypeScript types, unions and generics, pure functions, why logic is kept separate from UI

### 4. Projections

- Add the goal date estimate and each of its display states
- Add the seeded simulation
- Measure the simulation's speed

**Learn:** linear regression and random walks in code, seeded randomness, testing non-deterministic code

### 5. CSV logic

- Add CSV export formatting
- Add the parser for both import formats
- Add the preview logic that counts new, overwritten and invalid rows

**Learn:** handling untrusted input, modeling success and failure in types

### 6. Storage and activity log

- Define the storage interface
- Add a Dexie implementation and an in-memory one for tests
- Record every data change at the storage interface
- Cap the log at 5,000 entries, and make sure log failures can't block a data change

**Learn:** interfaces, async/await and promises in TypeScript, IndexedDB basics, dependency injection

## Phase 3: UI

Every milestone here that builds UI adds component tests and Playwright tests for its features.

### 7. App shell, logging and settings

- Add Playwright, run it in CI at desktop and phone sizes, and save traces when a test fails
- Build the app shell, four screens and responsive navigation
- Build the logging form with validation
- Build settings for display unit, target weight and date format with a live preview
- Show latest figures and the goal date on the home screen, calculated with `useMemo`
- Record uncaught errors with a global handler and a React error boundary

**Learn:** props, state, controlled forms, hooks, `useMemo`, context, routing, error boundaries, component tests, Playwright compared to Selenium, CI artifacts

### 8. Containers and deployment

Image:

- Add a multi-stage `Containerfile` and the nginx config, with the route fallback and caching rules
- Build with Podman on pushes to `main`, only after checks pass, and publish to `ghcr.io` tagged `latest` and with the commit SHA
- Make the image public

Homelab:

- Test `homelab.local` from your Android phone, using Avahi, and settle on the final address
- Add the app's Quadlet file, then enable lingering and `podman-auto-update.timer`
- Set up Caddy, allow rootless use of port 443, and install its root certificate on your devices
- Stop the laptop from suspending when the lid closes
- Confirm the app loads over HTTPS on your phone and desktop, and that a merged change deploys by itself

**Learn:** images and containers, rootless containers, multi-stage builds, registries and tags, workflow permissions, CI compared to CD, Quadlet and systemd, auto-update and rollback, nginx config, HTTPS, certificates and certificate authorities, DNS compared to mDNS

### 9. CSV screens and log page

- Build export, and the import preview and confirmation
- Build the Log page and its JSON export
- Import your real history

**Learn:** file handling in the browser, showing success and failure states

### 10. Data table

- Build the desktop table and the expandable phone rows
- Add edit and delete, with confirmation
- Mark estimated days

**Learn:** rendering lists and keys, derived state, responsive CSS, accessible expanding rows

### 11. Charts

- Build the four spreadsheet charts and the Projection chart, marking estimated days
- Add range presets, legend toggles, compact axis labels and formatted tooltips

**Learn:** composing third-party components, reusable components, shaping data for display, keeping heavy work from slowing the UI

### 12. PWA

- Add the manifest, icons and service worker
- Add the reload prompt for new versions
- Test install, offline use and updating on your phone and desktop

**Learn:** service workers, caching, the app update lifecycle, why HTTPS is required

### 13. Release

- Write the README, covering self-hosting and the data limitations
- Tag version 1.0.0, with a versioned image tag
- Retire the spreadsheet once you trust the app

**Learn:** versioning, release tags, writing docs for self-hosters

## Risks

| Risk                                           | Mitigation                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| The UI needs logic output in a different shape | Keep logic functions small, and adjust them in UI milestones; existing tests protect those changes |
| `homelab.local` doesn't work on your phone     | Test it first in milestone 8; fall back to HTTPS on the fixed IP                                   |
| The address changes after real data is entered | Settle the address in milestone 8, before real data goes in at milestone 9                         |
| A figure doesn't match the spreadsheet         | Compare against the real spreadsheet in milestone 3                                                |
| Browser data is lost                           | Export regularly, and keep the spreadsheet until milestone 13                                      |
| The simulation is slow on your phone           | Measure in milestone 4, and use a web worker in milestone 11 if needed                             |

## Verification

Every milestone must pass lint, type checks, tests and the build in CI, with Playwright added from milestone 7. Beyond that:

- **Milestone 2:** a PR with a deliberately failing test can't be merged.
- **Milestone 3:** every calculated figure matches the real spreadsheet.
- **Milestone 8:** a merged change appears on your phone over HTTPS with no manual steps.
- **Milestone 9:** all 309 of your days import, and the figures still match.
- **Milestone 12:** the installed app opens and logs an entry in airplane mode.
- **Milestone 13:** a fresh setup following only the README works.
