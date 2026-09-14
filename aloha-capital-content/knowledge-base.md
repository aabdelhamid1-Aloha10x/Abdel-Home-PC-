# Aloha Capital (Aloha10x) — Knowledge Base

**Source of truth: the Aloha Capital OS MCP connector** (`list_projects`,
`list_underwriting_deals`, `my_portfolio`, `my_distributions`), confirmed
live/real by Abdel on 2026-09-14. This replaces an earlier version of this
file that was built from public web search and described the wrong
company — see "Correction" below.

## ⚠️ Revision history on this file — read before quoting anything

- **Draft 1** (web search only) found `alohaprivatelending.com` ("Aloha
  Private Lending" / "Aloha LTD Income Fund," Boulder CO — first-lien note
  lending, 10–13% fixed returns, $25K note minimum / $50K fund minimum) and
  assumed it was this company on name match alone.
- **Draft 2** (after connecting Aloha Capital OS) found real project-level
  data — Lily Plaza, Franklin Produce, etc. — with large total-return
  multiples (293%–400%) and initially concluded Draft 1 was a *different,
  unrelated company*, since a pure note-lending fund and a value-add
  development shop looked incompatible.
- **This draft (confirmed directly by Abdel)**: it's one company with
  **two tranches under a single PPM** — a debt/note tranche (matches the
  shape of what Draft 1 found) and an equity/profit-participation tranche
  for larger checks (matches the project-level upside Draft 2 found). See
  below. **The specific numbers from Draft 1 (10–13%, $25K/$50K minimums)
  are still unverified against the actual current PPM** — treat them as a
  plausible starting point for the debt tranche, not confirmed fact, until
  someone with the PPM confirms current terms.

## What Aloha Capital (Aloha10x) actually does

Acquires underperforming, raw, or off-market **commercial** real estate —
retail strip centers, industrial/cold storage, office, mixed-use, and
ground-up retail development — and repositions or develops each asset to a
materially higher value, then exits (sale or stabilized hold) over a
multi-year period.

## Two ways investors participate (per the PPM, confirmed by Abdel 2026-09-14)

1. **Debt investment (promissory note)** — the investor buys a real estate
   note and receives a **fixed return**. This is the income/capital-
   preservation-oriented tranche. *Exact current rate and minimum need
   confirmation against the live PPM* — Draft 1's web research suggested a
   fixed range around 10–13% with a note minimum around $25K, but do not
   put a specific number in a script until it's confirmed.
2. **Profit participation (equity upside)** — investors committing **over
   $500,000** get profit participation in the deal itself, i.e. a share of
   the actual project-level upside — this is what the `list_projects`
   figures below represent (the 293%–400% total-return multiples on Lily
   Plaza, Franklin Produce, etc. are the kind of outcome a profit-
   participation investor is exposed to, not a fixed-note investor).

This "two ways in" structure is a strong content hook on its own — a fixed,
predictable note return for one audience, and direct participation in
outsized project upside for larger investors — and should be the
throughline of the brand-explainer concept (see `video-concepts/`).

## Live project data (from `list_projects`, 2026-09-14)

These are the underlying deals a **profit-participation** ($500K+)
investor's return is tied to — not what a fixed-note investor earns.

| Project | Location | Asset type | Status | Purchase price | ARV / exit | Projected profit | Hold | Projected ROI* |
|---|---|---|---|---|---|---|---|---|
| Lily Plaza | Millville, NJ | Retail strip center (NNN) | Stabilized | $550,000 | $2,363,077 | $1,763,077 | 5 yrs | 293.85% |
| Franklin Produce | Franklinville, NJ | Industrial cold storage (NNN) | Stabilized | $700,000 | $5,500,000 | $4,400,000 | 5 yrs | 400% |
| 3 Waterside Crossing | Windsor, CT | Office repositioning | **Sold** | $1,800,000 | $3,000,000 (actual sale) | $1,000,000 (realized) | 5 yrs | 55.56% |
| Williamsburg VA — Highway Retail Development | Williamsburg, VA | Commercial land / retail development | Acquired | — | $2,307,692 | — | 5 yrs | — |
| Baltimore MD — Light Street | Baltimore, MD | Mixed-use retail development | Acquired | $2,100,000 | $7,142,000 | $3,142,000 | 3 yrs | 78.55% (current NOI: $170,000) |

\* **"Projected ROI" is total return over the full hold period, NOT an
annual/annualized rate.** 293.85% over 5 years is not "293.85% a year" —
conflating the two is a serious, easy-to-make compliance error. See the
guardrail below. **3 Waterside Crossing is the one realized, closed deal**
(sold, not projected) — it's the strongest, lowest-risk proof point for
content because the numbers are actuals, not a forecast.

## ⚠️ Compliance guardrail — read before writing or recording anything

0. **Never blur the two tranches together.** The fixed debt/note return
   and the project-level profit-participation upside are different
   products with different risk, different minimums ($500K+ threshold for
   participation), and different investor profiles. A script that shows a
   400% project multiple must be clear that's the profit-participation
   outcome, not what a note holder earns.
1. **Never state a total-hold-period ROI as if it were an annual return.**
   "400% ROI" must always be paired with its hold period ("...over a
   projected 5-year hold") in the same breath/on-screen text, not just in
   fine print.
2. **Projected ≠ realized.** Every project except 3 Waterside Crossing is
   "Stabilized" or "Acquired" with a *projected* (not realized) exit value.
   Any script using those numbers must say "projected" / "targeted," not
   state them as guaranteed or achieved fact.
3. **This is a real capital raise for real assets.** Unlike generic
   educational content, this is offering-adjacent material for a pooled
   fund. Before anything publishes: confirm with whoever handles Aloha10x's
   compliance/legal (a) whether the intended audience/platform requires
   accredited-investor gating, (b) required disclosures/disclaimers, and
   (c) that specific project figures are cleared for public use (some
   sponsors keep individual deal economics confidential even after
   marketing the fund generally).
4. **`my_portfolio` / `my_distributions` returned empty** for Abdel's
   account — no personal investor subscription/distribution history exists
   to reference yet. The realized-numbers proof story should use 3
   Waterside Crossing (the fund's own closed deal), not a personal
   investor's numbers.

## Underwriting pipeline (internal, not for public content)

`list_underwriting_deals` exists for staff BRRRR/acquisition underwriting
and shows deals in draft/in-review before they become live projects — this
is internal pipeline data, not something to reference in marketing until a
deal is confirmed, closed, and cleared (same as any project above).
