# Utility Suite

> **One-line pitch:** [Who is this for, and what job does it do for them?]

- **Builder:** [Your Name] (`@github-handle`)
- **Pod:** [Pod Name / Number]
- **Product Page & Living PRD:** [Add your GitHub Pages URL]
- **App:** runs locally through Week 4; add a cloud URL in Build 5.

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
- Manual browser review: test US/UK/France source links, change currency and confirm numbers are not converted, check both $100 examples, try zero diners and negative amounts, and review keyboard focus and narrow mobile layout. Browser/user review is pending.
- No accounts, runtime API keys, saved trips or history are implemented. Saving and history remain Sunday's work. The earlier version was built with my brother; this calculator is new individual course work.

### Guidance sources

Reviewed November 7, 2026; these are manually maintained summaries, not live guidance:

- [Brand USA: Dining and tipping FAQ](https://traveltrade.visittheusa.com/travel-trade/faq/)
- [Visit London: official tipping guide](https://www.visitlondon.com/traveller-information/essential-information/money/tipping)
- [French Ministry of Economy / DGCCRF: Pourboire](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/pourboire)

`node_modules/`, `dist/`, `build/` and private `.env` files are already excluded by `.gitignore`. `.env.example` is a placeholder template and remains trackable. Never place private keys in browser code; this calculator needs none.
