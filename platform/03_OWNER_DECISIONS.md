# Owner decisions (open)

Answer inline; agents treat answered items as rules.

## Already decided (from conversation, Oct 21 2026)
- Solo founder + AI, no employees. Vendors only where the law requires a licensed party.
- Build in public on all platforms, aggressive from day one.
- Masar OS is Company #1 (continue mode).
- Autopilot only; changes through the coach chat; coach pushes back with evidence.
- Multi-provider models, chosen per task by evals.
- Accounting, KYC review and payments review are done by agents (owner signs filings).
- Lovable-style many tiers, no unlimited; aggressiveness drives credit use.
- Creator marketing through an existing marketplace API first; own network later.
- Revenue share locked to our Stripe Connect.
- Every business type supported; marketing by niche, selling outcomes.

- Niches in the spec are examples only; any business is served.
- Domain-first naming; no USPTO gate.
- Credits charged when a task passes testing; user revisions are paid work.
- No blanket AI labels; follow each platform's rules where they apply.
- Tiers and credit values are tested (Masar + beta) before publishing.
- Engineering agent added to the org chart.

- Ads: **Mode 1** (one ad account per company under our Meta Business Manager / Google Ads MCC, prepaid balance).
- Refunds: **no automatic refunds**; disputes reviewed case by case.
- Domains: **GoDaddy reseller API** (+ connect your own domain).
- Custom domains: **Cloudflare for SaaS**.
- Sending email: **Amazon SES** (+ built-in dashboard inbox).
- Legal entity: **Masar AI Inc. (Delaware C corporation)**, existing EIN, bank and Stripe account. Unstaffd runs as a product of Masar AI Inc.; a Delaware C-corp is already the structure investors expect.
- Google OAuth verification: **skipped at launch.** No Gmail (SES + Cloudflare inbox), built-in booking calendar instead of Google Calendar sync, Google Ads run from our own MCC (Mode 1, only our account authorizes), YouTube build-in-public on our own channel. Verify later only if we add Google Calendar sync, Business Profile management or posting to users' YouTube channels (and when > 100 users connect them).

## Name: **Unstaffd** (DECIDED Oct 21 2026)
Spelled **Unstaffd** (no "e"): the version whose domains are all free. Earlier candidates: Crewzero (dropped: "too heavy"), Orezo, Zifr, Nobody HQ, Autopreneur.
- Domains (Oct 21 2026): **unstaffd.com, unstaffd.ai, unstaffd.app, unstaffd.co all available**. Spelled "unstaffed": .com and .ai taken (unstaffed.app free).
- Plan: **unstaffd.com** = main site/app; **unstaffd.app** = tenant previews (`<slug>.unstaffd.app`); unstaffd.ai + unstaffd.co = protection, redirect to .com.

### USPTO knockout search: UNSTAFFD (Oct 21 2026, USPTO Trademark Search database, live + dead records)
| Query | Result |
|---|---|
| UNSTAFFD, UNSTAFFED, UNSTAFF, UNSTAFF*, UN STAFFED, UNSTAFD | **0 records** |
| NOSTAFF, ZERO STAFF, STAFFLESS | **0 records** |
| NO STAFF | only unrelated "STAFF" marks (sporting goods, tableware, old software filings) |
Reading: no conflicting mark. **Risk to manage: descriptiveness.** "Unstaffed" describes the service (a business run without staff), and USPTO treats a misspelling ("Unstaffd") like the real word. An application may be refused as merely descriptive (Section 2(e)(1)). Options: argue it is suggestive; file with a stylized logo; register on the Supplemental Register first and move to the Principal Register after 5 years of use. The brand can be used either way: no one else owns it.
Next: buy all four domains now; have a trademark attorney decide the filing strategy (classes 9, 35, 42, owner Masar AI Inc.).

## Build and accounts
- Build: **Codex** builds Unstaffd in its own private repo `unstaffd` (package in `platform/codex/`).
- Meta: reuse the existing verified Meta business; create a **separate Unstaffd business portfolio + developer app** (Mode 1 customer ad accounts isolated from Masar's own ads).
- Google Ads: reuse the existing manager account + developer token (check access level; update the API Center tool description for Unstaffd; create a Unstaffd sub-manager for client accounts).

## Trucking product rename (Masar OS -> American name), Oct 21 2026
USPTO: 0 records for each. Domains: .com taken for all.
| Name | Free domains found | Note |
|---|---|---|
| **HaulCrew** (recommended) | haulcrew.ai | "Your AI crew that runs the hauling business"; sister product under Masar AI |
| FreightCrew | freightcrew.ai, freightcrew.app | Broader logistics (brokers, 3PL) |
| RigCrew | rigcrew.app | Very trucker-native ("rig") |
| LoadCrew | loadcrew.app | Load-centric |
| Haulzero | haulzero.ai | "Zero back-office staff"; may read as "zero hauls" |
| HaulStack | haulstack.app | Software-y |
Company stays **Masar AI**; product renamed. Rename touches `src/config/brand.ts`, domains, emails, Stripe descriptor, Google OAuth consent screen (re-review), Vapi assistant name, and the in-app AI persona name ("Masar").

## Not adopted (legal)
- Fabricated testimonials/reviews: banned by the FTC rule (up to $51,744 per violation) and ad platform policies, and a risk to our shared ad accounts. Replaced by real-review collection and disclosed creator content.

## Open
1. ~~Platform name~~ DECIDED: **Unstaffd**. Main domain unstaffd.com; tenant previews on unstaffd.app (separate domain isolates user sites from our app).
2. **Hosting picks** in `01_INFRASTRUCTURE.md` §1: approve, or change any row (biggest ones: Supabase, Cloudflare, Trigger.dev, Next.js renderer).
3. **Dashboard build method**: Lovable (like Masar) vs Claude Code/Codex in the monorepo vs both.
4. **Trial model**: 7-day trial with card, or no trial + first-week money-back guarantee.
5. **Tier prices and credits** (draft in master spec §12): approve as starting point?
6. **Revenue share %** (3%, 4% or 5%) and **ad management fee %** (10-15%).
7. **First niche pack** after Masar: plumbers/HVAC, dentists, or other.
8. **Contest**: season length (90 days proposed), grant pool % (3-5%), guaranteed minimum $.
9. **Creator API provider**: Modash vs influencers.club vs Upfluence.
10. **Build tools**: Claude Code Max 20x + Codex as reviewer; keep or drop Lovable.
12. **Public metrics page**: which numbers are public from day one.
