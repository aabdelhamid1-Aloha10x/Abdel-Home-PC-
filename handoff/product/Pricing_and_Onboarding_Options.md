# Pricing, Onboarding & "Different TMS" Options — brainstorm + research
Date 2026-10-10. Built on research_pricing_variations.md, research_edi_tracking.md, research_onboarding_economics.md (full notes + URLs there). Labels: [V] vendor page/primary read this session · [3P] third-party/summary · [U] stated by Abdel · [H] my hypothesis. The research was a single standard pass per topic; nothing here is final.

## 1. What the market actually charges (SMB-facing)
| Vendor | Pricing | Trial | Source |
|---|---|---|---|
| TruckLogics | $39.95 (1–2 trucks) / $79.95 (3–7) / $199.96 (8–14) / $249.95 (15–24); 25+ quote; yearly 10% off | 7 days | [V] |
| TruckingOffice | Basic $25 / $55 / $90 (1–2 / 3–7 / 8+ trucks); Pro $35 / $75 / $130; no per-user fees, no contract | 30 days, no card | [V] |
| Rigbooks | $19 / $29 / $49 / $149 (small fleet, 5 trucks) + $19–29 per extra truck | 30 days, no card, refund guarantee | [V] |
| Truckbase | from $290/mo billed annually, free onboarding | not published | [V] |
| Alvys | "Foundations" $3.95 per load, no per-truck fee, no setup fee mentioned | "try for free" | [V] — **conflicts with your ~$1,500/mo, setup-fee, sales-led experience** (likely a different tier/contract; which did you have?) |
| Fleetio (maintenance) | $4 / $7 / $10 per vehicle | 14 days, no card | [3P] |
| Tailwind | $99 / $149 / $199 per user (older review $135–$265) | 30 days (disputed) | [3P] |
| Rose Rocket | from ~$2,080/mo, unlimited users, ~90-day implementation | — | [3P] |
| Revenova | from ~$2,500/mo | — | [3P] |
| Axon | ~$65/user; $25k+ implementation anecdotes | — | [3P] |
| McLeod / Trimble / Descartes | quote only | — | no public price |
Take-away: the "cheap and simple" end ($19–$250/mo) already gives **30 days free with no card** and flat prices by fleet size. The "enterprise" end ($2k+ and months of implementation) is exactly what you described. **Nobody in the sample sits in the middle with automation.** A 7-day trial would be *shorter* than TruckingOffice and Rigbooks.

## 2. Trial/free evidence (self-reported benchmarks, indicative only) [3P]
Conversion "good / great": no-card trial 4–6% / 10–15% · card-required trial 25–35% / 50–60% · freemium 3–5% / 8–12% · reverse trial 4–6% / 8–12% (small sample). Per 1,000 visitors: freemium ≈ 5 paying, no-card trial ≈ 3.6, card trial ≈ 10.5. 14 days is the most common trial. No time-to-value or SMB-trucking data. **Card-required trials convert better per trial but get fewer sign-ups; for low-tech SMB owners, trust and speed matter more than the trial length itself.**
Only ~33% of carriers under 10 trucks (and ~7% of single-truck owner-operators) were reported to use any TMS (old survey) → many prospects are on spreadsheets/paper, not switching from a competitor. [3P]

## 3. Brainstorm: make switching feel effortless
Ideas, ordered by how much input they remove:
1. **Connect, don't type.** Signup asks for four connections instead of a form: forward-to inbox or Gmail/Outlook (rate-cons → loads), ELD (trucks/drivers/miles), fuel card (EFS/WEX/Comdata statement), QuickBooks. First value within ~10 minutes. (Samsara documents APIs for odometer, IFTA mileage and fuel-card purchases [V]; broader coverage via a unified connector such as Terminal [3P].)
2. **"Your real cost per mile" in 10 minutes** as the hook. Existing tools estimate (e.g., TruckLogics uses MPG and fuel price [V]) or need manual entry; I found none that computes actual profit per load from ingested receipts + ELD miles + bank feeds (one search, so unproven). ATRI 2026: industry average **$2.336/mile** (2025 data; fuel ~$0.48, driver wages $0.82 / $1.03 with benefits, truck+trailer ~$0.40, insurance ~$0.11), truckload margin **0.4%** [3P, fleet average incl. employee drivers; repair figure disputed]. Show the carrier's own numbers next to the benchmark.
3. **Past data in, no double entry.** Import 12 months of loads/invoices from the old TMS, spreadsheets, QuickBooks; AI reads a pile of PDFs/photos.
4. **Parallel run.** Both systems for a few weeks; the new one only reads (email/ELD/fuel) so nothing is lost.
5. **Driver adoption by text link** (no app install first) and a phone-first owner-operator mode. [H]
6. **"Works with your factor"** via configurable packets/portal/CSV — no waiting for a vendor to approve an integration (your Treadstone problem [U]).
7. **Human help optional and paid, not mandatory.** Self-serve by default; "concierge migration" as an add-on for fleets that want it.
8. **Time-to-first-value promise:** "First load in 10 minutes or we'll do it for you."

## 4. Pricing & trial designs to choose from (price points are test hypotheses [H])
| | Design | Free/low barrier | Moving metric | Best for | Risks |
|---|---|---|---|---|---|
| A | **Free forever core** — 1–2 trucks free (cap on AI document parses/month, 1 tracking link), upgrade for automation | Strongest | trucks + credits | owner-operators; viral/community growth | free users cost money (est. ~$1–3/mo each in AI/storage/email [H]); needs a real upgrade trigger |
| B | **14–30 day no-card trial → per ACTIVE truck**, e.g. $19 tapering to $12, unlimited users | Strong | active trucks (a truck that ran that month) | small–mid fleets | idle trucks don't pay; match 30-day trial of incumbents |
| C | **Hybrid base + modules**, e.g. $49 base ≤5 trucks +$9/extra truck; modules $19–$99 (Tracking, Shop, Compliance, Recruiting, Reports) | Medium | trucks + modules switched on | mid fleets with departments | more complex to explain |
| D | **Subsidised by embedded finance** — $0 if carrier uses partner factoring/fuel/pay, else ~$39/truck | Strongest | none for partners | owner-operators with a factor | conflicts of interest; you may repeat the "approved partners only" problem you hated [U]; rev-share terms not public |
| E | **Reverse trial + billing cap** — full product 14 days, then downgrade to free core unless upgraded; "bill never exceeds $X" guarantee | Strong | trucks + usage, capped | everyone | downgrade UX effort |
| F | **Credits wallet** for automations/AI docs on top of any of the above | — | credits | heavy AI users | confusing as the only meter |
Documented embedded-finance precedents [3P]: Love's gave AscendTMS free to its factoring customers; Axle gives a year of Ascend free with funding; Trucker Path earned flat per-load factoring commissions (2017); TriumphPay earns ~1.9% interchange on LoadPay debit and ~$35 per small-carrier invoice. Published rev-share terms for TMS-to-factor/fuel/insurance: **not found**.

## 5. My recommended shape (to react to, not final)
**"Free to connect, pay when it runs the business."**
- **Free tier (A):** 1–2 trucks, the **Profit Engine** (cost per mile/break-even/profit per load from connected email+fuel+ELD+QuickBooks, with a monthly cap on AI document parses), document vault, expiry reminders, 1 tracking link at a time. This is the hook and costs us pennies.
- **Reverse trial (E):** every new account gets the full product free for 14 days (30 if they connect ≥2 data sources — rewards the behaviour that creates value), then either subscribes or drops to the free tier. No card for the free tier; card only to continue paid features.
- **Paid (B + C):** price per **active truck** (a truck that moved a load/mile in the month), unlimited users, tapering with fleet size, plus **modules** for departmental fleets (Shop & Maintenance, Safety & Compliance incl. DQ file, Recruiting & Onboarding, Advanced Tracking/EDI, Reports builder) and a **credits wallet** (F) for AI documents/SMS/automation runs above the bundle.
- **No setup fee**; optional paid concierge migration.
- **Embedded finance (D) as an optional later partner program**, never a requirement, to avoid recreating the lock-in you had.
Why this fits your goals: lowest barrier (free tier + connect-don't-type), a metric that moves with real usage (active trucks, modules, credits) without a per-load meter, and a clear gap vs. the market (30-day-free cheap tools have no automation; $2k+ tools need months).

## 6. Tracking and EDI (differentiators) [research_edi_tracking.md]
- Brokers already accept carrier tracking four ways (C.H. Robinson: ELD link, free API, EDI, SMS link) [V]; project44 is free for carriers [V]. So **tracking links + ELD connections unlock freight earlier than EDI**.
- Staging: (1) phone-GPS tracking link; (2) Samsara/Motive via direct OAuth or a unified connector (Samsara partner form can take ~7 business days [V]); (3) push tracking to broker platforms; (4) **EDI pilot with 1–2 named partners** through a vendor that allows many carriers on one platform (confirm in writing: separate ISA ID per carrier; Orderful's per-partner flat fee and Stedi's reported ~$500/mo minimum are third-party figures); (5) scale later. EDI is built per trading partner (each has its own spec); "few TMSs offer EDI" is unverified.
- Open question for you: which brokers/shippers send or require EDI to your carriers today?

## 7. Product backlog notes from your feedback
- **Chat:** it didn't work → fix and relaunch as part of Safety/Comms; decide scope (dispatcher↔driver↔shop).
- **Compliance documents:** build properly — DQ file items per 49 CFR 391.51 (application, initial/annual MVR, road test certificate, annual review, medical certificate and National Registry verification, variances; retention = employment + 3 years) [V]; plus insurance, registrations, IFTA/IRP/UCR/MCS-150 reminders (primary sources not yet verified).
- **Bonuses:** restructure as **timed programs** (weekly/monthly/quarter windows, targets, auto-calculation and payout into settlements). Needs a short spec with you.
- **Accounting "profit engine":** automatic ingestion (rate-cons, maintenance invoices, fuel, driver pay, ELD miles) → per load/mile/truck economics and break-even. Needs a clean cost model (fixed vs variable) per carrier.

## 8. Questions for you
1. Which Alvys plan/contract did you have ($1,500/mo, setup fee)? Their published Foundations plan is $3.95/load.
2. Free tier or reverse trial — are you comfortable giving the Profit Engine away free (1–2 trucks)?
3. Would you ever accept a factoring/fuel partner revenue share, as an option? Or strictly software revenue?
4. What was the single most painful step when you moved onto Alvys?
5. Which brokers/shippers ask your carriers for EDI or tracking links?
6. Should paid price follow active trucks, or fleet-size bands like TruckingOffice/TruckLogics (simpler to explain)?
