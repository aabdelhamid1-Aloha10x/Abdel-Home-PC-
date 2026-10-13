# Lovable QA log (Masar website, project 299bd402-de90-47e3-ae2e-2c376ccd98d9)

## 2026-10-12 23:15 UTC · baseline
Homepage redesign brief sent at 23:11 UTC (message umsg_01m4s65b1afjfsdgac0n14kept) with the mockup lovable-build/mockups/website_home.html. Lovable has not replied yet. Last reviewed message id: none. Reviews cover only assistant messages after 23:11 UTC.
Brief highlights: dark only (no theme switch), no credits anywhere, no truck counts on home, trial note "14-day free trial. Card required. Cancel anytime.", footer "© 2026 Masar AI Inc." only, Recruiting without "Soon", no testimonials or invented claims, SEO and sign-in/demo links kept, not published.

## 2026-10-12 23:50 UTC · homepage rebuild (first delivery) · PASS WITH GAPS
Last reviewed Lovable message id: main:agent#00000000003280#don:MPZ2AMNY (23:18 UTC). Diff: 20 files (home/* components, home.css, SiteHeader, SiteFooter, theme.tsx, __root.tsx, brand.ts, faq.ts, index.tsx, mockup saved to docs/mockups).
Checked OK: new homepage built from Hero, Bento, DayStory, ControlLanes, CostCalc, HomePricing and FAQ components; preview screenshot matches the mockup (aurora, headline gradient words, network, logo animation). Dark only (theme.tsx forces dark, switch removed, html has dark class, theme-color updated). BRAND.trialNote is "14-day free trial. Card required. Cancel anytime." All "charged on day 15" wording removed from home and pricing FAQs. Footer reduced to "© 2026 {legalName}". Testimonials removed from home. SEO title/description updated, faqLd/softwareLd kept. No credits anywhere in changed files or in faq.ts/plans.ts. Recruiting has no Soon tag. Reduced motion (useReduced), IntersectionObserver and visibilitychange pausing present in hooks.ts. Sign in link, trial and demo links kept (Book a demo goes through /demo to Calendly).
Findings:
1. HomePricing.tsx Growth bullet says "Voice assistant and teams" while plans.ts marks the phone assistant Soon (overclaim, my mockup wording). Fix requested.
2. Lovable did not send the requested closing report (screenshots, Lighthouse, 390px scroll check, differences). Requested.
3. Not verified by me: Lighthouse scores, 390px layout, sub-pages (/pricing, /owner-operators, /fleets, /demo, legal) in dark. Requested in the fix message.
4. Recruiting is shown as included on Growth and an add-on on Core while the recruiting product is not built yet (owner decision; flag before publishing).
5. plans.ts still tags Phone assistant, ELD integrations, SSO and API as Soon on /pricing; fine and honest, left as is.
Fix message sent (items 1 and 2). Nothing published.

## 2026-10-13 02:45 UTC · homepage fixes + owner feedback round · PASS WITH GAPS
Reviewed Lovable messages 00:03352 (23:30), 00:03453 (23:39). Voice bullet on Growth card removed (home no longer mentions voice). Report received: no horizontal scroll at 390px on /, /pricing, /owner-operators, /fleets, /demo, /terms, /privacy, /refunds, /security; no console errors; all dark with no leftover light backgrounds; Lighthouse on the dev preview: performance 48 (not representative), accessibility 93.
Owner feedback in Lovable chat (23:37): the "A day with Masar" phone moved around while scrolling and the three lanes should all run together. Lovable changed html/body overflow-x from hidden to clip, seeded one card in each lane and cycled the spawn order; it measured the phone pinned at top 110 and the steps advancing, and all three lanes populated.
Findings:
1. Accessibility 93 is below the 95 target; cause not investigated.
2. Real performance score unknown until published (dev preview only).
3. Differences from mockup (stated by Lovable): Book a demo goes via /demo to Calendly; Start free trial goes to app sign-up; other pages slightly darker.
4. Not verified by me: the fixed sticky behavior on a real phone; recommend owner checks the preview on a phone.
5. Recruiting still shown as available (not built).
No new fix message: item 1 is a target gap; will request only if owner wants it before publish.
