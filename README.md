# Weight Tracker

A daily weight tracker, built to replace a personal spreadsheet and as a portfolio project. It's an offline-first progressive web app (PWA): you log one weight a day, and it works out averages, lows, progress toward a target and a projected goal date. Data stays in the browser, and there's no backend.

**Open it:** <https://leonkeithfranco.github.io/weight-tracker-react/>

**Releases:** the [latest release](https://github.com/leonkeithfranco/weight-tracker-react/releases/latest), with notes on what changed.

**Stack:** React, TypeScript, Vite, CSS Modules, Recharts, Dexie (IndexedDB), vite-plugin-pwa, Vitest, Playwright, GitHub Actions and GitHub Pages.

## Why it exists

The app replaces a spreadsheet that had tracked a daily weight since the start of 2025. It reproduces every figure and chart the spreadsheet had, checked against the real history, where each year matches its own sheet except on days the sheet estimated differently. It also makes daily logging quick on a phone, and makes the history comfortable to review on a desktop.

It was also a way to learn by building something real:

- **TypeScript and React**, with TypeScript in strict mode.
- **Playwright**, for end-to-end tests at desktop and phone sizes.
- **CI/CD**, with GitHub Actions checking every change and deploying to GitHub Pages.
- **Agentic engineering**: building software with an AI coding agent in a structured, reviewable way, rather than accepting whatever it writes.

## What it does

- **Home:** log today's weight, or any past day's, and see the latest figures and the date the trend reaches the target.
- **Charts:** weight trends, progress, loss rate and weekly change, over ranges from one month to all time, and a projection of the next six months with a likely range.
- **Data:** every day's figures in a table on desktop, and in rows that expand on a phone, with edit and delete for saved entries. Missed days are estimated from the days either side, and marked as estimated.
- **Settings:** kg or lb, the target, the date format, CSV export and import with a preview, whether the browser will keep the data, a link to the activity log of changes and errors, and the app's version.
- **Offline and installable:** after the first visit, the whole app works with no connection. It installs on a phone or computer like a native app, and offers to reload when a new version is out.

The target is assumed to be below the starting weight, so the app suits losing weight, not gaining it.

## How it was built: agentic engineering

The code was written with [Claude Code](https://claude.com/claude-code), an AI coding agent that works in the terminal. The aim was to use an agent the way a team uses a fast, capable new developer: with a clear spec, small changes, review before anything merges, and tests that guard the result.

### The workflow

1. **Spec first.** [`docs/SPEC.md`](docs/SPEC.md) defines what the app does, down to how each figure is calculated. Its figure definitions are the source of truth for the calculations, and when a decision changes the spec, the decision log records why.
2. **Then a plan.** [`docs/PLAN.md`](docs/PLAN.md) sets the stack and splits the work into milestones, each with what it should teach, plus checks that prove the key milestones work. Logic came before UI, so the screens were built on tested code.
3. **Then small rounds.** Each milestone was built on its own branch. From the storage milestone on, the work went in rounds of about one commit. After each round, the agent explained what it changed and the concepts behind it, then stopped for questions before going on. The lessons below say how this way of working came about.
4. **Then a pull request.** Every milestone merged through a pull request, and only when the developer asked for the merge. From the second milestone, which added CI, a pull request could only merge once CI passed.

### Who did what

- **The developer** set the direction: what the app does, what went into the spec and plan, which they approved, and the design and trade-off decisions. They reviewed and questioned each change as it was written, wrote some of the code, such as the project setup and the first CI workflow, and tested the app by hand on a real phone and desktop with real data.
- **Claude Code** wrote most of the code and tests, ran the tools, explained each change, and proposed options with a recommendation when there was a choice to make.

### Guard rails

An agent writes code quickly, so the project relies on checks that don't depend on trusting it:

- **Written rules.** [`CLAUDE.md`](CLAUDE.md) holds the project's rules, such as keeping calculations in pure functions, storing weights at full precision and never saving estimated values, plus the working style and commit conventions. The agent reads it at the start of every session.
- **Branch protection.** A ruleset on `main` requires a pull request and a passing `Checks` job, so nothing reaches the live app without passing lint, formatting, type checks, unit, component and end-to-end tests, and a production build. This was proved with [a pull request](https://github.com/leonkeithfranco/weight-tracker-react/pull/3) containing a deliberately failing test, which couldn't be merged.
- **Tests that are seen to fail.** Bug fixes that a test can catch start with a regression test that fails before the fix. New tests are often checked by breaking the code on purpose, to show they catch it.
- **Small commits.** Each commit aims to be one logical change that passes the checks by itself, written in [Conventional Commits](https://www.conventionalcommits.org/) style, and pull requests are rebase merged by default so the history stays readable.

### The decision log

[`docs/PROGRESS.md`](docs/PROGRESS.md) records the decisions behind the spec, plan and design, each with its reason and often the options that were rejected. For example, why the projection's range is calculated directly rather than simulated, why weight fields are text inputs rather than number inputs, and why the charts load from a separate file. `CLAUDE.md` loads it into every session, so decisions carry over between sessions.

### Lessons learned

- **Small reviewed rounds keep a human in control.** An early milestone landed as a single 15-file commit, which was hard to review, so commits became one logical change each. Later, a question partway through the CSV work changed the rule for valid weights before any UI depended on it. That led to building in small rounds with a pause after each, so decisions get caught early.
- **Check that tests can fail.** A test can pass for the wrong reason. The first regression test for a bug where the Data screen's rows took taps meant for the phone's tab bar passed before the fix, because no rows were under the bar. It only caught the bug once it opened the Data screen directly. The test for links under GitHub Pages' subfolder was checked the same way, by removing the router's base path. Seeing a test fail on broken code is what shows it guards anything.
- **Write rules down.** Preferences explained only in a chat don't reliably reach the next session. Written into `CLAUDE.md`, the decision log and the agent's own memory files, they mostly carried over without being explained again, and each new correction was written down too.
- **Measure before optimising, including with a slowed CPU.** The projection's simulation took 49 ms on the desktop but up to 284 ms with the CPU slowed six times, enough to freeze a phone's screen. It was replaced by a direct calculation of the result the simulation only approximated, which takes microseconds. Loading the charts from a separate file came from measured load times too.
- **Review with a fresh context.** Before the 1.0 release, the README went through four reviews by subagents that hadn't seen it being written, then a final errors-only check. Each review found claims that overstated the record, including one introduced by the previous round's fix, and the final check found none. A reviewer that doesn't share the writer's assumptions catches what the writer can't.

## Technical highlights

### Testing

The tests follow the [testing trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications): static checks, unit tests for pure logic, mostly integration tests, and end-to-end tests for the main journeys.

- **Static checks:** strict TypeScript, ESLint and Prettier. Every module-level item has a [TSDoc](https://tsdoc.org/) comment, and ESLint checks their syntax in the TypeScript files.
- **Unit tests** in [Vitest](https://vitest.dev/) cover each rule and edge case of the calculations, CSV parsing and storage, next to the code, mostly in [`src/lib`](src/lib) and [`src/storage`](src/storage).
- **Component tests** use [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) with the real data provider and storage rules, and an in-memory backend in place of IndexedDB.
- **End-to-end tests** in [Playwright](https://playwright.dev/), in [`e2e`](e2e), run each journey at desktop and phone sizes. A third project builds the app for production and checks it works offline through its service worker.
- Elements are found by role and label wherever a user or screen reader could find them that way, so a test also fails when an element loses the role or name a screen reader relies on.

### CI/CD

One GitHub Actions workflow, [`pipeline.yml`](.github/workflows/pipeline.yml), runs the checks on every pull request to `main` and every push to `main`. On `main`, once the checks pass, it builds the app for GitHub Pages and deploys it. The build job runs with a read-only token, and only the deploy job, which runs GitHub's own action, can write to Pages. A failed run uploads Playwright's report and traces.

### Offline PWA

- A service worker, generated by [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) and Workbox, keeps the whole app for offline use.
- New versions wait for the user to reload, rather than swapping the code under a half-typed weight.
- The app asks the browser for persistent storage once there's data to keep, and Settings shows the answer.
- The charts library loads from its own file, which halved the main JavaScript file. Measured on a production build with a slowed CPU, it also halved the first load on a simulated fast 4G connection.

### Architecture

- **Pure calculations.** Every figure is a pure function in [`src/lib`](src/lib), separate from React, so it can be unit tested exactly.
- **A storage interface.** Screens reach data only through a React context over [`WeightStorage`](src/storage/weightStorage.ts). Its rules live in one class, over a backend that only reads and writes, with [Dexie](https://dexie.org/) on IndexedDB in the app and an in-memory backend for tests. Both backends pass the same test suite.
- **Data as entered.** Weights are stored in kg at full precision and rounded only for display, dates are calendar dates rather than timestamps, and estimated days are calculated on the fly and never saved.

Other libraries include React Router, Day.js, PapaParse and simple-statistics.

## Using the app

### Install the app

Installing gives the app its own icon and window, and makes your browser more likely to keep its data. It works offline either way, after the first visit.

| Device and browser                      | How to install                                                                                                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Android, in Chrome                      | Open the menu (⋮) and choose **Add to home screen** or **Install app**, then **Install**.                                                                                        |
| iPhone or iPad, in Safari               | Tap **Share**, which newer versions put under the **⋯** button, then **Add to Home Screen**. Other browsers on iOS 16.4 and later may offer the same option in their Share menu. |
| Windows, Mac or Linux, in Chrome        | Click the install icon at the right end of the address bar, or open the menu (⋮) and look for **Install**.                                                                       |
| Windows, Mac or Linux, in Edge          | Click **App available** in the address bar, or open the menu (…) and choose **Apps**, then **Install this site as an app**.                                                      |
| Mac, in Safari on macOS Sonoma or later | Choose **File**, then **Add to Dock**.                                                                                                                                           |
| Firefox                                 | On Android, open the menu and choose **Add to Home screen**. On a computer, Firefox may not offer to install it, so use the app in a tab, or install it from Chrome or Edge.     |

Browsers rename these menus now and then, so the exact words may differ.

An installed copy may not share data with the browser it came from. On an iPhone, iPad or Mac, an app added from Safari keeps its data apart from Safari, and a copy installed from a different browser always starts empty. Install before you start logging, or move your data across by CSV.

To uninstall, remove the app as you would any other. Uninstalling may delete its data, on some devices without asking, so export a CSV first if you want to keep it.

### Your data

- **It stays in this browser, on this device.** There's no account and no sync. Your phone and your computer each keep their own copy, and so do two browsers on the same computer.
- **Clearing site data deletes it.** Anything logged in a private window is lost when the window closes.
- **Export a CSV now and then as a backup**, from Settings. Settings shows whether the browser has agreed to keep the data, but even kept data is lost with the device.
- **To move to another device or browser**, export a CSV on the old one and import it on the new one. The import shows a preview of what it will add, overwrite and skip before saving anything.
- **Imports** take the app's own export, which has `date,weight_kg` columns, or any CSV with `Date` and `Weight (lbs)` columns, the format of the spreadsheet the app replaced. Extra columns are ignored, and dates can be `YYYY-MM-DD` or `DD-MM-YYYY`.
- **The activity log**, linked from Settings, records every change to your weights, including imports, and any errors, and keeps the latest 5,000 entries. It never leaves the device unless you export it as JSON from its page.
- Every site published on GitHub Pages from the same account shares the address `leonkeithfranco.github.io`, and browsers keep data per address, so in principle those sites can read each other's data. The address also only stays safe while the account keeps its username. Self-host your own copy if either matters to you.

## Self-hosting

The app is static files, so any web server can host it. A self-hosted copy has its own address, so its data is separate from the GitHub Pages copy. Move data across by CSV.

To build it, you need the [Node.js](https://nodejs.org/) version in [`.nvmrc`](.nvmrc), and [Git](https://git-scm.com/) to clone the repo. Check out the latest release's tag, such as `v1.0.0`:

```bash
git clone https://github.com/leonkeithfranco/weight-tracker-react.git
cd weight-tracker-react
git checkout v1.0.0
npm ci
npm run build
```

Without Git, download the source code zip from the [latest release](https://github.com/leonkeithfranco/weight-tracker-react/releases/latest), unzip it, and run `npm ci` and `npm run build` in its folder.

`npm ci` installs exactly the dependency versions in `package-lock.json`, so every build of a release uses the same code. The site is in the `dist` folder. Copy its contents to the web server.

To serve the app from a subfolder, such as `https://example.com/weight/`, build with `BASE_PATH=/weight/ npm run build`, with a slash at each end. The path is fixed when the app is built.

The server needs three things:

1. **HTTPS.** Browsers only run the app's offline support, and only offer to install it, over HTTPS, apart from on `localhost`.
2. **A route fallback.** Each screen has its own address, such as `/charts`, but there's no `charts` file. The server must answer addresses with no file behind them with the app's `index.html`, so opening or refreshing a screen's address works. For a subfolder build, use the subfolder's `index.html`.
3. **No long-term caching outside `assets`.** Every screen's address is answered with `index.html`, so a long-cached copy would keep loading old code, and a CDN or proxy caching `sw.js` would hide updates. The files in `assets` have a hash in their names, so they can be cached for as long as you like.

Most web servers can do all three. Their docs usually call the route fallback a "single-page app" or "SPA" fallback.

To update, run `git fetch --tags`, check out the new release's tag, then run `npm ci` and `npm run build` again and replace the files on the server. Without Git, download the new release's zip and build it the same way. Installed copies notice the new version the next time they open, and offer to reload.

## Development

You need the Node.js version in [`.nvmrc`](.nvmrc).

```bash
npm install
npm run dev
```

| Command                  | What it does                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`            | Starts the dev server, which reloads as you edit                                                                                  |
| `npm run build`          | Type checks and builds the site into `dist`                                                                                       |
| `npm run preview`        | Serves whatever is in `dist`, with the service worker running                                                                     |
| `npm run lint`           | Checks the code with ESLint                                                                                                       |
| `npm run format`         | Formats the code with Prettier                                                                                                    |
| `npm run format:check`   | Checks the formatting without changing files, as CI does                                                                          |
| `npm run typecheck`      | Type checks the code                                                                                                              |
| `npm test`               | Runs the unit and component tests with Vitest                                                                                     |
| `npm run test:watch`     | Runs the unit and component tests again on every change                                                                           |
| `npm run test:e2e`       | Runs the end-to-end tests with Playwright. It starts the dev server, or reuses one that's already running, and builds into `dist` |
| `npm run generate-icons` | Makes every icon size from `public/favicon.svg`                                                                                   |

Before the first end-to-end run, install Playwright's browser with `npx playwright install chromium`. On Debian or Ubuntu, add `--with-deps` to install the system libraries it needs too.

`npm run test:e2e` builds into `dist` for a subfolder, as on GitHub Pages, so run `npm run build` again before `npm run preview`.

The spec, plan and decision log are linked under [How it was built](#how-it-was-built-agentic-engineering).

### Releasing

Versions follow [semantic versioning](https://semver.org/): a fix bumps the patch number, a new feature the minor number, and a change that stops old data or files working the major number. Any other change to the app, such as a refactor or a dependency update, bumps the patch number. Every pull request that changes the app bumps the version, because every merge to `main` deploys to GitHub Pages. The one exception is a fix for a release whose run on `main` failed, which keeps that release's number, because it never went live.

1. On the pull request's branch, bump the version with `patch`, `minor` or `major`, and commit `package.json` and `package-lock.json` as `chore(release): 1.1.0`. For a minor release:
   ```bash
   npm version minor --no-git-tag-version
   ```
2. Merge the pull request once the checks pass.
3. Wait for the `CI/CD` run on `main` to pass and deploy, so the tag names code that passed its checks on `main` and is live. If it fails, fix it in a new pull request without bumping the version again, and tag the fix's merged commit.
4. Tag the merged commit on `main` and publish the release. `--verify-tag` makes `gh` stop if the tag isn't on GitHub, rather than creating a new one from a mistyped name:
   ```bash
   git switch main
   git pull
   git tag -a v1.1.0 -m "v1.1.0"
   git push origin v1.1.0
   gh release create v1.1.0 --title "v1.1.0" --generate-notes --verify-tag
   ```

## License

[MIT](LICENSE)
