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
