# The tool hub ("every AI tool behind one crew") + the capital-raising engine

Status: DRAFT. Date: 2026-10-21.

## 1. The idea
Unstaffd is the one place that runs every tool a business needs. The user never signs up for Apollo, an email sender, a dialer, an ad manager or a podcast-booking service: the crew uses them (or our own built versions) behind the scenes, billed through credits with markup.

## 2. How it works: the capability hub
Every small job is a **capability** with a standard interface. Behind each capability sit one or more **providers**. A router picks the provider per job by quality, cost, availability and the customer's region, the same way the model router picks AI models.

```
Agent (Sam) -> capability "find_leads(criteria)" -> router -> provider A (Apollo) | B (Clay) | C (our own index)
            -> capability "send_email_sequence"   -> router -> Instantly | Smartlead | our SES sender
            -> capability "place_call"            -> router -> Vapi + Twilio | (later) our own voice stack
```

Rules:
- **Buy first, build later.** Integrate the best existing tool (API or MCP server). Build our own version only when (a) cost at scale justifies it, (b) it is core to our advantage, or (c) a provider becomes a risk.
- Every capability call is metered (`usage_events`) and priced in credits with markup.
- Providers are swappable without changing any agent.
- Each capability declares its **legal guardrails** (consent required? disclosure required? regulated industry?) and the Compliance Guard enforces them.

### Capability map (first version)
| Capability | Providers to integrate (examples) | Build our own later? |
|---|---|---|
| Find leads / companies / people | Apollo, Clay, People Data Labs, ZoomInfo (enterprise), Google Maps data for local businesses, SEC EDGAR (fund managers, Form D filers) | Yes: our own lead index from public data |
| Enrich + verify contacts | Clay, Apollo, Hunter, email verification services | Partly |
| Wealth / accredited-investor signals | Wealth-screening data providers; accredited-investor verification services (third-party letters) | No (regulated) |
| Cold email (B2B) | Instantly or Smartlead (warm-up, rotation), our SES for opted-in mail | Yes, once volume is large |
| LinkedIn outreach | Official APIs only where allowed; manual-assist queue otherwise | No (platform terms) |
| Phone calls (inbound, follow-up, booked calls) | Vapi + Twilio, ElevenLabs voices | Yes (voice stack) |
| SMS / WhatsApp | Twilio, WhatsApp Business Platform | No |
| Ads | Meta Marketing API, Google Ads API, TikTok, LinkedIn Ads | No |
| Social posting | Native APIs, Blotato-type aggregator for speed | Partly |
| Video / images / voice | HeyGen, Higgsfield, Sora/Veo/Kling, ElevenLabs, Canva | No |
| Webinars / events | Our own (renderer + streaming via Cloudflare Stream) | Yes |
| Podcasts: get booked as a guest | Podcast databases (e.g. Listen Notes, Rephonic) + our pitching agent | Yes (pitch engine) |
| Podcasts: run your own show | Our own production pipeline (script, record founder or approved voice, edit, publish to Spotify/Apple via RSS) | Yes |
| CRM / pipeline | Our own (contacts, deals, conversations) | Yes (core) |
| Contracts + e-signature | PandaDoc, DocuSign | No |
| Investor portal / data room | Our own (document access logs, NDA gate) | Yes |
| Payments | Stripe (Billing + Connect) | No |
| Accounting | QuickBooks / Xero + our Finance agent | No |
| Scheduling | Our own booking + calendar sync later | Yes |
| Research | Perplexity, Exa, Grok, Similarweb, SparkToro | No |

Several of these are already connected in this workspace today (Clay, Blotato, ElevenLabs, HeyGen, Higgsfield, Canva, PandaDoc, DocuSign, Stripe, Meta Ads, Make), which makes prototyping fast.

## 3. "It shouldn't feel like AI" — the human-grade standard
Customers of a business on Unstaffd should feel they are dealing with a sharp, warm, attentive team. Standard for every conversation:
- Natural language, the business's own voice, the customer's name, memory of past conversations, local knowledge.
- Human pacing (no instant walls of text), short messages, real follow-through ("I'll text you the photos tonight" and it happens).
- Premium voices (ElevenLabs), natural turn-taking on calls, no scripted robot phrasing.
- Smooth handoff to the owner for anything sensitive, with full context.

**What we will not do: pretend to be a human.** That line is legal, not stylistic:
- FCC: AI-generated voices on calls are "artificial voice" under the TCPA, so they need prior consent (written consent for telemarketing).
- California's B.O.T. Act requires disclosing a bot used online to sell to Californians; Utah requires disclosure when asked (and up front in regulated professions); the EU AI Act requires telling people they're talking to AI.
- So: agents sound human, but **disclose where the law requires it and never deny being AI when sincerely asked** (same rule as Masar OS). Done well, customers don't mind: they care that it's fast, right and kind.

## 4. The capital-raising engine
Used for (a) clients raising money (funds, real estate, startups) and (b) **Unstaffd raising money for itself** (our own build-in-public raise is the first case study).

### 4.1 Pick the legal path first (decides everything else)
| Path | Who can invest | Can you advertise / cold-reach strangers? | Typical use |
|---|---|---|---|
| **Reg D 506(b)** | Accredited (+ up to 35 sophisticated) | **No general solicitation**: only people you have a pre-existing relationship with | Startup rounds with known angels/VCs, private funds |
| **Reg D 506(c)** | Accredited only, **verified** by a third party | **Yes**: ads, cold email, podcasts, webinars, social posts | Online fund raises (the Cardone-style funnel) |
| **Reg CF** | Anyone (investment limits apply) | Through a registered funding portal only | Community rounds (e.g. Wefunder, Republic) |
| **Reg A+** | Anyone (limits in Tier 2) | Yes, after SEC qualification | Larger public-style raises |
A **securities attorney** picks and documents the path and owns the legal documents. Unstaffd **never takes a percentage of money raised** (that requires broker-dealer registration); the client pays subscription + credits only.

### 4.2 The pipeline (506(c) fund example: James, $5M multifamily fund)
1. **Targets** — Mila builds the investor profile (accredited, interested in real estate, check size $50K-250K, region). Lead sources: Apollo/Clay (business owners, doctors, executives, family-office staff), SEC Form D filings (people active in similar deals), inbound from content.
2. **Content engine (inbound, the bigger channel)** — Iris + Ava: weekly "deal breakdown" videos, LinkedIn posts, a podcast run by the client, guest spots on real-estate podcasts (pitch engine books them), educational webinars. Every piece passes Compliance (no return promises, required risk language).
3. **Outbound** — Sam: personalized B2B email sequences and LinkedIn touches to targeted prospects (allowed under 506(c); CAN-SPAM rules). **No AI cold calls** to people who haven't opted in (TCPA); calls happen after a form, a reply or a booked slot.
4. **Paid** — Ava: Meta/Google/LinkedIn lead forms for the webinar or investor guide (ad-platform financial-services rules apply).
5. **Qualify** — Sam (voice/chat): accredited? timeline? check size? questions? Books the investor meeting. Answers only from approved materials (deck, PPM summary, FAQ approved by counsel).
6. **Pitch meeting** — the client (or an approved presentation with the client present) runs the pitch; Theo prepares a briefing on each investor beforehand.
7. **Close** — data room (our own), subscription documents via DocuSign/PandaDoc, accredited verification by a third-party service, funds to the fund's escrow/bank (never through Unstaffd).
8. **Investor relations** — Leo: quarterly reports, distributions schedule, K-1 reminders; Sam answers investor questions from approved info.
First Win: 25 qualified investor meetings in 30 days. North star: verified commitments.

### 4.3 Unstaffd's own raise (startup, pre-seed/seed)
- Path: usually **506(b)** with a SAFE. That means **no public "we're raising" posts**: build-in-public shows the company and metrics, not the offer. If we want to talk about the raise publicly, the attorney sets it up as 506(c) or a Reg CF community round.
- Targets (Apollo/Clay + public portfolios): pre-seed/seed funds and angels who backed AI agents, SMB software, solo-founder companies; accelerators (YC, a16z speedrun, Neo, South Park Commons).
- Agents: Mila builds the list and investor theses; Sam sends personalized emails and follow-ups; Theo writes the monthly investor update from live metrics; the data room updates itself; Iris turns build-in-public into the story. The founder takes the meetings and signs.

## 5. Owner involvement: no judging, no caps
Experience is **context, never a limit**. The business runs for the owner either way. Intake asks:
- "How involved do you want to be?" **Hands-off (default)** / Advisor (weekly check-in) / Operator (you do some of the work).
- "What do you know about this industry?" Only so the crew knows who they're talking to (how to explain things, what the owner can add if they want).
A newcomer and a 10-year veteran get the same full crew and the same autopilot. Plans change because of **market, money and regulation**, not the owner's résumé.
