# Plan.md — Optional Risk, Architecture & Budget Draft (Build 2)

This draft also tracks the Build 1 weekend. Publish the required PRD and build logs on `docs/index.html`; this file is not a separate hand-in.

**Product:** Utility Suite
**Build 1 due:** Monday, Nov 9, 2026 at noon, New York time
**Build 2 due:** Monday, Nov 16, 2026 at noon, New York time
**Builder:** [Your Name — pending]

## 1. What is the riskiest part?

- **#1 Technical / Product Risk:** Travelers may misread destination guidance or confuse an included service charge with an additional tip. Guidance needs sources and clear limits; calculations need clear inputs, rounding and totals.
- **Planned Build 1 checks:** Verify tip and split calculations with known examples; check zero additional tip, service charge handling, invalid inputs and uneven splits. Verify explicitly saved results can be retrieved from the correct named trip. These checks have not run yet.
- **How Build 2 will test it:** Observe a target user using the smallest working version and verify analytics events. No results are available yet.

## 2. The Smallest Working Version (Architecture)

- **Core workflow:** Choose destination → calculate tip → split bill → explicitly save to a named trip → retrieve saved result.
- **Stack (Frontend / Backend / DB):** Product Page uses standalone HTML/CSS. App stack and local persistence design are pending.
- **Planned data flow:** Destination guidance and bill inputs → additional tip and equal split calculation → result → user chooses to save to a named trip → saved result retrieval.
- **Local run command:** App command pending. Product Page preview: open `docs/index.html` in a browser.
- **Local URL (Build 2):** Pending app implementation.
- **Models used (via OpenRouter or provider):** No runtime model selected; a runtime model is not required for arithmetic. Coding-agent usage and costs remain to be recorded.
- **Attribution:** An earlier version was built with my brother. This course's new individual work currently consists of the documentation draft. Record any earlier code or assets reused later.

### Completed work

- [x] Draft PRD v1 and define Build 1 scope and three non-goals.
- [x] Draft the Product Page with honest pending evidence labels.
- [x] Record the weekend plan and Monday submission checklist.

### Saturday, Nov 7 — planned work

- [ ] Implement sourced restaurant tipping guidance for a clearly stated set of destinations.
- [ ] Implement additional tip calculation and equal bill splitting with clear totals and rounding.
- [ ] Check normal examples, service charges, zero tip and invalid inputs.
- [ ] Preview the Product Page on desktop and mobile; revise after real prototype evidence exists.
- [ ] Create a PostHog account for Week 1; install and verify events in Build 2.
- [ ] Record actual learning, problems, costs and hours; make a meaningful commit when reviewed.

### Sunday, Nov 8 — planned work

- [ ] Implement named trips, explicit saving and retrieval of saved results/history.
- [ ] Check the complete workflow, including retrieval after reopening the app; document storage limits.
- [ ] Invite a classmate or friend to try it; record actual observations without inventing feedback.
- [ ] Capture a real screenshot or GIF, place it under `docs/` and embed it with a relative asset path.
- [ ] Update status, learning, problems, costs and hours from evidence.
- [ ] Make a meaningful commit on a second separate day and push reviewed work.

### Monday, Nov 9 — submission checklist (before noon, New York time)

- [ ] Confirm the prototype and PRD match the stated Build 1 workflow; disclose any unfinished work.
- [ ] Add builder details, actual screenshot/GIF, learning, problems, costs and hours.
- [ ] Credit the earlier collaboration and identify the course's new individual work.
- [ ] Review for exposed secrets, check links and verify commits on at least two separate days outside class.
- [ ] Publish GitHub Pages from `main` → `/docs`; verify the public project URL and image paths on a phone.
- [ ] Submit Product Page and repository URLs in Icerynk.
- [ ] Prepare a two-minute prototype demo for Tuesday, Nov 10.

## 3. Time & Money Budget

Blank values are intentional: estimates and actuals have not been supplied.

| Item | Estimate | Actual | Notes |
| :--- | :--- | :--- | :--- |
| Build budget (coding agent / APIs) | | | Pending |
| Unit cost per user action | | | Pending architecture and measurement |
| Hosting cost (monthly) | | | Pending |
| Engineering time | | | Pending |

## 4. Security & Recovery Checklist

- [ ] Verify `.env` and API keys are excluded via `.gitignore` before application work.
- [ ] Configure spending limits or alerts where supported by any providers used.
- [ ] Use least-privilege permissions for any external data/APIs introduced.
- [ ] Explain local saved-data behavior and avoid automatic saving; cloud sync is outside Build 1.
- [ ] Create a reviewed Git save point; add a cloud rollback path in Build 5.
- [ ] Build 4: choose Track A (domain evaluation) or Track B (user friction) using `tests/README.md`; selection pending.
