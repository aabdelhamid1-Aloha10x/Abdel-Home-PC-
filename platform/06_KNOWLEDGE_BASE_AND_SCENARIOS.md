# Agent knowledge base + 5 end-to-end user scenarios

Status: DRAFT. Date: 2026-10-21.
Goal: every Unstaffd agent works like a seasoned expert in its field, and the plan each user gets is built from (1) the best proven operators' methods, (2) live market research, (3) the user's own background, and (4) what has actually worked for similar companies on Unstaffd.

---

## Part A — The knowledge system

### A1. Six layers of knowledge (each agent pulls from all six)
| Layer | What it is | Source | Refresh |
|---|---|---|---|
| 1. **Method cards** | Proven methods from top operators, written in our own words as step-by-step playbooks | Expert research pipeline (A3) | Re-verified every 90 days |
| 2. **Expert profiles** | Who the expert is, what they actually achieved (verified vs claimed), their core frameworks, source list | Research pipeline | Every 90 days |
| 3. **Industry packs** | Benchmarks, seasonality, regulations, pricing norms, buyer behavior per industry | Research + public data | Every 30-90 days |
| 4. **Live research** | Fresh facts for this specific idea, city and competitor set | Perplexity, Grok, web, ad libraries at run time | Every request |
| 5. **Outcome data** | What actually worked across Unstaffd companies (anonymized): hooks, offers, prices, channels, scripts | Our own platform | Daily |
| 6. **Company memory** | This user's business: brand, customers, results, decisions, owner preferences | The company itself | Continuous |

Owner experience never limits what Unstaffd does for them (see `07_TOOL_HUB_AND_CAPITAL_ENGINE.md` §5).

Rule of evidence: **outcome data (5) beats expert opinion (1-2) once we have enough of it.** A Hormozi method that underperforms for local services on our platform gets ranked down for that industry, automatically.

### A2. Method card format (what agents actually read)
```
id:            sales.offer.value-equation
title:         Raise perceived value instead of cutting price
agent:         coach, sales, funnel
industries:    all (strongest: services, info products)
when_to_use:   user wants to discount; conversion is low; commodity market
steps:         1) list the dream outcome  2) raise likelihood (guarantee, proof)
               3) cut time to result  4) cut effort  5) re-price on the outcome
scripts:       our own templates (offer headline, guarantee wording, objection replies)
metrics:       conversion rate, average order value, refund rate
failure_modes: guarantee the business can't afford; promise that breaks ad policy
experts:       Alex Hormozi — "$100M Offers" (book, ch. on value equation) [link]
evidence:      expert-claimed + 412 platform tests (+18% median AOV, services)
quotes:        max 1 short quote (<= 25 words) with link, never long passages
last_verified: 2026-10-15
version:       7
```

### A3. The research pipeline (run by our own "Knowledge Ops" agents)
1. **Scout** (weekly): for each expert and topic, finds new public material: books (metadata + our purchased copies), podcasts, interviews, articles, public talks, court/SEC records, ad libraries.
2. **Extractor**: turns a source into method cards **in our own words**: steps, scripts, numbers, conditions. Keeps a link and at most one short quote.
3. **Verifier**: cross-checks every claim. Marks each as `verified` (public records, multiple independent sources), `claimed` (self-reported), or `disputed` (litigation, regulator actions, contradictions). Example: a fundraising total an expert announces on social media is `claimed` until filings support it.
4. **Curator**: merges duplicates, resolves conflicts between experts ("Cardone says 10× follow-ups; Hormozi data says…"), versions every card.
5. **Evaluator**: before any KB update goes live, agents re-run a fixed test set (e.g. 50 sales objections, 30 ad briefs, 20 pricing dilemmas). The update ships only if scores hold or improve.
6. **Publisher**: owner sees a weekly "what the crew learned" diff for approval in the early months; later auto-publish with spot checks.

### A4. Sources and tools
| Need | Tool / source |
|---|---|
| Fresh web research with citations | **Perplexity Sonar API** (primary), Exa (semantic search), Firecrawl (crawl pages we're allowed to) |
| Real-time trends and what people say | Grok (X data) |
| What top advertisers are running now | **Meta Ad Library API**, Google Ads Transparency Center, TikTok Creative Center |
| Video/podcast content | YouTube Data API (metadata, titles, links), podcast transcript services with licensing; our own notes from content we watch/buy |
| Books and courses | **Buy them**; Knowledge Ops writes method cards from them (own words). Prefer **licensing deals** with the experts for full access |
| Capital raising records | **SEC EDGAR** (Form D, Reg A+, Reg CF filings show real amounts raised), court records |
| Market / traffic / audience | Similarweb, SparkToro, Google Trends, DataForSEO, Census and BLS data |
| Industry rules | State/federal regulators, licensing boards, bar/dental/real-estate rules |

**Legal lines (protect the company and keep the KB clean):**
- Methods, frameworks and ideas are free to learn and teach; **expression is not**. We never store full transcripts, book text or course videos in the KB; we store our own summaries, steps and scripts, with citations.
- No downloading or bulk-scraping YouTube/LinkedIn/podcasts against their terms; use official APIs and licensed transcript providers.
- Agents never present as an expert or claim endorsement ("Hormozi AI" is out). Licensed creator agents later = official partnerships with revenue share.

### A5. Expert roster per agent (starting list; the Scout keeps adding)
| Agent | Experts / bodies of work to research | What we extract |
|---|---|---|
| **Theo · CEO / operations** | Andy Grove (*High Output Management*, OKRs), Jeff Bezos (shareholder letters, written memos, two-pizza teams), Elon Musk (first-principles "algorithm": question, delete, simplify, speed up, automate), Gino Wickman (EOS / *Traction*), Dan Martell (*Buy Back Your Time*), Sam Walton (*Made in America*) | Weekly planning, priorities, scorecards, meeting cadence, delegation to agents |
| **Nora · Coach / strategy** | Alex Hormozi (offers, pricing), Rob Fitzpatrick (*The Mom Test*: validation), Clayton Christensen (Jobs to Be Done), Peter Thiel (*Zero to One*), Paul Graham / YC library, Warren Buffett letters | Validation, positioning, pricing, go/pivot/kill, honest pushback |
| **Mila · Research** | The Mom Test, April Dunford (*Obviously Awesome*: positioning), Jobs to Be Done interview method | Market sizing, competitor teardown, ICP, interview questions |
| **Sam · Sales / closer / receptionist** | Alex Hormozi (*$100M Leads*, CLOSER framework), Grant Cardone (follow-up, *10X*, *Sell or Be Sold*), Jeremy Miner (NEPQ questioning), Chris Voss (*Never Split the Difference*), Jeb Blount (*Fanatical Prospecting*) | Scripts, objection handling, follow-up cadences, qualification, call flow |
| **Ava · Growth / paid ads** | Ben Heath (Meta ads), Andrew Foxwell (Meta), Savannah Sanchez (TikTok/UGC creative), Dara Denney (creative strategy), Nik Sharma (DTC), local-ads specialists for Google LSA | Campaign structure, creative testing, budgets, scaling rules, hooks |
| **Iris · Brand & content** | Gary Vaynerchuk (content volume model), MrBeast production guide (hooks/retention), Alex Hormozi content playbook, Donald Miller (*StoryBrand*) | Hooks, scripts, content calendars, brand voice |
| **Jonah · Builder / CRO** | Baymard Institute (checkout UX), Nielsen Norman Group, Peep Laja / CXL (conversion research), Google web-performance guidance | Page structure, checkout, speed, A/B tests |
| **Leo · Finance** | Mike Michalowicz (*Profit First*), Warren Buffett letters, SaaS metrics (David Skok) | Cash rules, margins, unit economics, pricing math |
| **Capital-raising pack** (used by Sam, Iris, Nora when the business raises money) | Grant Cardone / Cardone Capital (online raising, Reg A+ / 506(c) funnels — claims checked against SEC filings and court records), Joe Fairless (syndication), Brad Feld (*Venture Deals*), YC fundraising library, SEC rules (Reg D 506(b)/(c), Reg A+, Reg CF) | Investor funnels, webinars, pitch structure, data rooms, **what is legal to say** |
| **Compliance guard** | FTC (endorsements, reviews rule), FCC/TCPA, CAN-SPAM, SEC general-solicitation rules, platform ad policies, HIPAA basics, state bar rules | Hard blocks and safe wording |

### A6. What the user tells us (intake), kept short
Asked **after** they type the idea, 5-7 quick taps, adapted to the idea (Mom Test style: past behavior, not opinions):
1. "How involved do you want to be?" **Hands-off (default)** / Advisor (weekly check-in) / Operator
2. "What do you know about this industry?" Expert / Worked in it / Customer of it / New to it (context only, never a limit)
3. "Who could you sell to this week?" (people you know, an audience, an email list, none)
4. "Anything that gives you an edge?" one line, optional (license, skill, location, network)
5. Starting budget range
6. Goal: side income / replace my job / build something big
7. Market: city or online, and any license you hold
8. Optional: **upload your resume or LinkedIn PDF** ("Save to PDF" on your profile) and paste your website/social links.

**About LinkedIn login:** "Sign in with LinkedIn" only gives name, email and photo, not your work history; full profile access is limited to LinkedIn partners, and scraping profiles breaks LinkedIn's terms. So: sign-in with LinkedIn for speed + **LinkedIn PDF or resume upload** for experience. Mila reads it to build an **owner profile**: context, never a score or a cap. The business runs for the owner either way; experience only changes how the crew explains things and what the owner can add if they choose to. Plans change because of market, money and regulation, not the résumé.

---

## Part B — Five live scenarios, step by step

Common start for everyone: they see Unstaffd content → land on **unstaffd.com** → type the idea → answer intake → watch the crew build (≈20 min) → choose the crew → plan + live preview → launch → daily autopilot.

### Scenario 1 — Maria, mobile car detailing, Austin (idea → local service, strong expertise)
1. **Sees**: a TikTok from the AI CEO account: "This detailing business was planned by AI in 17 minutes." Taps the link.
2. **Lands**: unstaffd.com hero "A whole company. Zero employees." Types: *"Mobile car detailing in Austin."*
3. **Intake (6 taps)**: Expert, 9 years at a dealership · can reach ~40 past clients · has a van and equipment · 25 hrs/week · $1,500 budget · replace my job · uploads LinkedIn PDF.
4. **Crew builds (live)**: Mila finds 41 detailers, only 6 mobile, most phone-only booking. Ava: Google local + before/after Reels + office parks; no cold email.
5. **Nora's verdict (84, pivot then go)**: one-off washes = price war. Uses method cards *value equation* (Hormozi) + *Jobs to Be Done*: sell "always clean" memberships at offices. Her past clients give a fast first win, so the plan starts by contacting them.
6. **Plan**: membership offer + "redo free" guarantee; First Win = first member by day 14; 90-day roadmap; names from available domains; site preview on `[name].unstaffd.app`.
7. **Choose crew**: renames Sam to "Jess", picks the Southern voice for calls.
8. **Launch**: buys `[name].com`, Stripe Connect onboarding, prepaid $300 ads, connects Instagram/Facebook (2 min).
9. **Day 1**: Sam (Jess) answers calls/texts in < 60 s; Ava runs $15/day local ads; Iris posts the first before/after Reel; Theo sends the 7 am briefing.
10. **Day 6**: First Win (2 members). **Day 30**: 11 members, 4.9★ with 18 real reviews, Nora suggests a company plan for office parks. Sam's call scripts came from the *follow-up* (Cardone) and *questioning* (NEPQ) cards, tuned by our outcome data for local services.

### Scenario 2 — James, raising $5M for a multifamily real estate fund (capital raising, regulated)
1. **Sees**: LinkedIn post "How we'd raise a real-estate fund with zero staff (and stay legal)."
2. **Types**: *"Raise a $5M fund to buy apartment buildings in Ohio."*
3. **Intake**: 2 deals done before · network of ~60 investors · $8,000 budget · goal: build something big · uploads LinkedIn PDF.
4. **Crew builds**: Mila pulls comparable raises from **SEC EDGAR Form D filings** (real amounts), cap rates in target cities; capital-raising pack loads (Cardone online-raise funnel, Fairless syndication model, SEC rules).
5. **Nora's verdict (go, with conditions)**: "This is securities law territory." She explains the choice: **Rule 506(c)** (can advertise online, but only accredited investors, verified by a third party) vs **506(b)** (no public ads, existing relationships). Recommends 506(c) for an online funnel. Flags court cases where social-media investment posts were treated as solicitations, so every post goes through compliance.
6. **Hard rules set**: no return promises; all offering documents (PPM, subscription agreement) drafted with a **securities attorney** (Unstaffd prepares the business side, the attorney owns the legal documents); Unstaffd takes **no percentage of capital raised** (that's broker-dealer territory), only subscription/credits; Sam talks only to people who opted in, and never gives investment advice.
7. **Plan**: investor site + data room; weekly "deal breakdown" video series (Iris, Cardone-style content machine, reviewed by compliance); webinar funnel; investor CRM; accredited verification step; First Win = 25 qualified investor calls booked in 30 days.
8. **Launch**: site live, Meta lead forms for an educational webinar (not the offering itself unless 506(c) and approved), LinkedIn content, email nurture.
9. **Day 14**: 140 webinar sign-ups, 31 calls booked; Sam qualifies (accredited? timeline? check size?) and books James for the real conversation. **Day 60**: verified commitments tracked in the CRM; Leo builds the investor reporting template.

### Scenario 3 — Priya, plant-based dog treats online (idea → e-commerce, new to industry)
1. **Sees**: an Instagram Reel with the orb crew "Meet your crew."
2. **Types**: *"Healthy plant-based dog treats sold online."*
3. **Intake**: hands-off · new to the industry (context only) · 2,000 Instagram followers (dog lovers) · $1,000 budget · side income.
4. **Crew builds**: Mila: crowded category, strong brands; pet-food labeling rules (state feed registrations) flagged. Ava: TikTok/IG UGC + creators; Amazon later.
5. **Nora's verdict (68, pre-sell first)**: crowded category + inventory cash at risk + regulated labeling (not her experience; a veteran would get the same advice). Uses *The Mom Test*: "Before you buy inventory, pre-sell 50 boxes." The crew runs everything; Priya stays hands-off. Pushback when Priya wants 1,000 units upfront: shows cash-at-risk math (Profit First card).
6. **Plan**: pre-order page + small-batch co-packer list + registration checklist; First Win = 50 pre-orders in 21 days.
7. **Launch**: store in pre-order mode, 3 UGC videos (faceless, Iris), 5 dog creators contacted via the creator API (affiliate 20%).
8. **Day 21**: 64 pre-orders → Nora: "Validated. Order the first batch." If it had failed, she would have proposed a pivot instead of letting her spend.

### Scenario 4 — Omar, trucking dispatch software (import a half-built project → B2B SaaS)
1. **Sees**: YouTube video "AI finished my half-built app."
2. **Chooses**: "Finish my half-built project" → connects GitHub repo + uploads spec docs.
3. **Intake**: expert (owner-operator 8 yrs) · knows 30 small fleets · goal: build something big.
4. **Crew builds**: Jonah (Engineering) audits the repo, lists gaps from the status docs, runs tests in a sandbox; Mila maps competitors and pricing; Sam's outbound pack loads (Fanatical Prospecting, NEPQ, Hormozi *$100M Leads* cards).
5. **Nora's verdict**: "Don't launch to everyone. Launch to the 30 fleets you know, as design partners."
6. **Plan**: Jonah fixes the top 12 gaps (PRs tested, reviewed by a second model); demo funnel; trucking creators; texts for owner-operators, email for fleets; First Win = 5 paid pilots.
7. **Day 30**: 9 demos, 6 trials; Jonah ships the IFTA report trial users asked for; MRR tracked by Leo.

### Scenario 5 — Dr. Lee, existing dental practice (running business → growth, HIPAA)
1. **Sees**: Google search ad "Fill your chairs. AI front desk, 24/7."
2. **Chooses**: "I already run a business" → enters website + Google Business Profile.
3. **Intake**: 2 dentists, 30% chair time unused, budget $3,000/month ads, goal: more new patients.
4. **Crew builds**: Mila audits the site (slow, no online booking), reviews (4.3★, 90), competitors' offers; compliance pack loads HIPAA rules.
5. **Nora's verdict**: "Your problem is missed calls and no online booking, not ads." Calls data: 38% of calls unanswered after 5 pm.
6. **Plan**: Sam = AI receptionist (books into the practice's calendar; collects no clinical details in Meta DMs; routes medical questions to staff); online booking page; reviews engine; Google local ads; reactivation emails to past patients (with consent).
7. **Day 7**: missed calls → 0; **Day 30**: 46 new patient bookings, 4.6★ (real reviews), ad cost per new patient tracked by Leo.

---

## Part C — How this gets built (Codex)
See `codex/prompts/02b_knowledge_base.md`: tables, retrieval, Knowledge Ops pipeline, intake + owner profile, evaluation sets, and the first 150 method cards across the roster above.
