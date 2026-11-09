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
- **Gaps to discuss:** Hong Kong tipping guidance and HKD support are not implemented.  These are gaps to discuss with Simran, not completed features or confirmed user requests.
- **Build 2 analytics:** Installation and event verification remain pending.

## 2. The Smallest Working Version (Architecture)

- **Core workflow:** Choose destination → calculate tip → split bill → explicitly save to a named trip → retrieve saved result.
- **Stack (Frontend / Backend / DB):** App: HTML/CSS and JavaScript with Vite; Node’s built-in test runner; localStorage for versioned trip snapshots.  Product Page: separate standalone HTML/CSS.
- **Implemented local data flow:** Destination guidance and bill inputs → additional tip and equal split calculation → result → user chooses to save to a named trip → saved result retrieval.
- **Local run command:** `npm run dev`.  Product Page preview: open `docs/index.html` in a browser.
- **Local URL:** `http://127.0.0.1:5173/`.  Reopen the same URL in the same browser profile to retrieve saved history.
- **Models used (via OpenRouter or provider):** No runtime model selected; a runtime model is not required for arithmetic.  Codex was used through my existing ChatGPT Pro subscription; token usage is not tracked and the subscription cost has not been allocated to this project.
- **Attribution:** An earlier version was built with my brother.  This course’s new individual work includes the documentation, calculator and saved-trip workflow.  Record any earlier code or assets reused later.

### Completed work

- [x] Draft PRD v1 and define Build 1 scope and three non-goals.
- [x] Draft the Product Page with honest pending evidence labels.
- [x] Record the weekend plan and Monday submission checklist.

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

- [ ] Ask Simran to calculate, split, save and reopen a result; record actual feedback.  Discuss the Hong Kong guidance and HKD gaps without treating them as confirmed requests.
- [ ] Test on a phone; do not count a resized desktop window as a phone test.
- [ ] Commit and push reviewed Sunday work on a second separate day; verify the new screenshot on the public Product Page afterward.
- [ ] Build 2: install PostHog on the Product Page and local app and verify events.  Account creation is already complete.

### Monday, Nov 9 — submission checklist (before noon, New York time)

- [ ] Do a final review that the prototype and PRD match the implemented workflow; disclose remaining limits.
- [x] Record builder details, real screenshots, learning, problems, hours and cost uncertainty in the local documentation.
- [x] Credit the earlier collaboration and identify the course’s new individual work.
- [ ] Review for exposed secrets, check links and verify commits on at least two separate days outside class.
- [x] Publish and verify the Product Page at `https://building-with-ai-f26.github.io/jsd10030-utilityApp/` (Saturday evidence).
- [ ] After Sunday’s push, verify the new history screenshot at the public URL; phone testing remains pending.
- [ ] Submit Product Page and repository URLs in Icerynk.
- [ ] Prepare a two-minute prototype demo for Tuesday, Nov 10.

## 3. Time & Money Budget

Actual time: approximately 1.5 hours Saturday and 50 minutes Sunday, for approximately 2 hours and 20 minutes total.  Additional project spending so far: $0.  I used Codex through my existing ChatGPT Pro subscription.  I have not tracked token usage or allocated the subscription cost to this project.  Estimates and cost per user run remain unmeasured.

| Item | Estimate | Actual | Notes |
| :--- | :--- | :--- | :--- |
| Additional project spending | | $0 | Existing ChatGPT Pro subscription; subscription cost not allocated, token usage not tracked |
| Unit cost per user action | | | Not measured |
| Hosting cost (monthly) | | | No additional hosting expense reported |
| Engineering time | | Approximately 2 hours 20 minutes | Saturday: 1.5 hours; Sunday: 50 minutes |

## 4. Security & Recovery Checklist

- [ ] Verify `.env` and API keys are excluded via `.gitignore` before application work.
- [ ] Configure spending limits or alerts where supported by any providers used.
- [ ] Use least-privilege permissions for any external data/APIs introduced.
- [x] Explain same-browser and same-origin storage limits; save only on explicit action.  No cloud backup or sync.  Clearing site data removes history; private browsing may erase it when closed.  Storage failure handling is covered by automated tests.
- [ ] Create a reviewed Git save point; add a cloud rollback path in Build 5.
- [ ] Build 4: choose Track A (domain evaluation) or Track B (user friction) using `tests/README.md`; selection pending.
