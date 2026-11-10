# Utility Suite

> **One-line pitch:** [Who is this for, and what job does it do for them?]

- **Builder:** [Your Name] (`@github-handle`)
- **Pod:** [Pod Name / Number]
- **Product Page & Living PRD:** https://building-with-ai-f26.github.io/jsd10030-utilityApp/
- **Calculator web prototype:** https://building-with-ai-f26.github.io/jsd10030-utilityApp/app/
- **Development:** the same calculator can still run locally with Vite.

## Start here: Build 1

**Due Monday, November 9 at noon, New York time.** No class November 3; keep building that week.

1. Join the [class organization](https://github.com/building-with-ai-f26), then use this template to create a **public** repo named `<netid>-<project-slug>`. Ask Christian or Hew if the organization is missing from the owner list.
2. Set up Git and one coding agent during the week of October 27. Follow the [Icerynk setup guide](https://www.icerynk.com/c/fa26-tech-gb-2160-dm2-f2/content/pre-class-setup-github-openrouter-your-coding-agent).
3. Publish [`docs/index.html`](./docs/index.html): **Settings → Pages → Deploy from a branch → main → /docs → Save**. When deployment finishes, open `https://building-with-ai-f26.github.io/<your-repo-name>/`.
4. Fill in PRD v1: a reachable user, their painful before/after workflow, one core workflow, and three non-goals.
5. Build a rough local prototype. Add a screenshot or GIF and an honest Build 1 log to the Product Page, including progress, learning, problems, costs, and hours.
6. Push meaningful commits on **at least two separate days each week outside class**, including the November 3 break.
7. Submit your **Product Page URL and repository URL in Icerynk**. Come ready to demo the prototype in two minutes on November 10.

Create your PostHog account in Week 1. Install it on the Product Page and local app in **Build 2**, then verify events. The Product Page is public from Build 1; the app can stay local through Week 4.

## Repository map

| File / folder | Purpose |
| --- | --- |
| [`docs/index.html`](./docs/index.html) | Required public pitch, living PRD, and weekly build log. Update with actual work and evidence. |
| [`Intent.md`](./Intent.md), [`Plan.md`](./Plan.md), [`journal/`](./journal/) | Optional drafting aids. No duplicate submission is required. |
| [`AGENTS.md`](./AGENTS.md) | Local run commands, project context, and agent rules. Build 2 onward. |
| [`tests/`](./tests/) | Verification guidance. Build 4 offers Track A domain evals **or** Track B user replays. |
| [`SPONSOR_MEMO.md`](./SPONSOR_MEMO.md) | One-page recommendation backed by actual usage, full costs, and risks. Due December 14 at noon. |

[Icerynk](https://www.icerynk.com/c/fa26-tech-gb-2160-dm2-f2/content) holds the assignment instructions and submissions.

## Local setup — Travel Tipping calculator

Requires Node.js 22.12+ (or a newer supported release) and npm. From Terminal:

```bash
cd ~/Desktop/jsd10030-utilityApp
npm install
npm run dev
```

Open **http://127.0.0.1:5173/**. Stop the server with Control-C.
The calculator is at root `index.html`; `docs/index.html` remains the separate course Product Page.

```bash
npm test           # Node's built-in runner: calculation and validation tests
npm run build      # Production output in dist/, using relative asset URLs
npm run preview    # Preview the production build; open the URL printed by Vite
```

### Behavior and checks

- Select US, UK or France guidance. Guidance sources and reviewed dates appear in the app. The UK source is London-specific; it is labeled accordingly.
- Currency supports USD, GBP and EUR. It changes formatting only, never converts amounts. Destination changes only update guidance, preserving your inputs and currency.
- Enter the receipt subtotal before tax and separately listed service charges. Enter only charges not already included in that subtotal. France's displayed prices include service; do not add it again. Ask staff if the receipt is unclear.
- Additional tip starts at zero, remains editable and applies only to the entered subtotal. Included service does not automatically require another tip.
- Money is parsed into integer cents. Percentages support two decimal places. Tip rounds once, half up; remainder cents go to the first diners. Every person's share is shown.
- Amounts must be non-negative, use decimal points and at most two decimal places, and cannot exceed 1,000,000 each. Tip is 0–100%; diners must be a whole number from 1–1,000. Invalid fields show errors; edited inputs clear stale results.
- Tests cover the required $100 examples, invalid inputs, zero tip, rounding, fractional percentages and exact share totals. They do not replace browser or user testing.
- Manual browser review: test US/UK/France source links, change currency and confirm numbers are not converted, check both $100 examples, try zero diners and negative amounts, and review keyboard focus and narrow mobile layout. Saturday builder checks of the $128 split, zero-diner correction and narrow layout are recorded on the Product Page. External user testing remains pending.
- Named trips and explicitly saved calculation history are implemented locally. No accounts, cloud synchronization or runtime API keys are used. The earlier version was built with my brother; this calculator is new individual course work.

### Guidance sources

Reviewed November 7, 2026; these are manually maintained summaries, not live guidance:

- [Brand USA: Dining and tipping FAQ](https://traveltrade.visittheusa.com/travel-trade/faq/)
- [Visit London: official tipping guide](https://www.visitlondon.com/traveller-information/essential-information/money/tipping)
- [French Ministry of Economy / DGCCRF: Pourboire](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/pourboire)

`node_modules/`, `dist/`, `build/` and private `.env` files are already excluded by `.gitignore`. `.env.example` is a placeholder template and remains trackable. Never place private keys in browser code; this calculator needs none.

### Saved trips and history

1. Create a trip with a name from 1–80 characters, or select an existing trip under the result.
2. Calculate a valid bill, then choose **Save current result**. A success message appears only after the browser accepts the write. Calculation alone never saves.
3. Browse a trip and choose **Open details** to see the saved destination, currency, original inputs, tip, total, individual shares and timestamp.
4. Close and reopen the same app URL in the same browser profile to retrieve saved details. For local development, use **http://127.0.0.1:5173/** with the server running; for the public prototype, use **https://building-with-ai-f26.github.io/jsd10030-utilityApp/app/**.

Editing any calculator input, destination or currency clears the current result and disables saving until a new valid calculation. Saved details remain read-only snapshots; later calculator changes do not alter them. Trip names are trimmed and duplicates are rejected without changing existing trips.

Storage is local to the browser profile and exact origin (scheme, hostname and port). `localhost`, `127.0.0.1`, different ports, and a deployed website have separate histories. There is no cloud backup, synchronization or export. Clearing browser/site data removes history; private browsing may erase it when closed. Avoid relying on it as your only copy of important records.

Storage is limited by the browser. Blocked reads, failed writes (including quota errors), invalid records and unsupported data versions show a warning without breaking calculation. Damaged data is not silently overwritten; this version has no repair or reset UI. Existing data is validated before writing, and the application does not claim success for a failed write. Simultaneous saves in multiple tabs are not coordinated; use one tab for editing trips and saving.

Storage tests use an in-memory adapter and fresh store instances to check persistence, validation, snapshot independence, stale-result rejection and failures. They do not prove browser restart persistence or mobile usability.

Manual browser checklist for Sunday (pending until actually performed):

- Create two trips; reject blank or duplicate names. Save different calculations to each and browse their details.
- Save the $128 example; edit each calculator input, destination and currency and confirm saving stays disabled until recalculation. Invalid calculations must not be saveable.
- Change inputs after saving; reopen saved details and confirm the snapshot stays unchanged.
- Refresh, then close and reopen the same URL in the same browser profile. Verify saved trip names, inputs, timestamp and all shares.
- Start with empty history; inspect the empty state. In a disposable browser profile, test damaged or blocked local storage and verify the calculator still works and no false save success appears.
- Check labels, keyboard operation, focus indicators and narrow layout for the new controls and history.

## Publish the calculator on the existing GitHub Pages site

The course Product Page stays at the project root URL.  The calculator lives under `/jsd10030-utilityApp/app/`.  Saved trips remain in each visitor’s browser profile and origin; existing localhost trips do not transfer to the public app.  There is no cloud storage or synchronization, and clearing browser data can remove history.

```bash
npm ci
npm test
npm run build
npm run build:pages
```

`npm run build` still creates `dist/` with relative asset URLs.  `npm run build:pages` uses `vite.publish.config.js`, sets the deployment base to `/jsd10030-utilityApp/app/`, and replaces only the generated files inside `docs/app/`.  Keep that directory generated-only; edit calculator source files instead.  It does not empty `docs/`, change `docs/index.html`, or replace screenshots in `docs/assets/`.  The publishing config disables public-directory copying and `.env` file loading; this app requires no secrets or analytics.

After calculator changes, rebuild and review `docs/app/`, then commit the generated HTML/assets together with the source changes and push to `origin/main`.  The existing GitHub Pages deployment serves `/docs`; no Pages settings changes are needed.  Verify both the Product Page and `/app/` URL plus their assets after deployment before treating a push as a completed publication.

The November 7–8 manual checks above were on the local app.  Repeat calculation, save/reopen, stale-result prevention, keyboard navigation and phone checks on the public URL; earlier local checks do not establish browser behavior on the deployed app.
