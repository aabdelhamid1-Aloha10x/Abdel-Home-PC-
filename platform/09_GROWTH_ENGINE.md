# Growth engine: client acquisition and lead generation for Unstaffd and Masar OS, on autopilot

Status: PLAN v1 for owner review. Date: 2026-10-30. Owner: Abdel Hamid (Masar AI Inc.).
Companion: the daily dashboard ("Growth Command Center", claude.ai artifact) and `05_LAUNCH_GTM_FUNDRAISING.md`, `07_TOOL_HUB_AND_CAPITAL_ENGINE.md`, `lovable-build/marketing/SEO_PLAN.md`.

---

## 0. The short version

- The LinkedIn post ("40 APIs that turn your Claude into a lead generation machine", Ruben Davoli, Oct 29 2026) is a good **taxonomy** and a bad **plan**. Its one useful instruction is the last line: pick one tool per category. Everything else (who to target, what to offer, in what order, what is legal, how you know it works) is missing. This document fills that in for our two products.
- We run **one engine, two products**. Same stack, same CRM, same dashboard. Masar OS is B2B and outbound-friendly. Unstaffd is mostly inbound and content-led, with B2B outbound only toward partners, creators and running local businesses.
- **Stack (one per category, mostly already connected):** Clay (data + enrichment + verification hub), FMCSA public data (Masar's unfair data advantage, free), Apify (scraping and social signals), RB2B (website visitor identification), Instantly (cold email), manual-assist queue for LinkedIn (no automation on the personal account), HeyGen (personal video), Vapi + ElevenLabs (voice, inbound and consented follow-up only), Make (glue), GoHighLevel (CRM, pipelines, calendar, SMS, email nurture; already used for Aloha Growth), Blotato (posting + comment-to-DM automations), Meta Ads (Unstaffd Ads account is active). Claude is the brain: scoring, personalization, reply triage, content, daily brief.
- **Daily loop:** agents run overnight; at 6:30 am ET the dashboard and a written brief are ready; you spend 20 minutes: read, decide three things, clear the human queue (LinkedIn sends, flagged replies, ad approvals). Nothing else needs you.
- **90-day targets (first pass, to be replaced by real data after 30 days):** Masar: 20 demos and 8 paying fleets per month by day 90. Unstaffd: 3,000 waitlist, 300 founding members and a launch-ready creator and affiliate bench by day 90.

---

## 1. Review of the post

Source: https://www.linkedin.com/posts/ruben-davoli_40-apis-that-turn-your-claude-into-a-lead-share-7521624464921526272-dFcP/ (780 reactions, 115 comments at the time of reading).

### What it says
Eleven categories, forty tools, "Claude is the brain, the tools are the hands":

| Category | Tools named |
|---|---|
| Data | Apollo.io, Prospeo, AI Ark, Ocean.io, People Data Labs, Crunchbase |
| Enrichment | Clay, Hunter.io, Findymail, LeadMagic, FullEnrich |
| Verification | ZeroBounce, MillionVerifier |
| Scraping | Apify, Firecrawl, PhantomBuster, Bright Data, Exa |
| Buying signals | RB2B, TheirStack, Trigify.io, Common Room |
| Cold email | Instantly.ai, Smartlead, lemlist |
| LinkedIn | HeyReach, Expandi, Unipile |
| AI video | Sendr, HeyGen, Tavus |
| AI voice | Vapi, ElevenLabs |
| Automation | n8n, Make, Zapier |
| CRM and booking | HubSpot, Attio, Calendly, Cal.com |

### What is right
1. The categories are the real pipeline: find, enrich, verify, detect intent, touch (email / LinkedIn / video / voice), orchestrate, track.
2. "Pick one per category." Every extra tool is another API key, rate limit, billing line and failure point (the top comment, by Saim Ahmed Qazi, says exactly this about chaining Apollo, Clay and Firecrawl).
3. Claude as the layer that decides and writes, with tools as hands. That is the Unstaffd architecture already (`07_TOOL_HUB_AND_CAPITAL_ENGINE.md`).

### What is missing or wrong (and what we do instead)
| Gap in the post | Why it matters | Our answer |
|---|---|---|
| No ICP, no offer, no sequencing | Tools do not generate leads; an offer to the right list does | Section 2: ICPs and offers per product, written before any tool is touched |
| Everything is outbound | Outbound is 1 of 6 engines. For Unstaffd (prosumer + SMB) inbound and content win; for Masar outbound is strong but still only half | Section 3: six engines, with the mix per product |
| No inbound capture (forms, lead ads, free tools), no reviews/listings, no community, no attribution | These are where most SaaS leads come from | Included as engines, with the dashboard tracking source per lead |
| LinkedIn automation (HeyReach, Expandi) | These violate LinkedIn's terms; the account you post from daily is your biggest asset and can be restricted | Manual-assist queue: Claude drafts, you send 15 a day in 15 minutes. Official API only where allowed (same rule already in the tool hub doc) |
| Voice agents listed as an outreach tool | AI voice calls to people who did not consent are a TCPA problem (FCC Feb 2024 ruling) | Voice is inbound, speed-to-lead after a form, and follow-up after a reply only |
| No lawful basis / consent note | A commenter (Klaus Schwarzkopf) raised GDPR/PECR; US still has CAN-SPAM, TCPA, state bot-disclosure laws | Section 8: guardrails enforced in the flows, not in a memo |
| No "what happens after the reply" | Another commenter noted missed follow-ups lose more leads than missing data | Speed-to-lead and follow-up until buy-or-opt-out are the shared backbone (Section 4) |
| No measurement | Forty tools, zero dashboards | The Growth Command Center, reviewed daily |

Commenters also pushed single-tool alternatives (Deepline, OutReign, Bloomberry, ColdIQ). We ignore them for now: untested, and we already own the pieces.

---

## 2. Who we sell to and what we say

### Masar OS (trucking back office on autopilot)
| | |
|---|---|
| ICP A: owner-operator / 1-3 trucks | New or recent authority (0-24 months), runs on spreadsheets, phone and a factoring portal. Pain: paperwork at night, IFTA, settlements, chasing paperwork. Buys Solo/Core. Reached by content, free tools, FB groups, creators, Meta ads. **Not** cold email (low open rates, tiny budgets). |
| ICP B: small fleet 4-25 trucks (the money) | Has a dispatcher or an office person, often family. Pain: dispatcher cost, driver paperwork, settlements, compliance, no visibility. Buys Growth/Scale. Reached by **cold email + LinkedIn + voice follow-up**, plus everything above. |
| ICP C: dispatch services (5-50 carriers each) | They are a distribution channel: one dispatcher brings many carriers. Partner/affiliate offer. |
| Offer | "Your back office on autopilot. We move your loads, drivers and documents in for you. 14-day trial." Outcome language: hours saved per week, settlements done the same day, IFTA ready. Published prices stay a weapon (competitors hide theirs). |
| Lead magnets | Cost-per-mile calculator, load profit checker, IFTA estimator, settlement template, "new authority 90-day checklist" (all planned in `SEO_PLAN.md`; the app already has the logic). |
| Data advantage | **FMCSA Motor Carrier Census** (public, free, updated monthly): every carrier with MC/DOT, power units, drivers, state, phone, email (where filed), authority date. Filter 3-25 power units + authority granted in the last 36 months = the exact ICP B list. Nobody in the post has this. Clay enriches the decision-maker and verifies the email. |

### Unstaffd (AI agents run the whole company)
| | |
|---|---|
| ICP 1: idea-stage founders / side-hustlers | Want a business, scared of the work. Reached by content, free idea score, creators, Meta ads, Product Hunt. Never cold outreach (B2C, no lawful basis, wrong economics). |
| ICP 2: running local businesses | Plumbers, dentists, daycares, grocers, law offices. Pain: leads, follow-up, reviews. Reached by **B2B cold email** ("free 2-minute audit of your online presence"), local Meta ads, click-to-message. Google Maps data via Apify, enriched in Clay. |
| ICP 3: Polsia churners and the disappointed | Polsia churns ~50% in month 1 and 2 (platform/00_MASTER_SPEC.md §2). They are warm, educated and angry. Reached by public comparison pages, honest replies in threads, retargeting. No scraped-DM spam. |
| ICP 4: partners (agencies, creators, newsletter writers, YouTubers) | They bring hundreds of users each. **B2B outbound is appropriate here.** Offer: 30% recurring affiliate, early access, co-marketing, creator partnership ads paid by us. |
| Offer (pre-launch) | Free idea validation score in 60 seconds, then the waitlist. Founding member: first 500 get bonus credits for life and a founder badge. Post-launch: free plan and preview before paying; "First Win in 14 Days". |
| Message | Honest autopilot with a coach that pushes back. Never "do nothing while you sleep" (Polsia's churn driver and an FTC risk). |

---

## 3. The six engines and the mix per product

| # | Engine | Masar | Unstaffd | Automation level |
|---|---|---|---|---|
| E1 | **Outbound email** (B2B): list → enrich → verify → Instantly sequence → reply triage → CRM | Primary for ICP B and C | Only ICP 2 (local businesses) and ICP 4 (partners) | 95% automated; you only read flagged replies |
| E2 | **Content and comment-to-DM**: build-in-public posts on all connected accounts → "comment KEYWORD" → Blotato DM automation → link / qualification → CRM | Trucking content from the A&H story, "AI finished my TMS" episodes | The main engine: daily agent clips, idea-score cards, Masar episodes | 90% automated: you record raw video twice a week; agents clip, caption, schedule, DM |
| E3 | **Free tools and SEO**: calculators, comparison pages, alternative pages → email capture → nurture | IFTA, cost per mile, load profit, settlement template, "TruckingOffice alternative" | Idea score, "Polsia alternative", "[niche] marketing automation" pages, business plan generator | 100% automated after build |
| E4 | **Paid**: Meta lead forms + click-to-message, retargeting, YouTube pre-roll on trucking channels, creator partnership ads | Owner-operator lead ads to the calculator; retarget site visitors | Waitlist ads, 20-50 creative variants per week (Polsia's tactic, honest copy), creator partnership ads | 85% automated: agents build and rotate creatives, you approve budget changes above a threshold |
| E5 | **Creators and affiliates**: find → score → outreach → deal → tracking link → payout | Trucking YouTube/TikTok/LinkedIn creators, dispatch-service owners, trucking newsletters | AI, side-hustle, small-business creators; agencies; newsletter writers | 80% automated: outreach and tracking automated, deal terms you approve once per creator |
| E6 | **Speed-to-lead and follow-up** (shared backbone): any new lead → text or call inside 60 seconds (consent on the form) → qualify → book → remind → follow up until buy or opt out | Demo booking and trial activation | Waitlist to founding member; post-launch activation | 100% automated; handoff to you only for enterprise or "talk to the founder" |

### Why this mix
- Masar's buyer is a business with a phone number and a public record. Outbound converts. Unstaffd's main buyer is a person with a dream; they are reached by content and proof, and the law is on that side too.
- Both products get a free tool at the top of the funnel because a working calculator or score is proof, is shareable, and costs nothing per lead.
- E6 is where most companies lose: the post's commenters said it, Masar's own niche research says it (buyers complain about slow follow-up from TMS vendors).

---

## 4. The stack, one tool per category, and what Claude does in each

| Category (post) | Our pick | Why this one | Already connected? |
|---|---|---|---|
| Data | **FMCSA census** (Masar) + **Apollo API inside Clay** (people at fleets, agencies, creators' businesses) + **Google Maps via Apify** (local businesses for Unstaffd) | Free public ground truth for trucking; Apollo for titles and emails; Maps for local SMBs | FMCSA: download. Apollo: add to Clay. Apify: account needed |
| Enrichment | **Clay** (waterfall: Apollo → Prospeo → Findymail → LeadMagic) | One table per ICP, one waterfall, built-in verification, Claude scoring column. Already paid for | Yes (workspace "Aloha Capital") |
| Verification | **Clay's built-in** first; **MillionVerifier** API as the final gate before Instantly | Cheapest at volume; bounces below 2% protect domains | Add |
| Scraping | **Apify** | One account, actors for Google Maps, LinkedIn posts/commenters, Facebook group posts, YouTube comments, Trustpilot. Replaces Firecrawl, PhantomBuster, Bright Data for our needs | Add (~$49/mo) |
| Buying signals | **RB2B** on both websites (identifies US visitors at company level, pushes to CRM) + **Apify social signals** (people commenting on Polsia, TruckingOffice, "need a dispatcher", "starting my authority") | Website intent is the highest-value signal we can get for free; social signals feed E2 replies, not cold DMs | Add (free tier) |
| Cold email | **Instantly** (API, warm-up, inbox rotation, unified reply inbox) | Simpler API than Smartlead, good enough at our volume. 3 secondary domains per product, 3 inboxes each | Add (~$97/mo + domains + Google Workspace inboxes) |
| LinkedIn | **Manual-assist queue** (Claude drafts into GoHighLevel tasks; you send). No HeyReach/Expandi on the personal account. Company-page posting through Blotato | Account safety. Your personal profile is the build-in-public channel | Yes (Blotato has the personal account + 4 company pages) |
| AI video | **HeyGen** (via HyperFrames, already connected) for 30-second personalized videos to the top 10% of Masar fleets and every creator/agency prospect | Already connected; personal video roughly doubles reply rate on top accounts | Yes |
| AI voice | **Vapi + ElevenLabs** (already in Masar) | Inbound demo line, speed-to-lead callback after a form, follow-up after a positive email reply. Never cold | Yes |
| Automation | **Make** (already connected, MCP available so Claude can build and fix scenarios) | Glue between Clay, Instantly, GHL, Blotato, Meta, Sheets/Supabase. n8n later if volume justifies self-hosting | Yes |
| CRM and booking | **GoHighLevel** (sub-account per product) | Already used for Aloha Growth; pipelines, calendars, SMS, email nurture, forms, A2P 10DLC, workflows. Replaces HubSpot + Calendly + a nurture tool | Yes (existing account) |
| Posting and DMs | **Blotato** (not in the post; our E2 needs it) | All 12 connected accounts in one API, plus IG/FB comment-to-DM automations | Yes |
| Ads | **Meta Ads API** (Unstaffd Ads account 963958406477771 is active; Masar runs from its own account under Masar's portfolio) | MCP connected; agents can create, read and rotate | Yes |
| Dashboard | **Growth Command Center** (claude.ai dashboard artifact) fed from a single `growth_daily` table | One page, reviewed daily | Built in this session (v1 on seeded targets) |

### What Claude does (the brain)
1. **ICP scoring**: every row in Clay gets a 0-100 fit score with a one-line reason (fleet size, authority age, state, website signals; for local businesses: reviews count, missing website, no booking link).
2. **Personalization**: first line and P.S. from real data (their lanes, their Google reviews, their last post). No fake flattery.
3. **Reply triage**: every Instantly/GHL reply is classified (interested, question, not now, wrong person, unsubscribe, angry) and routed; "interested" triggers E6 within 60 seconds.
4. **Content**: clips and captions from your raw recordings; idea-score cards; weekly comparison page refreshes; ad variants (20-50 per week) with a compliance check.
5. **Daily brief**: what moved, what broke, three decisions for you, the human queue.
6. **Anomaly flags**: bounce rate above 2%, reply rate under 1% on a sequence, CPL up 40% week over week, inbox warm-up failures, ad account issues (two of your ad accounts are already flagged "unsettled"; the brief would have caught that).

---

## 5. The flows (what gets built in Make, Clay, Instantly and GHL)

### F1. Masar fleet outbound (E1)
```
FMCSA census (monthly CSV) → filter: 3-25 power units, authority ≤ 36 months, US states in scope
  → Clay table "Masar fleets": find decision maker (Apollo), email waterfall, phone, website, Claude score + first line
  → MillionVerifier gate (valid only) → Instantly campaign by segment (new authority / 4-10 trucks / 11-25 trucks)
  → 4-step sequence over 14 days: value email, calculator link, 30-sec HeyGen video (top 10%), breakup
  → reply webhook → Claude triage → GHL contact + pipeline stage
  → "interested" → Vapi callback inside 60 s (business hours) or SMS with booking link → demo calendar
  → no reply after 14 days → nurture list (monthly content email) → re-sequence in 90 days
```
Volume at launch: 3 domains x 3 inboxes x 30 sends/day = 270 sends/day, ~5,400/month. Planning assumptions: 50% open, 3-5% reply, 1-1.5% positive → 55-80 positive replies/month → 20-30 demos → 6-10 paid. Replace with real numbers after 30 days.

### F2. Unstaffd local-business outbound (E1, ICP 2)
```
Apify Google Maps scrape (city x category: plumbers, HVAC, dentists, daycares, law offices)
  → Clay: owner name, email, review count, website quality, has booking?, Claude score
  → Instantly: "I ran a 2-minute audit of <business>" (real audit facts from the scrape) → free audit page link
  → reply → GHL → E6 → waitlist with "running business" tag → first cohort when the running-business path ships
```
Start with 2 metros and 2 categories so the audit copy is specific. Scale after the first 500 sends.

### F3. Partner and creator outbound (E5, both products)
```
Sources: Apify (YouTube channel search by keyword, TikTok/IG via VidIQ outlier search, LinkedIn post scrape for newsletter writers),
         Apollo (agencies: 1-20 staff, "marketing agency" + "small business" keywords)
  → Clay: audience size, engagement, fit score, email
  → Instantly (creators/agencies) + HeyGen personal video from Abdel
  → deal terms template in PandaDoc (30% recurring; creator partnership ad budget) → DocuSign/PandaDoc e-sign
  → GHL pipeline "Partners": Contacted → Replied → Call → Signed → Live → First referral
  → tracking links (GHL affiliate manager or Stripe promo codes) → payouts monthly
```

### F4. Content-to-DM (E2)
```
Twice a week: you record 20-30 minutes raw (phone is fine)
  → transcribe (ElevenLabs) → Claude picks 8-12 clips, writes hooks and captions per platform
  → HyperFrames/Canva captions and cards → Blotato schedules to all accounts (per-platform copy)
  → each post carries a CTA: "comment SCORE / comment MASAR"
  → Blotato automation: comment → DM with link (idea score / calculator / trial) → GHL contact via webhook
  → weekly: Claude reports top posts (Blotato analytics + VidIQ) and doubles down on winning hooks
```
Accounts already connected to Blotato: Facebook pages (Unstaffd, Aloha Capital Global, A&H Logistics), YouTube (Masar AI, Aloha Capital), Instagram (masar10_x, aloha_tech, ashour_abdelhamid), LinkedIn (personal + Unstaffd, Masar AI, Aloha Technologies, A&H pages), Threads, TikTok (x2), X (x2).

### F5. Paid (E4)
```
Meta: campaign per product → ad sets by audience (trucking interests + lookalike of trial users; AI/side-hustle + lookalike of waitlist)
  → creatives: 20-50 variants/week generated from winning organic hooks → Compliance check → launch at $20-50/day each
  → lead form / click-to-message → GHL (instant) → E6
  → nightly: pause losers (CPL > 2x target after 3x target spend), scale winners (+20%/day), report
Retargeting: RB2B + Meta pixel audiences (site visitors, video viewers 50%+, calculator users)
YouTube: pre-roll on trucking channels (Masar) once the demo funnel converts
```
Budget to start: Masar $1,000/mo, Unstaffd $1,500/mo. Owner approval needed for any day-budget change above 30%.

### F6. Speed-to-lead and follow-up (E6)
```
Any new lead (form, DM, reply, ad) → GHL workflow:
  0 s: confirmation SMS/email (consent captured on the form)
  60 s: Vapi call (business hours) or SMS with booking link
  Day 1, 3, 7, 14: follow-ups alternating channel; stop on booking, purchase or opt-out
  Booked → reminders 24 h / 1 h → no-show → re-book sequence
  Trial started → activation nudges tied to the "First Win" plan
```

### F7. Inbound signals (E3 + RB2B)
```
RB2B identifies a company on masar10x.io or unstaffd.com → Clay enrich → if ICP → Instantly "saw you looking" 2-step (B2B only) → GHL
Free tool used → email captured → nurture + E6 light (email only unless they asked for a call)
```

### F8. Reporting
```
Nightly (Make): Instantly stats, GHL pipeline counts, Blotato post analytics, Meta insights, Clay table counts, RB2B visitors
  → one row per product per day in `growth_daily` (Google Sheet first, Supabase table when the Unstaffd dashboard exists)
  → 6:30 am ET: Claude writes the daily brief and the three decisions; dashboard reads the same table
```

---

## 6. The daily loop (your 20 minutes)

1. **Open the Growth Command Center** (6:30 am ET it is ready). Order of reading: North-star tiles → engine scorecards → anomalies → human queue.
2. **Decide three things.** The brief always proposes exactly three: e.g. "pause the 11-25 truck sequence (0.6% reply)", "raise the Unstaffd waitlist ad set from $50 to $65", "approve the creator deal with X at 30%".
3. **Clear the human queue** (15 min max): send the 15 LinkedIn messages Claude drafted, answer the 2-5 replies flagged "founder should answer", approve creative or budget changes above threshold, sign any partner contract.
4. **Record** on Tuesday and Friday (20-30 min raw). That is the only content work.
5. **Weekly (Monday, 30 min):** review the week-over-week table, kill or scale engines, read the lessons list, set next week's targets. The agents propose; you decide.

What never needs you: list building, enrichment, sending, triage, scheduling, DM replies to standard questions, ad rotation inside limits, follow-up sequences, data refresh.

---

## 7. Targets and KPIs

### North stars
- **Masar:** paid fleets per month (and trials started as the leading indicator).
- **Unstaffd (pre-launch):** founding members (waitlist members who completed the idea score and shared or referred). Post-launch: activated companies and Time to First Result.

### Engine scorecards (what the dashboard tracks daily, per product)
| Engine | Daily metrics | Health thresholds |
|---|---|---|
| E1 Outbound | sends, deliverability, open %, reply %, positive %, bounces %, meetings | bounce < 2%, reply > 2%, positive > 0.8% |
| E2 Content | posts, views, comments with keyword, DMs started, link clicks, leads | DM-to-lead > 25% |
| E3 Free tools / SEO | tool sessions, emails captured, capture %, organic sessions | capture > 8% |
| E4 Paid | spend, impressions, CTR, CPL, leads, cost per demo/member | Masar CPL < $40, cost per demo < $150; Unstaffd cost per waitlist < $4, per founding member < $25 |
| E5 Partners | prospects added, replied, calls, signed, live, referred users | 1 signed per 20 contacted |
| E6 Follow-up | speed to first touch (median seconds), contact rate, booked %, show %, trial activation % | first touch < 60 s, show > 65% |

### 90-day ramp (planning numbers, revisit at day 30)
| | Day 30 | Day 60 | Day 90 |
|---|---|---|---|
| Masar demos / month | 8 | 15 | 20 |
| Masar paying fleets / month | 2 | 5 | 8 |
| Unstaffd waitlist (cumulative) | 600 | 1,600 | 3,000 |
| Unstaffd founding members (cumulative) | 50 | 160 | 300 |
| Partners signed (cumulative) | 3 | 8 | 15 |
| Blended cost per Masar paid fleet | < $700 | < $500 | < $400 |

---

## 8. Guardrails (built into the flows, not into a memo)
- **Cold email:** B2B only; CAN-SPAM (identity, address, one-click unsubscribe honored in Instantly and GHL); separate secondary domains; warm-up 14 days before the first send; stop any inbox at 2% bounce. EU/UK contacts excluded by default (GDPR/PECR; add later with a lawful-basis review).
- **Voice:** no AI cold calls. Calls only inbound, after a form with consent language, or after a written reply asking for contact. AI discloses it is AI when asked and where the law requires (California B.O.T. Act, Utah). Business hours only. Same rule as Masar's Vapi agent.
- **SMS:** opt-in on every form; A2P 10DLC registered per GHL sub-account; quiet hours.
- **LinkedIn:** no automation on personal accounts; connection notes and messages sent by you from Claude's drafts; company pages post via Blotato (official API).
- **Meta messaging:** DMs only inside user-initiated conversations (comment or message); disclose AI; no DMs to scraped lists.
- **Scraping:** public data only, for scoring and targeting; no scraped personal emails used for B2C outreach; respect robots and platform rules; Apify actors that log in with your accounts are not used.
- **Claims and testimonials:** real numbers only; "estimate, not tax advice" on calculators; no "AI finds loads" claim until the worker is live; no fabricated reviews (FTC rule); related-party quotes disclosed.
- **Ads:** financial and employment special-ad-category rules where they apply; no "do nothing / passive income" copy.
- **Data:** provider terms checked (Apollo, Clay, Apify); customer data never used for training; secrets in Make/GHL/Clay vaults, never in this repo.

---

## 9. Costs (monthly, approximate list prices, Oct 2026; verify before buying)
| Item | $/mo | Note |
|---|---|---|
| Clay | existing plan | add Apollo + MillionVerifier integrations (credits) |
| Apollo (API seat) | ~$99 | or use Clay's Apollo integration only |
| Instantly (Hypergrowth) | ~$97 | plus 6 domains (~$12/yr each) + 9 Google Workspace inboxes (~$7 each = ~$63) |
| MillionVerifier | ~$37 / 10k | pay as you go |
| Apify | ~$49 | starter plan + actor usage |
| RB2B | $0 to ~$99 | free tier first |
| Make | existing | expect ~10k-20k ops/mo (~$29-$59 tier) |
| GoHighLevel | existing | 2 sub-accounts; SMS/voice usage at cost |
| Blotato, HeyGen, ElevenLabs, Vapi, Canva, VidIQ | existing | usage-based parts grow with volume |
| Ads | $2,500 | Masar $1,000 + Unstaffd $1,500 to start |
| **Total tools (new)** | **~$450-650** | before ads and usage |

---

## 10. Rollout (90 days)
| Week | Build | Exit criteria |
|---|---|---|
| 1 | Buy 6 secondary domains, create inboxes, start Instantly warm-up. GHL sub-accounts (Masar, Unstaffd), pipelines, calendars, A2P registration. RB2B pixel on both sites. Apify + MillionVerifier accounts. FMCSA census imported into Clay. `growth_daily` sheet + Make reporting scenario. Dashboard switched from seeded targets to the sheet | warm-up running, dashboard shows real zeros |
| 2 | Clay tables (Masar fleets, Unstaffd local, Partners) with scoring and first lines. Blotato comment-to-DM automations on IG/FB. First two raw recordings → first 20 posts scheduled. Vapi speed-to-lead assistant wired to GHL | 3 Clay tables scored, posts live, test lead reaches phone in < 60 s |
| 3 | First Masar sends (50/day/inbox ramp). Partner outreach batch 1 (50 creators, 30 agencies). Free idea-score page live (waitlist). Meta: first 20 Unstaffd variants, first 10 Masar lead-form variants | first replies and first demos booked |
| 4 | Reply triage tuned on real replies. Nightly ad rotation live. Daily brief live at 6:30 am | day-30 review with real numbers; targets reset |
| 5-8 | Free tools live for Masar (calculator, IFTA, load profit). Comparison pages. Local-business outbound starts (2 metros). Creator partnership ads with the first signed creators. YouTube pre-roll test | day-60 review |
| 9-12 | Scale what works (more inboxes, more metros, more creators). Capterra/G2 listings. Product Hunt prep for Unstaffd. Nurture and re-sequencing loops | day-90 review; hand the whole engine to Unstaffd's own agents as the "B2B SaaS / trucking" niche pack |

---

## 11. Decisions needed from you
1. Masar outbound sender identity: Abdel (founder, A&H story) or a "Masar team" persona? Recommended: Abdel for ICP B and partners; team persona for ICP A nurture.
2. Starting ad budgets ($1,000 Masar, $1,500 Unstaffd) and the approval threshold (30% day-budget change).
3. Affiliate terms: 30% recurring for 12 months (recommended) or lifetime.
4. First two metros and two categories for the Unstaffd local-business audit (recommendation: Houston and Dallas; plumbers and dentists).
5. Where `growth_daily` lives first: Google Sheet (fastest, this week) or Supabase (final home). Recommendation: Sheet now, migrate at Unstaffd MVP.
6. Switch on the 6:30 am ET daily brief as a scheduled Claude task (it reads the sheet, writes the brief and refreshes the dashboard).
