# Masar OS: UI redesign and Solo journey build plan
Date: 2026-10-12. Status: mockups approved by the product owner. Build only what this plan says.
Reference mockups (HTML, open in a browser, dark and light): `mockups/redesign_preview.html` (screens, charts, motion, fleet), `mockups/solo_journey.html` (15 moments of one owner-operator), `mockups/connect_email.html` (connect-email step). Where this plan and a mockup differ, this plan wins.
Related specs already in the repo: `docs/specs/AUTOPILOT_PRODUCT_SPEC.md`, `UI_MOTION_CHARTS_PROPOSAL.md`, `DESIGN_SPEC.md`, `voice/VOICE_AGENT_SPEC.md`.

## 0. Rules that never change
1. Do not touch the live ANH / A&H company, and do not use any other Supabase project. This project only.
2. Money is record-only. The app never moves money. Do not change any money rule.
3. No per-action credit prices anywhere in customer UI. Credits are shown only as one plain "Masar help used" bar plus a way to add more. Credits never appear on the marketing website.
4. Never ask for or store load-board passwords.
5. Dark and light themes both supported, same lime accent, tokens from DESIGN_SPEC.md.
6. Capacitor-safe: animate only transform and opacity, SVG charts, safe areas, 44 px tap targets, reduced-motion respected, native calls only through `src/lib/native/*` wrappers with web fallbacks.
7. Do not publish. The owner publishes. Do not add unrequested integrations.
8. Every button, tab, toggle and row click must do its real action and persist. List anything not wired.
9. Verify at 390 px and desktop, light and dark, no console errors. Say plainly what is not done.

## 1. Order of work
Finish what is already in your queue first (command eval, MCP hold/safety, S1 fixes, credits-vs-real-cost report). Then do U1 and U2 and report. Wait for the owner's go before U3 to U6.

## U1. Foundation
- Motion tokens: durations 90 / 140 / 220 / 360 ms, celebratory 700 ms once; easings standard (0.2,0,0,1), enter (0,0,0,1), exit (0.3,0,1,1); one spring (stiffness 420, damping 34). Stagger lists 30 ms, max 6 items.
- Install Motion, shadcn charts (Recharts), sonner (exists), Vaul, canvas-confetti, lottie-react. Code-split charts.
- Native wrappers with web fallbacks: haptics, statusbar, keyboard, share, network, splash. Haptics: tap light, approve success, stop warning.
- Shared components: ConfidenceBadge (Estimated amber, Learning blue, Based on your data lime), GoalRing, PaceSparkline, StackedKeepBar, UndoRing (10 s countdown), SuccessCheck (500 ms draw), WorkingSteps (plain-language steps with spinner and check), VoiceComposer, NeedsYouCard (swipe or buttons), DoneRow (with Undo), Skeleton.
- A "Reduce motion" setting plus `prefers-reduced-motion`: every animation has an instant-state version.

## U2. Solo shell and the Masar thread home
- Bottom tabs: Masar, Loads, Money, Truck, More. The center-button idea is dropped; Find lives inside Loads.
- Home (Masar tab) top to bottom: greeting and Autopilot chip; goal card (ring, amount of goal, On pace or Behind, pace sparkline); Needs you (cards with Approve and a secondary action); Done for you today (with Undo while safe); composer.
- Composer: photo button, text field, mic.
- Voice note rules (important):
  - Tap the mic once to start recording hands-free. No holding required.
  - Alternative: press and drag up to lock. Hold and release without locking sends.
  - While locked: a Cancel (trash) button, a live waveform, and a Send arrow that replaces the mic.
  - A "Listening" panel above the composer shows the transcript appearing live as the user speaks, with a blinking cursor and an elapsed timer. The timer exists only in this panel.
  - The sent message appears in the thread as plain text of the transcript only. No microphone icon, no duration, no quotation marks, no emoji, no brackets or parentheses added by the app.
  - Haptic on start, lock and send.
- Thread replies: short, plain, one action at a time. Show what was done, not the system's inner workings.
- Incomplete or unclear messages: Masar logs what it understood as a draft (not counted in totals), asks one short follow-up with quick-reply buttons and a mic, and never guesses on money or outward actions. If unanswered, the question stays under Needs you, one gentle nudge, then silence. Drafts can be edited or discarded. If the transcript is cut off, show "I caught: ... Did I get that right?" with Edit and Discard.
- Splash: animated route-line "M" draw, then wordmark fade, handed off from the native splash.

## U3. Money, Offer, Truck
- Money tab: Week / Month / Year toggle; net profit by week bars with a goal line (bars grow 360 ms); Owed to you with an aging bar (current, 1 to 15 days late, 16+ days late; green, amber, coral); Where it goes donut.
- Load offer detail: headline "You keep"; one stacked bar for fuel, truck and trailer, insurance share, dispatch and tolls, and what you keep; net per mile against the user's floor; ConfidenceBadge; actions Counter, Other, Book it (see U5).
- Truck tab: MPG trend line from fill-ups; days without a breakdown (42-day grid, amber = repair); Coming up (oil, DOT annual, IFTA); pre-trip, documents and ELD live under this tab.
- Do not show a "Learning, N fill-ups" tag inside chat replies. Confidence badges belong on cost screens and offer screens only.
- Every number uses real data from the cost model; example numbers in the mockup are not data.

## U4. Journey screens
- Hire Masar, 4 steps: (1) DOT lookup fills the company, showing only active authority types; (2) confirm; (3) your real costs and goal with ConfidenceBadges; (4) connections.
- Connect email (step 3 or 4, skippable): see section 3 below.
- Morning brief (push plus top of thread), pre-trip flow with photos (12 items), end-of-day summary (also by email, with optional extra recipients), goal-reached moment (ring to 100 percent, one-time confetti, recap, set next goal, estimated tax set-aside shown as an estimate and switchable off), month recap.
- Growth moment: when a second truck is added, show the plan that fits (Core), carry data over, show "Masar help used" bar and "Add more Masar help". No per-action prices.
- Late invoices: Chasing for you list, quick-pay offer card that asks first.

## U5. Load workflow by email
1. Offer arrives by email (forwarded load-board alerts or direct). Masar extracts load details and shows the offer screen from U3.
2. Buttons: Counter, Other, Book it.
   - Counter: suggested amount from the user's floor and goal with a one-line reason; editable.
   - Other: type or speak a custom instruction (for example "ask for $2,500 plus detention pay, pickup after 10"); Masar drafts the email from it.
3. Always show an email preview (To, Subject, Body) with Edit and Send. Nothing is sent without approval (class C). Body includes load reference, lane, pickup date, equipment, the rate asked, MC number, "truck is ready", and the user's contact.
4. Replies are read from the user's mailbox and classified: accepted, countered, declined. Masar reports in the thread and never accepts on the user's behalf.
5. Book it sends "We accept at $X" and requests the rate confirmation.
6. Rate confirmation check: extract rate, addresses, dates, detention, lumper, payment terms, check-call and tracking rules; compare to the agreed deal and list mismatches. The user signs (never Masar). Send the signed copy back by email or open the broker's signing link.
7. Booked load timeline in Loads: Booked, Heading to pickup, Arrived at pickup, Loaded (BOL photo), In transit, Arrived at delivery, Delivered (POD photo), Invoiced.
8. Status sources: ELD or phone location with geofence prompt ("You're here. Check in?"), one tap on the load, or voice and text ("Loaded, leaving now").
9. Broker updates: short emails at the intervals the rate confirmation requires ("Loaded 8:40, ETA Atlanta 11:30 tomorrow"), asking first at the start and eligible for Autopilot after clean sends. If ETA slips past the window, warn the user and offer to tell the broker first.
10. If the rate confirmation requires broker-specific tracking (Trucker Tools, MacroPoint, project44), show that requirement and the link. Do not claim Masar can feed it unless the ELD or phone is connected to it.
11. Phone check calls through the voice agent are a later phase. Do not build now.
12. Invoice from rate confirmation plus POD with a 10-second Undo; after the first send it becomes Void.

## 3. Connect email (signup step)
- User types the email address. Masar detects the provider from the domain.
- Gmail and Google Workspace: "Continue with Google". Outlook, Hotmail, Microsoft 365: "Continue with Microsoft". OAuth scopes: read mail and send mail only (no delete or modify). Provider's own consent screen. No password reaches Masar. Revocable.
- Other providers (Yahoo, iCloud, Hostinger, GoDaddy mail, cPanel, unknown): guided setup with IMAP and SMTP settings pre-filled from a provider table. Yahoo and iCloud require an app password: show a short step guide. Password is encrypted at rest, never shown again, scoped to the company, disconnectable. Run a three-step connection test (reach server, sign in, send a test message to the user) with plain error messages. A wrong password never changes or sends anything.
- Gmail and Outlook users also get a small "Use a password instead" link.
- Skip for now is always visible. Without a connection, Masar writes each email and shows "Open in my email app"; broker replies are read only if forwarded to the user's Masar load address.
- Sender rules: send from the user's own connected address. Never silently switch to a Masar address if the connection breaks; tell the user and ask to reconnect. A Masar address is only the fallback for users who never connected email. Account emails (verification, daily summary, billing) keep using info@masar10x.io.
- Masar reads only broker and load-board mail and ignores personal mail. State plainly that the provider permission covers the mailbox.
- Security: store credentials only in server-side encrypted storage; audit log every connect, disconnect and send; owner-only to connect; rate-limit sends; per-company isolation tested with two companies.
- Open decision for the owner: whether a third-party email connection service is used for the password path. Build the Google and Microsoft OAuth paths and the open-in-my-email-app path first; propose the password path implementation and cost in your report before building it.

## U6. Fleet manager (after the Solo rounds are accepted)
- Ask Masar company-wide thread plus Today across the company (on the road, need you, done for you).
- Staff cards: Dispatch, Accounting, Maintenance, Safety, each with a one-line live summary.
- Staff page: live case with WorkingSteps, Pause / Take over / Add note, this-month results, Autopilot rules (Autopilot or Ask first per action).
- Role-based visibility: owner sees money and approvals; dispatcher and shop manager see only their department. The same voice composer is used.

## 4. Acceptance (reply with results, and what is NOT done)
[ ] U1 components exist in one design-system page for review in dark and light.
[ ] Voice note: tap start, drag-up lock, hold-release send, cancel, live transcript, plain-text sent message with no icon, duration, quotes or brackets.
[ ] Home matches the mockup at 390 px, dark and light, with real data where it exists and clearly marked sample data otherwise.
[ ] No chart or animation animates anything except transform and opacity; reduced motion verified.
[ ] No credit prices in customer UI; no credits on the marketing site.
[ ] Lighthouse and axe results, and a run with 4x CPU throttle.
Reply format: what was built, files changed, tables and policies added, results of each checkbox, gaps.
