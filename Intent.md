# Intent.md — Optional PRD Draft (Build 1)

Publish the required PRD and Build 1 log on `docs/index.html`; this file is not a separate hand-in.

**Product:** Utility Suite
**Build 1 due:** Monday, Nov 9, 2026 at noon, New York time
**Updated:** Sunday, Nov 8, 2026
**Builder:** Jiwanjot Dhaliwal

## 1. Who is it for?

- **Target user:** A classmate or friend planning an international trip who needs help calculating restaurant tips and splitting bills.
- **How I will reach them to test it:** Invite a classmate or friend directly.  Outside participant and testing session are pending; I have completed my own checks, but no outside feedback has been collected.

## 2. What job does it do?

- **Problem:** My phone has a few built-in tools, but more specific tasks send me to another website or app.  I encounter ads, unnecessary features and uncertainty about data collection.  If I need a result later, I may have to calculate it again.
- **Product:** An ad-free collection of everyday utilities with a consistent experience.  Over time, users will be able to pin favorites, choose preferred units and currency, and explicitly save selected results together.
- **Current painful workflow (before):** Search tipping customs, open a calculator, divide the bill and save a screenshot—or lose the result.
- **New workflow with this product (after):** Check destination guidance, calculate and split the bill, save the result to a named trip and find it again later.
- **Why this is useful:** The intended benefit is fewer separate tools and less repeated work.  Usefulness and frequency of use still need user testing.

## 3. What is in and out of scope?

- **One core workflow:** Choose destination → calculate tip → split bill → save to trip → retrieve saved result.
- **Build 1 scope (implemented locally):** Restaurant tipping guidance, additional tip calculation, equal bill splitting, explicit saving to a named trip and retrieval of saved results.
- **Saturday, Nov 7 (completed):** Tipping guidance, calculation, equal splitting and the Product Page with a real calculator screenshot.  The Product Page is public; the calculator runs locally.
- **Sunday, Nov 8 (completed locally):** Named trips, explicit saving and saved history.  I verified saving the $128 result, reopening it after closing the tab, stale-result prevention after changing the tip, and a separate $133 result without changing the first trip’s history.  Outside user feedback remains pending.
- **Long-term scope:** A roadmap of 55 utilities.  Currency conversion, favorites and preferences come first, followed by the remaining utility groups; the detailed catalog is pending.

Three non-goals for Build 1:

- Accounts and cloud synchronization.
- Payments, bank connections and receipt scanning.
- The complete utility catalog and live currency conversion.

## 4. Rough Local Prototype

- **Completed:** PRD v1, the local calculator, named trips, explicit snapshot saving and retrieval, the public Product Page and Saturday screenshot.  The Sunday history screenshot is included in this local update but is not yet pushed.
- **Automated checks:** The completed implementation run reported 41 passing tests, a successful production build and passing whitespace checks.
- **Local run command / screenshots:** `npm run dev`, then open `http://127.0.0.1:5173/`.  Evidence: `docs/assets/tipping-demo.png` and `docs/assets/trip-history-demo.png`.
- **My browser checks:** I verified the $128 save/reopen workflow and a separate $133 trip.  Changing the tip disabled saving until recalculation.  A smaller desktop browser window stayed readable; I did not test a phone.  Keyboard navigation to saved details worked after I enabled Safari’s “Press Tab to highlight each item on a webpage” setting.
- **Storage limits:** Results stay in the same browser profile and origin, with no cloud backup or sync.  Clearing site data removes history; private browsing may erase it when closed.  Storage can be blocked, damaged or full; the calculator remains usable when storage fails.
- **Time and costs:** Saturday: approximately 1.5 hours.  Sunday: approximately 50 minutes.  Total: approximately 2 hours and 20 minutes.  Codex token usage and associated cost are unknown.  No other project expenses have been reported.
- **Analytics:** PostHog account creation is complete on the Free plan as of November 7, 2026.  Installation and event verification remain pending for Build 2.
- **Attribution:** An earlier version was built with my brother.  This course’s new individual work includes the documentation, calculator and saved-trip workflow.  Identify any earlier code or assets reused later.
- **Still pending:** Outside user feedback, phone testing, Sunday commit/push, and Monday submission.  Follow `Plan.md` for remaining checks.  The Product Page is public; the calculator remains local.
