# Progress

**Current status:** Milestone 7 is finished, in PR #11. The app has an app shell with four screens and responsive navigation, a logging form, settings for the unit, target and date format, the latest figures and goal date on Home, and error handling that records to the activity log. Charts and Data are still placeholders. Unit and component tests run in Vitest, and Playwright runs in CI at desktop and phone sizes, saving a report and traces when a test fails. CI runs on every PR, and the `Protect main` ruleset blocks merging until the `Checks` job passes.

**Next:** Start milestone 8, containers and deployment. In milestone 9, add a Playwright test that an uncaught error in the browser shows up on the new Log page. The global handler only has unit tests until something on screen shows the log.

**In progress:** Nothing.

## Milestones

### Phase 1: Pipeline

- [x] 1. Project setup
- [x] 2. CI and branch protection

### Phase 2: Logic

- [x] 3. Core calculations
- [x] 4. Projections
- [x] 5. CSV logic
- [x] 6. Storage and activity log

### Phase 3: UI

- [x] 7. App shell, logging and settings
- [ ] 8. Containers and deployment
- [ ] 9. CSV screens and log page
- [ ] 10. Data table
- [ ] 11. Charts
- [ ] 12. PWA
- [ ] 13. Release

## Decision log

Record changes to the spec or plan here, with the reason.

### 2026-11-07

- Screens get their data from a `DataProvider` that loads it through `WeightStorage` into React state and shares it through context. Its save and delete functions call storage and then reload. Dexie's `useLiveQuery` was rejected because it reads the database directly, around the storage interface. A `subscribe` method on the interface and TanStack Query were also considered. The first changes the interface and needs a harder hook, and the second mostly helps with server data. Changes made in another tab only show after a refresh, which is fine for one person.
- Playwright and component tests find elements by role and label first, and use `data-testid` only where nothing a user sees identifies the element, such as a chart. A role locator also fails when an element stops working for keyboard or screen reader users, which a test id can't catch. The usual case for test ids is weak here, because the app isn't translated and its wording rarely changes.
- Zod was considered for checking user input and not adopted. The app's untrusted inputs are small and flat, and the rules that matter are its own: the plain decimal rule, no future dates and unit conversion. A schema would be about as long as the hand-written checks, and Zod's number parsing accepts `1e3`, so the regex would stay anyway. It's the first choice if a larger untrusted input turns up, such as importing JSON.
- Tests follow the testing trophy rather than a strict test pyramid. Component tests render the real `DataProvider` and storage rules and fake only IndexedDB. Playwright covers each main journey, plus any unhappy path that needs a real browser or several parts working together, such as validation showing in Chromium, IndexedDB being unavailable or data surviving a reload. Every input variation of a rule stays in unit tests. Parts working together can fail in ways no single part shows, as the settings radio did, and only Playwright caught it. The Playwright suite runs in seconds, so the pyramid's cost argument barely applies. Exploratory testing was considered and left out.
- Vitest runs two projects: `.test.ts` files in plain Node and `.test.tsx` files in jsdom, with React Testing Library and StrictMode. jsdom for every file would slow down the logic tests, which never render anything.
- Weight fields are text inputs with `inputMode="decimal"`, not `type="number"`. A number input reports invalid text as empty, accepts `1e3` and changes when scrolled, and React keeps half-typed values as strings anyway. The phone still shows the number keypad.
- The display unit saves as soon as it's chosen. The target weight and date format have Save buttons, because typed text needs checking first.
- Saving the target unchanged keeps the stored value. The field shows the target rounded in the display unit, and converting that rounded text back would shift the target a little on every save.
- Home shows 8 of the 10 daily figures and leaves out the two lowest averages, to stay short on a phone. The Data table will show all of them.
- `react-error-boundary` was added, which the plan didn't list. React's own docs point to it, and it saves writing the class component an error boundary needs. A boundary around each screen keeps the navigation working after a crash, and one around the whole app catches the rest.

### 2026-11-06

- Chart range presets count back from the latest day in the data, not from today. Otherwise a break from logging would leave the charts empty.
- Date arithmetic parses calendar dates as UTC, because UTC has no daylight saving. A local day can be 23 or 25 hours long.
- The simulation follows the spec, not the Scratch sheet. The sheet's other details, such as its hardcoded floor on simulated weight, aren't carried over, because the user doesn't remember what they were for.
- Claude merges PRs when the user asks, once CI passes. The user reviews the code as it's written, so asking for the merge is their sign-off.
- Commits are small, with one logical change each, because milestone 3's single 15-file commit was hard to read. Claude commits as the work goes rather than once at the end.
- PRs now rebase merge by default, so those small commits stay on `main`. This replaces choosing per PR, and squash is only for commits that aren't worth keeping.
- Projections keep their 14-day minimum, which counts days in the daily series, including estimated days. The spec gave no reason for 14, so the reason is now recorded there. Two real entries 13 days apart therefore pass the minimum, which is accepted so the count matches every other figure.
- Tried and tested libraries are preferred over hand-written general-purpose code, and each new one gets explained. JavaScript's built-in `Math` has no statistics and can't seed `Math.random`, so milestone 4 uses libraries for both.
- `simple-statistics` provides the mean, standard deviation, regression and percentiles. `seedrandom` is the seeded generator, and `d3-random` shapes its output into a normal distribution. Each covers something the others don't.
- Linear interpolation stays for missed days, after considering random values and linear regression. Random values add noise and need a guard rail that biases the figures. Regression can jump at gap edges and would no longer match the spreadsheet on those days.
- The simulation uses the sample standard deviation, because the Scratch sheet uses `STDEV.S`.
- A goal date slope shallower than 0.00001 kg a day counts as flat. Without this, a slope that's only slightly negative from rounding projects a date too far away for JavaScript to hold, and the app would show "Invalid Date".
- The simulation's seed comes from the dates and weights in the 90-day window only, so changing the target doesn't redraw the chart.
- One simulation run takes about 49 ms on the desktop under Vitest, so it doesn't need a web worker there. It still needs checking on the phone in milestone 11.
- Weight only has to be above 0, replacing the 20 to 500 kg limit. The range only caught slips of about 10 times, missed likelier typos such as `230.8` for `203.8`, and those slips are obvious on a chart and easy to edit.
- Imports follow the logging rules, which the spec didn't say. A future date would stretch the daily series past today.
- PapaParse reads and writes CSV, because quoting, line endings and byte order marks are general problems. The app's own code only applies its rules to the rows.
- When a file repeats a date, the first row is kept and later ones are listed as invalid. Nothing shows which row is right, so the duplicate is made visible rather than quietly replaced.
- An unclosed quote rejects the whole file, because it swallows every row after it into one field.
- The delimiter is fixed as a comma rather than detected, so a file with semicolons is rejected with a clear reason.
- A one-off dry run of the parser on the real spreadsheet read all 309 days with no invalid rows. The file stayed out of the repo.
- Milestones are built in small rounds, with an explanation and a pause for questions after each, replacing one walkthrough at the end. The user's question partway through milestone 5 changed the weight rule, so reviewing as the work goes catches decisions early.
- Claude runs commands and setup steps, including first-time tooling and config, and only hands a step over if the user asks or Claude can't run it. This replaces the user doing first-time setup by hand, at the user's request.
- Claude uses the file tools rather than shell commands to write code, so the user sees each diff, and runs the formatter for mechanical fixes rather than making them by hand.
- Concepts that have already been taught aren't explained again in full. The list of them stays in Claude's memory, not the repo.
- Storage has two layers. `AppStorage` implements `WeightStorage` and holds the rules, and a `StorageBackend` only reads and writes. The plan had each implementation stand alone, but that would copy the logging rules into both and leave the real rules untested by tests using the in-memory one.
- Classes are used only where something holds state, which so far means storage. Calculations stay as pure functions.
- `fake-indexeddb` was added, which the plan didn't list, because Node has no IndexedDB. Both backends run the same test suite, so the in-memory one can be trusted to match Dexie.
- Settings changes aren't recorded in the activity log. They don't touch weight data, and the current values are always visible in Settings.
- Saving the same weight again is recorded as an edit, matching how the import preview counts an overwrite.
- The display unit defaults to lb, which the spec didn't say, because that's what the user logs in.
- SQLite in the browser was considered and rejected. It would add a WebAssembly download and a web worker, and three simple tables gain nothing from SQL.

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
