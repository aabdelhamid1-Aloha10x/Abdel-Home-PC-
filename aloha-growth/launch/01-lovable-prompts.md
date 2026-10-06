# Lovable Build Prompts: Aloha Growth Website and Landing Pages

Paste each prompt into Lovable **in order**. Build Prompt 0 first (design system), then the rest. Everything in [BRACKETS] is a placeholder to replace with real assets or numbers. Do not publish invented testimonials, case studies or guarantees.

## Facts you can use (all supplied by the founder)
- Founder rented one truck in 2020 and built A&H Logistics (transportation). Revenue: 2021 $220K, 2022 $340K, 2023 $3.4M, 2024 $11.5M, 2025 $16.7M.
- Moved from Egypt to the US about 14 years ago. Finance degree.
- Partner in a daycare; helped take it from zero to a six-figure business in under a year.
- Aloha Capital: real estate, started 2023, $25M+ AUM.
- Aloha Growth: helps business owners improve operations, sales and marketing.
- Market: daycares in South Jersey and Philadelphia. Minimum $500K annual revenue.
- Offer ladder: Fill Sprint (30 days), Growth Blueprint (3 weeks), Fill and Systemize (90 days), Scale Partner (12 months).
- Founding cohort: 3 daycares.

---

## Prompt 0: Brand and design system (run first)

```
Build a design system and project scaffold for "Aloha Growth", a growth partner for daycare owners in South Jersey and Philadelphia. Use React, TypeScript, Tailwind and shadcn/ui.

BRAND FEEL: premium, warm, credible, operator-led. Think "trusted business partner who has scaled real companies", not a generic marketing agency. Calm confidence, lots of whitespace, editorial typography.

COLORS (define as CSS variables, support light and dark):
- Ink navy #0B1F3A (primary text and dark sections)
- Lagoon teal #0F8B8D (primary buttons and links)
- Sunrise coral #F26A4B (accent and key highlights only)
- Sand #F7F2EA (page background)
- Cloud #FFFFFF (cards)
- Slate #5B6B7C (secondary text)

TYPOGRAPHY: Fraunces (serif) for headlines, Inter for body. Large, confident headlines with tight tracking. Body 18px on desktop.

COMPONENTS: Button (primary teal, secondary outline, ghost), Card, Section wrapper with 96px vertical padding on desktop and 56px on mobile, StatCard (big number, small label), Timeline, Accordion (FAQ), Badge, Sticky header, Footer, Announcement bar, CTA banner, Testimonial card (with placeholder state), Pricing/Package card.

MOTION: subtle fade-up on scroll (400ms ease-out), no parallax, respect prefers-reduced-motion.

RULES: mobile-first, 16px side gutters on mobile, accessible (WCAG AA contrast, focus rings, alt text, semantic HTML), fast (lazy-load images), no stock-photo clichés. Use [LOGO] placeholder and a neutral illustration style. Set up Lovable Cloud/Supabase for lead storage.

Create a /design page that shows every component so I can review it.
```

---

## Prompt 1: Main website

```
Using the existing design system, build the full marketing website for Aloha Growth with these pages and a shared header and footer.

HEADER: logo, nav (Programs, Founder Story, Results, Apply), primary button "Apply for the Founding Cohort". Sticky, becomes compact on scroll. Announcement bar: "Founding cohort: only 3 daycare partners in South Jersey and Philadelphia."

--- HOME (/) ---
1. HERO. Headline: "Fill your seats. Free your time. Grow to your next location." Subhead: "Aloha Growth is the operator-led growth partner for daycares in South Jersey and Philadelphia doing $500K or more a year." Primary CTA "Apply for the Founding Cohort". Secondary CTA "Watch the 8-minute story" (scrolls to the video). Right side: a clean stat card stack showing "One rented truck in 2020 -> $16.7M in 2025".
2. TRUST STRIP: "Built by the founder of A&H Logistics | Aloha Capital ($25M+ AUM) | Aloha Growth". No fake logos.
3. THE PROBLEM: "You built a great daycare. Now it depends on you for everything." Three pain cards: empty seats and slow follow-up; staffing and turnover chaos; you are the bottleneck.
4. THE FOUNDER STORY (short version): 2020 rented one truck -> A&H Logistics. Show a clean animated bar chart of revenue 2021 $220K, 2022 $340K, 2023 $3.4M, 2024 $11.5M, 2025 $16.7M. Caption: "The lesson wasn't working harder. It was building a company that could run without me." Link to /founder-story.
5. THE METHOD: three steps, "Diagnose, Blueprint, Build". Diagnose = we step inside your center and score numbers, enrollment, operations, people. Blueprint = a written 12-month plan naming your #1 bottleneck. Build = optional done-for-you implementation.
6. PROGRAMS: four Package cards (Fill Sprint, Growth Blueprint, Fill and Systemize, Scale Partner) with duration, who it's for, and "See details". Show prices as [PRICE] placeholders behind a config file so I can toggle "show pricing" on or off.
7. WHO IT'S FOR / NOT FOR: qualification checklist ($500K+ annual revenue, licensed and in good standing, South Jersey or Philadelphia area, owner willing to open the books and delegate).
8. PROOF: placeholder testimonial cards and a case study slot labeled [CASE STUDY: FOUNDING COHORT RESULT]. Show an empty-state that says "Founding cohort results coming soon" rather than fake quotes.
9. FAQ accordion (see below).
10. FINAL CTA banner with the application button and "Only 3 founding spots".

--- PROGRAMS (/programs) ---
Full detail for each package with a timeline component:
- Fill Sprint (30 days): baseline, quick fixes, tour and follow-up system, campaign launch, optimize, results review.
- Growth Blueprint (3 weeks): kickoff, on-site diagnostic, enrollment and marketing audit, report and blueprint walkthrough.
- Fill and Systemize (90 days): foundation, enrollment engine, operations and people, retention and referrals.
- Scale Partner (12 months): fix and fill, profit and leadership, expansion planning, launch and repeat. Include a note on retainer plus performance or equity options "by agreement".
Add a comparison table and a "Which package is right for me?" 4-question selector that recommends a package and links to /apply.

--- FOUNDER STORY (/founder-story) ---
Long-form editorial page. Sections: "One rented truck" (2020), "From Egypt to the United States" (moved about 14 years ago, no family money, finance degree), "A&H Logistics" with the revenue chart, "Aloha Capital" (real estate, started 2023, $25M+ AUM), "The daycare" (partner; helped take it from zero to a six-figure business in under a year), "Why Aloha Growth". Include the three lessons: understand your numbers, make the work repeatable, find the real bottleneck before spending more. Embed the founder video [VIDEO URL]. Use a [FOUNDER PHOTO] placeholder.

--- RESULTS (/results) ---
Case study template (challenge, what we did, timeline, outcome) with empty states. Include a "founding cohort" progress tracker (3 spots: filled/open, editable in config).

--- APPLY (/apply) ---
Multi-step application form (see Prompt 4).

--- FOOTER ---
Links, service area, contact [EMAIL] [PHONE], and legal links. Add a disclaimer in the footer: "Results vary. Examples reflect specific businesses and are not guarantees."

FAQ CONTENT:
1. Who is this for? Daycare owners in South Jersey and the Philadelphia area with at least $500K in annual revenue.
2. What if I'm below $500K? Point to the free resource page.
3. Do I have to buy the done-for-you option? No. The Blueprint stands alone.
4. How much does it cost? [PRICING NOTE].
5. What are the 3 founding spots? [FOUNDING COHORT TERMS].
6. Do you take equity? Only in select Scale Partner deals, by written agreement and reviewed by counsel.
7. How is this different from a marketing agency? Operator-led, covers operations and expansion (including real estate through Aloha Capital), not just ads.

SEO: title and meta for each page, JSON-LD (Organization, FAQPage), sitemap, OG images. Performance: Lighthouse 90+.
```

---

## Prompt 2: VSL landing page (main paid-traffic page, /watch)

```
Create a VSL landing page at /watch for daycare owners. Goal: get qualified owners to watch the video and submit the application. No site navigation, just the logo (no links) to keep focus.

LAYOUT (top to bottom):
1. Slim announcement bar: "For daycare owners in South Jersey and Philadelphia doing $500K+ a year."
2. HEADLINE (Fraunces, large): "How daycare owners are filling empty seats and getting their time back, without working more hours."
   Subhead: "Watch this 8-minute story from the founder who took one rented truck to $16.7M a year, and see how we do the same for daycares."
3. VIDEO PLAYER: 16:9, custom controls, poster frame [POSTER], captions on, a "click to unmute" overlay if autoplay is muted. Track watch progress (25/50/75/100%) as events.
4. CTA BUTTON below the video, hidden until [DELAY: 4 minutes] of video watched (config), then fades in: "Apply for the Founding Cohort". Also show it immediately for returning visitors (localStorage).
5. THREE-ICON ROW under the CTA: "Fill open seats", "Fix staffing and systems", "Grow to your next location".
6. "What you'll see in the video" bullets (5): the problem with a center that runs on the owner; the 2020 truck story and revenue chart; the 4-step method; what working with us looks like; how to apply.
7. FOUNDER BLOCK: photo, 3-sentence bio using only supplied facts.
8. THE OFFER SUMMARY: the four packages in compact cards.
9. QUALIFICATION BOX: "This is for you if..." and "This is not for you if..." lists.
10. PROOF: testimonial slots with empty state.
11. FAQ (5 items) and a final CTA.
12. Sticky mobile CTA bar after the video is 25% watched.

APPLICATION: the CTA opens a modal with the same multi-step form as /apply (Prompt 4).

TECH: page must be a single scroll, load under 2 seconds, lazy-load below-the-fold sections, add UTM capture and store with each lead, add Meta Pixel and GA4 placeholders with events: PageView, VideoPlay, Video25/50/75/100, CTAClick, LeadSubmit.
```

---

## Prompt 3: Fill Sprint landing page (/fill-sprint)

```
Create a landing page at /fill-sprint for the 30-day Fill Sprint, aimed at daycare owners with open seats and tight cash.

HERO: "Fill your open seats in 30 days." Subhead: "A 30-day sprint that fixes how your center answers, tours and follows up with families, plus one enrollment campaign built for you." CTA "Book My Fill Sprint" and a small line "For daycares in South Jersey and Philadelphia doing $500K+ a year."

SECTIONS:
1. WHY SEATS STAY EMPTY: slow response to inquiries, tours that don't convert, no follow-up, a weak Google profile. Use four cards with an icon each.
2. THE 30-DAY TIMELINE: interactive vertical timeline: Days 1-3 Baseline, Days 4-7 Quick fixes, Days 8-14 Tour and follow-up system, Days 15-21 Campaign launch, Days 22-28 Optimize, Days 29-30 Results review. One short paragraph per stage.
3. WHAT'S INCLUDED / NOT INCLUDED two-column list.
4. PRICING: show two options as cards: "Flat fee" and "Pay from results" with [PRICE] placeholders and a config toggle. Show the guarantee text as [GUARANTEE TERMS - COUNSEL TO APPROVE].
5. THE FIT CHECK: an interactive 4-question qualifier (revenue $500K+, open seats 5+, owner time 2-3 hours/week, located in South Jersey or Philadelphia). Qualified visitors see the booking step; others see a helpful resource.
6. WHERE IT LEADS: upgrade path to Blueprint and Fill and Systemize with an "apply the Sprint fee as a credit" note [CREDIT TERMS].
7. FAQ and final CTA.

Add a lead form (name, center name, phone, email, revenue range, open seats) saving to Supabase with an email notification to [EMAIL].
```

---

## Prompt 4: Application form, qualification logic and thank-you pages

```
Build /apply and reuse the same form as a modal component.

FORM (5 short steps, progress bar, one question per screen on mobile):
1. Contact: full name, email, mobile phone (with SMS consent checkbox and privacy link).
2. Center: center name, city, state (NJ/PA/other), number of locations, licensed (yes/no).
3. Numbers: annual revenue range (Under $250K, $250K-$500K, $500K-$1M, $1M-$2M, $2M+), current occupancy % (slider), number of open seats.
4. Bottleneck: single choice (Enrollment/Inquiries, Staffing and turnover, Cash flow and margin, I'm doing everything, Opening another location), plus a text box "What does success look like in 12 months?"
5. Fit: "Are you open to done-for-you implementation?" (Yes / Maybe / Just the plan) and "Are you the owner or decision maker?" (Yes/No).

QUALIFICATION LOGIC (server-side):
- Revenue $500K+, licensed = yes, state NJ or PA: QUALIFIED -> redirect to /book (calendar embed [CALENDAR LINK]).
- Revenue under $500K: NOT YET -> redirect to /resources with a short "we'll be in touch" message and offer the Fill Sprint if open seats >= 5.
- Any other state: WAITLIST page.
Store every submission with score, UTM parameters and qualification status in Supabase. Email the lead a confirmation and email [EMAIL] with the new lead summary.

THANK-YOU (/book): headline "You qualify. Pick a time for your strategy call." with the calendar embed, a 60-second "what to expect" checklist and the founder video [VIDEO URL]. Fire the Meta Pixel "Lead" event on submit and "Schedule" event on booking.

RESOURCES (/resources): a friendly page for under-$500K owners with three free tips (know your numbers, respond to inquiries within minutes, ask for reviews) and an email signup.
```

---

## Prompt 5: Expansion Partner page (/expansion) for cash-rich, scaling centers

```
Create /expansion for daycare owners doing $1.5M+ who want to open or acquire more locations.

HERO: "Open your next location with a partner who has done it before." Subhead: "Operator-led expansion support backed by real estate capital experience. For daycare owners in South Jersey and Philadelphia."

SECTIONS:
1. THE EXPANSION WALL: sites, financing, hiring a leadership layer, and systems that don't need you in every room.
2. WHAT WE BRING (four cards): a scaling playbook (A&H Logistics grew from $340K in 2022 to $16.7M in 2025), real estate capital experience (Aloha Capital, $25M+ AUM), operating systems and training, and skin in the game through performance or equity structures.
3. THE 12-MONTH ROADMAP: timeline (Months 1-3 Fix and fill, 4-6 Profit and leadership, 7-9 Expansion planning, 10-12 Launch and repeat).
4. HOW WE'RE PAID: transparent options (retainer plus performance share, or reduced retainer plus minority equity by written agreement). Note "terms reviewed by counsel".
5. WHO WE WORK WITH: qualification list, and "we work with 1-2 expansion partners at a time".
6. APPLY: CTA to the application with the "Opening another location" bottleneck pre-selected.
7. FAQ: Do you invest capital? [ANSWER PER FOUNDER]. Do you take equity? How do you compare with hiring a COO?

Include a legal disclaimer: "Nothing on this page is an offer to sell securities or a guarantee of returns."
```

---

## After the build: checklist
- [ ] Replace all [BRACKETS]
- [ ] Add real photos, logo and video URLs
- [ ] Have counsel approve guarantee, pay-from-results and equity language
- [ ] Add privacy policy, terms and SMS consent copy
- [ ] Test the form on mobile, test qualification routing, test pixel events
- [ ] Publish testimonials only when they're real and approved in writing
