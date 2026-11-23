# Build 3: Build.exe (The Core, in Small Changes)

Optional working notes. Publish your required build log on `docs/index.html`; no separate journal submission is required.

**Build due:** Monday, Nov 23, 2026 at 12:00 PM (Noon)

---

**Entry:** November 20, 2026 (ET)

## 1. What you made

- **Product Page URL / local demo evidence:** I tested localhost and the [public calculator](https://building-with-ai-f26.github.io/jsd10030-utilityApp/app/).  I referenced the [November 20 security audit](../SECURITY.md).
- **Summary of what works now:** On localhost, I reopened a saved $128 bill with shares of $38.40 and $89.60.  PostHog showed `calculation_succeeded`, `conversion_succeeded`, `result_saved` and `saved_details_opened` in order.  On my phone, the public calculator recorded `conversion_failed` on the first attempt, but I could still save the bill.  A later attempt recorded a successful conversion, save and reopen.

## 2. Metacognition ("Learn with AI"): Branches, Diffs & Agent Guardrails

- **What I learned:** A currency lookup can fail while the bill split and saved trip still work.  Checking PostHog alongside Render helped me see which part succeeded.
- **New rule I added to `AGENTS.md`:** Before calling a backend requirement complete, trace a real published request through our backend to the provider and record the evidence.

## 3. What the agent did

- **Agent used / how I directed it:** I used Codex to audit the project, help check localhost and document only the results I reported.  The audit scope and remaining risks are recorded in SECURITY.md.

## 4. What didn't work

- **Failure and diagnosis:** The first phone conversion failed.  Render started the backend at 6:32:20 p.m. ET and began listening at 6:32:22 p.m.  This is consistent with a cold start; the exact cause of the failed request and the wait time are unconfirmed.
- **Replay checks:** The local and public replay screenshots showed masked text.  In the public replay, I could follow the touch indicator while trip names and amounts stayed hidden.

## 5. What it cost

- **Additional Codex spending:** Pending; I have not supplied the actual figure.
- **Actual hours:** Pending; I have not supplied my November 20 time.
- **Previously recorded costs:** $27 for Codex development credits.  My ChatGPT Pro subscription remains separate and unallocated; token usage is unmeasured.  I have not confirmed additional runtime spending.

## 6. Pod Critique Sign-off

- **Classmate phone feedback:** Pending.  These phone checks were my own, not classmate feedback.


---

**Entry:** November 22, 2026 (ET) — private-trips feature branch, not deployed

## 1. What I made

- I added optional sign-in and private trips while keeping existing guest records on-device.  New private saves reuse the exact original-currency snapshot and existing details renderer; conversion estimates are not saved.  I prepared an owner-only RLS migration for my hosted review.
- I applied the private-trips migration in my utility-suite Supabase project.  The SQL Editor reported “Success. No rows returned.”  This records my reported application, not a completed RLS isolation test.  I configured the local app and reported that Chrome reopened my private test trip with a $128.00 total and $38.40/$89.60 shares.  I also signed in as Account B and selected Private account.  B's authenticated requests against A's specific trip and saved bill have not been observed, so the two-account privacy test remains pending.  I will handle deployments myself.

## 2. What I learned / rules

- A mocked successful save is not proof of RLS.  I need both a real A cross-browser result and a specific-ID request using B's credentials, plus policy inspection.  Friday's clean search and own phone/replay evidence remain historical, not verification of new account storage.

## 3. What the agent did

- Codex implemented the feature branch, setup guide and migration, tested guest compatibility, exact snapshots, stale writes and sign-out/late-response clearing, and kept the public calculator build unchanged.  Hosted permissions and live replay must still be checked by me.

## 4. What remains / evidence

- Recheck the current Beginner rubric and submission fields; Icerynk is not available to the agent.  Git has commits on November 16 and 20 (ET), two distinct workdays; outside-class qualification still needs the exact rubric.
- Refresh Auth/database permissions, two-account isolation, public sign-out behavior, secret/dependency scans and live PostHog flow/playable replay with account inputs masked.  Friday's observed conversion_failed and later success are retained; its exact failure cause/wait remain unconfirmed.
- Classmate phone feedback remains pending.  I will submit the Product Page/repository and whatever evidence the current assignment actually requests; no new submission was made.

## 5. Actual time and cost

- November 20 actual additional time/Codex spending: pending.  November 22 actual time and additional spending: pending; the one-hour work window is a budget, not a measured time entry.
- Previously recorded totals stay 4 hours 20 minutes and $27 Codex development credits.  My existing Pro subscription remains separate/unallocated; token usage, hosted usage cost and runtime cost per run are unmeasured.  No paid service was enabled by the agent.

## 6. Next use

- Once private-trip isolation is verified, I can reuse the owner-scoped trip container for another utility by adding an explicit utility type/version and its own validated snapshot.  This branch still stores tipping snapshots only.

**Local check record:** I recorded Codex's run of 140 passing tests, a successful production build and temporary Pages builds, and a fresh lockfile audit reporting 0 advisories.  Account tests used mocked Auth/Postgres responses and DOM handlers; they do not establish hosted RLS or general cross-device behavior.  My reported Chrome reopening is separate browser evidence; Account B isolation, fresh sign-out/privacy evidence and live release checks remain pending.


---

**Entry:** November 23, 2026 (ET) — two-account privacy check

## 1. What I verified

- I completed the read-only checker using the **localhost app connected to hosted Supabase**.  Both signed-in accounts were verified.  In Safari, Account A received HTTP 200 with one matching trip row and one matching bill row.  In Chrome, Account B requested those same exact record IDs and received HTTP 200 with zero rows for each.
- I marked this exact-record read-isolation check **passed**.  A could still reopen the $128.00 By person bill with $38.40/$89.60 shares.  An empty dropdown alone was not the evidence, and I did not use failed authentication or a network error as a pass.  The result is also recorded in [SECURITY.md](../SECURITY.md).

## 2. What I learned

- I need a known readable A record and completed B requests for that same trip and bill to demonstrate read isolation.  The checker uses the normal signed-in client without an owner filter or admin credentials.

## 3. What remains

- Public deployment and published-app sign-in, save/reopen/sign-out verification remain pending.  The checker is development-only and must stay out of the GitHub Pages build.
- Other permissions checks, the refreshed account-field PostHog flow/replay, final live credential scan, classmate feedback and exact submission requirements remain pending.  I will handle deployment and Icerynk submission.

## 4. Hours and costs

- No new actual hours or Codex spending were supplied.  Earlier pending figures remain pending; the recorded 4 hours 20 minutes and $27 development spending are unchanged.  No screenshot capture or submission is claimed by this entry.


## November 23 release preparation — feedback recorded

- Marisa tested the published app: she got $38.40/$89.60 shares, converted the bill to EUR, saved the trip and reopened it after refreshing.  The saved bill showed USD.  This is feedback on the already published app, not verification of the new private-account release; her device and account mode were not supplied.
- I will consider saving the EUR reference-rate estimate alongside the original bill as a future improvement, including its rate/date, while preserving the original USD snapshot.  This is not implemented in this release.
- My localhost-to-hosted-Supabase two-account read test passed as recorded above.  Public deployment, account-field replay and release verification remain pending.  No new actual hours or additional Codex spending have been supplied; earlier recorded totals and pending figures are preserved.  I will handle publishing and Icerynk submission.


**Release check record (November 23):** I recorded 156 passing tests, successful production and real GitHub Pages builds using the existing Render URL and public Supabase settings, correct generated asset paths, enabled private-account configuration and exclusion of the development privacy checker.  Render health/rates/Pages-origin checks passed; the lockfile audit returned 0 advisories.  HTML/link and whitespace checks passed.  These are release-preparation checks, not proof of the version being published.  Public private-account save/reopen/sign-out and new live replay remain pending.

The Pages build uses a reproducible code-generation setting to escape an SDK whitespace literal cleanly.  Its runtime string value was checked unchanged; generated whitespace checks passed.  This changes bundle formatting, not the saved bill format.
