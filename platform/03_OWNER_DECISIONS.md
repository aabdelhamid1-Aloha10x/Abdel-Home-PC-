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
- Legal entity: **Masar AI LLC (Delaware)**, existing EIN, bank and Stripe account. Platform runs as a product/DBA of Masar AI LLC for now. If raising VC later, form or convert to a Delaware C-corp (investors expect one).
- Google OAuth verification: **skipped at launch.** No Gmail (SES + Cloudflare inbox), built-in booking calendar instead of Google Calendar sync, Google Ads run from our own MCC (Mode 1, only our account authorizes), YouTube build-in-public on our own channel. Verify later only if we add Google Calendar sync, Business Profile management or posting to users' YouTube channels (and when > 100 users connect them).

## Name finalists: **Crewzero** (one word) vs Autopreneur
- crewzero.ai, crewzero.app, crewzero.co available (Oct 21 2026); crewzero.com registered at GoDaddy since 2015 (expires 2027-01-15).
- autopreneur.com/.ai/.app/.co all taken; the word is also widely used by others (books, courses), so weak as a trademark.
- Recommendation: **Crewzero**.

## Earlier name shortlist (Oct 21 2026, .com checked via Verisign RDAP; .ai checks partly rate-limited)
| Name | Meaning | Domain status |
|---|---|---|
| **CrewZero** (recommended) | A full crew, zero employees | crewzero.ai available; getcrewzero.com available; crewzero.com taken |
| Opernaut | Operator + astronaut | getopernaut.com, opernauthq.com available; .com taken |
| Autopreneur | Autopilot + entrepreneur | getautopreneur.com, autopreneurhq.com available; .com taken |
| Bizgent | Business + agent | bizgent.ai available; getbizgent.com available |
| Runtly | It runs your company | getruntly.com available; .com taken |
| Helmwise | At the helm, wise coach | gethelmwise.com available; .com taken |
| Tadbir (تدبير) | Managing / running affairs | gettadbir.com, tadbirhq.com available; .com and .ai taken |
| Rawaj (رواج) | Market demand, things selling | getrawaj.com available; .com taken |
| Bidaya (بداية) | Beginning | getbidaya.com available; .com taken |
| Nahda (نهضة) | Rise, renaissance | getnahda.com available; .com taken |
Re-check availability at purchase time (GoDaddy) and run a trademark search on the final pick (for our own brand).

## Not adopted (legal)
- Fabricated testimonials/reviews: banned by the FTC rule (up to $51,744 per violation) and ad platform policies, and a risk to our shared ad accounts. Replaced by real-review collection and disclosed creator content.

## Open
1. **Platform name + domain.** (Goes into `src/config/brand.ts` only.)
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
