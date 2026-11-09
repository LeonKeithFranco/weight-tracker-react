# Weight Tracker Plan

## Context

The spec is finished (`docs/SPEC.md`), and the repo has no app code yet. This plan sets the order, tools and working method for building the app, and teaches React, TypeScript, CI/CD and static hosting along the way. Containers, nginx, Quadlet, HTTPS certificates and local network naming come in an optional homelab milestone after the release.

## How we work

- Claude builds each milestone on its own branch, in small rounds of about one commit. Each round makes a small set of changes, explains them, then stops for your questions before continuing.
- Claude commits in small steps as the work goes, with each commit being one logical change that passes the checks by itself.
- Each milestone is merged through a pull request once CI passes. You review the code as it's written, and Claude merges when you ask.
- A milestone is done when CI passes, its concepts have been covered, `docs/PROGRESS.md` is updated, and the PR is merged.
- Tests are written alongside or after the code to guard against regressions, not test-first. There are no coverage targets.
- Commands on the homelab, in the optional milestone 14, are yours to run. Claude provides each step and explains it.

## Stack

| Concern                        | Choice                                     | Why                                                 |
| ------------------------------ | ------------------------------------------ | --------------------------------------------------- |
| Build tool                     | Vite                                       | The standard way to start a React app               |
| UI                             | React + TypeScript (strict)                | Learning goals                                      |
| Routing                        | React Router                               | Four screens, and a widely used skill               |
| Storage                        | Dexie over IndexedDB                       | Simpler API, with React hooks for live data         |
| Dates                          | Day.js                                     | Small, with `YYYY-MM-DD` style format tokens        |
| Statistics                     | simple-statistics                          | Regression, mean and standard deviation             |
| CSV                            | PapaParse                                  | Handles quoting, line endings and byte order marks  |
| Charts                         | Recharts                                   | Written for React; covers line, area and bar charts |
| Styling                        | CSS Modules                                | Teaches responsive CSS directly                     |
| PWA                            | vite-plugin-pwa                            | Generates the service worker and manifest           |
| Unit and component tests       | Vitest + React Testing Library             | Integrates with Vite                                |
| End-to-end tests               | Playwright                                 | Builds on your Selenium experience                  |
| Hosting                        | GitHub Pages                               | Free, with HTTPS, and anyone can install from it    |
| CI/CD                          | GitHub Actions and GitHub Pages            | Checks and deploys the app                          |
| Containers (milestone 14)      | Podman and `ghcr.io`                       | Rootless; the self-hosting image                    |
| Web server (milestone 14)      | Unprivileged nginx                         | Serves static files without root                    |
| Homelab service (milestone 14) | Quadlet, `podman auto-update`              | Your homelab setup                                  |
| Homelab HTTPS (milestone 14)   | Caddy with its local certificate authority | No domain needed                                    |
| Homelab name (milestone 14)    | Avahi (mDNS)                               | Your router can't set custom DNS names              |

## Before milestone 1

You:

- Install `gh` and run `gh auth login`.

Claude:

- Fast-forward `main` to `docs/spec`, which holds the spec and the moved `CLAUDE` files.
- Create the public `weight-tracker-react` repo and push, after checking with you.

## Milestones

The work runs in three phases, plus an optional fourth:

1. **Pipeline:** CI and branch protection come first, so everything after them is checked automatically.
2. **Logic:** all calculations, parsing and storage are built and unit tested, with no UI.
3. **UI:** components are built on the tested logic, with component and Playwright tests alongside them. Deployment comes last, after you've used and tested the finished app locally.
4. **Optional:** the homelab setup, purely for learning, after the release.

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

Until milestone 12, the app runs from the dev server on your desktop. Your phone can open it over your Wi-Fi with `npm run dev -- --host`.

### 8. CSV screens and log page

- Build export, and the import preview and confirmation
- Build the Log page and its JSON export
- Add a Playwright test that an uncaught error in the browser shows up on the Log page
- Import your real history into the local copy, and keep logging in the spreadsheet until the deployed copy is set up

**Learn:** file handling in the browser, showing success and failure states

### 9. Data table

- Build the desktop table and the expandable phone rows
- Add edit and delete, with confirmation
- Mark estimated days

**Learn:** rendering lists and keys, derived state, responsive CSS, accessible expanding rows

### 10. Charts

- Build the four spreadsheet charts and the Projection chart, marking estimated days
- Add range presets, legend toggles, compact axis labels and formatted tooltips
- Check the simulation's speed on your phone

**Learn:** composing third-party components, reusable components, shaping data for display, keeping heavy work from slowing the UI

### 11. PWA

- Add the manifest, icons and service worker, with the manifest's `start_url` and `scope` following Vite's base path, so the app installs from a subfolder such as GitHub Pages' `/weight-tracker-react/`
- Add the reload prompt for new versions
- Request persistent storage, and show the browser's answer in Settings with a way to ask again
- Split the JavaScript into smaller files if the first load is slow, since Recharts took the main file past Vite's 500 kB warning
- Test install, offline use and updating on your desktop, and on your phone through Chrome's USB port forwarding, which counts as `localhost`, so no HTTPS is needed yet
- Check that an installed app keeps working when its server returns 404 for everything, as it would if GitHub Pages went away

**Learn:** service workers, caching, the app update lifecycle, why HTTPS is required, USB port forwarding, best-effort compared to persistent storage

### 12. GitHub Pages

- Take Vite's base path from a build environment variable, and give React Router `basename={import.meta.env.BASE_URL}`, so one codebase serves from `/weight-tracker-react/` and from `/`
- Copy `index.html` to `404.html` in the deploy workflow, because Pages has no route fallback
- Deploy from GitHub Actions on pushes to `main`, only after checks pass, with `actions/upload-pages-artifact` and `actions/deploy-pages`, the `pages: write` and `id-token: write` permissions, and the repo's Pages source set to GitHub Actions
- Confirm the app installs from Pages on your phone and desktop, works offline, and updates after a merge
- Move your data to the Pages copy with CSV export and import, then log there instead of in the spreadsheet

**Learn:** static hosting, base paths, deploy jobs and environments, workflow permissions, CI compared to CD

### 13. Release

- Write the README, covering using the app from GitHub Pages, self-hosting the built files on any web server with a route fallback, and the data limitations
- Tag version 1.0.0
- Retire the spreadsheet once you trust the app

**Learn:** versioning, release tags, writing docs for users and self-hosters

## Phase 4: Optional

### 14. Container image and homelab

A learning project after the release. It's a separate copy of the app with its own browser data, so your real data stays on GitHub Pages unless you choose to move it.

Image:

- Add a multi-stage `Containerfile` and the nginx config, with the route fallback and caching rules
- Build with Podman on pushes to `main`, only after checks pass, and publish to `ghcr.io` tagged `latest` and with the commit SHA, plus a version tag for releases
- Make the image public
- Run the image locally with Podman, and check it serves the app from `/`
- Add self-hosting the image to the README

Homelab:

- Test `homelab.local` from your Android phone, using Avahi, and settle on the address
- Add the app's Quadlet file, then enable lingering and `podman-auto-update.timer`
- Set up Caddy, allow rootless use of port 443, and install its root certificate on your devices
- Stop the laptop from suspending when the lid closes
- Confirm the app loads over HTTPS on your phone and desktop, and that a new image deploys by itself

**Learn:** images and containers, rootless containers, multi-stage builds, registries and tags, nginx config, Quadlet and systemd, auto-update and rollback, reverse proxies, HTTPS, certificates and certificate authorities, DNS compared to mDNS

## Risks

| Risk                                                        | Mitigation                                                                                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| The UI needs logic output in a different shape              | Keep logic functions small, and adjust them in UI milestones; existing tests protect those changes                       |
| The address changes after real data is entered              | Data stays at the local address until milestone 12, then moves once to the GitHub Pages address by CSV export and import |
| The site is public                                          | The app's code is public anyway, and weight data never leaves the browser                                                |
| Other Pages sites on the account can read the app's storage | Host no untrusted code on the account's Pages; a custom domain would fix it but isn't wanted                             |
| Someone takes a freed username and publishes at the address | Keep the username, and export regularly                                                                                  |
| GitHub Pages changes its terms or ends                      | Installed copies keep working offline; export by CSV and self-host the built files                                       |
| `homelab.local` doesn't work on your phone                  | Test it first in milestone 14; fall back to HTTPS on the fixed IP                                                        |
| A figure doesn't match the spreadsheet                      | Compare against the real spreadsheet in milestone 3                                                                      |
| Browser data is lost                                        | Request persistent storage in milestone 11, export regularly, and keep the spreadsheet until milestone 13                |
| The projection is slow on your phone                        | Measured in milestone 10 at up to 284 ms with a slowed CPU, so the simulation was replaced by a direct calculation       |

## Verification

Every milestone must pass lint, type checks, tests and the build in CI, with Playwright added from milestone 7. Beyond that:

- **Milestone 2:** a PR with a deliberately failing test can't be merged.
- **Milestone 3:** every calculated figure matches the real spreadsheet.
- **Milestone 8:** all of your real weigh-ins from 2025 and 2026 import, which was 523 on 2026-11-08, and the figures match the spreadsheet except near the days it estimated with random values.
- **Milestone 11:** the installed app opens and logs an entry in airplane mode, still opens when its server returns 404, and Settings shows the browser's answer to the persistent storage request.
- **Milestone 12:** a merged change reaches the app installed from GitHub Pages on your phone with no manual steps, and your data moves over intact.
- **Milestone 13:** a fresh self-hosted setup following only the README works.
- **Milestone 14:** the image serves the app locally with Podman, the app loads over HTTPS at `homelab.local` on your phone and desktop, and a new image deploys by itself.
