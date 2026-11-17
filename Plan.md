# Plan.md — Optional Risk, Architecture & Budget Draft (Build 2)

This draft also tracks the Build 1 weekend.  Publish the required PRD and build logs on `docs/index.html`; this file is not a separate hand-in.

**Product:** Utility Suite
**Build 1 due:** Monday, Nov 9, 2026 at noon, New York time
**Build 2 due:** Monday, Nov 16, 2026 at noon, New York time
**Builder:** Jiwanjot Dhaliwal

## 1. What is the riskiest part?

- **#1 Technical / Product Risk:** Travelers may misread destination guidance or confuse an included service charge with an additional tip.  Guidance needs sources and clear limits; calculations need clear inputs, rounding and totals.
- **Completed Build 1 checks:** The implementation run reported 41 passing tests, a successful production build and passing whitespace checks.  My browser checks covered the $128 save/reopen workflow, disabling stale saves, independent $133 history in a separate trip, a smaller desktop layout and keyboard navigation after enabling Safari’s tab-highlighting setting.  These are my own checks, not outside feedback or phone testing.
- **First intended user and planned check:** Simran is my first intended user and is planning a trip to Hong Kong.  I will ask Simran to try calculating, splitting, saving and reopening a result.  Feedback is still pending.
- **Gaps to discuss:** HKD is supported as a conversion target.  Hong Kong tipping guidance and HKD bill input are not implemented.  These remaining gaps are topics to discuss with Simran, not confirmed user requests.
- **Build 2 analytics:** Installed on both pages and deployed.  I observed pageviews, ui_clicked, calculation_succeeded, conversion_succeeded and result_saved locally, and previously observed saved_details_opened locally before By person was added.  PostHog also received events from the public calculator URL.  The public replay played with visible inputs and saved content masked.  Receipt of conversion_failed remains pending.  The November 15 PostHog screenshot specifically confirms public ui_clicked, saved_details_opened, result_saved, conversion_succeeded and calculation_succeeded.  Other event checks remain pending.

## 2. The Smallest Working Version (Architecture)

- **Core workflow:** Choose destination → calculate tip → split bill → explicitly save to a named trip → retrieve saved result.
- **Stack (Frontend / Backend / DB):** App: HTML/CSS and JavaScript with Vite; Node’s built-in test runner; localStorage for versioned trip snapshots.  Product Page: separate standalone HTML/CSS.
- **Implemented data flow:** Destination guidance and bill inputs → additional tip and Equal or By person calculation → result → optional whole-total reference-rate conversion → explicit save of the original calculation to a named trip → saved result retrieval.
- **Local run command:** `npm run dev`.  Product Page preview: `http://127.0.0.1:5173/docs/index.html` (use HTTP so the analytics module loads).
- **Web calculator:** `https://building-with-ai-f26.github.io/jsd10030-utilityApp/app/`.  Saved trips remain in each visitor’s browser; existing localhost trips do not transfer.
- **Publishing build:** `npm run build:pages` replaces generated files only in `docs/app/`, using base `/jsd10030-utilityApp/app/` and the existing GitHub Pages configuration.  Keep `docs/index.html` and `docs/assets/` separate.
- **Local URL:** `http://127.0.0.1:5173/`.  Reopen the same URL in the same browser profile to retrieve saved history.
- **Models used (via OpenRouter or provider):** No runtime model selected; a runtime model is not required for arithmetic.  Codex was used through my existing ChatGPT Pro subscription; token usage is not tracked and the subscription cost has not been allocated to this project.
- **Attribution:** An earlier version was built with my brother.  This course’s new individual work includes the documentation, calculator and saved-trip workflow.  Record any earlier code or assets reused later.

### Completed work

- [x] Draft PRD v1 and define Build 1 scope and three non-goals.
- [x] Draft the Product Page with honest pending evidence labels.
- [x] Record the weekend plan and Monday submission checklist.

### Build 2 — completed and remaining evidence

- [x] Implement PRD v2 and Anirudh’s smaller requested response: per-person subtotals, proportional charges/tip, exact-cent allocation and backward-compatible snapshots.
- [x] Implement separate whole-total Frankfurter conversion and PostHog on both pages.
- [x] Record the implementation run: 106 passing tests, successful production/publishing builds, HTML and whitespace checks.
- [x] Push and deploy commit `9f87215`; check both public pages and required assets.
- [x] Record public browser observations: My public browser checks produced shares of $38.40 and $89.60.  USD 128 converted to an estimated EUR 115.56 during the observed test; later estimates may differ with the reference rate.  The “Live test” saved result reopened with By person mode and its complete breakdown.
- [x] Record public event receipt and playable replay with visible inputs and saved content masked; saved_details_opened was previously observed locally.
- [ ] Observe conversion_failed receipt; complete remaining mode-change, zero/invalid individual-input, old-history, keyboard/phone, exhaustive privacy and analytics-failure checks.
- [x] Four November 15 Build 2 screenshots are included: the By person result (70/30 diner order), the Frankfurter conversion with rate/date, reopened “Live test” details, and PostHog event receipt from the public calculator.  The November 7–8 images remain historical Build 1 evidence.  The PostHog screenshot does not show replay playback or conversion_failed receipt; those statuses are recorded separately.
- [x] Build 2 submitted November 15, 2026; attempt 2 at 1:17 PM New York time included the PostHog image.  The November 16 backend correction is separate and has not been resubmitted.

**API and cost model:** The calculator requests a currency-pair reference rate from Frankfurter v2 and computes the estimate in the browser; it does not send bill amounts or trip names.  The public API is free and requires no key or account.  Its official documentation states no daily/monthly quotas, with rate limiting to prevent abuse.  Reference rates are not live market quotes or guaranteed card/cash rates; availability is not guaranteed.  No paid API plan was enabled.  [Official documentation](https://frankfurter.dev/).  USD/GBP/EUR bill selection remains display-only; conversion is separate, with USD/GBP/EUR/HKD targets.  Conversion estimates are not saved.  PostHog uses the previously created Free plan account; usage/billing limits should be checked before broader testing.  Recorded development spending is $27 in Codex credits on November 15; it is separate from runtime API costs and the unallocated ChatGPT Pro subscription.

### Saturday, Nov 7 — completed work

- [x] Implement sourced restaurant guidance for the US, UK (London-based) and France.
- [x] Implement additional tip calculation and equal bill splitting with clear totals and integer-cent rounding.
- [x] Run the original 27 tests and production build; check the $128 example and zero-diner validation manually.
- [x] Publish and verify the Product Page and calculator screenshot.
- [x] Create a PostHog Free plan account on November 7, 2026.
- [x] Record learning, hours and cost uncertainty; commit and push Saturday’s work.

### Sunday, Nov 8 — completed locally

- [x] Implement named trips, explicit saving and retrieval of independent saved snapshots.
- [x] Run 41 tests, the production build and whitespace checks successfully.
- [x] Save the $128 result and retrieve it after closing and reopening the tab.
- [x] Confirm that changing the tip disables saving until recalculation.
- [x] Save a $133 result in a separate trip without changing the first trip’s history.
- [x] Check a smaller desktop window for readability; no phone test has been performed.
- [x] Navigate to saved details by keyboard after enabling Safari’s “Press Tab to highlight each item on a webpage” setting.
- [x] Document local storage limits and add the actual history screenshot with a relative path.
- [x] Update local documentation from evidence and record Sunday’s time.

### Monday, Nov 9 — learning

November 9, 2026: I connected Codex to Icerynk and used it to review course requirements.  No Monday time has been added to the recorded hours.

### Work still pending

- [ ] Ask Simran to calculate, split, save and reopen a result; record actual feedback.  Discuss the missing Hong Kong guidance and HKD bill-input gaps without treating them as confirmed requests.
- [ ] Test on a phone; do not count a resized desktop window as a phone test.
- [x] Commit and push Sunday’s implementation and evidence.
- [x] Verify the publishing deployment; Build 2 deployment and the specific public browser observations are recorded above, separately from local history.
- [x] Build 2: install PostHog on the Product Page and calculator.  Partial event/replay observations are recorded above; remaining checks stay pending.

### Monday, Nov 9 — submission checklist (before noon, New York time)

- [ ] Do a final review that the prototype and PRD match the implemented workflow; disclose remaining limits.
- [x] Record builder details, real screenshots, learning, problems, hours and cost uncertainty in the local documentation.
- [x] Credit the earlier collaboration and identify the course’s new individual work.
- [ ] Review for exposed secrets, check links and verify commits on at least two separate days outside class.
- [x] Publish and verify the Product Page at `https://building-with-ai-f26.github.io/jsd10030-utilityApp/` (Saturday evidence).
- [x] Verify the deployed Product Page, calculator at `/app/`, required assets and historical screenshots.  Phone testing remains pending.
- [ ] Submit Product Page and repository URLs in Icerynk.
- [ ] Prepare a two-minute prototype demo for Tuesday, Nov 10.

## 3. Time & Money Budget

Recorded active project time: approximately 1.5 hours November 7, 50 minutes November 8, and 2 hours Sunday, November 15, 2026: 4 hours 20 minutes total.  Recorded project spending: $27 for Codex credits used for development on November 15.  This is development spending, not a per-user-run API cost.  My existing ChatGPT Pro subscription remains separate and unallocated to this project.  Token usage has not been measured.  Runtime API cost per user run remains unmeasured; Frankfurter uses its free public API.

| Item | Estimate | Actual | Notes |
| :--- | :--- | :--- | :--- |
| Recorded development spending | | $27 | November 15 Codex credits; Pro subscription separate and unallocated; token usage unmeasured |
| Unit cost per user action | | | Not measured |
| Hosting cost (monthly) | | | No additional hosting expense reported |
| Engineering time | | 4 hours 20 minutes | Nov 7: approximately 1.5 hours; Nov 8: approximately 50 minutes; Nov 15: 2 hours |

## 4. Security & Recovery Checklist

- [ ] Verify `.env` and API keys are excluded via `.gitignore` before application work.
- [ ] Configure spending limits or alerts where supported by any providers used.
- [ ] Use least-privilege permissions for any external data/APIs introduced.
- [x] Explain same-browser and same-origin storage limits; save only on explicit action.  No cloud backup or sync.  Clearing site data removes history; private browsing may erase it when closed.  Storage failure handling is covered by automated tests.
- [ ] Create a reviewed Git save point; add a cloud rollback path in Build 5.
- [ ] Build 4: choose Track A (domain evaluation) or Track B (user friction) using `tests/README.md`; selection pending.

### November 16 backend correction

Implemented locally: Node currency-pair endpoint → fixed Frankfurter API, with Vite development proxy preserving port 5173.  Full suite: 124 tests passed; production and temporary publishing builds passed.  Real backend and temporary Vite proxy requests succeeded.  After restarting Vite on 5173, calculation, conversion and reopening saved details passed local browser checks.  Render Free setup includes /health and production PORT/0.0.0.0 binding.  Production backend deployment, hosted cold-start retry verification, other unperformed browser checks, PostHog receipt for this correction and any resubmission remain pending.  Existing docs/app output is unchanged.  Recorded hours remain 4 hours 20 minutes and development spending $27; no November 16 hours or additional expense were supplied.  See README for production API configuration and hosting risks.

### November 16 hosted backend and Pages connection

Render backend https://jsd10030-utilityapp.onrender.com verified by real HTTP requests: /health 200; USD/EUR rate 0.90603 dated 2026-11-17; allowed Pages origin with matching CORS header; unrelated origin rejected with 403.  Pages output rebuilt with this origin; 124 tests and both builds passed.  Verify served Pages HTML and assets after pushing.  Public browser checks with this backend, cold-start/retry testing and conversion_failed receipt remain pending.  No resubmission, extra hours or additional spending recorded.
