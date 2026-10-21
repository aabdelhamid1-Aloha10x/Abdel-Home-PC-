# Master spec: AI company platform (v1-v3 consolidated)

Status: DRAFT for owner decisions. Date: 2026-10-21.
Working name: not chosen yet. The name lives in ONE constant (`src/config/brand.ts`, same rule as Masar OS). This doc says "the Platform".
Companion docs: `01_INFRASTRUCTURE.md` (hosting, tenants, stack), `02_BUILD_QUEUE.md` (order of work), `03_OWNER_DECISIONS.md` (open questions).

---

## 1. One-line pitch and positioning

**"Type your idea or plug in your business. AI agents run the whole company — and coach you to results."**

- The Platform builds, launches and runs a business end to end: research, plan, brand, website, payments, marketing, sales, support, finance.
- It runs on **autopilot**. The user steers through a strategy chat, not by approving every action.
- It is a **business coach**, not a yes-man. It challenges bad ideas with research and proven playbooks.
- It works for **every kind of business**: idea-stage, running local businesses (plumbers, dentists, daycares, grocery, law offices), B2B services, SaaS, e-commerce, info products.
- We **sell the outcome** (booked jobs, filled chairs, first 100 sales), not the software.

### Founder model
- Solo founder + AI. **No employees, ever.** That is the core story.
- Vendors are allowed where the law requires a licensed party (counsel drafting contest rules, for example). They are vendors, not hires.
- The Platform runs its own company on itself ("Company #0"). Masar OS is Company #1.
- Built in public, aggressively, on every platform from day one.

---

## 2. Market context (why now, why us)

- Proof of demand: Polsia (Ben Cera / Ben Broca, founded late 2025) reached ~$11M recurring revenue (subscription MRR $915K annualized, Sept 15 2026) and raised $30M at ~$250M (May 2026, Sound Ventures + True Ventures).
- Polsia's weaknesses (from founder statements, ToS, reviews):
  - ~6% of created companies active (29,132 of 484,592), ~10% ever made $1, best company ~$4K.
  - ~50% churn in month 1, again in month 2.
  - Headline ARR mixes one-off revenue (credit packs, ad spend) with recurring.
  - Lock-in (domains/hosting on polsia.app), tasks marked done but not deployed, credits burned on failures, cold emails sent without approval, hard cancellations. Trustpilot 1.8 -> 3.4.
  - Revenue cut dropped from 20% to 3% (Sept 2026) under pressure.
- AI agents market: ~$7.6-7.8B (2025) -> ~$48-53B (2030), ~45% CAGR (MarketsandMarkets, Grand View, BCC).
- Competitors: Polsia, NanoCorp, Cofounder.co, Crevio, HeyBoss; app builders (Lovable, Bolt, Replit) that build but do not run; Meta Business Agent (launched globally June 2026) for DM selling; big labs and Shopify as future threats.

### How we win (Polsia problem -> our answer)
| Polsia problem | Our answer |
|---|---|
| No validation, "surprise me" builds anything | Validation stage with Go / Pivot / Kill score before building |
| Agents write free code, sites break | Hardened templates. One multi-tenant renderer. Agents change config and content, not raw code |
| Users don't see results, churn fast | "First Win in 14 Days" plan per business model. North-star metric: Time to First Result |
| Uses every channel blindly | Channel-fit engine picks only the channels that fit the business model |
| Opaque | Live org-chart dashboard: every agent, its task, result, cost, lessons |
| Credits burned on tasks that never delivered | Task is "completed" only after it passes testing. Revisions the user asks for are normal paid work (Lovable model). Only system failures (task crashed / never delivered) are re-run at no charge |
| Yes-man AI | Coach with a challenge protocol and a playbook knowledge base |
| Inflated metrics | Public live metrics page: recurring MRR, active companies, customer revenue generated |

---

## 3. Onboarding paths

1. **I have an idea** -> validate -> build -> launch -> grow.
2. **I have a running business** -> connect website, Google Business Profile, socials, Stripe -> audit -> grow.
3. **I have a half-built company** -> import repo, docs, site, database -> agents audit and finish it -> launch. (Masar OS is the proof case.)

### The aha moment: full plan and live site in ~20 minutes, before paying
| Minute | What the user sees |
|---|---|
| 0 | One input box. Idea, business URL, or repo import |
| 0-2 | Org chart lights up. Agents work in parallel, results stream live |
| 2-8 | Market research, competitors, niche options, ICP. Coach flags weak points |
| 8-12 | Business plan: offer, pricing, channel strategy, 90-day roadmap, First Win plan |
| 12-18 | Live preview of site or landing page on a subdomain. Brand kit. Domain options with prices |
| 18-20 | "Launch" screen: choose tier, buy domain, set ad budget, connect accounts -> autopilot starts |

Rules:
- Plan + preview are free. Free stage uses cheap models; target cost < $1-3 per signup; abuse limits per user/device/IP.
- Trial: either 7-day trial with card, or no trial + money-back guarantee if the first-week milestone is missed (owner decision).
- Nothing the user sees in onboarding may be broken. Templates are pre-tested; preview is rendered by the same production renderer.

---

## 4. User journey (worked example: ski equipment)

1. **Research and validation** (10-20 min, free): demand and seasonality, competitors (REI, Evo, Backcountry, Amazon), finding = generalist ski gear is saturated and capital heavy. Niche options scored: premium women's gear, refurbished gear marketplace, beginner trip kits, kids' gear subscription. ICP written. Go / Pivot / Kill score.
2. **Brand and build**: names are suggested **from available domains** (domain-first naming; no USPTO gate). The user picks; the choice is theirs. Domain shown with price (cost + markup). Logo, brand kit, store from template, Stripe Connect, inbox, legal pages. Supplier / dropship integration for physical goods.
3. **Channel strategy**: for ski gear -> IG/TikTok UGC, Pinterest, Meta ads, Google Shopping, creators, email/SMS. Not cold email, not AI cold calls. (A B2B business would get the opposite.)
4. **Launch and operate**: daily loop (plan -> execute -> QA -> report). Daily email: visitors, signups, orders, what the agents test today.
5. **Learn**: results feed company memory and the platform playbook library.

---

## 5. Autopilot + strategy chat (the coach)

### Autopilot is the product
- No "approve everything" mode.
- At onboarding the user sets, once: monthly budget (ads, credits pace), goals, brand rules, hard no's.
- Agents act freely inside those limits.

### Hard limits (enforced server-side, never crossed even on autopilot)
- Illegal, deceptive or platform-policy-violating actions.
- Spending above the budget the user set.
- Irreversible destructive actions (deleting the site, cancelling the domain) without explicit user confirmation.
- Compliance rules of the niche pack (section 10).

### Strategy chat flow
```
User message -> Coach (general query agent)
   -> understands goal behind the request
   -> researches (user data, competitors, platform benchmarks, playbook KB)
   -> AGREES  -> Orchestrator -> owning agent -> done -> result reported in chat + dashboard
   -> DISAGREES -> pushes back with evidence + better alternative
        -> user insists -> executes, logs the risk, reports honestly ("2 weeks in, revenue -12%, revert?")
```

### Challenge protocol
1. Understand the goal ("why do you want to lower prices?").
2. Research: their own data, competitors, benchmarks across the platform.
3. Verdict with numbers + the playbook principle + the better plan, ready to run.
4. User decides. The coach executes and tracks the outcome.

Example: user wants $49. Coach: "Price on the outcome, not the product (Hormozi, $100M Offers). Competitors charge $79 for software. Sell 'two extra loads a month or next month free' at $129. Here is the new offer and landing page."

### Coaching layer
- Daily lesson tied to what happened that day ("why your CPM rose and what we did").
- Users who learn churn less.

---

## 6. Playbook knowledge base (the core of the machine)

Structure: **playbook cards**, stored in Postgres + pgvector, retrieved by every agent and the coach.

```
principle:      Don't compete on price; raise price, sell the outcome
applies_when:   user wants discount; low margin; commodity offer
do_instead:     outcome-based offer, guarantee, bonuses, speed
evidence:       platform data (conversion of repackaged offers), examples
source:         Hormozi, "$100M Offers" (cited by name)
domains:        pricing, offers
```

Sources to distil (principles in our own words, cited by name and work):
- Alex Hormozi: offers, pricing, lead generation, value equation.
- Grant Cardone: sales follow-up, activity volume.
- Dan Martell: systems, delegation, SaaS growth.
- Jeff Bezos: shareholder letters (customer obsession, long-term).
- Elon Musk: first-principles cost and speed.
- Satya Nadella: culture, platform strategy.
- Plus channel-specific best practice (Meta ads, SEO, cold email, local services, e-commerce).

Rules (protects the company, keeps the KB fully usable):
- Write principles in our own words and cite the source. No wholesale ingestion of books, courses or paid videos.
- Agents never present as these people or as endorsed by them ("Hormozi AI" is not allowed).
- Later: licensed creator agents (official playbooks, revenue share with the creator) as a premium tier.

The platform's own outcome data becomes the stronger moat over time (section 13).

---

## 7. Agent org chart

| Agent | Owns | Main tools | KPI |
|---|---|---|---|
| CEO / Orchestrator | Weekly goals, task routing, conflicts, daily report | All agents, KPI tables | Revenue growth |
| Coach (strategy chat) | User conversations, challenge protocol, lessons | Playbook KB, research | Retention, plan adherence |
| Research & Strategy | Market, niche, ICP, competitors, pricing | Perplexity, Grok, DataForSEO, web | Validation accuracy |
| Brand | Names, logo, voice, brand kit | Image models, domain availability API | — |
| Web / Build | Site, store, funnels from templates (config + content, no raw code) | Template engine, renderer | Uptime, speed |
| Engineering | Custom features, integrations, apps per company; finishing imported apps (Masar); bug fixes. Flow: spec -> code in sandbox -> tests -> review by a second model -> QA agent -> preview -> promote | Claude Agent SDK / Codex in E2B sandbox, GitHub repo per company, Workers for Platforms or tenant's own host | Shipped features, zero regressions |
| Funnel & CRO | Offers, A/B tests, checkout, VSL pages | Analytics, Stripe | Conversion rate |
| Content Studio | UGC (faceless / avatar), images, copy, VSL scripts | Sora/Veo/Kling/Higgsfield, HeyGen, ElevenLabs | Hook rate |
| Social | Posting, comments, community | Social APIs, scheduler | Engagement |
| Paid Ads | Meta / Google / TikTok campaigns, budget, creatives | Ads APIs | ROAS, CAC |
| Lead Gen | Lead magnets, instant forms, calculators, webinars | Templates, Meta lead ads | Cost per lead |
| AI Closer | DMs, click-to-message, speed-to-lead, booking | Messenger/IG/WhatsApp APIs, calendar, Vapi | Booked / closed |
| Email & SMS | Flows, newsletters, reminders | Resend/SES, Twilio | Email revenue |
| Outbound (B2B only) | Cold email, LinkedIn, warm voice follow-up | Lead data, sending infra, Vapi | Meetings |
| Creator Partnerships | Find, score, negotiate, track creators | Modash / influencers.club API, Stripe Connect | Creator revenue |
| Support | Customer chat, email, inbound voice | Helpdesk, Vapi | Response time, CSAT |
| Finance & Accounting | Bookkeeping, reconciliation, P&L, sales tax, 1099 prep, tax package | Stripe, Plaid, QuickBooks/Xero, Stripe Tax | Margin, books closed |
| Risk & KYC | Connect onboarding review, fraud, prohibited categories, contest integrity | Stripe Connect/Identity/Radar | Fraud loss |
| QA & Compliance Guard | Checks every public output before it ships | Rules engine + LLM grader | Error rate |

The QA & Compliance Guard is mandatory because there is no approval step.
The same org chart runs the Platform's own company (Company #0), so it is tested daily by us.

---

## 8. Model routing (multi-provider)

All calls go through one LLM gateway (see infra doc). Each task type has: default model, fallback, cost cap, eval set.

| Job | Default | Fallback |
|---|---|---|
| Orchestrator, long tool use, coding/finishing apps | Claude Opus 5.5 ($4/$20 per 1M tok) | OpenAI flagship |
| Sales copy, ads, DM closing | A/B test Claude Sonnet 5.5 / OpenAI / Grok on conversion, keep winner per niche | — |
| Real-time trends, social listening, hooks | Grok (X data) | Perplexity |
| Research with citations | Perplexity Sonar | Claude/OpenAI + web search |
| Video / long doc understanding | Gemini | — |
| Bulk tagging, summaries, QA checks, triage | Claude Haiku 5.5 ($0.10/$0.50), Gemini Flash, GPT mini, open-weight | Cheapest that passes evals |
| Images | OpenAI image, Imagen, Flux | — |
| Video | Sora 2, Veo, Kling, Higgsfield | — |
| Avatars | HeyGen ($1-4 per video minute via API) | — |
| Voice agents | Vapi + ElevenLabs (~$0.07-0.22/min all-in) or OpenAI Realtime | — |
| Speech-to-text | Deepgram, Whisper | — |

Rules:
- Monthly re-test of new models against each eval set; traffic moves to best cost/quality automatically.
- Provider outage -> automatic failover.
- Use prompt caching and batch APIs wherever possible.
- Check each provider's data retention / training terms before sending customer data.
- Log cost per task from day one (same idea as Masar `usage_events`).

---

## 9. Sales and lead engines

The channel-fit engine selects engines by **business model**:

| Business model | Engines |
|---|---|
| High-ticket services / book-a-call (agencies, coaches, B2B, Masar) | VSL page -> calendar; Meta instant forms; lead magnets (calculators, audits, checklists, quizzes); webinars; LinkedIn; B2B cold email; retargeting; case-study ads |
| Local services (plumbers, dentists, daycares) | Google Business Profile + Local Services Ads; click-to-message ads; missed-call text-back; reviews engine; referrals; local SEO |
| E-commerce | UGC + creators; content -> DM; Meta/TikTok shop ads; email/SMS flows; retargeting |
| SaaS / apps | Free tools, freemium, SEO content, creator affiliates, Product Hunt, onboarding emails |
| Info products / coaching | Webinars, lead magnets, DM funnels, community, creators |

### Engine details
- **Content -> DM selling**: posts with "comment KEYWORD" CTA -> AI Closer DMs -> qualify, handle objections, checkout link / booking / lead capture -> CRM. Revenue per post shown.
- **Click-to-message ads + AI Closer**: Meta CTM campaigns (Messenger / IG Direct / WhatsApp) -> instant AI reply 24/7 -> book into calendar, take deposit. Differentiation vs Meta Business Agent: ours knows the whole business (CRM, calendar, inventory, offers) and works across all channels.
- **Speed to lead (shared by every engine)**: new lead -> AI text/call within 60 seconds (consent captured on the form) -> qualify -> book -> reminders -> follow up until buy or opt out.

### First Win in 14 Days
Each business model has a fastest-path plan to a first result (first lead, booked call, sale). Time to First Result is the north-star metric. The coach watches it daily.

---

## 10. Niche packs (horizontal product, vertical marketing)

Niche pack = template + playbook + channel mix + KPIs + compliance rules.
The niches below are **examples only**. The Platform serves any business; new packs are added whenever data shows demand.

| Niche | Primary engines | Outcome we sell | Compliance |
|---|---|---|---|
| Plumbers / HVAC | LSA, click-to-message, voice receptionist, reviews | More booked jobs | Inbound calls only |
| Dentists | Lead ads, booking closer, reviews, reactivation | Fill your chairs | HIPAA: no health details in Meta DMs |
| Daycares | Local social, FB groups, tour booking | Full enrollment + waitlist | Child privacy, no kid photos without consent |
| Grocery | Local social, WhatsApp/SMS promos, delivery ordering | More weekly orders | SMS opt-in (TCPA), A2P 10DLC |
| Law offices | SEO/content, intake bot, Google ads | More qualified consultations | State bar ad rules; bot gives no legal advice |
| Trucking SaaS (Masar) | Creators, LinkedIn, B2B email, FB groups, calculators, demo funnel | More demos / subscribers | CAN-SPAM |
| Idea-stage e-commerce | UGC, creators, Meta ads, content -> DM | First 100 sales | FTC ad claims |

Launch order: Masar's niche + 1 niche pack first, then one new pack per month. Marketing message stays "run your entire business in one place".
Each niche gets its own landing page and ad set, run by our own agents (dogfooding).

---

## 11. Creator network

### Phase A (MVP): connect to an existing marketplace by API
- Providers: Modash (public API, 350M+ creators, from ~$199/mo), influencers.club, Upfluence. Pick one in MVP.
- Creator agent: search by niche keywords, audience geo/demo vs ICP, engagement, fake-follower check, brand safety, price.
- Outreach + negotiation: flat fee, affiliate (e.g. 20-30% recurring for SaaS), or hybrid.
- Tracking links/codes; payouts through Stripe Connect; our fee on top of creator campaign spend.
- FTC disclosure (#ad / paid partnership) enforced by the Compliance Guard.
- Masar example: trucking, owner-operator, CDL and logistics creators on YouTube/TikTok/LinkedIn.

### Phase B (later): creators join the Platform
- Opportunity feed: companies on the Platform, products, commission rates, real conversion data.
- AI matchmaking both ways.
- Revenue: % of creator payouts (e.g. 10-20%), optional small business-side fee.
- Flywheel: more companies -> more opportunities -> more creators -> more sales -> more companies.

---

## 12. Pricing and revenue

### Tiers (Lovable-style, no unlimited)
| Tier | $/mo | Companies | Credits/mo |
|---|---|---|---|
| Business 1 | 29 | 1 | 1,000 |
| Business 2 | 59 | 1 | 2,500 |
| Business 3 | 99 | 2 | 5,000 |
| Business 4 | 199 | 3 | 11,000 |
| Business 5 | 299 | 5 | 17,000 |
| Business 6 | 499 | 8 | 30,000 |
| Business 7 | 799 | 12 | 50,000 |
| Business 8 | 1,199 | 20 | 80,000 |
| Business 9 | 1,999 | 35 | 140,000 |
| Business 10 | 2,999 | 50 | 220,000 |
| Enterprise / Agency | quote | 50+ | custom |

**STATUS: TEST ONLY. Not published.** Tiers, credit amounts and per-action credit values are tested first (Masar + 10-20 beta users, real cost per action measured in Langfuse), then set. See `04_COST_ANALYSIS.md` §9.

### What credits do (draft values, to be tested)
Credits pay for agent work. Each action has a credit value sized so our real cost stays ~25-35% of what the credit sells for.

| Action | Credits (draft) |
|---|---|
| Idea validation + first business plan + site preview (onboarding) | free |
| Daily agent cycle (orchestrator plan + daily report) | 20 / day |
| Site / landing page build from template | 100 |
| Page edit or revision | 10 |
| Social post (copy + image) | 8 |
| AI image | 4 |
| SEO / blog article | 25 |
| Ad campaign setup (3 ad variants) | 60 |
| Ad optimization pass | 5 / day |
| Faceless UGC video (30s) | 150 |
| Avatar video (30s, user's face) | 250 |
| DM / chat conversation handled by AI Closer | 3 |
| Email campaign (per 100 recipients) | 2 |
| Voice minute (receptionist / follow-up) | 35 |
| Lead found + enriched | 2 |
| Creator found + outreach | 10 |
| Engineering task (custom feature) | 200-1,000 by size |

Example: Business 1 ($29, 1,000 credits) ≈ daily cycle all month (600) + 20 social posts (160) + 1 ad campaign (60) + daily ad optimization (150) = 970. That is "light autopilot for one company". Video-heavy or aggressive users top up or upgrade.

Rules:
- Upgrade any month; one-time top-up packs any time.
- Included credits expire monthly; packs never expire (same as Masar).
- Credits priced at 3-4x blended AI cost (target 65-75% gross margin).
- A task counts as **completed when it passes testing**; credits are charged then. Changes the user asks for afterwards (didn't like the look, wants another version) are new paid tasks, like Lovable.
- Only **system failures** (task crashed, timed out, or never delivered output because of our bug/outage) are re-run automatically at no extra charge. Recommended because "credits spent on tasks that never deployed" is Polsia's top complaint. Owner decision.
- **Aggressiveness is a slider** (Steady / Growth / Aggressive / Blitz) that controls credit pace and which engines run. The coach shows "at this pace credits last 16 days; top up or move to Business 4?"
- Autopilot paces credits across the month unless the user speeds it up. No surprise bills.

### Revenue streams
1. Subscriptions (tiers above).
2. Credit top-up packs.
3. Usage markups: voice minutes (cost ~$0.10-0.20, sell ~$0.35-0.50), avatar video (2-3x), domains (+$3-5/yr on registration and renewal).
4. Ad management fee: 10-15% of ad spend, billed through our Stripe (user's ad account pays Meta directly).
5. Revenue share: 3-5% application fee on sales processed through our Stripe Connect.
6. Creator campaigns: fee on top of creator spend; later % of creator payouts.
7. Later: template/agent marketplace, licensed creator agents, agency white-label.

### Revenue lock (Stripe Connect)
- Use **Connect Express** accounts (platform-controlled; only work inside the Platform; payouts to the user's bank). Not Standard (user can disconnect).
- All platform-built checkouts, booking pages, invoices and payment links use only our Connect. No other processor can be added inside platform-built assets.
- ToS: revenue from platform-built assets must be processed through the Platform while subscribed.
- Risk agent flags anomalies (traffic/leads up, processed revenue down).
- Service businesses get platform invoices, payment links and tap-to-pay so on-site revenue still flows through us.
- Ownership promise: "You own your brand, domain, customer data and code export. Payments run on our rails while you are with us."
- Revenue share is upside; subscriptions + credits carry the base economics.

### Example month (ski company, Business 4-level usage)
Subscription $149-199 + credits $60 + ad fee 12% of $1,500 = $180 + 4% of $4,000 sales = $160 -> ~$550 revenue vs ~$60-80 cost. Illustrative only.

---

## 13. Self-improving system

1. **Company memory**: brand rules, what worked, what the owner rejected, customers.
2. **Platform playbook library**: anonymized cross-company results by niche and channel ("outdoor gear: POV UGC hooks 2.1x CTR"). New companies start with winners. Consent in ToS.
3. **Evals and graders**: every output scored (auto + real KPIs). Nightly Retro agent proposes prompt/playbook changes -> A/B tested on eval set -> rolled out only if better. Owner reviews weekly change summary in early months.
4. **Fine-tuning (later)**: small open models fine-tuned on successful trajectories for high-volume tasks to cut cost.

Shown to users as each agent's "Lessons learned" feed and a weekly "your team got smarter" summary.

---

## 14. Founder Grant Contest (anti-churn)

- **Season = 90 days.** Public live leaderboard (also build-in-public content).
- Prizes: grand grant + category winners (best new business, fastest growth, best niche, best comeback).
- **Milestone rewards for everyone**: first $100 / $1K / $10K revenue -> bonus credits + badges. This drives retention more than the grand prize.
- Funding: fixed share of season revenue (e.g. 3-5%) with a guaranteed minimum.
- Integrity: only revenue processed through our Stripe Connect counts; net of refunds/chargebacks; minimum unique paying customers; Risk agent checks wash trading (self-purchases, related cards); KYC required to receive a grant; 1099s issued.
- Legal: paid-entry skill contests are restricted in some US states. Counsel drafts official rules once (vendor), possibly with a free-entry route.

---

## 15. Compliance and trust

| Area | Rule |
|---|---|
| AI voice calls | FCC (Feb 2024): AI voices are "artificial voice" under TCPA. Telemarketing needs prior express written consent. Voice = inbound, warm leads, consented follow-up only |
| Cold email | CAN-SPAM / GDPR / PECR. B2B only, unsubscribe, separate warmed sending domains |
| SMS | Opt-in, A2P 10DLC registration per business |
| Meta messaging | Reply only to user-initiated conversations inside Meta's window; disclose AI; WhatsApp allows business-specific bots, not general-purpose assistants (verify current policy) |
| Avatars / voice clones | Only the user's own face/voice with liveness + consent check |
| AI content labels | No blanket labeling. Follow each platform's own rule only where it applies (e.g. Meta for political/social-issue ads with realistic altered media; TikTok/YouTube for realistic AI-generated people or events) |
| Testimonials and reviews | Only real customer reviews and real results. No fabricated testimonials, AI "customers" presented as real, or bought reviews: banned by the FTC rule (effective Oct 21 2024, up to $51,744 per violation) and by ad platform policies; one violation can get ad accounts banned. Instead: automated real-review collection, disclosed creator reviews, demo ads labeled "actor portrayal" where actors are used, true numbers as social proof |
| Names | Domain-first naming. Optional non-blocking warning for obvious famous brands (ads and domains get rejected for those) |
| Prohibited businesses | Blocked categories; KYC via Stripe; Risk agent review |
| Regulated niches | HIPAA (dental/health), state bar rules (law), child privacy (daycare) built into niche packs |
| Billing | Credits charged when a task passes testing; user revisions are paid; system failures re-run free. Online cancellation (required for California consumers by state auto-renewal law). No refunds of used credits or the current period; written refund policy; transparent credit usage |
| Data | Provider retention terms checked; customer data never used for training without consent |

---

## 16. Dashboard (UI)

- **Landing**: one input box, minimal, Polsia-simple.
- **Org chart (home)**: CEO on top, departments below; each agent a live card (working / waiting / blocked), current task, last result.
- **Agent detail**: task history, outputs, credits spent, KPI, "lessons learned", feedback button.
- **Strategy chat**: always available; coach replies with evidence.
- **Business KPIs**: visitors, leads, booked calls, sales, revenue, ad spend, ROAS, CAC, Time to First Result.
- **Credits**: balance, pace, per-agent breakdown, top-up.
- **Aggressiveness slider** and budget settings.
- **Contest**: leaderboard, milestones, badges.
- Design rules from Masar apply: no dead buttons, loading/empty/error states, 390px width, light/dark.

---

## 17. Build in public (all platforms, aggressive from day one)

| Platform | Content | Volume |
|---|---|---|
| YouTube long-form | Weekly "building a company with zero employees", Masar progress | 1-2/week |
| Shorts, TikTok, IG Reels, FB Reels | Agents working live, revenue updates, coach pushback moments | 3-5/day each |
| X | Build threads, metrics, takes | 5-10/day |
| LinkedIn | Founder story, B2B / Masar angle | 1-2/day |
| Threads, Facebook | Repurposed | Daily |
| Reddit, Indie Hackers, HN, Product Hunt | Honest milestones, launches (value first) | Weekly / per launch |
| Newsletter | Weekly metrics + lessons | Weekly |
| Podcasts | Guest spots, agent pitches hosts | Ongoing |

- **AI CEO account**: posts the Platform's own daily agent report, written by the agents.
- **Live metrics page**: recurring MRR, active companies, customer revenue generated.
- Pipeline: owner records -> transcribe -> agents clip, caption, thumbnail -> scheduled everywhere. Existing workspace connectors cover most of this today: Blotato, VidIQ, HeyGen/HyperFrames, ElevenLabs, Higgsfield, Canva, Meta Ads.

---

## 18. Masar OS: Company #1 (continue mode)

- Masar OS (trucking TMS, Lovable + Supabase) is already partly built: specs, credits model, Vapi agent, browser worker, `lovable-build/SOLO_STATUS.md` known gaps.
- The Platform imports Masar (repo + `lovable-build/` docs), turns known gaps into tasks, finishes them, then runs Masar's go-to-market.
- Public story: "Masar OS was partly built. We plugged it in and the AI finished and launched it."
- Owner-only steps (identity-bound): Google OAuth verification, Apple/Google developer accounts, Stripe live mode, ELD/carrier provider applications. Agents prepare everything; owner signs once.
- Masar GTM: trucking creators, LinkedIn, B2B email (FMCSA public data), trucking FB groups, free tools (cost-per-mile calculator, load profit checker), demo-booking funnel.
- Baseline at week 0, public 30/60/90-day reports, then Masar becomes the "B2B SaaS / trucking" niche pack.

---

## 19. Metrics

- North star: **Time to First Result** (first lead / booked call / sale).
- Activation: % of signups that launch within 24h; time to plan (< 15 min); time to live site (< 20 min).
- Retention: M1, M3, M6 logo retention; % of companies with revenue > $0 at day 30.
- Revenue: recurring MRR (reported separately from one-off), credit pack revenue, ad fees, rev share, creator fees.
- Unit economics: AI cost per active company, gross margin per tier, free-stage cost per signup.
- Customer outcomes: total customer revenue processed (public).

---

## 20. Roadmap (solo)

| When | Focus |
|---|---|
| Weeks 1-4 | Infra foundation + long-lead approvals (see infra doc). Run Masar semi-manually, baseline. Build-in-public from day 1 |
| Months 2-3 | MVP: 3 onboarding paths, plan generation, coach chat -> orchestrator, template renderer, domains, Stripe Billing + Connect Express, Meta ads, content -> DM closer, org-chart dashboard, credits |
| Months 3-4 | First niche pack + public Masar results. First 50 paying users |
| Months 4-6 | Click-to-message closer, lead-gen engines, creator agent (Phase A), aggressiveness slider + tiers, voice receptionist, contest season 1 |
| Months 6-12 | One niche pack per month, learning loop, creator marketplace (Phase B), agency tier |

Detailed order: `02_BUILD_QUEUE.md`.
