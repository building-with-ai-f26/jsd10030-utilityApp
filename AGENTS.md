# AGENTS.md — Coding Agent Operating Manual

> Give this file to your coding agent and check that it is using these instructions. Keep the stack, commands, and ground rules current.

## 1. Project Overview
- **What this repo builds:** Utility Suite is an ad-free collection of everyday utilities.  Its current Travel Tipping prototype provides sourced restaurant guidance, tip calculation, Equal or By person splitting, separate reference-rate conversion and locally saved trips.
- **Primary user & core workflow:** Simran is the first intended user and is planning a Hong Kong trip; feedback is pending.  Choose destination → calculate and split → explicitly save to a named trip → reopen saved details.  See the living PRD in `docs/index.html`.  Hong Kong guidance and HKD bill input are missing; HKD conversion targets are supported.
- **Tech stack:** Plain HTML, CSS and JavaScript modules; Vite 8.3.6; Node.js >=22.12.0 and npm; Node’s built-in test runner; browser localStorage.  Frankfurter v2 supplies reference rates.  Shared PostHog browser analytics uses an owner-authorized public ingestion token, not a private API key.  No backend or runtime AI model.
- **Structure:** `index.html` and `src/main.js` wire the app; `src/tipping.js` calculates; `src/trips.js` stores snapshots; `src/conversion.js` calls the API; `src/destinations.js` holds sourced guidance; `src/styles.css` styles the app.  `tests/` contains deterministic tests and Build 4 guidance.  `docs/index.html` is the standalone Product Page; `docs/assets/` holds historical evidence and shared analytics; `docs/app/` contains generated publishing output.  `Intent.md` and `Plan.md` track scope and plans.
- **Storage:** Trips stay in the same browser profile and origin.  Localhost trips do not transfer to the public app; there is no cloud sync or backup.

## 2. Setup & Commands
- **Setup:** From the repository root, use Node.js >=22.12.0 and npm.  No private API credentials are required.  Dependencies, private `.env` files and `dist/` are ignored; never add them to Git.
- **Install dependencies:** `npm ci`
- **Run locally:** `npm run dev`; calculator: `http://127.0.0.1:5173/`; Product Page: `http://127.0.0.1:5173/docs/index.html`.  Stop with Control-C.  Use HTTP rather than file URLs.
- **Run deterministic tests:** `npm test` (`node --test`).  API test fixtures are synthetic; actual API connectivity and browser/PostHog receipt checks are separate.
- **Production build:** `npm run build` writes `dist/`; `npm run preview` serves it at the URL printed by Vite.
- **Publishing build:** `npm run build:pages` uses `vite.publish.config.js`, base `/jsd10030-utilityApp/app/`, and replaces only generated `docs/app/`.  Preserve `docs/index.html` and `docs/assets/`.  To check without changing publishing output: `npm run build:pages -- --outDir /tmp/utility-pages-check --emptyOutDir`.
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
