# Progress

**Current status:** Milestone 10 is finished. The app has an app shell with four screens and responsive navigation, a logging form, settings for the unit, target and date format, the latest figures and goal date on Home, and error handling that records to the activity log. Settings exports and imports CSV files, with a preview before an import saves anything, and links to the Log page, which lists the activity log and exports it as JSON. The Data screen shows every daily figure newest first, as a full table on desktop and as rows that expand on a phone, with estimated days marked and edit and delete for saved entries. The Charts screen has the five charts, Weight trends, Progress, Loss rate, Weekly change and Projection, sharing one frame, with range presets, legend toggles and tooltips in the date format setting. Each section on Home, Charts and Settings sits in a card, and success messages show in green. The user's real history from 2025 and 2026 is imported into the desktop's dev server copy. Unit and component tests run in Vitest, and Playwright runs in CI at desktop and phone sizes, saving a report and traces when a test fails. CI runs on every PR, and the `Protect main` ruleset blocks merging until the `Checks` job passes.

**Next:** Start milestone 11, PWA, in a new session.

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
- [x] 8. CSV screens and log page
- [x] 9. Data table
- [x] 10. Charts
- [ ] 11. PWA
- [ ] 12. GitHub Pages and the container image
- [ ] 13. Release

### Phase 4: Optional

- [ ] 14. Homelab

## Decision log

Record changes to the spec or plan here, with the reason.

### 2026-11-08

- The Data screen puts both layouts in the page and a CSS media query shows one, rather than reading the width with `matchMedia` in JavaScript. `display: none` also hides the other layout from screen readers, and there's no hook or flash on load. The phone rows draw a day's details only when it's opened, so the extra page size is small.
- The table isn't virtualised. About 680 days is small for a browser, and virtualising is the fix if the phone feels slow, not a starting point.
- The "To lose" column is left out when no target is set, because every value would be empty, matching Home.
- Phone rows expand with a button using `aria-expanded`, not `<details>`, so closed rows don't hold their hidden figures in the page.
- Edit and delete use the native `<dialog>` with `showModal()`, which brings the backdrop, keyboard blocking, Escape and focus return without a library. jsdom lacks `showModal()` and `close()`, so the component test setup adds simple versions, and Playwright checks the real ones.
- Estimated days have no edit or delete buttons, because there's no entry to change. Logging that date on Home makes it a real entry, as the spec says.
- Saving the edit dialog with its weight unchanged keeps the stored value, for the same reason as the target: the field shows a rounded value.
- After a delete, focus goes to the page rather than back to the Delete button, because the button's row is gone or estimated. That's accepted for now.
- Containers and deployment moved from milestone 8 to milestone 12, after the PWA and before the release, and the milestones between were renumbered: CSV screens and log page is now 8, Data table 9, Charts 10 and PWA 11. The user wants to use and test the finished app before deploying it. Entries before this one use the old numbers.
- Until deployment, the app runs from the dev server on the desktop, and the phone opens it over Wi-Fi. Real history is imported into that local copy in milestone 8, and the spreadsheet stays in use until milestone 12 moves the data to the deployed copy by CSV export and import. Browser data is tied to the exact address, so it moves once, after the address is settled.
- The real history was imported into the desktop browser's copy at `localhost:5173`: 220 weigh-ins for 2025 and 303 for 2026, with no invalid rows. Each year's figures match its own sheet except on days the sheet estimated differently from a straight line, which were 2 to 9 January and 7 August to 5 September 2025, and the random values in March and May 2026. With both years in the app, weight loss since start and loss per week count from 2025-01-01, and the averages in early January 2026 include December 2025, because each sheet started again each year. The phone holds separate data, so it gets the same files only if needed before deployment.
- The Log page loads the log itself through `getLogEntries` in the data context, rather than `DataProvider` loading it with everything else, because only that page needs it. `DataProvider` wraps `getLogEntries` and `logError` in `useCallback`, so they can be effect dependencies.
- Export downloads through a link with the `download` attribute, so the browser chooses where the file goes, which is the Downloads folder unless it's set to ask. `showSaveFilePicker()` would open a Save As window, but only Chromium on desktop has it, so the phone would still need the link. The browser's own "ask where to save" setting gives the same window with one code path.
- Milestone 8's check now counts real weigh-ins rather than days. The 309 days in the 2026 sheet include days it filled with estimates, which were pasted in as plain values. A reading counts as real when it fits the scale's 0.2 lb steps, which gave 220 weigh-ins for 2025 and 303 for 2026 on 2026-11-08. The figures can differ near the days the sheet estimated with random values, because the app interpolates in a straight line there.
- The PWA is tested on the phone through Chrome's USB port forwarding, which makes the dev server count as `localhost`. Service workers need HTTPS or `localhost`, and HTTPS only arrives with deployment.
- The app requests persistent storage in milestone 11, reversing the spec's non-goal. By default, browser storage is best-effort, and a browser low on space may delete a site's data without asking. The user doesn't want that risk for their weight history, even though it's small for an installed app used daily. It's requested in the PWA milestone because Chrome mostly grants it to installed apps. The browser can refuse, so the app works the same either way, and Settings shows the answer. CSV export stays the backup, because persistent storage doesn't stop clearing site data, uninstalling or changing phones.
- GitHub Pages is now the main home for the app and for the user's own data, at `<username>.github.io/weight-tracker-react/`. The user wants anyone to be able to use and install it, and Pages is free, has HTTPS and works away from home Wi-Fi. It also removes the hardest homelab steps from the path to 1.0: a root certificate on every device, mDNS on Android, rootless port 443 and stopping the laptop suspending. Milestone 12 becomes "GitHub Pages and the container image", and the user's data moves once by CSV to the Pages address there, as already planned for "the deployed copy".
- Self-hosting stays, slimmed down to the container image: a multi-stage `Containerfile`, nginx with the route fallback, an image on `ghcr.io` and a README section. It keeps "self-hostable" true and is the way out if Pages changes or ends. It costs about one round of work and still teaches images, registries and nginx.
- The homelab setup moves to an optional milestone 14 after the release, in a new phase 4. Quadlet, systemd, auto-update, Caddy with its certificate authority and mDNS are still learning goals, but no longer block 1.0 or hold real data. The homelab copy would have its own, separate browser data.
- No custom domain, because the user doesn't want to pay for anything. Two small risks stay and are in the plan's risks table: all Pages sites on the account share the `<username>.github.io` origin, and a freed username could be taken by someone who then publishes at the same address.
- One codebase serves from `/weight-tracker-react/` on Pages and from `/` in the container. Vite's base path comes from a build environment variable, React Router's `basename` and the manifest follow it, and the Pages build copies `index.html` to `404.html` because Pages has no route fallback. Milestone 11 already makes the manifest follow the base path.
- The Progress chart is a stacked area, not the overlapping areas the spec first said. The user's spreadsheet stacks them, and stacked, the two always add up to the start weight minus the target, so the split shows progress at a glance. Weight to lose is split at 0 into `leftToLose` and `pastTarget`, with the part past the target in a stack of its own. Recharts' `stackOffset="sign"` was tried first and drew spikes, both when the value changed sign and when it was exactly 0.
- Weight to lose is called "Left to lose" everywhere, because that's the spreadsheet's name and the user asked for the app to be consistent. Every figure's name now comes from one table, `src/lib/figureLabels.ts`, which Home, the Data table and the charts all read. Tests keep the visible text written out, so they still catch an accidental rename.
- Estimated days are faded only on the Weight line, with a note under the chart. Fading the averages and lows, which estimated days also feed, would grey out most of the chart after a gap. The tooltip says "Estimated" on every chart.
- The projection's range is calculated directly rather than simulated. The production build's 1,000-path simulation took 49 ms on the desktop, 190 ms with the CPU slowed four times and 284 ms slowed six times, enough to freeze a phone's screen. Each day's change is normal in the model, so each future day is normal too, centred on the latest weight plus the days times the mean change, with the daily standard deviation times the square root of the days. That gives the answer the simulation approximated, in microseconds, so no web worker is needed. `seedrandom` and `d3-random` were removed.
- The projection's range is 2 standard deviations either side of the trend, about 95%, rather than the 10th to 90th percentile band, at the user's preference for standard deviations. It's wider, on a band the spec already says looks wider than the true uncertainty.
- The Projection chart ignores the range presets and always shows the 90 days the projection learns from, then 180 projected days, because the presets only cover the past. It says so under the chart.
- Every chart's y-axis is 56 pixels wide, so the plots start at the same point and dates line up down the page. At 48 pixels, "-0.45%" lost its minus sign.
- The Weekly change chart colours losses blue and gains red, from the palette's pair of opposite colours. Bars also sit below or above 0, so the direction doesn't rely on colour.
- Charts are 28rem tall from the 48rem breakpoint, and 20rem on phones, because the desktop had room to spread out lines that sat close together.
- The range preset resets to YTD when leaving the Charts screen, because its state lives in the screen. Keeping it would need settings or the URL, and the spec doesn't ask for it.
- Charts with one series, Loss rate and Weekly change, have no legend. The heading names the series, and hiding the only series would leave an empty chart.
- Recharts took the main JavaScript file past Vite's 500 kB warning. Milestone 11 checks the first load, and splits the file if it's slow.
- Milestone 11 also checks that an installed app keeps working when its server returns 404, which the user asked about in case GitHub Pages goes away.
- Each section on Home, Charts and Settings sits in a card, a panel with its own background and border, so it's clear what belongs together. The user asked for this during milestone 10. `Card` is a wrapper the screens place around each section, so the sections don't know where they're shown, and it adds no role, so landmarks and tests are unchanged. Its colours are `light-dark()` tokens, a step lighter than the page in dark mode.
- On Home, the log form and Latest figures sit side by side from the 48rem breakpoint. Stacked full-width cards left empty space at the end of the figures' rows, which looked like missing tiles. The figures fill their card in at most three columns, a full 3 by 3 grid when a target is set.
- Success messages under forms and buttons show in green, at the user's request. All six status lines share a `FormStatus` component, so they stay consistent. Failures look the same as before. Both greens pass the 4.5:1 contrast text needs, on the page and on a card.
- Chart headings stay left-aligned, after the user considered centring them. Left-aligned headings are the web convention, are easier to scan and match the other screens' cards.
- From the 48rem breakpoint, each chart's legend sits in a column on its right, and on phones it stays below the chart, because there's no room beside it. The column is 10.5rem on every chart, so the plots are the same width and dates still line up down the page. 10.5rem fits every legend name on one line except the two "Lowest … average" ones, which wrap.
- Loss rate and Weekly change now have a legend, reversing the earlier entry that charts with one series have none, so their plots match the other charts' width. It's plain text rather than toggle buttons, because hiding the only series would empty the chart. Weekly change's legend lists its two bar colours, Loss and Gain, rather than the one series.
- On desktop, Settings has two columns: preferences on the left, which are the unit, target and dates, and data on the right, which is export, import and the activity log. Each column stacks its own cards, so a card never stretches to match one beside it, and an import preview only lengthens its own column. Phones keep the same order. A grid with shared rows was tried first and stretched the shorter cards.
- The Settings columns are as wide as their forms, about 22rem, and the width left over is page margin on the right. Half-page columns left empty space inside each card, beside its 20rem form. Stretching the forms to fill the cards was rejected, because a field's width hints at how much to type. A third column doesn't fit in the 64rem content width, and the user chose to keep two rather than narrow the forms or widen the app. A settings-row layout, with the name on the left and the control on the right, would use the full width, and is an option for later.

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
