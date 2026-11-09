# Weight Tracker Spec

## Overview

A self-hostable, offline-capable React PWA that replaces a personal weight-tracking spreadsheet. You log one weight per day, and the app calculates averages, lows, progress toward a target and projections.

It is built primarily for one person. Anyone else can run their own copy.

## Goals

- Reproduce every figure and chart from the spreadsheet.
- Make daily logging quick on a phone, and reviewing data comfortable on desktop.
- Keep deployment simple: a static React app served from one container image.
- Act as a learning project for React, TypeScript and CI/CD.

## Non-goals

- Accounts, login or multiple users within one deployment
- A custom backend or any server-side data storage
- Sync between devices (each browser has its own data)
- Reaching the homelab deployment from outside the home network
- Backup reminders
- Body measurements or notes on entries
- Weight-gain goals (the target is assumed to be below the starting weight)

## Architecture constraints

- The app is React only, with no custom backend.
- Data is stored in the browser's IndexedDB.
- All data access goes through a storage interface, so a sync or backend option can be added later without rewriting the UI.
- The container only serves static files. It never sees weight data.

## Data model

```ts
type WeightEntry = {
  date: string; // Local calendar date, "YYYY-MM-DD". Primary key.
  weightKg: number; // Full precision. Never rounded for storage.
};

type Settings = {
  displayUnit: "kg" | "lb"; // Defaults to "lb".
  targetWeightKg: number | null;
  dateFormat: string; // Day.js format string. Defaults to "YYYY-MM-DD".
};
```

- Weight is always stored in kg. Input and display use the unit chosen in settings.
- Conversion uses 1 lb = 0.45359237 kg. Because kg is stored unrounded, a value entered in lb displays identically afterward (203.8 lb stays 203.8 lb).
- Dates are plain calendar dates, not timestamps, so time zones can't shift an entry to another day.
- Dates are displayed using the format string in settings, which defaults to `YYYY-MM-DD`. Stored dates and CSV exports always stay `YYYY-MM-DD`.

## Features

### Logging

- One entry per date. Logging a date that already has an entry replaces it.
- The form defaults to today, and past dates can be logged. Future dates are rejected.
- Weight must be above 0.
- Entries can be edited or deleted. Deleting requires confirmation.

### Missed days

- Days between two real entries are estimated by linear interpolation.
- Estimates are calculated when needed and are never saved. Logging a real value for that date replaces the estimate.
- Estimated days are visibly marked in the table and on charts.
- Days after the latest entry are not estimated.

### Daily figures

All figures are calculated from a continuous daily series running from the first entry to the latest, including estimated days.

| Figure                      | Definition                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Weight                      | The logged or estimated weight for the day                                                                         |
| Lowest weight               | Minimum weight from the first day through this day                                                                 |
| 7-day average               | Mean of the last 7 days including this day; uses the days available until 7 exist                                  |
| Lowest 7-day average        | Minimum 7-day average through this day                                                                             |
| 7-day average % change      | This day's 7-day average divided by the one 7 days earlier, minus 1; compares to day 1 until 7 days earlier exists |
| 28-day average              | Mean of the last 28 days including this day; uses the days available until 28 exist                                |
| Lowest 28-day average       | Minimum 28-day average through this day                                                                            |
| Weight to lose until target | Weight minus target; negative once below target; empty if no target is set                                         |
| Weight loss since start     | First day's weight minus this day's weight                                                                         |
| Weight loss per week        | Weight loss since start divided by (days since first day / 7); 0 on the first day                                  |

Display precision: weights to 1 decimal place, averages and rates to 2, percentages to 2.

### Data table

- **Desktop:** a full table with every figure, newest day first.
- **Phone:** a compact row per day showing date, weight and 7-day average. Tapping a row expands it to show every figure.
- Edit and delete are available from both layouts for real entries. Estimated days can be turned into real entries by logging them.

### Charts

| Chart         | Type           | Series                                                                                            |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| Weight trends | Line           | Weight, lowest weight, 7-day average, lowest 7-day average, 28-day average, lowest 28-day average |
| Progress      | Area           | Weight to lose until target, weight loss since start                                              |
| Loss rate     | Line           | Weight loss per week                                                                              |
| Weekly change | Bar            | 7-day average % change                                                                            |
| Projection    | Line with band | Recent weight, simulated median and range, target                                                 |

- Range presets: 1M, 3M, 6M, YTD, 1Y and All. The default is YTD. Presets count back from the latest day in the data, not from today.
- Presets only change what is shown. Running lows and averages always use the full history.
- Each series can be toggled from the legend, which keeps the six-line chart readable on a phone.
- Chart axes use compact date labels, such as `Nov 5`, regardless of the date format setting. Tooltips use the date format setting.
- Without a target, the Progress chart shows only weight loss since start, and target lines are hidden.

### Goal date estimate

- Fit a straight line (linear regression) to the last 90 days of the daily series.
- Project from the latest 7-day average to the target, using that line's slope.
- Use all available days if there are fewer than 90.
- Count from the latest day in the data, and round up to the first whole day the line reaches the target.
- A slope shallower than 0.00001 kg a day counts as flat.

| Situation                               | Display            |
| --------------------------------------- | ------------------ |
| No target set                           | Nothing            |
| Fewer than 14 days of data              | "Not enough data"  |
| Latest 7-day average at or below target | "Target reached"   |
| Slope is flat or upward                 | "No estimate"      |
| Otherwise                               | The projected date |

**Why 90 days:** against the existing spreadsheet data, a 28-day window changed direction 8 times in a year, while a 90-day window changed direction twice and had the narrowest range of rates. The window is a single constant, so it is easy to change.

**Why 14 days:** two full weeks stop one unusual weekend from setting the trend, the 7-day average has been using a full 7 days for a week by then, and the slope is far steadier than at 7 days. Early estimates are still rough, and they settle by about 28 days. The minimum counts days in the daily series, including estimated days, like every other figure. It is also a single constant, shared with the simulated projection.

### Simulated projection

- Based on the Scratch sheet's random walk.
- Take the day-to-day changes from the last 90 days of the daily series, then calculate their mean and sample standard deviation.
- Run 1,000 simulated paths for 180 days, starting from the latest weight. Each day's change is drawn from a normal distribution with that mean and standard deviation.
- Chart the median path and the 10th to 90th percentile band.
- Requires at least 14 days of data.
- Uses a seeded random number generator, with the seed derived from the data. The chart stays the same between renders, and tests get repeatable results.

**Known limitation:** normal scale noise counts as real change, so the band will look wider than the true uncertainty.

### CSV export and import

- **Export:** a button in settings downloads all real entries as `date,weight_kg`, with full precision. Estimated days and settings are not included.
- **Import formats:** the app's own export, or a spreadsheet CSV with `Date` and `Weight (lbs)` columns. Extra columns are ignored.
- **Dates:** accepts `YYYY-MM-DD` and `DD-MM-YYYY`.
- Rows with no weight are skipped, which covers the spreadsheet's unfilled future dates.
- A row is invalid if its date isn't valid or is in the future, or if its weight isn't a plain decimal number above 0.
- If a date appears more than once in a file, the first row is kept and the later ones are invalid.
- A file is rejected whole if it has neither pair of columns, or has an unclosed quote.
- A preview shows how many rows are new, how many would overwrite existing entries and how many are invalid. A row counts as an overwrite whenever its date already has an entry, even if the weight is the same. Nothing is written until confirmed.
- Imported rows overwrite existing entries for the same date. Invalid rows are skipped and listed.

### Settings

- Display unit (kg or lb)
- Target weight (optional, entered in the display unit)
- Date format: a free-text format string using Day.js tokens, with a live preview. An empty value falls back to `YYYY-MM-DD`. The logging form's date picker uses the browser's own format instead.
- CSV export and import
- Activity log

### Activity log

```ts
type LogEntry = {
  id: number; // Auto-incrementing.
  timestamp: string; // UTC, because a log records an exact moment.
  type: "change" | "error";
  message: string;
  details?: Record<string, unknown>;
};
```

- **Changes:** every add, edit, delete and import is recorded at the storage interface, so no feature can skip it. Edits include the old and new values. An import is one entry with its counts, not one entry per row.
- **Errors:** uncaught errors are recorded by a global handler and a React error boundary.
- Entries are stored in IndexedDB, and only the newest 5,000 are kept.
- A page within Settings lists entries, newest first, and can export them as a JSON file.
- Log entries never leave the device, except through that export.
- A failure to write a log entry never blocks the data change.
- Browser logs are separate from server logs. nginx, Caddy and Podman logs on the homelab cover availability and deployments only.

### PWA

- Installable on phone and desktop.
- Works fully offline after the first load.
- Shows a prompt to reload when a new version is available.
- Requires HTTPS, except on `localhost`.

### Persistent storage

- The app asks the browser for persistent storage with `navigator.storage.persist()`. Without it, a browser that runs low on space may delete the app's data without asking.
- It asks after the first successful save, and again at startup while storage isn't persistent yet.
- Settings shows whether storage is persistent, with a button to ask again when it isn't.
- The browser can refuse, and the app works the same either way. Chrome decides without a prompt and usually grants it to installed apps. Firefox asks the user.
- Persistent storage doesn't protect against clearing site data, uninstalling or changing devices, so CSV export is still the backup.

## Screens

1. **Home:** logging form, latest figures, goal date estimate
2. **Charts:** range presets and all charts
3. **Data:** the data table
4. **Settings**

The app is a single-page app, and each screen has its own URL. Navigation is a bottom tab bar on phones and a top or side nav on desktop.

## Deployment

- The source lives in a public GitHub repo named `weight-tracker-react`, under the MIT license.
- GitHub Actions runs checks on every push and pull request.
- Podman is the container tool, locally and on the homelab. The build file is a `Containerfile`.
- A push to `main` that passes all checks builds a container image and publishes it to GitHub Container Registry (`ghcr.io`).
- The image contains the built static files and unprivileged nginx, and runs rootless. Node.js is used only to build the app and is not in the final image.
- nginx returns `index.html` for app routes, so refreshing a screen's URL works. It keeps `index.html` and the service worker out of long-term caches, and caches hashed JS and CSS files for a long time.
- The homelab runs the container as a Podman Quadlet (a systemd service), and `podman auto-update` picks up new images.
- The homelab has a fixed private IP.
- The app is reachable only on the home network at `https://homelab.local`, using Avahi (mDNS) for the name.
- Caddy runs on the homelab in front of the container and provides HTTPS, using its local certificate authority. Its root certificate is installed once on each device.
- If `homelab.local` doesn't work on the Android phone, the fallback is HTTPS on the homelab's fixed IP. Confirm the address before entering real data, because browser data is tied to it.
- Self-hosters pull the same public image and put it behind HTTPS. It is a standard OCI image, so it also works with Docker.
- The image is built for x86-64 only, which matches the homelab. ARM hosts aren't supported.

## Data limitations

These follow from browser-only storage and should appear in the README:

- Phone and desktop hold separate data. CSV export and import is the only way to move it.
- Clearing browser data deletes entries that weren't exported.
- Data belongs to the browser and the exact site address. Changing the homelab's hostname or port starts with an empty app, so export first.

## Testing

Tests guard against regressions and are written alongside or after the code, not test-first.

- **Unit:** units, dates, interpolation, every daily figure, goal date, simulation, CSV parsing
- **Component:** the form, table and settings behavior
- **End to end (Playwright):** log an entry, change units, import and export, reload and confirm data persists; run at desktop and phone sizes
- Test data must be synthetic. `example-weight-tracker.fods` holds real personal data and stays out of the repo.
