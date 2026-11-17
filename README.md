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

Historical Build 1 instructions are retained above.  The PostHog Free plan account was created November 7.  Build 2 conversion, analytics and By person splits are now deployed in commit `9f87215`; Build 2 was submitted November 15, 2026.  Attempt 2 at 1:17 PM New York time included the PostHog image.

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
npm ci
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
- Manual browser review: test US/UK/France source links, change currency and confirm numbers are not converted, check both $100 examples, try zero diners and negative amounts, and review keyboard focus and narrow mobile layout. Saturday builder checks of the $128 split, zero-diner correction and narrow layout are recorded on the Product Page. Anirudh’s feedback is recorded in PRD v2; Simran’s feedback and remaining user checks are pending.
- Named trips and explicitly saved calculation history are implemented in the public and local app. No accounts, cloud synchronization or private runtime API keys are used. The earlier version was built with my brother; this calculator is new individual course work.

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

`npm run build` still creates `dist/` with relative asset URLs.  `npm run build:pages` uses `vite.publish.config.js`, sets the deployment base to `/jsd10030-utilityApp/app/`, and replaces only the generated files inside `docs/app/`.  Keep that directory generated-only; edit calculator source files instead.  It does not empty `docs/`, change `docs/index.html`, or replace screenshots in `docs/assets/`.  The publishing config disables public-directory copying and `.env` file loading; this app requires no private credentials.  PostHog is now configured using the owner-supplied public ingestion token; public calculator events and a playable masked replay have been observed; remaining checks are listed below.

After calculator changes, rebuild and review `docs/app/`, then commit the generated HTML/assets together with the source changes and push to `origin/main`.  The existing GitHub Pages deployment serves `/docs`; no Pages settings changes are needed.  Verify both the Product Page and `/app/` URL plus their assets after deployment before treating a push as a completed publication.

The November 7–8 manual checks above were on the local app.  The confirmed public checks are recorded below.  Public stale-result prevention, keyboard navigation, phone checks and other unperformed checks remain pending; earlier local checks do not establish those deployed behaviors.

## Convert a calculated total — published Build 2 feature

The bill currency selector still changes display only.  After calculating a valid bill, choose a separate target currency (USD, GBP, EUR or HKD) under **Convert total · reference-rate estimate**, then select **Convert total**.  The target must differ from the original currency.  HKD is a conversion target only; Hong Kong tipping guidance and HKD bill input are not added by this feature.

The result shows the original total, converted estimate, currency codes, exchange rate and provider’s rate date.  The latest published reference rate can predate today, especially on weekends or holidays; it is not a live market quote.  Actual card or cash rates and fees may differ.  Converted amounts round once to two decimal places.  Original tip calculations, equal splits and saved snapshots are unchanged; conversion estimates are not saved.

Provider: [Frankfurter v2](https://frankfurter.dev/).  Official documentation reviewed November 15, 2026 describes a free public API without an API key and [open CORS for browser requests](https://frankfurter.dev/javascript/).  The [currency catalog](https://frankfurter.dev/currencies/) includes all four offered targets.  This implementation uses no credentials, account, paid plan, SDK or new dependencies.  Official documentation states no daily/monthly quotas, with rate limiting to prevent abuse.  Free access does not guarantee availability or an uptime commitment.  No paid service was enabled.

The historical November 15 public build called Frankfurter directly.  The November 16 replacement publishing build instead requests `/api/rates?base=USD&target=EUR` from our Node backend, which alone calls the fixed `https://api.frankfurter.dev/v2/rate/{base}/{quote}` endpoint.  Both send the currency pair only, not the bill amount or trip names.  The provider receives normal connection metadata such as IP address.  The app has no embedded fallback rates.  Missing rates, malformed responses, timeouts (10 seconds), offline failures and service errors show a message instead of an estimate.  Editing calculator inputs or selecting another target clears the estimate and cancels/discards outdated requests.  Network failure does not block ordinary calculation or trip saving.

### Local conversion check

```bash
cd ~/Desktop/jsd10030-utilityApp
npm run dev
```

1. Open `http://127.0.0.1:5173/` and select USD for the bill currency.
2. Enter subtotal `100`, charges `8`, additional tip `20`, diners `3`; calculate.  Confirm USD 128 total and the existing shares.
3. Choose EUR as the separate target and select **Convert total**.  With internet access, check the original USD total, EUR estimate, rate and rate date.  Do not expect a fixed exchange rate or estimate.
4. Change the target to HKD and request a fresh estimate.  The original bill and shares must remain in USD.
5. Edit the tip while a conversion is pending or displayed.  The estimate must disappear and conversion must stay disabled until recalculation.
6. Select the same target as the bill currency.  The app should ask for a different target, without making a request.
7. Save a normal trip result, then reopen it.  The original currency and calculation should remain unchanged; no conversion estimate should be stored.
8. Turn the browser offline and request conversion again.  Expect an honest error without a rate or estimate; the calculator and trips should remain usable.  Restore internet access afterward.

Run `npm test` for deterministic tests (API responses in tests are synthetic fixtures, never runtime fallback rates) and `npm run build` for the production build.  Browser interaction checks remain manual; an HTTP connectivity/CORS check alone does not prove the complete browser workflow.  Conversion is published in commit `9f87215`.  The observed public USD 128 → EUR 115.56 estimate is a historical test result, not a fixed rate promise.

## Build 2 PostHog — deployed, partial observed verification

The standalone Product Page and calculator share `docs/assets/analytics.js`, using the exact owner-supplied project token and `https://us.i.posthog.com` host.  This is the public browser ingestion token, not a private API credential; its inclusion is explicitly authorized by the project owner.  Never add a personal API key to browser code.  The official bootstrap loads the SDK asynchronously without an npm dependency.  A page-level guard prevents duplicate initialization/pageviews.  Calculator code imports the same module, which Vite bundles for production; the Product Page loads it by relative URL.  Existing saved trips and the conversion feature are preserved.

Each event is labeled `environment` (`local` or `production`, based on hostname) and `surface` (`product_page` or `calculator`).  Pageviews use `$pageview`; relevant allowlisted clicks use `ui_clicked` with a fixed `action` code.  There is no broad DOM autocapture.  Success events fire only after a valid calculation is rendered, conversion is received/rendered, storage accepts a saved result, or saved details are opened:

- `calculation_succeeded`
- `conversion_succeeded`
- `conversion_failed` (a current failed request, not an intentionally cancelled/outdated request)
- `result_saved`
- `saved_details_opened`

Custom events carry no trip names, bill amounts, conversion values, raw error messages, names or emails.  No `identify` calls are made.  Replay masks all inputs and text, blocks sensitive DOM regions/select options and Product Page screenshot figures, and disables console/network performance capture and request/response bodies/headers.  URL query strings/fragments are stripped from pageview/referrer properties and replay/network URLs.  Playback will therefore show masked text and placeholder regions while preserving page layout and interaction positions.  Analytics uses browser-generated identifiers and normal connection metadata; the plain-language notices do not claim complete anonymity.  Analytics exceptions are isolated from calculator actions.  Blocking the SDK or ingestion endpoints should leave calculation, conversion and trip storage operational.

Official documentation reviewed for this implementation: [SDK configuration](https://posthog.com/docs/libraries/js/config), [replay privacy](https://posthog.com/docs/session-replay/privacy), and [recording rules](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record).

### Dashboard settings required before verification

In the matching US PostHog project:

1. Open **Session Replay → Settings** (or project settings for session recording) and enable **Record user sessions**.
2. For this short test, ensure local sessions are included: sampling includes the test session (temporarily use 100% if appropriate), localhost is not excluded, and URL/event/feature-flag triggers do not prevent recording.  Either remove those restrictions for the test or satisfy them deliberately.  Keep the session active longer than any configured minimum duration.
3. Keep console recording, network bodies/headers, canvas recording and other optional capture features off.  Do not loosen the client masking configuration.  Check project usage/billing limits before broader testing.
4. In **Activity / Live events**, filter `environment=local` and then each `surface`.  If you normally filter internal/test users out, include this test traffic while verifying.

No dashboard setting has been changed by Codex.  Installation is not evidence that the project received data or that replay is playable.

### Exact local URLs and verification steps

Start Vite with `npm run dev`, then open:

- Product Page: `http://127.0.0.1:5173/docs/index.html`
- Calculator: `http://127.0.0.1:5173/`

Use HTTP rather than opening the Product Page as a `file://` URL: browser modules need an HTTP server.  On the local Product Page, the module routes **Open calculator** to `/` (the live source app), rather than the old generated `docs/app/` output.  Production links remain `app/`.

1. With network access and analytics allowed in your browser, visit the Product Page.  Click the PRD/build-log links, then **Open calculator**.  Confirm one `$pageview` for each document load, and fixed-code `ui_clicked` events tagged with the correct surface.  A deliberate reload should add one new pageview, not zero or two.  Same-page anchor clicks should not create extra pageviews.
2. Use disposable test data: USD subtotal `100`, charges `8`, tip `20`, diners `3`.  Calculate and observe `calculation_succeeded`.  An invalid zero-diner attempt should not emit that success event.
3. Convert to EUR and observe `conversion_succeeded`.  To test failure without blocking PostHog too, use browser request blocking for `api.frankfurter.dev` only (or a temporary browser-local equivalent); retry conversion and observe `conversion_failed`.  Restore the API afterward.  Turning all networking off cannot demonstrate delivery to PostHog.
4. Create a disposable trip, save the valid result and open its saved details.  Observe `result_saved` and `saved_details_opened`.  Changing an input must still disable saving until recalculation.  A failed storage write must never emit `result_saved`.
5. Inspect the custom event properties: only environment/surface, and the fixed action code on `ui_clicked`, should come from the app.  SDK metadata such as anonymous/session IDs is expected.  No form values, trip names, monetary amounts, converted amounts or raw errors should be present.
6. Stay on each page for longer than the dashboard minimum recording duration; click/scroll and interact with forms, then navigate or wait for uploads.  Find the local session under **Session Replay**, open it and confirm it plays.  Verify typed values, trip selectors/names, displayed bills/conversions, saved details and screenshot figures are masked/blocked.  The visible page in your browser should remain unchanged; masking applies to captured replay only.
7. Test SDK failure by blocking `us-assets.i.posthog.com` and reloading, then confirm calculations, conversion and existing trips still work.  Restore access afterward.  Do not clear all localStorage to troubleshoot analytics: it contains saved trips too.

**Verification status: PARTIAL, based on the builder’s observations.**  I observed pageviews, ui_clicked, calculation_succeeded, conversion_succeeded and result_saved locally, and previously observed saved_details_opened locally before By person was added.  PostHog also received events from the public calculator URL.  The public replay played with visible inputs and saved content masked.  Receipt of conversion_failed remains pending.  The November 15 PostHog screenshot specifically confirms public ui_clicked, saved_details_opened, result_saved, conversion_succeeded and calculation_succeeded.  Other event checks remain pending.  Automated tests validate configuration, allowlists and failure guards but do not prove dashboard delivery.  Exhaustive privacy/event-property inspection, failure isolation and duplicate-pageview checks remain pending unless separately recorded.

Build checks without changing the checked-in published app:

```bash
npm test
npm run build
npm run build:pages -- --outDir /tmp/utility-posthog-pages-check --emptyOutDir
```

## By person splitting — published Build 2 implementation

**Equal split** remains the default.  Select **By person** and use the diner count to generate Diner 1, Diner 2, etc.  Enter each diner’s combined item subtotal in the original bill currency.  These subtotals must sum exactly to the bill subtotal.  Zero is valid for an individual diner; the combined subtotal must be positive.  Negative, blank, non-numeric and fractional-cent amounts are rejected.

The tip is still calculated and rounded once on the bill subtotal.  Charges and that already-rounded tip are then allocated separately using integer cents and largest fractional remainder.  Ties use diner order.  The result shows each diner’s subtotal, charges, tip and final amount, with exact component totals.  Equal mode retains its original remainder rule.  Conversion remains a separate estimate of the whole bill total, not a conversion of each share.

New saved records include a version-2 snapshot marker, explicit split mode and (for By person) the individual subtotals and breakdown.  The existing storage key/envelope is retained.  Old records without a split mode are treated as Equal splits and remain unchanged on read.  This is backward compatibility in the new app; do not expect an old deployed app build to understand newly saved By person records.  No browser data is deleted or reset.

The new subtotal section and result/history containers are private replay regions.  PostHog events still send only fixed event/action codes and environment/surface labels, never names or amounts.  Editing the mode or a diner subtotal clears stale results/conversion and disables saving until a new valid calculation.  The public replay was observed playing with visible inputs and saved content masked.  Exhaustive checks of every dynamic field and event property remain pending.

### Local By person browser observations — completed

The builder reported these checks passed:

- Bill subtotal 100, charges 8, tip 20%, diner subtotals 30/70 produced 38.40 and 89.60.
- The saved result reopened under “Second test,” retaining By person mode and the complete breakdown.
- Subtotals 30/60 against bill subtotal 100 showed the correct mismatch error.

Other manual checks remain pending; the steps below include the completed examples for reproduction and do not imply that every step passed.  Recorded time and development spending are updated in the summary below.

### Browser checklist — completed observations are recorded separately

1. Run `npm run dev` and open `http://127.0.0.1:5173/`.
2. Keep USD, enter bill subtotal `100`, charges `8`, tip `20`, diners `2`; select **By person** and enter Diner 1 `30`, Diner 2 `70`.  Calculate.
3. Confirm Diner 1: subtotal 30.00, charges 2.40, tip 6.00, final 38.40.  Confirm Diner 2: subtotal 70.00, charges 5.60, tip 14.00, final 89.60.  Bill total must remain 128.00.
4. Enter `60` for Diner 2 and calculate: expect a subtotal-sum error and no saveable result.  Test a blank, negative and three-decimal amount.  Test zero for both diners with bill subtotal zero: By person must reject the zero combined subtotal.  For a valid zero share, restore bill subtotal 100 and use `0` and `100`.
5. Restore `30` and `70`, calculate and convert the USD 128 whole total if desired.  Switch to Equal split: old result and conversion must clear.  Recalculate to get USD 64.00 each.  Switch back and recalculate By person.
6. Create/select a disposable trip and explicitly save the By person result.  Close the tab, reopen the same URL in the same browser profile, select the trip and open details.  Confirm the saved By person label and all component amounts.  Change current inputs and confirm the saved snapshot stays unchanged.  Open an older Equal result too.
7. Check the new fields and breakdown in a smaller window and with the keyboard.  In PostHog, inspect each dynamic field/breakdown and event properties.  The public masked replay observation is recorded above; this exhaustive inspection and keyboard/phone checks remain pending.

### Public deployment and browser observations

Commit `9f87215` was pushed and deployed.  The Product Page contains PRD v2 and the Build 2 log; the calculator contains By person splitting and conversion.  Required JavaScript, CSS and analytics assets passed deployment checks.  These HTTP/content checks are distinct from the builder’s browser observations:

My public browser checks produced shares of $38.40 and $89.60.  USD 128 converted to an estimated EUR 115.56 during the observed test; later estimates may differ with the reference rate.  The “Live test” saved result reopened with By person mode and its complete breakdown.

Four November 15 Build 2 screenshots are included: the By person result (70/30 diner order), the Frankfurter conversion with rate/date, reopened “Live test” details, and PostHog event receipt from the public calculator.  The November 7–8 images remain historical Build 1 evidence.  The PostHog screenshot does not show replay playback or conversion_failed receipt; those statuses are recorded separately.

PRD v2 and the Build 2 log are in `docs/index.html`.  Build 2 was submitted November 15, 2026.  Attempt 2 at 1:17 PM New York time included the PostHog image.  Recorded active project time: approximately 1.5 hours November 7, 50 minutes November 8, and 2 hours Sunday, November 15, 2026: 4 hours 20 minutes total.  Recorded project spending: $27 for Codex credits used for development on November 15.  This is development spending, not a per-user-run API cost.  My existing ChatGPT Pro subscription remains separate and unallocated to this project.  Token usage has not been measured.  Runtime API cost per user run remains unmeasured; Frankfurter uses its free public API.


## November 16 backend correction — Render verified, Pages build connected

Browser → Vite `/api/rates` proxy → Node backend → Frankfurter → validated rate/date → browser.  The browser keeps amounts, exact-cent conversion and trip names; no direct-provider fallback is used.  Existing cancellation, stale-result protection and PostHog events/masking are preserved.  The November 15 screenshots document the earlier browser-direct architecture, not the backend correction.  The replacement Pages build uses the verified Render backend described below.

Start two Terminal windows in the repository:

```bash
# Terminal 1: backend on 127.0.0.1:3001
npm run dev:api
# Terminal 2: frontend on its original origin
npm run dev
```

If Vite was already running, stop it with Control-C and restart to load `vite.config.js`.  Open `http://127.0.0.1:5173/`; existing trips remain on this origin.  Do not switch ports for your saved-trip checks.  Product Page: `http://127.0.0.1:5173/docs/index.html`.

The backend accepts only GET `/api/rates` with exactly `base` (USD/GBP/EUR) and a different `target` (USD/GBP/EUR/HKD).  It rejects extra parameters and request bodies, uses a fixed HTTPS upstream with redirects disabled, validates currencies, positive finite rate and real non-future UTC date, and returns only base/quote/rate/date.  Its 8-second deadline covers headers and JSON body; the browser retains its 10-second deadline.  Errors use 400/403/404/405/429/502/504 with no invented rates or private upstream error text.  No request logging is added.  Browser disconnects abort upstream work.

### Verification and remaining checks

The initial backend suite passed 121 tests; the Render-ready suite passed 124 tests, including backend HTTP success, validation, upstream status errors, malformed data, network/JSON failures, timeouts and CORS.  Existing calculation, custom splits, snapshots, conversion arithmetic/cancellation and analytics tests passed.  Standard production and temporary publishing builds passed.  A real local backend request returned USD/EUR rate 0.90603 dated 2026-11-17 (UTC rate dates can be ahead of the New York calendar date).  This connectivity observation is separate from mocked tests; it is not a guaranteed future rate.  A real request through a temporary Vite proxy on port 5174 returned the same validated rate/date.  After Vite was restarted on 5173, my local browser checks passed: calculation, conversion and reopening saved details worked.  These observations do not complete cancellation/stale-input checks, every saved-history regression check or PostHog receipt for this correction.  `conversion_failed` receipt remains pending.

### Smallest production deployment step

Deploy `server/rates.js` to a Node >=22.12 HTTPS service using `npm ci` then `npm run start:api`; set `HOST=0.0.0.0`, the platform's `PORT`, and `ALLOWED_ORIGIN=https://building-with-ai-f26.github.io`.  Configure a hosting spending limit where available.  Validate the real rate endpoint and allowed-origin response before setting the frontend's public `VITE_API_ORIGIN` to that HTTPS origin (no path/trailing slash).  CORS restricts browser reads, not non-browser abuse: the endpoint is public and currently has no authentication, cache or application rate limiter.  Provider/host outages, abuse and hosting costs remain deployment risks; monitor usage and add a host rate limit before wider use.

GitHub Pages cannot run Node.  The Render backend has now passed the HTTP checks below, allowing regeneration of `docs/app/` with its verified origin.  The publishing build rejects a missing or invalid HTTPS API origin:

```bash
npm test
npm run build
# Build-check only; this .invalid origin is not a deployable backend:
VITE_API_ORIGIN=https://backend-not-deployed.invalid npm run build:pages -- --outDir /tmp/utility-backend-pages-check --emptyOutDir
# Verified production backend:
VITE_API_ORIGIN=https://jsd10030-utilityapp.onrender.com npm run build:pages
```

The placeholder build demonstrates asset generation only; no frontend configured with it should be published.  Set VITE_API_ORIGIN explicitly in the publishing command/environment; the publishing config does not load `.env`.  Vite production preview of the ordinary build requires the backend proxy or an explicitly configured API origin.

Recorded hours remain 4 hours 20 minutes, with no November 16 time supplied.  Recorded spending remains $27 in Codex development credits; ChatGPT Pro is separate and unallocated and token usage unmeasured.  Frankfurter's public API requires no key and has no per-request charge; backend hosting pricing is not selected or incurred here.  Runtime cost per user run remains unmeasured.  The November 15 submission is historical; this November 16 correction is prepared for a separate backend deployment and has not been resubmitted.


### Render Free deployment settings

Use a **Node Web Service**, repository root, branch `main`, **Free** instance:

| Setting | Value |
| --- | --- |
| Build command | `npm ci` |
| Start command | `npm run start:api` |
| Health check path | `/health` |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `ALLOWED_ORIGIN` | `https://building-with-ai-f26.github.io` |
| `PORT` | Render supplies this; do not override it with local port 3001 |

Use Node >=22.12 as required by package.json.  No API key, database or private environment file is required.  `VITE_API_ORIGIN` is a later frontend build setting, not needed to run this backend.  The production/Render default host is also 0.0.0.0 if HOST is omitted; local development defaults to 127.0.0.1.  The existing `npm run start:api` command runs only Node, without Vite.  GET `/health` returns `{"status":"ok"}` without contacting Frankfurter: it proves the process responds, not that upstream rates are available.

CORS allows the configured Pages origin and rejects other browser origins on the rate endpoint.  Local same-origin Vite proxy requests work without an Origin header.  Do not configure the Pages project path as the origin.  CORS is not authentication or protection against non-browser requests.

Render Free sleeps after 15 minutes without inbound traffic; waking can take about a minute, longer than the browser's 10-second timeout.  There is no automatic retry or fabricated estimate.  **Hosted cold-start verification remains pending:** leave the service idle for at least 15 minutes without health polling or other test traffic, request a conversion, and record the actual behavior (timeout/loading/error or success).  If it fails, confirm no success event or estimate appears, allow about a minute for waking, then explicitly click Convert total again.  Confirm a real rate/date appears and calculation/saved details remain usable throughout.  Check failed/successful event receipt separately; do not mark conversion_failed received until observed.  After editing inputs during a wait, recalculate before retrying.  Test warm requests and the allowed-origin response before rebuilding the Pages app with the verified backend origin.

Official references: [web-service binding and setup](https://render.com/docs/web-services), [health checks](https://render.com/docs/health-checks), [Free service cold starts and limits](https://render.com/docs/free).  Free instance hours, bandwidth and build allowances have limits; review the dashboard and avoid enabling paid resources without review.  No Render expense has been reported.  Recorded development spending remains $27; runtime cost per user run is unmeasured.


### November 16 Render verification and Pages connection

Verified backend: https://jsd10030-utilityapp.onrender.com.  GET `/health` returned HTTP 200 with `{"status":"ok"}`.  GET `/api/rates?base=USD&target=EUR`, with Origin `https://building-with-ai-f26.github.io`, returned HTTP 200, JSON `{"base":"USD","quote":"EUR","rate":0.90603,"date":"2026-11-17"}` and the matching Access-Control-Allow-Origin header.  The date is the API's UTC rate date.  An unrelated Origin `https://example.com` received HTTP 403 without an allow-origin header.  These are real hosted HTTP checks, not browser or cold-start evidence.

The publishing build was run with `VITE_API_ORIGIN=https://jsd10030-utilityapp.onrender.com npm run build:pages`.  Generated HTML uses the project `/app/` asset base; the JavaScript contains that backend origin and `/api/rates`, with no direct Frankfurter endpoint.  All 124 tests, both builds, generated-path and whitespace checks passed.  GitHub Pages serves the committed `docs/app/` output after deployment; its served HTML/assets must match before declaring this deployment verified.

Public browser calculation/conversion/save-reopen checks using this hosted backend remain pending, as do controlled cold-start/retry testing and conversion_failed PostHog receipt.  Earlier local browser checks and November 15 public observations remain historical evidence.  No Icerynk resubmission was made.  Recorded time remains 4 hours 20 minutes; recorded development spending remains $27 in Codex credits, with ChatGPT Pro separate/unallocated, token usage unmeasured, and runtime cost per user run unmeasured.
