# AGENTS.md — Coding Agent Operating Manual

> Give this file to your coding agent and check that it is using these instructions. Keep the stack, commands, and ground rules current.

## 1. Project Overview
- **What this repo builds:** Utility Suite is an ad-free collection of everyday utilities.  Its current Travel Tipping prototype provides sourced restaurant guidance, tip calculation, Equal or By person splitting, separate reference-rate conversion and locally saved trips.
- **Primary user & core workflow:** Simran is the first intended user and is planning a Hong Kong trip; feedback is pending.  Choose destination → calculate and split → explicitly save to a named trip → reopen saved details.  See the living PRD in `docs/index.html`.  Hong Kong guidance and HKD bill input are missing; HKD conversion targets are supported.
- **Tech stack:** Plain HTML, CSS and JavaScript modules; Vite 8.3.6; Node.js >=22.12.0 and npm; Node’s built-in test runner; browser localStorage.  Frankfurter v2 supplies reference rates.  Shared PostHog browser analytics uses an owner-authorized public ingestion token, not a private API key.  Node HTTP backend in `server/rates.js` proxies Frankfurter; no runtime AI model.  The Render backend at https://jsd10030-utilityapp.onrender.com passed health, currency and CORS HTTP checks; the Pages publishing build now targets it.  Public browser and cold-start checks remain pending.
- **Structure:** `index.html` and `src/main.js` wire the app; `src/tipping.js` calculates; `src/trips.js` stores snapshots; `src/conversion.js` calls the API; `src/destinations.js` holds sourced guidance; `src/styles.css` styles the app.  `tests/` contains deterministic tests and Build 4 guidance.  `docs/index.html` is the standalone Product Page; `docs/assets/` holds historical evidence and shared analytics; `docs/app/` contains generated publishing output.  `Intent.md` and `Plan.md` track scope and plans.
- **Storage:** Trips stay in the same browser profile and origin.  Localhost trips do not transfer to the public app; there is no cloud sync or backup.

## 2. Setup & Commands
- **Setup:** From the repository root, use Node.js >=22.12.0 and npm.  No private API credentials are required.  Dependencies, private `.env` files and `dist/` are ignored; never add them to Git.
- **Install dependencies:** `npm ci`
- **Run locally:** Start `npm run dev:api` in one terminal, then `npm run dev` in another (restart an existing Vite server to load the proxy); calculator: `http://127.0.0.1:5173/`; Product Page: `http://127.0.0.1:5173/docs/index.html`.  Stop with Control-C.  Use HTTP rather than file URLs.
- **Run deterministic tests:** `npm test` (`node --test`).  API test fixtures are synthetic; actual API connectivity and browser/PostHog receipt checks are separate.
- **Production build:** `npm run build` writes `dist/`; `npm run preview` serves it at the URL printed by Vite.
- **Publishing build:** `VITE_API_ORIGIN=https://jsd10030-utilityapp.onrender.com npm run build:pages` uses `vite.publish.config.js`, base `/jsd10030-utilityApp/app/`, and replaces only generated `docs/app/`.  Preserve `docs/index.html` and `docs/assets/`.  To check without changing publishing output: `VITE_API_ORIGIN=https://backend-not-deployed.invalid npm run build:pages -- --outDir /tmp/utility-pages-check --emptyOutDir` (test output only; never publish this placeholder).
- **Backend production:** `npm run start:api`; configure `HOST=0.0.0.0`, platform `PORT` and `ALLOWED_ORIGIN=https://building-with-ai-f26.github.io`.  Render build: `npm ci`; start: `npm run start:api`; health: `/health`.  Render supplies PORT.  Production defaults to 0.0.0.0.  See README for cold-start retry checks, deployment risks and verification.  No private credentials required.
- **Whitespace check:** `git diff --check`; before committing, also review staged files and run `git diff --cached --check`.
- **Run model evals:** No runtime model or model-evaluation command is configured.  Build 4 track selection remains pending; see `tests/README.md`.
- **Public URLs:** Product Page: `https://building-with-ai-f26.github.io/jsd10030-utilityApp/`; calculator: `https://building-with-ai-f26.github.io/jsd10030-utilityApp/app/`.

## 3. Non-Negotiable Engineering Rules
1. **Plan before coding:** Before touching multiple files, propose a brief plan and wait for approval.
2. **Small batches:** Make small, focused changes that can be reviewed and explained by a human in a single Pull Request.
3. **Explainability:** Avoid unnecessary abstractions or dependencies. Help the human builder understand the main components, what changed, why it matters, what could break, and how it was checked.
4. **Verify changes:** Run relevant checks. For a reproducible logic bug, use a failing test to demonstrate the fix when practical. Record manual checks and known limitations; follow the selected Build 4 evaluation track.
5. **Zero secrets in code:** Never hardcode API keys, tokens, or credentials. Always read from environment variables (`.env`) and update `.env.example` when new variables are needed.
6. **Stop when looping:** If a fix fails twice in a row, stop, summarize what failed, and ask the human before trying a third approach.

## 4. Shipping

1. Check git status and preserve local work.  Run `npm test`, `npm run build` and `git diff --check`; keep private `.env` files, dependencies and unrelated screenshots out of the release.
2. If backend code changed, deploy it first when authorized.  Verify `https://jsd10030-utilityapp.onrender.com/health` returns 200 and status ok; verify `/api/rates?base=USD&target=EUR` returns valid base/quote/rate/date JSON.  Repeat the rates request with `Origin: https://building-with-ai-f26.github.io` and check the matching Access-Control-Allow-Origin header.  Health alone does not prove rates work.
3. Only with a verified backend, run `VITE_API_ORIGIN=https://jsd10030-utilityapp.onrender.com npm run build:pages`.  Review generated `docs/app/` paths and backend URL; preserve the Product Page and screenshot assets.  Never publish a placeholder API origin.
4. Review the staged files and run `git diff --cached --check`.  Commit/push only when authorized.  Verify Pages serves the intended HTML, JavaScript and CSS after deployment.
5. At `https://building-with-ai-f26.github.io/jsd10030-utilityApp/app/`, check calculation, conversion (rate/date), explicit saving and reopening.  Trace the backend request as below.  Record observed checks and failures in `docs/index.html`; keep cold-start, replay and event receipt pending until observed.

## 5. Ask me first

Get approval before using a paid service or enabling billable resources, changing where trip data is stored or what analytics collects, or performing a destructive action (including deleting trips/site data, overwriting work or force-pushing).  Existing plan/approval rules still apply; release steps do not authorize deployment, commit, push or submission by themselves.

## 6. Rule from a real mistake

Build 2's public calculator converted currency successfully while the browser still called Frankfurter directly.  A working result did not satisfy the backend requirement.  Before marking that requirement complete, trace one real conversion from the published calculator to our Render `/api/rates` endpoint and from the backend to the fixed Frankfurter provider.  Check the published browser request and pair-only parameters, correlate its response with backend/provider evidence, and record the date, app commit/asset, endpoints, status and rate/date in the build log without secrets, amounts or trip names.  Source inspection or separate curl checks alone do not prove the full published request path; keep any unobserved hop pending.
