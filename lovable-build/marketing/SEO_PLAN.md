# Masar OS: SEO and marketing plan (from Lovable's research of 2026-10-15)
Status: PLAN ONLY. Nothing is published, posted or sent to Lovable until the owner says go.
Owner direction (Oct 15): finish the application first; marketing/posting starts after. Keep it in the plan. Merge the website project and the app project into one.

## 1. What the research says (short)
- Strong position to copy: published prices ($39 Solo / $97 Core / $249 Growth) while buyers complain about hidden pricing and $18-40k quotes.
- Zero third-party presence (no listings, reviews, mentions). The name "Masar" is crowded in search (Saudi, Iraq, GCC).
- Competitors win with: free calculator/tool pages (IFTA, cost per mile, load profit, invoice template), per-audience landing pages, comparison/review articles, and review-site listings (TruckingOffice has 40 Capterra reviews).
- Reddit and TruckersReport ban advertising. Real participation only.
- Technical SEO defects on our side: canonical points to www but www 302-redirects to bare domain; app subdomain repeats the marketing TMS page; home title lacks "TMS" / "owner operator"; Core is "2 to 10 trucks" in one place and "up to 3 trucks" in another.

## 2. My recommendations
1. Agree: finish the app first. Do the technical foundation (one project, one canonical host, consistent copy) BEFORE any content push, so content lands on its final URLs. Posting everywhere is Phase M3 (after app is ready).
2. Merge website + app into ONE Lovable project, one codebase, one deploy. Keep the app project as the base (it owns auth, database, secrets, Google OAuth). Move marketing routes into it. Reason: one canonical host, no duplicate TMS page, one pricing source of truth, shared components.
   - Domain layout (recommended): masar10x.io = marketing + sign-in entry; app stays on app.masar10x.io (same project, host-based routing) OR everything on one host with /app. Decide after the merge risk check (below). Either way: one host in canonicals, sitemap and redirects (301, not 302).
   - Risks to check before merging: (a) "/" in the app is currently the sign-in screen; marketing needs "/", sign-in moves to /sign-in; (b) Google OAuth consent screen/verification uses homepage, privacy and terms URLs; changing them can trigger re-verification, so keep those URLs stable or update them together; (c) Supabase auth redirect URLs and email templates; (d) marketing deploys must not be able to break the app: keep marketing in its own route group with its own tests; (e) the marketing site has its own rules (no credits shown, no ANH/A&H data) that must survive the merge.
3. Copy fixes now needed because of owner decisions made today:
   - The research says the driver app is "EN/ES". Spanish was removed from the app on Oct 15. Remove every Spanish claim from site copy, pricing and listings until it returns.
   - Fix Core sizing: one rule ("up to 3 trucks") everywhere, or change the plan. Owner decision.
   - Home title: "Trucking management software (TMS) for owner-operators and small fleets | Masar OS".
4. Free tools are the best long-term traffic bet, and the app already has the logic: IFTA (we have an ifta_rates table), cost per mile / break-even, load profit, invoice generator. Public pages, no login, each ends in the Solo trial. Accuracy rule: show rate dates and sources, label "estimate, not tax advice".
5. Comparison pages ("TruckingOffice alternative", "TruckLogics vs Masar", "best TMS for owner-operators with prices"): factual only, every claim cited and dated, competitor prices re-checked on the day of publishing (the research took some from third-party articles). No disparagement.
6. Review sites (Capterra covers Software Advice and GetApp; G2): claim free listings after launch. Capterra needs a public offer (trial is fine), a unique description with no CTA/URL, and an English video. Reviews must be genuine.
7. Community (Reddit, TruckersReport, Facebook groups): participate without promoting; answer questions; only mention Masar where rules allow and only with disclosure. No fake accounts, no astroturf.

## 3. Things to be careful about (compliance)
- Sister-fleet testimonials/reviews (ANH, DAS, Nexus): they are related parties. Use only real, written-permission quotes, disclose the relationship, and do not submit them as "independent" reviews on Capterra/G2 (violates their rules and FTC endorsement rules). Ask real third-party users and trial users for reviews too. Do not use any ANH/A&H data in the product or the site beyond a permitted quote.
- Do not show credit prices anywhere on the marketing site (standing rule).
- Trial copy: "14-day trial, card required" must be stated clearly next to the CTA. Consider whether card-required hurts conversion versus competitors (TruckingOffice: no card). Owner decision.
- Claims: no "AI finds loads" language until the load search worker is live and approved; no DAT claims (reseller, not official).

## 4. Phased plan
**M0. Decisions (now, no work in Lovable)** - owner answers section 5. I write the merge brief.
**M1. Merge and technical SEO (after the app's current development round settles)**
  1. Merge brief to Lovable: one project, route groups, "/" marketing, /sign-in app entry, host-based redirects, one canonical host, 301s, sitemap and canonicals aligned, noindex on sign-in/app routes, remove duplicate /trucking-management-software, schema.org (SoftwareApplication + Organization), fix home title/meta, pricing copy single source of truth, Spanish claims removed.
  2. Verify: crawl check of canonicals/redirects/sitemap, auth + Google sign-in still work, no ANH/A&H data, no credit prices, nothing published without owner tap.
  3. Search Console + Bing Webmaster verification (owner account).
**M2. Build content assets offline (no publishing)**
  Free tools (IFTA, cost per mile, load profit, invoice), per-audience landing pages (owner-operator, small fleet, new authority), 3 comparison pages, 5 how-to guides (IFTA, settlements, HOS, going off spreadsheets), a product video (reuse the reels). All behind noindex/draft until launch.
**M3. Launch window (when the owner says the app is ready)**
  Publish tools + pages, submit sitemap, claim Capterra and G2 listings, outreach to spotsaas, bestcarriertms, transplus (price-comparison angle), start real community participation, ask real users for reviews.
**M4. Ongoing**
  Monthly: rankings/traffic (needs an SEO tool; none was available), new tool/guide pages, refresh competitor prices, review requests, track sign-ups per source.

## 5. Owner decisions needed
1. Domain layout after the merge: marketing on masar10x.io and app on app.masar10x.io (recommended), or everything on one host?
2. Pricing (owner direction Oct 15, pending final check): Solo $39 (1 truck, phone), Core $97 (up to 3), Growth $297 (4-10), third tier $497 (11-25), Enterprise by quote. Open: the jump at tier edges (3 -> 4 trucks = $97 -> $297; 10 -> 11 = $297 -> $497), cost per truck of AI/voice, existing $249 Growth customers, Stripe/plan-limit changes in the app, site copy. Must match everywhere.
3. Trial: keep "card required"?
4. Sister-fleet quotes: written permission and disclosure OK? Which names may be used?
5. Who owns the Search Console, Capterra and G2 accounts (owner email)?
6. Confirm marketing stays unpublished/unchanged beyond the technical fixes until the app is ready.

## 6. Not known / not checked (from the research)
No SEO tool data (volumes, rankings). Competitor sitemaps not read. r/OwnerOperators and Facebook group rules not opened. G2 listing rules unconfirmed. Leads (Rate Per Mile Masters, Mike Boston group, spotsaas/bestcarriertms editors) are unverified.
